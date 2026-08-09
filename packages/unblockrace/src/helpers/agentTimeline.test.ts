import { Move } from '../types/board';
import { AgentConfig, DreyfusLevel } from '../types/Agent';
import { loadSolver, SolverApi, SolverResult } from '../services/solver';
import { createAgentTimeline, createLocalAgents } from './agentTimeline';
import { parseBoardString } from './parseBoardString';
import { boardToString, solvedBoardString } from './boardToString';
import { boardMoves } from './boardMoves';
import { doMove } from './doMove';
import { isSolved } from './isSolved';

jest.mock('../services/solver', () => ({
  loadSolver: jest.fn(),
}));

const mockLoadSolver = jest.mocked(loadSolver);

// Fixture from src/fixtures/puzzles.json (movesRequired 4) with its known
// optimal solution, verified by replay below: D-1 E-1 G+2 A+4.
const SIMPLE_BOARD = 'FBBCCoFoGoooAAGooooDDooooEEooooooooo';
const SIMPLE_MOVES: Move[] = [
  { piece: 3, steps: -1 },
  { piece: 4, steps: -1 },
  { piece: 6, steps: 2 },
  { piece: 0, steps: 4 },
];

// Fixture from src/fixtures/puzzles.json (movesRequired 8) — long enough for
// low-skill agents to take detours.
const LONG_BOARD = 'oHoBBKoHCCJKAAIoJKGoIoDDGEEoooooooFF';
const LONG_MOVES: Move[] = [
  { piece: 1, steps: -1 },
  { piece: 3, steps: -1 },
  { piece: 4, steps: 2 },
  { piece: 5, steps: -1 },
  { piece: 8, steps: 1 },
  { piece: 9, steps: -1 },
  { piece: 10, steps: 3 },
  { piece: 0, steps: 4 },
];

const makeConfig = (name: string, skillLevel: DreyfusLevel): AgentConfig => ({
  name,
  emoji: '🤖',
  emojiName: 'robot',
  emotionalRole: 'test',
  skillLevel,
  personality: 'test',
  timingCurve: {
    baseDelayMs: 1000,
    jitterMs: 0,
    burstChance: 0,
    burstLength: [1, 2],
    hesitationChance: 0,
    hesitationDelayMs: [1000, 2000],
    endgameStart: 0.75,
    endgameSpeedMultiplier: 0.5,
    endgameHesitationSpike: 0,
  },
  voiceLines: { neutral: [], playerAhead: [], playerBehind: [], endgame: [] },
});

const mockSolver = (result: SolverResult): jest.Mock<SolverResult> => {
  const solve = jest.fn<SolverResult, [string]>().mockReturnValue(result);
  const api: SolverApi = { solve };
  mockLoadSolver.mockResolvedValue(api);
  return solve;
};

// Replays every step's move against the previous board state, asserting each
// one is legal, and returns the board strings visited (initial first).
const replay = (
  initial: string,
  steps: { move: Move; state: { answerStack: string[] } }[]
): string[] => {
  let board = parseBoardString(initial);
  const visited = [initial];
  for (const step of steps) {
    expect(boardMoves(board)).toContainEqual(step.move);
    board = doMove(board, step.move);
    const boardString = boardToString(board);
    expect(step.state.answerStack[step.state.answerStack.length - 1]).toBe(
      boardString
    );
    visited.push(boardString);
  }
  return visited;
};

beforeAll(() => {
  // Both fixtures replay legally and end solved — validates the hand-derived
  // optimal move lists before the tests rely on them.
  for (const [initial, moves] of [
    [SIMPLE_BOARD, SIMPLE_MOVES],
    [LONG_BOARD, LONG_MOVES],
  ] as const) {
    let board = parseBoardString(initial);
    for (const move of moves) {
      expect(boardMoves(board)).toContainEqual(move);
      board = doMove(board, move);
    }
    expect(isSolved(board)).toBe(true);
  }
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe('createAgentTimeline', () => {
  it('produces exactly the optimal moves for an Expert agent', () => {
    const timeline = createAgentTimeline(
      SIMPLE_BOARD,
      solvedBoardString(SIMPLE_BOARD),
      makeConfig('Sage', DreyfusLevel.Expert),
      undefined,
      SIMPLE_MOVES
    );

    expect(timeline.steps).toHaveLength(SIMPLE_MOVES.length);
    expect(timeline.steps.map((step) => step.move)).toEqual(SIMPLE_MOVES);
  });

  it('has strictly increasing timestamps ending at totalDuration', () => {
    const timeline = createAgentTimeline(
      SIMPLE_BOARD,
      solvedBoardString(SIMPLE_BOARD),
      makeConfig('Sage', DreyfusLevel.Expert),
      undefined,
      SIMPLE_MOVES
    );

    for (let i = 1; i < timeline.steps.length; i++) {
      expect(timeline.steps[i].timestamp).toBeGreaterThan(
        timeline.steps[i - 1].timestamp
      );
    }
    expect(timeline.steps[0].timestamp).toBeGreaterThan(0);
    expect(timeline.steps[timeline.steps.length - 1].timestamp).toBe(
      timeline.totalDuration
    );
  });

  it('walks legal states to a solved final board with moves-based metadata', () => {
    const timeline = createAgentTimeline(
      SIMPLE_BOARD,
      solvedBoardString(SIMPLE_BOARD),
      makeConfig('Sage', DreyfusLevel.Expert),
      undefined,
      SIMPLE_MOVES
    );

    const visited = replay(SIMPLE_BOARD, timeline.steps);
    expect(isSolved(parseBoardString(visited[visited.length - 1]))).toBe(true);

    timeline.steps.forEach((step, index) => {
      expect(step.state.initial).toBe(SIMPLE_BOARD);
      expect(step.state.answerStack).toHaveLength(index + 1);
      expect(step.state.metadata?.movesRequired).toBe(
        String(SIMPLE_MOVES.length)
      );
      expect(step.state.metadata?.movesMade).toBe(String(index + 1));
    });
  });

  it('inserts cancelling detour pairs for a Novice agent on long puzzles', () => {
    // Constant 0.99: detourCount rolls 3 but all indexes land on 7, so
    // exactly one detour pair is inserted before the final optimal move.
    jest.spyOn(Math, 'random').mockReturnValue(0.99);

    const timeline = createAgentTimeline(
      LONG_BOARD,
      solvedBoardString(LONG_BOARD),
      makeConfig('Bumblebee', DreyfusLevel.Novice),
      undefined,
      LONG_MOVES
    );

    expect(timeline.steps).toHaveLength(LONG_MOVES.length + 2);

    const visited = replay(LONG_BOARD, timeline.steps);
    expect(isSolved(parseBoardString(visited[visited.length - 1]))).toBe(true);

    // Locate the inserted pair by diffing against the optimal sequence: the
    // two consecutive moves that are not part of the optimal line.
    let optimalIndex = 0;
    const extras: { index: number; move: Move }[] = [];
    timeline.steps.forEach((step, index) => {
      const optimal = LONG_MOVES[optimalIndex];
      if (
        optimal &&
        step.move.piece === optimal.piece &&
        step.move.steps === optimal.steps
      ) {
        optimalIndex++;
      } else {
        extras.push({ index, move: step.move });
      }
    });
    expect(optimalIndex).toBe(LONG_MOVES.length);
    expect(extras).toHaveLength(2);

    // The pair is consecutive, self-cancelling, and leaves the board exactly
    // as it was before the pair.
    const [detour, inverse] = extras;
    expect(inverse.index).toBe(detour.index + 1);
    expect(inverse.move).toEqual({
      piece: detour.move.piece,
      steps: -detour.move.steps,
    });
    expect(visited[inverse.index + 1]).toBe(visited[detour.index]);

    // The detour never moves the piece the next optimal move needs. The next
    // optimal move after the pair is the one the diff had not yet consumed.
    const optimalConsumedBeforePair = detour.index;
    expect(detour.move.piece).not.toBe(
      LONG_MOVES[optimalConsumedBeforePair].piece
    );

    // movesRequired stays the optimal count; movesMade counts every slide.
    timeline.steps.forEach((step, index) => {
      expect(step.state.metadata?.movesRequired).toBe(
        String(LONG_MOVES.length)
      );
      expect(step.state.metadata?.movesMade).toBe(String(index + 1));
    });
  });

  it('does not take detours on short puzzles', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.99);
    const timeline = createAgentTimeline(
      SIMPLE_BOARD,
      solvedBoardString(SIMPLE_BOARD),
      makeConfig('Bumblebee', DreyfusLevel.Novice),
      undefined,
      SIMPLE_MOVES
    );
    expect(timeline.steps).toHaveLength(SIMPLE_MOVES.length);
  });

  it('rescales timestamps to the skill level target duration', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.99);

    const timeline = createAgentTimeline(
      SIMPLE_BOARD,
      solvedBoardString(SIMPLE_BOARD),
      makeConfig('Sage', DreyfusLevel.Expert),
      'beginner',
      SIMPLE_MOVES
    );

    // Expert band [0, 0.3] at draw 0.99 in beginner bounds [15s, 40s]:
    // 15000 + 25000 * 0.297 = 22425.
    expect(timeline.totalDuration).toBeCloseTo(22425);
    const lastTimestamp = timeline.steps[timeline.steps.length - 1].timestamp;
    expect(
      Math.abs(lastTimestamp - timeline.totalDuration)
    ).toBeLessThanOrEqual(1);
    for (let i = 1; i < timeline.steps.length; i++) {
      expect(timeline.steps[i].timestamp).toBeGreaterThan(
        timeline.steps[i - 1].timestamp
      );
    }
  });

  it('returns an empty timeline when there are no moves', () => {
    const timeline = createAgentTimeline(
      SIMPLE_BOARD,
      solvedBoardString(SIMPLE_BOARD),
      makeConfig('Sage', DreyfusLevel.Expert),
      undefined,
      []
    );
    expect(timeline).toEqual({ steps: [], totalDuration: 0 });
  });
});

describe('createLocalAgents', () => {
  it('solves once and builds a timeline per agent', async () => {
    const solve = mockSolver({ solvable: true, moves: SIMPLE_MOVES });

    const agents = await createLocalAgents(
      SIMPLE_BOARD,
      solvedBoardString(SIMPLE_BOARD),
      [
        makeConfig('Sage', DreyfusLevel.Expert),
        makeConfig('Compass', DreyfusLevel.Competent),
      ],
      'beginner'
    );

    expect(solve).toHaveBeenCalledTimes(1);
    expect(solve).toHaveBeenCalledWith(SIMPLE_BOARD);
    expect(agents).toHaveLength(2);
    expect(agents[0]).toMatchObject({
      id: 'agent-0',
      name: 'Sage',
      emoji: '🤖',
      skillLevel: DreyfusLevel.Expert,
    });
    expect(agents[1].id).toBe('agent-1');
    for (const agent of agents) {
      expect(agent.timeline.steps).toHaveLength(SIMPLE_MOVES.length);
    }
  });

  it('returns agents with empty timelines when the board is unsolvable', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockSolver({ solvable: false });

    const agents = await createLocalAgents(
      SIMPLE_BOARD,
      solvedBoardString(SIMPLE_BOARD),
      [makeConfig('Sage', DreyfusLevel.Expert)],
      'beginner'
    );

    expect(agents).toHaveLength(1);
    expect(agents[0].timeline).toEqual({ steps: [], totalDuration: 0 });
    expect(consoleError).toHaveBeenCalled();
  });

  it('returns agents with empty timelines when the solver throws', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockLoadSolver.mockRejectedValue(new Error('wasm failed to load'));

    const agents = await createLocalAgents(
      SIMPLE_BOARD,
      solvedBoardString(SIMPLE_BOARD),
      [
        makeConfig('Sage', DreyfusLevel.Expert),
        makeConfig('Bumblebee', DreyfusLevel.Novice),
      ]
    );

    expect(agents).toHaveLength(2);
    for (const agent of agents) {
      expect(agent.timeline).toEqual({ steps: [], totalDuration: 0 });
    }
    expect(consoleError).toHaveBeenCalled();
  });
});
