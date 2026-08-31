import { Parties, Session } from '@bubblyclouds-app/types/serverTypes';
import { PlayerStageResult } from '@bubblyclouds-app/games/types/scoringTypes';
import { ServerState } from '../types/state';
import { RunStage, StageScore } from './stageResults';
import { calculateRunResults } from './runResults';

const STAGE_1 = [
  'oooooo',
  'oooooo',
  'AAoBoo',
  'oooBoo',
  'oooooo',
  'oooooo',
].join('');
const STAGE_2 = [
  'oooooo',
  'oooooo',
  'oAABoo',
  'oooBoo',
  'oooooo',
  'oooooo',
].join('');

const STAGES: RunStage[] = [
  { stageId: STAGE_1, movesRequired: 3 },
  { stageId: STAGE_2, movesRequired: 4 },
];

// A single-piece final transition so isPuzzleCheated stays false
const FAIR_STACK = [STAGE_1, STAGE_2];
// The last transition moves both A and B at once, which trips the cheat check
const CHEATED_STACK = [
  STAGE_1,
  ['oooooo', 'oooooo', 'ooAABo', 'oooBoo', 'oooooo', 'oooooo'].join(''),
];

const session = (
  seconds: number | undefined,
  {
    answerStack = FAIR_STACK,
    movesMade,
  }: { answerStack?: string[]; movesMade?: number } = {}
): Session<ServerState> => ({
  sessionId: 'session',
  state: {
    initial: STAGE_1,
    final: STAGE_2,
    answerStack,
    metadata:
      movesMade === undefined ? undefined : { movesMade: String(movesMade) },
    completed:
      seconds === undefined
        ? undefined
        : { at: '2026-07-11T00:00:00.000Z', seconds },
  },
  updatedAt: new Date(),
});

const partiesWith = (memberSessions: {
  [userId: string]: Session<ServerState>;
}): Parties<Session<ServerState>> => ({
  party1: { memberSessions },
});

// movesRequired mirrors each stage's own par, matching how
// completedStagesFromStorage's extractScore always sources it from the
// stage config rather than persisted data.
const ownResults = (
  entries: [number, number][]
): Map<number, PlayerStageResult<StageScore>> =>
  new Map(
    entries.map(([stageIndex, seconds]) => [
      stageIndex,
      {
        seconds,
        score: {
          movesMade: 3,
          movesRequired: STAGES[stageIndex].movesRequired,
        },
      },
    ])
  );

// Thin wrapper around @bubblyclouds-app/games's generic calculateRunResults,
// wiring in isPuzzleCheated and unblockrace's moves-based score extraction.
// The generic ranking/folding/presence mechanics themselves are covered by
// packages/games/src/helpers/runResults.test.ts.
describe('calculateRunResults', () => {
  it('builds a per-stage line with moves and running totals for each player', () => {
    const results = calculateRunResults({
      stages: STAGES,
      runStageParties: {
        [STAGE_1]: partiesWith({ friend: session(20, { movesMade: 5 }) }),
        [STAGE_2]: partiesWith({ friend: session(30, { movesMade: 4 }) }),
      },
      userId: 'me',
      ownResults: ownResults([
        [0, 10],
        [1, 15],
      ]),
    });

    expect(results).toEqual([
      {
        userId: 'me',
        isCurrentUser: true,
        stageResults: [
          { seconds: 10, score: { movesMade: 3, movesRequired: 3 } },
          { seconds: 15, score: { movesMade: 3, movesRequired: 4 } },
        ],
        totalSeconds: 25,
        completedStageCount: 2,
      },
      {
        userId: 'friend',
        isCurrentUser: false,
        stageResults: [
          { seconds: 20, score: { movesMade: 5, movesRequired: 3 } },
          { seconds: 30, score: { movesMade: 4, movesRequired: 4 } },
        ],
        totalSeconds: 50,
        completedStageCount: 2,
      },
    ]);
  });

  it('falls back to the answer stack length when movesMade metadata is missing', () => {
    const results = calculateRunResults({
      stages: STAGES,
      // FAIR_STACK has 2 snapshots = 1 move
      runStageParties: { [STAGE_1]: partiesWith({ friend: session(20) }) },
      userId: undefined,
      ownResults: new Map(),
    });

    expect(results[0].stageResults[0]).toEqual({
      seconds: 20,
      score: { movesMade: 1, movesRequired: 3 },
    });
  });

  it('ignores cheated stage completions', () => {
    const results = calculateRunResults({
      stages: STAGES,
      runStageParties: {
        [STAGE_1]: partiesWith({
          cheat: session(1, { answerStack: CHEATED_STACK }),
          friend: session(20, { movesMade: 3 }),
        }),
      },
      userId: undefined,
      ownResults: new Map(),
    });

    expect(results.map((result) => result.userId)).toEqual(['friend']);
  });
});
