import { Parties, Session } from '@bubblyclouds-app/types/serverTypes';
import { ServerState } from '../types/state';
import { RunStage, StageResult } from './stageResults';
import {
  AgentRunInput,
  calculateMostRecentUpdatedAtByUserId,
  calculatePresenceStageByUserId,
  calculateRunResults,
} from './runResults';

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
  { boardString: STAGE_1, movesRequired: 3 },
  { boardString: STAGE_2, movesRequired: 4 },
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

const ownResults = (entries: [number, number][]): Map<number, StageResult> =>
  new Map(
    entries.map(([stageIndex, seconds]) => [
      stageIndex,
      { seconds, movesMade: 3, movesRequired: 3 },
    ])
  );

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
          { seconds: 10, movesMade: 3, movesRequired: 3 },
          { seconds: 15, movesMade: 3, movesRequired: 4 },
        ],
        totalSeconds: 25,
        totalMoves: 6,
        // 3/3 on par, 3/4 one under
        totalMovesDelta: -1,
        completedStageCount: 2,
      },
      {
        userId: 'friend',
        isCurrentUser: false,
        stageResults: [
          { seconds: 20, movesMade: 5, movesRequired: 3 },
          { seconds: 30, movesMade: 4, movesRequired: 4 },
        ],
        totalSeconds: 50,
        totalMoves: 9,
        // 5/3 two over, 4/4 on par
        totalMovesDelta: 2,
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
      movesMade: 1,
      movesRequired: 3,
    });
  });

  it('ranks more completed stages first, then lower total time', () => {
    const results = calculateRunResults({
      stages: STAGES,
      runStageParties: {
        [STAGE_1]: partiesWith({ fast: session(5), thorough: session(50) }),
        [STAGE_2]: partiesWith({ thorough: session(60) }),
      },
      userId: undefined,
      ownResults: new Map(),
    });

    expect(results.map((result) => result.userId)).toEqual([
      'thorough',
      'fast',
    ]);
  });

  it('uses the local own results over the server session for the current user', () => {
    const results = calculateRunResults({
      stages: STAGES,
      runStageParties: {
        // Stale server echo of the current user's stage 1
        [STAGE_1]: partiesWith({ me: session(99) }),
      },
      userId: 'me',
      ownResults: ownResults([[0, 12]]),
    });

    expect(results).toEqual([
      {
        userId: 'me',
        isCurrentUser: true,
        stageResults: [
          { seconds: 12, movesMade: 3, movesRequired: 3 },
          undefined,
        ],
        totalSeconds: 12,
        totalMoves: 3,
        totalMovesDelta: 0,
        completedStageCount: 1,
      },
    ]);
  });

  it('folds agent results in as leaderboard lines sorted among the humans', () => {
    const agentResults: AgentRunInput[] = [
      {
        agentId: 'agent-Bumblebee',
        name: 'Bumblebee',
        emoji: '🐝',
        stageResults: new Map([
          [0, { seconds: 30, movesMade: 5, movesRequired: 3 }],
        ]),
      },
      {
        agentId: 'agent-Sage',
        name: 'Sage',
        emoji: '🦉',
        stageResults: new Map([
          [0, { seconds: 8, movesMade: 3, movesRequired: 3 }],
          [1, { seconds: 9, movesMade: 4, movesRequired: 4 }],
        ]),
      },
    ];

    const results = calculateRunResults({
      stages: STAGES,
      runStageParties: {},
      userId: 'me',
      ownResults: ownResults([
        [0, 10],
        [1, 15],
      ]),
      agentResults,
    });

    expect(results.map((result) => result.userId)).toEqual([
      'agent-Sage',
      'me',
      'agent-Bumblebee',
    ]);
    expect(results[0]).toEqual({
      userId: 'agent-Sage',
      isCurrentUser: false,
      stageResults: [
        { seconds: 8, movesMade: 3, movesRequired: 3 },
        { seconds: 9, movesMade: 4, movesRequired: 4 },
      ],
      totalSeconds: 17,
      totalMoves: 7,
      totalMovesDelta: 0,
      completedStageCount: 2,
      nickname: 'Sage',
      isAgent: true,
      emoji: '🦉',
    });
    // One completed stage ranks below the two-stage lines regardless of time
    expect(results[2]).toEqual(
      expect.objectContaining({
        userId: 'agent-Bumblebee',
        nickname: 'Bumblebee',
        isAgent: true,
        totalSeconds: 30,
        totalMovesDelta: 2,
        completedStageCount: 1,
      })
    );
  });

  it('omits agents with no completed stage yet', () => {
    const results = calculateRunResults({
      stages: STAGES,
      runStageParties: {},
      userId: 'me',
      ownResults: ownResults([[0, 10]]),
      agentResults: [
        {
          agentId: 'agent-Puddle',
          name: 'Puddle',
          emoji: '💧',
          stageResults: new Map(),
        },
      ],
    });

    expect(results.map((result) => result.userId)).toEqual(['me']);
  });

  it('ignores cheated stage completions and players with no completed stage', () => {
    const results = calculateRunResults({
      stages: STAGES,
      runStageParties: {
        [STAGE_1]: partiesWith({
          cheat: session(1, { answerStack: CHEATED_STACK }),
          racing: session(undefined),
          friend: session(20, { movesMade: 3 }),
        }),
      },
      userId: undefined,
      ownResults: new Map(),
    });

    expect(results).toEqual([
      {
        userId: 'friend',
        isCurrentUser: false,
        stageResults: [
          { seconds: 20, movesMade: 3, movesRequired: 3 },
          undefined,
        ],
        totalSeconds: 20,
        totalMoves: 3,
        totalMovesDelta: 0,
        completedStageCount: 1,
      },
    ]);
  });
});

describe('calculatePresenceStageByUserId', () => {
  // A friend who has NOT finished stage 1 yet — calculateRunResults omits
  // them entirely (completedStageCount === 0 is filtered out), so without
  // this presence signal they'd have no data anywhere and show as offline.
  it('includes a friend who is present but has not completed any stage yet', () => {
    const presence = calculatePresenceStageByUserId({
      stages: STAGES,
      runStageParties: {
        [STAGE_1]: partiesWith({ friend: session(undefined) }),
      },
      userId: 'me',
    });

    expect(presence.get('friend')).toBe(0);
  });

  it('reports the latest stage a player has any session on, not the earliest', () => {
    const presence = calculatePresenceStageByUserId({
      stages: STAGES,
      runStageParties: {
        [STAGE_1]: partiesWith({ friend: session(20) }),
        [STAGE_2]: partiesWith({ friend: session(undefined) }),
      },
      userId: 'me',
    });

    expect(presence.get('friend')).toBe(1);
  });

  it('excludes the current user from the presence map', () => {
    const presence = calculatePresenceStageByUserId({
      stages: STAGES,
      runStageParties: {
        [STAGE_1]: partiesWith({ me: session(10) }),
      },
      userId: 'me',
    });

    expect(presence.has('me')).toBe(false);
  });

  it('returns an empty map when no stage has any party data yet', () => {
    const presence = calculatePresenceStageByUserId({
      stages: STAGES,
      runStageParties: {},
      userId: 'me',
    });

    expect(presence.size).toBe(0);
  });
});

describe('calculateMostRecentUpdatedAtByUserId', () => {
  const sessionAt = (updatedAt: string): Session<ServerState> => ({
    sessionId: 'session',
    state: {
      initial: STAGE_1,
      final: STAGE_2,
      answerStack: FAIR_STACK,
    },
    updatedAt: new Date(updatedAt),
  });

  it('picks the LATEST updatedAt across stages, not the earliest or the last one seen', () => {
    // A friend who went stale on the stage we're watching (STAGE_1) can
    // still be actively playing a later one (STAGE_2) right now — the
    // Lobby's online/away split needs the true latest, not whichever stage
    // happens to be iterated last.
    const mostRecent = calculateMostRecentUpdatedAtByUserId({
      stages: STAGES,
      runStageParties: {
        [STAGE_1]: partiesWith({
          friend: sessionAt('2026-07-11T00:00:00.000Z'),
        }),
        [STAGE_2]: partiesWith({
          friend: sessionAt('2026-07-11T02:00:00.000Z'),
        }),
      },
      userId: 'me',
    });

    expect(mostRecent.get('friend')).toEqual(
      new Date('2026-07-11T02:00:00.000Z')
    );
  });

  it('excludes the current user from the map', () => {
    const mostRecent = calculateMostRecentUpdatedAtByUserId({
      stages: STAGES,
      runStageParties: {
        [STAGE_1]: partiesWith({ me: sessionAt('2026-07-11T00:00:00.000Z') }),
      },
      userId: 'me',
    });

    expect(mostRecent.has('me')).toBe(false);
  });

  it('returns an empty map when no stage has any party data yet', () => {
    const mostRecent = calculateMostRecentUpdatedAtByUserId({
      stages: STAGES,
      runStageParties: {},
      userId: 'me',
    });

    expect(mostRecent.size).toBe(0);
  });
});
