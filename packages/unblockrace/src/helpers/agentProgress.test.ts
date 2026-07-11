import { LocalAgent, DreyfusLevel } from '../types/Agent';
import { Move } from '../types/board';
import { ServerState } from '../types/state';
import { parseBoardString } from './parseBoardString';
import { boardToString, solvedBoardString } from './boardToString';
import { doMove } from './doMove';
import { isSolved } from './isSolved';
import {
  calculateAgentProgress,
  getAgentCurrentState,
  getAllAgentProgress,
} from './agentProgress';

// Fixture from src/mockData/puzzles.json (movesRequired 4): the primary piece
// starts at column 0, so the distance fallback reads 0% before any move.
const INITIAL = 'FBBCCoFoGoooAAGooooDDooooEEooooooooo';
const FINAL = solvedBoardString(INITIAL);
const OPTIMAL_MOVES: Move[] = [
  { piece: 3, steps: -1 },
  { piece: 4, steps: -1 },
  { piece: 6, steps: 2 },
  { piece: 0, steps: 4 },
];

// Board strings visited along the optimal line, derived with the real board
// helpers so every snapshot is a legal, parseable state.
const boardStrings = ((): string[] => {
  let board = parseBoardString(INITIAL);
  return OPTIMAL_MOVES.map((move) => {
    board = doMove(board, move);
    return boardToString(board);
  });
})();

const makeStep = (
  timestamp: number,
  movesMade: number
): {
  move: Move;
  timestamp: number;
  state: ServerState;
} => ({
  move: OPTIMAL_MOVES[movesMade - 1],
  timestamp,
  state: {
    initial: INITIAL,
    final: FINAL,
    answerStack: boardStrings.slice(0, movesMade),
    metadata: { movesRequired: '4', movesMade: String(movesMade) },
  },
});

const makeAgent = (): LocalAgent => ({
  id: 'agent-0',
  name: 'Sage',
  emoji: '🦉',
  skillLevel: DreyfusLevel.Expert,
  timeline: {
    steps: [
      makeStep(1000, 1),
      makeStep(2000, 2),
      makeStep(3000, 3),
      makeStep(4200, 4),
    ],
    totalDuration: 4200,
  },
});

const emptyAgent = (): LocalAgent => ({
  id: 'agent-1',
  name: 'Puddle',
  emoji: '🦆',
  skillLevel: DreyfusLevel.Novice,
  timeline: { steps: [], totalDuration: 0 },
});

beforeAll(() => {
  // The fixture's final snapshot must read as solved for the 100% cases.
  expect(
    isSolved(parseBoardString(boardStrings[boardStrings.length - 1]))
  ).toBe(true);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getAgentCurrentState', () => {
  it('returns null for an agent with no timeline', () => {
    expect(getAgentCurrentState(emptyAgent(), 5000)).toBeNull();
  });

  it('returns the pristine board before the race starts', () => {
    const state = getAgentCurrentState(makeAgent(), -1);
    expect(state).toEqual({
      initial: INITIAL,
      final: FINAL,
      answerStack: [],
    });
  });

  it('returns the pristine board before the first step completes', () => {
    const state = getAgentCurrentState(makeAgent(), 500);
    expect(state?.answerStack).toEqual([]);
  });

  it('returns the last completed step state', () => {
    const state = getAgentCurrentState(makeAgent(), 2500);
    expect(state?.answerStack).toHaveLength(2);
    expect(state?.metadata?.movesMade).toBe('2');
  });
});

describe('calculateAgentProgress', () => {
  it('is 0 before any move and 100 after the final move', () => {
    const agent = makeAgent();
    expect(calculateAgentProgress(agent, -1)).toBe(0);
    expect(calculateAgentProgress(agent, 4200)).toBe(100);
  });

  it('is 0 for an agent with no timeline', () => {
    expect(calculateAgentProgress(emptyAgent(), 4200)).toBe(0);
  });

  it('increases monotonically over the timeline', () => {
    const agent = makeAgent();
    const samples = [-1, 0, 999, 1000, 1999, 2000, 3000, 4199, 4200, 9999];
    let previous = -1;
    for (const elapsed of samples) {
      const percentage = calculateAgentProgress(agent, elapsed);
      expect(percentage).toBeGreaterThanOrEqual(previous);
      previous = percentage;
    }
    expect(previous).toBe(100);
  });
});

describe('getAllAgentProgress', () => {
  it('reports 0% with no state advancement before the race starts', () => {
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
    expect(progress[1].state).toBeUndefined();
  });

  it('reports partial progress mid-race', () => {
    jest.spyOn(Date, 'now').mockReturnValue(12_000);
    const progress = getAllAgentProgress([makeAgent()], 10_000);

    // 2 of 4 required moves made at 2000ms elapsed.
    expect(progress[0].percentage).toBe(50);
    expect(progress[0].finishTime).toBeUndefined();
    expect(progress[0].state?.metadata?.movesMade).toBe('2');
  });

  it('reports 100% with a finish time once the timeline completes', () => {
    jest.spyOn(Date, 'now').mockReturnValue(20_000);
    const progress = getAllAgentProgress([makeAgent()], 10_000);

    expect(progress[0].percentage).toBe(100);
    expect(progress[0].finishTime).toBe(Math.round(4200 / 1000));
  });
});
