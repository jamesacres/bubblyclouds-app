import { Parties, Session } from '@bubblyclouds-app/types/serverTypes';
import {
  AgentRunInput,
  calculateMostRecentUpdatedAtByUserId,
  calculatePresenceStageByUserId,
  calculateRunResults,
} from './runResults';
import { RunStage } from '../types/runTypes';
import { PlayerStageResult } from '../types/scoringTypes';

interface TestStage extends RunStage {
  par: number;
}

interface TestState {
  answerStack: string[];
  completed?: { at: string; seconds: number };
}

interface TestScore {
  value: number;
}

const STAGE_1 = 'stage-1';
const STAGE_2 = 'stage-2';

const STAGES: TestStage[] = [
  { stageId: STAGE_1, par: 3 },
  { stageId: STAGE_2, par: 4 },
];

// Cheat detection is entirely the caller's concern in the generic layer —
// this test's isCheated flags any session whose answer stack contains
// 'CHEAT'.
const isCheated = (session: Session<TestState>): boolean =>
  session.state.answerStack.includes('CHEAT');

const extractScore = (
  session: Session<TestState>,
  stage: TestStage
): TestScore | undefined => {
  const value = session.state.answerStack.length - 1;
  return value > 0 ? { value: value + stage.par } : undefined;
};

const session = (
  seconds: number | undefined,
  { answerStack = ['a', 'b'] }: { answerStack?: string[] } = {}
): Session<TestState> => ({
  sessionId: 'session',
  state: {
    answerStack,
    completed: seconds === undefined ? undefined : { at: 'now', seconds },
  },
  updatedAt: new Date(),
});

const partiesWith = (memberSessions: {
  [userId: string]: Session<TestState>;
}): Parties<Session<TestState>> => ({
  party1: { memberSessions },
});

const ownResults = (
  entries: [number, number][]
): Map<number, PlayerStageResult<TestScore>> =>
  new Map(
    entries.map(([stageIndex, seconds]) => [
      stageIndex,
      { seconds, score: { value: 10 } },
    ])
  );

describe('calculateRunResults', () => {
  it('builds a per-stage line with score and running totals for each player', () => {
    const results = calculateRunResults<TestStage, TestState, TestScore>({
      stages: STAGES,
      runStageParties: {
        [STAGE_1]: partiesWith({ friend: session(20) }),
        [STAGE_2]: partiesWith({ friend: session(30) }),
      },
      userId: 'me',
      ownResults: ownResults([
        [0, 10],
        [1, 15],
      ]),
      isCheated,
      extractScore,
    });

    expect(results).toEqual([
      {
        userId: 'me',
        isCurrentUser: true,
        stageResults: [
          { seconds: 10, score: { value: 10 } },
          { seconds: 15, score: { value: 10 } },
        ],
        totalSeconds: 25,
        completedStageCount: 2,
      },
      {
        userId: 'friend',
        isCurrentUser: false,
        stageResults: [
          { seconds: 20, score: { value: 4 } },
          { seconds: 30, score: { value: 5 } },
        ],
        totalSeconds: 50,
        completedStageCount: 2,
      },
    ]);
  });

  it('skips a stage result when extractScore returns undefined even though seconds is defined', () => {
    const results = calculateRunResults<TestStage, TestState, TestScore>({
      stages: STAGES,
      runStageParties: {
        [STAGE_1]: partiesWith({ friend: session(20, { answerStack: ['a'] }) }),
      },
      userId: undefined,
      ownResults: new Map(),
      isCheated,
      extractScore,
    });

    expect(results).toEqual([]);
  });

  it('ranks more completed stages first, then lower total time', () => {
    const results = calculateRunResults<TestStage, TestState, TestScore>({
      stages: STAGES,
      runStageParties: {
        [STAGE_1]: partiesWith({ fast: session(5), thorough: session(50) }),
        [STAGE_2]: partiesWith({ thorough: session(60) }),
      },
      userId: undefined,
      ownResults: new Map(),
      isCheated,
      extractScore,
    });

    expect(results.map((result) => result.userId)).toEqual([
      'thorough',
      'fast',
    ]);
  });

  it('uses the local own results over the server session for the current user', () => {
    const results = calculateRunResults<TestStage, TestState, TestScore>({
      stages: STAGES,
      runStageParties: {
        // Stale server echo of the current user's stage 1
        [STAGE_1]: partiesWith({ me: session(99) }),
      },
      userId: 'me',
      ownResults: ownResults([[0, 12]]),
      isCheated,
      extractScore,
    });

    expect(results).toEqual([
      {
        userId: 'me',
        isCurrentUser: true,
        stageResults: [{ seconds: 12, score: { value: 10 } }, undefined],
        totalSeconds: 12,
        completedStageCount: 1,
      },
    ]);
  });

  it('folds agent results in as leaderboard lines sorted among the humans', () => {
    const agentResults: AgentRunInput<TestScore>[] = [
      {
        agentId: 'agent-Bumblebee',
        name: 'Bumblebee',
        emoji: '🐝',
        stageResults: new Map([[0, { seconds: 30, score: { value: 8 } }]]),
      },
      {
        agentId: 'agent-Sage',
        name: 'Sage',
        emoji: '🦉',
        stageResults: new Map([
          [0, { seconds: 8, score: { value: 3 } }],
          [1, { seconds: 9, score: { value: 4 } }],
        ]),
      },
    ];

    const results = calculateRunResults<TestStage, TestState, TestScore>({
      stages: STAGES,
      runStageParties: {},
      userId: 'me',
      ownResults: ownResults([
        [0, 10],
        [1, 15],
      ]),
      agentResults,
      isCheated,
      extractScore,
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
        { seconds: 8, score: { value: 3 } },
        { seconds: 9, score: { value: 4 } },
      ],
      totalSeconds: 17,
      completedStageCount: 2,
      nickname: 'Sage',
      isAgent: true,
      emoji: '🦉',
    });
    expect(results[2]).toEqual(
      expect.objectContaining({
        userId: 'agent-Bumblebee',
        nickname: 'Bumblebee',
        isAgent: true,
        totalSeconds: 30,
        completedStageCount: 1,
      })
    );
  });

  it('omits agents with no completed stage yet', () => {
    const results = calculateRunResults<TestStage, TestState, TestScore>({
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
      isCheated,
      extractScore,
    });

    expect(results.map((result) => result.userId)).toEqual(['me']);
  });

  it('ignores cheated stage completions and players with no completed stage', () => {
    const results = calculateRunResults<TestStage, TestState, TestScore>({
      stages: STAGES,
      runStageParties: {
        [STAGE_1]: partiesWith({
          cheat: session(1, { answerStack: ['a', 'CHEAT'] }),
          racing: session(undefined),
          friend: session(20),
        }),
      },
      userId: undefined,
      ownResults: new Map(),
      isCheated,
      extractScore,
    });

    expect(results).toEqual([
      {
        userId: 'friend',
        isCurrentUser: false,
        stageResults: [{ seconds: 20, score: { value: 4 } }, undefined],
        totalSeconds: 20,
        completedStageCount: 1,
      },
    ]);
  });
});

describe('calculatePresenceStageByUserId', () => {
  it('includes a friend who is present but has not completed any stage yet', () => {
    const presence = calculatePresenceStageByUserId<TestStage, TestState>({
      stages: STAGES,
      runStageParties: {
        [STAGE_1]: partiesWith({ friend: session(undefined) }),
      },
      userId: 'me',
    });

    expect(presence.get('friend')).toBe(0);
  });

  it('reports the latest stage a player has any session on, not the earliest', () => {
    const presence = calculatePresenceStageByUserId<TestStage, TestState>({
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
    const presence = calculatePresenceStageByUserId<TestStage, TestState>({
      stages: STAGES,
      runStageParties: {
        [STAGE_1]: partiesWith({ me: session(10) }),
      },
      userId: 'me',
    });

    expect(presence.has('me')).toBe(false);
  });

  it('returns an empty map when no stage has any party data yet', () => {
    const presence = calculatePresenceStageByUserId<TestStage, TestState>({
      stages: STAGES,
      runStageParties: {},
      userId: 'me',
    });

    expect(presence.size).toBe(0);
  });
});

describe('calculateMostRecentUpdatedAtByUserId', () => {
  const sessionAt = (updatedAt: string): Session<TestState> => ({
    sessionId: 'session',
    state: { answerStack: ['a', 'b'] },
    updatedAt: new Date(updatedAt),
  });

  it('picks the LATEST updatedAt across stages, not the earliest or the last one seen', () => {
    const mostRecent = calculateMostRecentUpdatedAtByUserId<
      TestStage,
      TestState
    >({
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
    const mostRecent = calculateMostRecentUpdatedAtByUserId<
      TestStage,
      TestState
    >({
      stages: STAGES,
      runStageParties: {
        [STAGE_1]: partiesWith({ me: sessionAt('2026-07-11T00:00:00.000Z') }),
      },
      userId: 'me',
    });

    expect(mostRecent.has('me')).toBe(false);
  });

  it('returns an empty map when no stage has any party data yet', () => {
    const mostRecent = calculateMostRecentUpdatedAtByUserId<
      TestStage,
      TestState
    >({
      stages: STAGES,
      runStageParties: {},
      userId: 'me',
    });

    expect(mostRecent.size).toBe(0);
  });
});
