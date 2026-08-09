import { DreyfusLevel, TimingCurve, TimingState } from '../types/Agent';

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

// Competent and above draw randomly within [fastest, median].
// AdvancedBeginner and Novice draw randomly within [median, slowest].
// Bands within each half give finer control so skill levels are clearly ordered.
const SKILL_LEVEL_BAND: Record<DreyfusLevel, [number, number]> = {
  [DreyfusLevel.Expert]: [0.0, 0.3],
  [DreyfusLevel.Proficient]: [0.4, 0.7],
  [DreyfusLevel.Competent]: [0.65, 1.0],
  [DreyfusLevel.AdvancedBeginner]: [0.4, 0.65],
  [DreyfusLevel.Novice]: [0.8, 1.0],
};

// Competent and above are positioned within [fastest, median].
// AdvancedBeginner and Novice are positioned within [median, slowest].
const USES_SLOW_HALF = new Set<DreyfusLevel>([
  DreyfusLevel.AdvancedBeginner,
  DreyfusLevel.Novice,
]);

export function skillLevelTargetDuration(
  skillLevel: DreyfusLevel,
  bounds: [number, number, number]
): number {
  const [fastestMs, medianMs, slowestMs] = bounds;
  const [lo, hi] = SKILL_LEVEL_BAND[skillLevel];
  const position = lo + Math.random() * (hi - lo);
  if (USES_SLOW_HALF.has(skillLevel)) {
    return medianMs + (slowestMs - medianMs) * position;
  }
  const raw = fastestMs + (medianMs - fastestMs) * position;
  if (skillLevel === DreyfusLevel.Competent) {
    return Math.max(raw, medianMs - 60000);
  }
  return raw;
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

  let baseDuration = baseTime * planningMultiplier * endgameSpeedMultiplier;

  if (timingState.burstsRemaining > 0) {
    timingState.burstsRemaining--;
    baseDuration = Math.max(400, baseDuration * 0.25);
  } else {
    if (Math.random() < timingCurve.burstChance) {
      const minBurst = timingCurve.burstLength[0];
      const maxBurst = timingCurve.burstLength[1];
      timingState.burstsRemaining =
        Math.floor(Math.random() * (maxBurst - minBurst + 1)) + minBurst;
      timingState.burstsRemaining--;
      baseDuration = Math.max(400, baseDuration * 0.25);
    } else {
      const hesitationChance =
        timingCurve.hesitationChance +
        (isEndgame ? timingCurve.endgameHesitationSpike : 0);
      if (Math.random() < Math.max(0, hesitationChance)) {
        const minHesitation = timingCurve.hesitationDelayMs[0];
        const maxHesitation = timingCurve.hesitationDelayMs[1];
        const hesitationDelay =
          Math.random() * (maxHesitation - minHesitation) + minHesitation;
        baseDuration += hesitationDelay;
      }
    }
  }

  const jitter = (Math.random() * 2 - 1) * timingCurve.jitterMs;
  return Math.max(200, baseDuration + jitter);
}
