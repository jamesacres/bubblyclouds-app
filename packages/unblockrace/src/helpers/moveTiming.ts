import { TimingCurve, TimingState } from '@bubblyclouds-app/games/types/Agent';
import { applyTimingEnvelope } from '@bubblyclouds-app/games/helpers/agentTiming';

const secs = (s: number) => s * 1000;

// Three-point bounds per difficulty tier: [fastest, median, slowest].
// Competent and above draw from [fastest, median]; beginners draw from
// [median, slowest]. No real-user data yet — tune later.
export const DIFFICULTY_SOLVE_BOUNDS_MS: Record<
  string,
  [number, number, number]
> = {
  beginner: [secs(15), secs(40), secs(150)],
  challenging: [secs(30), secs(80), secs(300)],
  hard: [secs(60), secs(150), secs(480)],
  expert: [secs(100), secs(240), secs(720)],
};

export function difficultyToSolveBounds(
  difficulty?: string
): [number, number, number] | undefined {
  if (!difficulty) return undefined;
  return DIFFICULTY_SOLVE_BOUNDS_MS[difficulty];
}

// Fraction of the solve over which the opening "planning" multiplier tapers
// back to 1.0 — agents study the whole grid before their first slides.
const PLANNING_WINDOW = 0.25;

export function calculateMoveExecutionTime(
  branchingFactor: number,
  moveIndex: number,
  totalMoves: number,
  timingCurve: TimingCurve,
  timingState: TimingState
): number {
  // Boards with more legal moves take longer to read. A typical mid-game 6x6
  // board offers ~5-15 legal moves, so branchingFactor/8 centers the
  // multiplier around ~1-2.
  const complexityMultiplier = Math.min(
    Math.max(0.75 + branchingFactor / 8, 0.75),
    2.5
  );
  const baseTime = timingCurve.baseDelayMs * complexityMultiplier;

  const progress = totalMoves > 0 ? moveIndex / totalMoves : 1;

  // Opening planning: x2-3 on the very first move, tapering linearly to x1
  // over the first quarter of the solve.
  let planningMultiplier = 1.0;
  if (progress < PLANNING_WINDOW) {
    const maxMultiplier = 2 + Math.random();
    planningMultiplier =
      maxMultiplier - (maxMultiplier - 1.0) * (progress / PLANNING_WINDOW);
  }

  const isEndgame = progress >= timingCurve.endgameStart;
  const endgameSpeedMultiplier = isEndgame
    ? timingCurve.endgameSpeedMultiplier
    : 1.0;

  const baseDuration = baseTime * planningMultiplier * endgameSpeedMultiplier;

  return applyTimingEnvelope(baseDuration, isEndgame, timingCurve, timingState);
}
