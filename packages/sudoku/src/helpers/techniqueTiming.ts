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

// Early in the puzzle, the board is sparse — scanning for candidates and
// applying notes takes much longer because there's less information to work
// with. This only meaningfully affects basic techniques (singles), which
// dominate early solve time. Advanced techniques occur later when the board
// is already partially filled, so they are not affected.
//
// Returns a multiplier between maxMultiplier (empty board) and 1.0 (full board).
function earlyPuzzleMultiplier(
  filledCells: number,
  skillLevel?: DreyfusLevel
): number {
  const progress = Math.min(filledCells, 81) / 81;
  const isExpert =
    skillLevel === DreyfusLevel.Expert ||
    skillLevel === DreyfusLevel.Proficient;
  // Experts use Snyder notation, significantly reducing the early game scan penalty
  const maxMultiplier = isExpert ? 1.5 : 3.0;
  return maxMultiplier - (maxMultiplier - 1.0) * progress;
}

export function calculateExecutionTime(
  technique: Technique,
  timingCurve: TimingCurve,
  timingState: TimingState,
  isAboveSkillLevel: boolean = false,
  filledCells: number = 30,
  skillLevel?: DreyfusLevel
): number {
  const complexityMultiplier =
    BASE_TIMES[technique] / BASE_TIMES['nakedSingle'];
  const baseTime = timingCurve.baseDelayMs * complexityMultiplier;

  const struggleMultiplier = isAboveSkillLevel ? STRUGGLE_MULTIPLIER : 1.0;
  const scanMultiplier = BASIC_TECHNIQUES.has(technique)
    ? earlyPuzzleMultiplier(filledCells, skillLevel)
    : 1.0;

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
