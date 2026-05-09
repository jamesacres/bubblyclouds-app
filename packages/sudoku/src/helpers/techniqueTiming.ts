import { Technique } from 'human-sudoku-solver';
import {
  Difficulty,
  BookPuzzleDifficulty,
} from '@bubblyclouds-app/games/types/difficulty';
import { DreyfusLevel, TimingCurve, TimingState } from '../types/Agent';

const mins = (m: number) => m * 60000;

// Three-point bounds from real user data: [fastest, median, slowest].
// Competent and above draw from [fastest, median]; beginners draw from [median, slowest].
// Extreme outlier slowest times are capped to keep Novice times reasonable.
export const DIFFICULTY_SOLVE_BOUNDS_MS: Record<
  Difficulty | BookPuzzleDifficulty,
  [number, number, number]
> = {
  // Sudoku of the Day: [fastest paid user, median, capped slowest]
  [Difficulty.SIMPLE]: [mins(4.9), mins(7.72), mins(35)],
  [Difficulty.EASY]: [mins(4.25), mins(8.85), mins(45)], // actual slowest 2419m — capped
  [Difficulty.INTERMEDIATE]: [mins(6.4), mins(9.43), mins(42)],
  [Difficulty.EXPERT]: [mins(8), mins(13), mins(50)], // no data — extrapolated

  // Sudoku Book: [fastest paid user, median, capped slowest]
  [BookPuzzleDifficulty.VERY_EASY]: [mins(3), mins(4.03), mins(10)],
  [BookPuzzleDifficulty.EASY]: [mins(4), mins(6), mins(23)],
  [BookPuzzleDifficulty.MODERATELY_EASY]: [mins(4), mins(10.15), mins(31)],
  [BookPuzzleDifficulty.MODERATE]: [mins(6.65), mins(10.82), mins(31)],
  [BookPuzzleDifficulty.MODERATELY_HARD]: [mins(7.87), mins(10.52), mins(45)], // actual 71m — capped
  [BookPuzzleDifficulty.HARD]: [mins(7.13), mins(9.97), mins(35)], // actual 53m — capped
  [BookPuzzleDifficulty.VICIOUS]: [mins(10.43), mins(17.6), mins(60)], // actual 289m — capped
  [BookPuzzleDifficulty.FIENDISH]: [mins(10.1), mins(17.62), mins(60)], // actual 114m — capped
  [BookPuzzleDifficulty.DEVILISH]: [mins(12), mins(19), mins(70)], // only 2 records — extrapolated above Fiendish
  [BookPuzzleDifficulty.HELL]: [mins(14), mins(22), mins(80)], // 1 record — extrapolated above Devilish
  [BookPuzzleDifficulty.BEYOND_HELL]: [mins(16), mins(25), mins(90)], // 1 completion — extrapolated above Hell
};

export const BASE_TIMES: Record<Technique, number> = {
  nakedSingle: 1500,
  hiddenSingleBox: 2000,
  hiddenSingleRow: 2500,
  hiddenSingleCol: 2500,

  nakedPair: 4000,
  hiddenPair: 6000,
  lockedCandidatePointing: 4500,
  lockedCandidateClaiming: 4500,

  nakedTriple: 8000,
  nakedQuad: 12000,
  hiddenTriple: 10000,
  hiddenQuad: 15000,
  xWing: 15000,
  skyscraper: 15000,
  twoStringKite: 15000,

  swordfish: 30000,
  jellyfish: 40000,
  yWing: 20000,
  xyzWing: 25000,
  wWing: 25000,
  emptyRectangle: 25000,
  finnedXWing: 30000,
  finnedSwordfish: 40000,
  finnedJellyfish: 50000,
  uniqueRectangleType1: 15000,
  uniqueRectangleType2: 20000,
  uniqueRectangleType3: 25000,
  uniqueRectangleType4: 30000,
  uniqueRectangleType5: 35000,
  bug: 20000,

  xyChain: 40000,
  aic: 50000,
  aicRing: 60000,
  groupedAIC: 70000,
  alsXZ: 60000,
  sueDeCoq: 60000,
  deathBlossom: 80000,
  nishio: 80000,
  nishioNet: 100000,
  cellRegionForcingChain: 90000,
  cellRegionForcingNet: 120000,
  forcingChain: 150000,
};

export const STRUGGLE_MULTIPLIER = 10.0;

const DIFFICULTY_MULTIPLIERS: Record<
  Difficulty | BookPuzzleDifficulty,
  number
> = {
  [Difficulty.SIMPLE]: 0.8,
  [Difficulty.EASY]: 1.0,
  [Difficulty.INTERMEDIATE]: 1.4,
  [Difficulty.EXPERT]: 1.9,

  [BookPuzzleDifficulty.VERY_EASY]: 0.7,
  [BookPuzzleDifficulty.EASY]: 0.85,
  [BookPuzzleDifficulty.MODERATELY_EASY]: 1.0,
  [BookPuzzleDifficulty.MODERATE]: 1.2,
  [BookPuzzleDifficulty.MODERATELY_HARD]: 1.5,
  [BookPuzzleDifficulty.HARD]: 1.8,
  [BookPuzzleDifficulty.VICIOUS]: 2.2,
  [BookPuzzleDifficulty.FIENDISH]: 2.6,
  [BookPuzzleDifficulty.DEVILISH]: 3.0,
  [BookPuzzleDifficulty.HELL]: 3.5,
  [BookPuzzleDifficulty.BEYOND_HELL]: 4.0,
};

export function difficultyToMultiplier(
  difficulty: Difficulty | BookPuzzleDifficulty | string | undefined
): number {
  if (!difficulty) return 1.0;
  return (
    DIFFICULTY_MULTIPLIERS[difficulty as Difficulty | BookPuzzleDifficulty] ??
    1.0
  );
}

export function difficultyToSolveBounds(
  difficulty: Difficulty | BookPuzzleDifficulty | string | undefined
): [number, number, number] | undefined {
  if (!difficulty) return undefined;
  return DIFFICULTY_SOLVE_BOUNDS_MS[
    difficulty as Difficulty | BookPuzzleDifficulty
  ];
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

// Early in the puzzle, the board is sparse — scanning for candidates and
// applying notes takes much longer because there's less information to work
// with.
//
// Returns a multiplier between maxMultiplier (empty board) and 1.0 (full board).
function earlyPuzzleMultiplier(
  filledCells: number,
  baseDelayMs: number,
  difficultyMultiplier: number
): number {
  // A typical Sudoku starts with ~25-35 clues. We scale progress from 25 to 81
  // so the start of the solve feels equally slow for everyone.
  const progress = Math.min(1.0, Math.max(0, filledCells - 25) / (81 - 25));

  // All personas should take a similar amount of time at the start (between 30 and 35 seconds for basic moves)
  // to prevent experts from storming off. Scale by difficulty so harder puzzles
  // have a proportionally slower opening phase.
  const targetStartDelayMs =
    (30000 + Math.random() * 5000) * difficultyMultiplier;
  const neededMultiplier = targetStartDelayMs / baseDelayMs;

  const maxMultiplier = Math.max(1.0, neededMultiplier);
  return maxMultiplier - (maxMultiplier - 1.0) * progress;
}

export function calculateExecutionTime(
  technique: Technique,
  timingCurve: TimingCurve,
  timingState: TimingState,
  isAboveSkillLevel: boolean = false,
  filledCells: number = 30,
  difficultyMultiplier: number = 1.0
): number {
  const complexityMultiplier =
    BASE_TIMES[technique] / BASE_TIMES['nakedSingle'];
  const baseTime =
    timingCurve.baseDelayMs * complexityMultiplier * difficultyMultiplier;

  const struggleMultiplier = isAboveSkillLevel ? STRUGGLE_MULTIPLIER : 1.0;
  // Apply scan penalty to all techniques. It's even harder to find advanced techniques on an empty board.
  const scanMultiplier = earlyPuzzleMultiplier(
    filledCells,
    timingCurve.baseDelayMs,
    difficultyMultiplier
  );

  const isEndgame = filledCells / 81 >= timingCurve.endgameStart;
  const endgameSpeedMultiplier = isEndgame
    ? timingCurve.endgameSpeedMultiplier
    : 1.0;

  let baseDuration =
    baseTime * struggleMultiplier * scanMultiplier * endgameSpeedMultiplier;

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
