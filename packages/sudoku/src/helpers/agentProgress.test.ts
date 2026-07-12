import {
  getAgentCurrentState,
  calculateAgentProgress,
  getAllAgentProgress,
} from './agentProgress';
import { puzzleTextToPuzzle } from './puzzleTextToPuzzle';
import { DreyfusLevel, LocalAgent } from '../types/Agent';
import { ServerState } from '../types/state';

const INITIAL_TEXT =
  '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
const FINAL_TEXT =
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

const initial = puzzleTextToPuzzle(INITIAL_TEXT);
const final = puzzleTextToPuzzle(FINAL_TEXT);

const partialAnswer = puzzleTextToPuzzle(
  '534678912672195348198342567800000000000000000000000000000000000000000000000000000'.slice(
    0,
    81
  )
);

const makeState = (answerStack: ServerState['answerStack']): ServerState => ({
  initial,
  final,
  answerStack,
});

const makeAgent = (overrides: Partial<LocalAgent> = {}): LocalAgent => ({
  id: 'agent-0',
  name: 'Sage',
  emoji: '🦉',
  skillLevel: DreyfusLevel.Expert,
  timeline: {
    steps: [
      {
        technique: 'nakedSingle',
        timestamp: 1000,
        state: makeState([partialAnswer]),
        wasBlocked: false,
      },
      {
        technique: 'nakedSingle',
        timestamp: 2000,
        state: makeState([partialAnswer, final]),
        wasBlocked: false,
      },
    ],
    totalDuration: 2000,
  },
  ...overrides,
});

const emptyAgent = (): LocalAgent => ({
  id: 'agent-1',
  name: 'Puddle',
  emoji: '🦆',
  skillLevel: DreyfusLevel.Novice,
  timeline: { steps: [], totalDuration: 0 },
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getAgentCurrentState', () => {
  it('returns null for an agent with no timeline steps', () => {
    expect(getAgentCurrentState(emptyAgent(), 5000)).toBeNull();
  });

  it('returns the pristine state (empty answer stack) when elapsed time is negative', () => {
    const agent = makeAgent();
    const state = getAgentCurrentState(agent, -1);

    expect(state).toEqual({
      initial: agent.timeline.steps[0].state.initial,
      final: agent.timeline.steps[0].state.final,
      answerStack: [],
    });
  });

  it('returns the pristine state when elapsed time is before the first step completes', () => {
    const state = getAgentCurrentState(makeAgent(), 500);
    expect(state?.answerStack).toEqual([]);
  });

  it('returns the exact step state when elapsed time matches a step timestamp', () => {
    const state = getAgentCurrentState(makeAgent(), 1000);
    expect(state?.answerStack).toEqual([partialAnswer]);
  });

  it('returns the last completed step state for elapsed time between steps', () => {
    const state = getAgentCurrentState(makeAgent(), 1500);
    expect(state?.answerStack).toEqual([partialAnswer]);
  });

  it('returns the final step state once elapsed time passes the last step', () => {
    const state = getAgentCurrentState(makeAgent(), 10000);
    expect(state?.answerStack).toEqual([partialAnswer, final]);
  });
});

describe('calculateAgentProgress', () => {
  it('returns 0 for an agent with no timeline', () => {
    expect(calculateAgentProgress(emptyAgent(), 5000)).toBe(0);
  });

  it('returns 0 before the race starts', () => {
    expect(calculateAgentProgress(makeAgent(), -1)).toBe(0);
  });

  it('returns 100 once the agent reaches the fully solved state', () => {
    expect(calculateAgentProgress(makeAgent(), 2000)).toBe(100);
  });

  it('returns a partial percentage part-way through the timeline', () => {
    const percentage = calculateAgentProgress(makeAgent(), 1000);
    expect(percentage).toBeGreaterThan(0);
    expect(percentage).toBeLessThan(100);
  });
});

describe('getAllAgentProgress', () => {
  it('reports 0% for every agent when startTimeMs is null (race not started)', () => {
    const progress = getAllAgentProgress([makeAgent(), emptyAgent()], null);

    expect(progress).toHaveLength(2);
    expect(progress[0]).toMatchObject({
      agentId: 'agent-0',
      name: 'Sage',
      emoji: '🦉',
      percentage: 0,
      skillLevel: DreyfusLevel.Expert,
    });
    expect(progress[0].finishTime).toBeUndefined();
    expect(progress[1]).toMatchObject({ agentId: 'agent-1', percentage: 0 });
    // No state is possible for an agent with an empty timeline.
    expect(progress[1].state).toBeUndefined();
  });

  it('reports partial progress and no finish time mid-race', () => {
    jest.spyOn(Date, 'now').mockReturnValue(11_500);
    const progress = getAllAgentProgress([makeAgent()], 10_000);

    expect(progress[0].percentage).toBeGreaterThan(0);
    expect(progress[0].percentage).toBeLessThan(100);
    expect(progress[0].finishTime).toBeUndefined();
  });

  it('reports 100% and a finish time once the agent completes its timeline', () => {
    jest.spyOn(Date, 'now').mockReturnValue(20_000);
    const progress = getAllAgentProgress([makeAgent()], 10_000);

    expect(progress[0].percentage).toBe(100);
    expect(progress[0].finishTime).toBe(Math.round(2000 / 1000));
  });

  it('maps agentId, name, emoji and skillLevel from each agent', () => {
    const agents = [makeAgent(), emptyAgent()];
    const progress = getAllAgentProgress(agents, null);

    expect(progress.map((p) => p.agentId)).toEqual(['agent-0', 'agent-1']);
    expect(progress.map((p) => p.name)).toEqual(['Sage', 'Puddle']);
    expect(progress.map((p) => p.emoji)).toEqual(['🦉', '🦆']);
    expect(progress.map((p) => p.skillLevel)).toEqual([
      DreyfusLevel.Expert,
      DreyfusLevel.Novice,
    ]);
  });
});
