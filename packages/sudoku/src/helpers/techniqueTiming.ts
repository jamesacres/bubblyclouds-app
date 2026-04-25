import { Technique } from 'human-sudoku-solver';
import { DreyfusLevel, TimingCurve, TimingState } from '../types/Agent';

const BASIC_TECHNIQUES = new Set<Technique>([
  'nakedSingle',
  'hiddenSingleBox',
  'hiddenSingleRow',
  'hiddenSingleCol',
]);

export const BASE_TIMES: Record<Technique, number> = {
  nakedSingle: 1500,
  hiddenSingleBox: 3000,
  hiddenSingleRow: 2500,
  hiddenSingleCol: 2500,

  nakedPair: 6000,
  hiddenPair: 10000,
  lockedCandidatePointing: 7000,
  lockedCandidateClaiming: 7000,

  nakedTriple: 15000,
  nakedQuad: 25000,
  hiddenTriple: 20000,
  hiddenQuad: 35000,
  xWing: 30000,
  skyscraper: 25000,
  twoStringKite: 25000,

  swordfish: 60000,
  jellyfish: 90000,
  yWing: 35000,
  xyzWing: 45000,
  wWing: 45000,
  emptyRectangle: 40000,
  finnedXWing: 50000,
  finnedSwordfish: 75000,
  finnedJellyfish: 100000,
  uniqueRectangleType1: 30000,
  uniqueRectangleType2: 35000,
  uniqueRectangleType3: 40000,
  uniqueRectangleType4: 45000,
  uniqueRectangleType5: 55000,
  bug: 35000,

  xyChain: 90000,
  aic: 120000,
  aicRing: 150000,
  groupedAIC: 180000,
  alsXZ: 150000,
  sueDeCoq: 150000,
  deathBlossom: 210000,
  nishio: 180000,
  nishioNet: 240000,
  cellRegionForcingChain: 200000,
  cellRegionForcingNet: 270000,
  forcingChain: 300000,
};

export const STRUGGLE_MULTIPLIER = 10.0;

// Early in the puzzle, the board is sparse — scanning for candidates and
// applying notes takes much longer because there's less information to work
// with. This only meaningfully affects basic techniques (singles), which
// dominate early solve time. Advanced techniques occur later when the board
// is already partially filled, so they are not affected.
//
// Returns a multiplier between maxMultiplier (empty board) and 1.0 (full board).
function earlyPuzzleMultiplier(filledCells: number): number {
  const progress = Math.min(filledCells, 81) / 81;
  const maxMultiplier = 3.0;
  return maxMultiplier - (maxMultiplier - 1.0) * progress;
}

export function calculateExecutionTime(
  technique: Technique,
  timingCurve: TimingCurve,
  timingState: TimingState,
  isAboveSkillLevel: boolean = false,
  filledCells: number = 30
): number {
  const complexityMultiplier =
    BASE_TIMES[technique] / BASE_TIMES['nakedSingle'];
  const baseTime = timingCurve.baseDelayMs * complexityMultiplier;

  const struggleMultiplier = isAboveSkillLevel ? STRUGGLE_MULTIPLIER : 1.0;
  const scanMultiplier = BASIC_TECHNIQUES.has(technique)
    ? earlyPuzzleMultiplier(filledCells)
    : 1.0;

  const isEndgame = filledCells / 81 >= timingCurve.endgameStart;
  const endgameSpeedMultiplier = isEndgame
    ? timingCurve.endgameSpeedMultiplier
    : 1.0;

  let baseDuration =
    baseTime * struggleMultiplier * scanMultiplier * endgameSpeedMultiplier;

  if (timingState.burstsRemaining > 0) {
    timingState.burstsRemaining--;
    baseDuration = Math.max(150, baseDuration * 0.25);
  } else {
    if (Math.random() < timingCurve.burstChance) {
      const minBurst = timingCurve.burstLength[0];
      const maxBurst = timingCurve.burstLength[1];
      timingState.burstsRemaining =
        Math.floor(Math.random() * (maxBurst - minBurst + 1)) + minBurst;
      timingState.burstsRemaining--;
      baseDuration = Math.max(150, baseDuration * 0.25);
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
  return Math.max(100, baseDuration + jitter);
}
