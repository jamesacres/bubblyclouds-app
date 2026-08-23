import { Move } from '../types/board';
import {
  AgentConfig,
  AgentStep,
  AgentTimeline,
  DreyfusLevel,
  LocalAgent,
  TimingState,
} from '../types/Agent';
import { ServerState } from '../types/state';
import { loadSolver } from '../services/solver';
import { parseBoardString } from './parseBoardString';
import { boardToString } from './boardToString';
import { doMove } from './doMove';
import { boardMoves } from './boardMoves';
import {
  calculateMoveExecutionTime,
  difficultyToSolveBounds,
  skillLevelTargetDuration,
} from './moveTiming';

// Detours only make sense on puzzles long enough that a couple of wasted
// moves read as fumbling rather than doubling the solve.
const MIN_MOVES_FOR_DETOURS = 8;

const DETOUR_SKILL_LEVELS = new Set<DreyfusLevel>([
  DreyfusLevel.Novice,
  DreyfusLevel.AdvancedBeginner,
]);

// Low-skill agents wander: at 1-3 random points in the optimal sequence they
// slide an unrelated piece and immediately slide it back. Each detour pair
// leaves the board unchanged, so the remaining optimal moves stay valid and
// the agent simply finishes a few moves over par.
const withDetours = (initial: string, optimalMoves: Move[]): Move[] => {
  if (optimalMoves.length < MIN_MOVES_FOR_DETOURS) {
    return [...optimalMoves];
  }
  const detourCount = Math.floor(Math.random() * 3) + 1;
  const detourIndexes = new Set<number>();
  for (let i = 0; i < detourCount; i++) {
    detourIndexes.add(Math.floor(Math.random() * optimalMoves.length));
  }

  const moves: Move[] = [];
  let board = parseBoardString(initial);
  optimalMoves.forEach((optimalMove, index) => {
    if (detourIndexes.has(index)) {
      const candidates = boardMoves(board).filter(
        (move) => move.piece !== optimalMove.piece
      );
      if (candidates.length > 0) {
        const detour =
          candidates[Math.floor(Math.random() * candidates.length)];
        moves.push(detour, { piece: detour.piece, steps: -detour.steps });
      }
    }
    moves.push(optimalMove);
    board = doMove(board, optimalMove);
  });
  return moves;
};

export function createAgentTimeline(
  initial: string,
  final: string,
  config: AgentConfig,
  difficulty: string | undefined,
  optimalMoves: Move[]
): AgentTimeline {
  try {
    if (optimalMoves.length === 0) {
      return { steps: [], totalDuration: 0 };
    }

    const moves = DETOUR_SKILL_LEVELS.has(config.skillLevel)
      ? withDetours(initial, optimalMoves)
      : [...optimalMoves];

    let board = parseBoardString(initial);
    let currentTime = 0;
    let answerStack: string[] = [];
    const steps: AgentStep[] = [];
    const timingState: TimingState = { burstsRemaining: 0 };

    moves.forEach((move, index) => {
      const branchingFactor = boardMoves(board).length;
      const stepDuration = calculateMoveExecutionTime(
        branchingFactor,
        index,
        moves.length,
        config.timingCurve,
        timingState
      );
      currentTime += stepDuration;

      board = doMove(board, move);
      answerStack = [...answerStack, boardToString(board)];

      const state: ServerState = {
        initial,
        final,
        answerStack: [...answerStack],
        metadata: {
          movesRequired: String(optimalMoves.length),
          movesMade: String(index + 1),
        },
      };

      steps.push({ move, timestamp: currentTime, state });
    });

    const totalDuration = currentTime;

    // Rescale all timestamps so the agent finishes at a target duration derived
    // from the difficulty tier. Each skill level maps to a fixed point in
    // [min, max]: Novice → slowest end, Expert → fastest end.
    const bounds = difficultyToSolveBounds(difficulty);
    if (bounds && totalDuration > 0) {
      const targetDuration = skillLevelTargetDuration(
        config.skillLevel,
        bounds
      );
      const scale = targetDuration / totalDuration;
      for (const step of steps) {
        step.timestamp = Math.round(step.timestamp * scale);
      }
      return { steps, totalDuration: targetDuration };
    }

    return { steps, totalDuration };
  } catch (error) {
    console.error(
      'createAgentTimeline failed for agent',
      config.name,
      JSON.stringify(config),
      error
    );
    return { steps: [], totalDuration: 0 };
  }
}

export async function createLocalAgents(
  initial: string,
  final: string,
  agentConfigs: AgentConfig[],
  difficulty?: string
): Promise<LocalAgent[]> {
  let optimalMoves: Move[] = [];
  try {
    const solver = await loadSolver();
    const result = solver.solve(initial);
    if (result.solvable) {
      optimalMoves = result.moves;
    } else {
      console.error('createLocalAgents: board is unsolvable', initial);
    }
  } catch (error) {
    console.error('createLocalAgents: solver failed', initial, error);
  }

  return agentConfigs.reduce<LocalAgent[]>((acc, config) => {
    try {
      acc.push({
        // Stable across per-stage timeline rebuilds and matching the run
        // leaderboard's agentId (`agent-${name}`, keyed by name since
        // results are recorded per-agent-name): an index-based id would
        // point a rebuilt agent's live kart at the wrong (or no) run-results
        // row, since positions can shift as agents are added/removed.
        id: `agent-${config.name}`,
        name: config.name,
        emoji: config.emoji,
        skillLevel: config.skillLevel,
        timeline: createAgentTimeline(
          initial,
          final,
          config,
          difficulty,
          optimalMoves
        ),
      });
    } catch (error) {
      console.error(
        'createLocalAgents failed for agent',
        config.name,
        config.skillLevel,
        error
      );
    }
    return acc;
  }, []);
}
