import { Technique } from '../types/Technique';
import { DreyfusLevel } from '../types/Agent';

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

export const LEVEL_MULTIPLIERS: Record<DreyfusLevel, number> = {
  [DreyfusLevel.Novice]: 8.0,
  [DreyfusLevel.AdvancedBeginner]: 6.0,
  [DreyfusLevel.Competent]: 4.0,
  [DreyfusLevel.Proficient]: 2.5,
  [DreyfusLevel.Expert]: 1.5,
};

export const STRUGGLE_MULTIPLIER = 10.0;

export const JITTER_PERCENTAGE = 0.2;

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
  agentLevel: DreyfusLevel,
  isAboveSkillLevel: boolean = false,
  filledCells: number = 30
): number {
  const baseTime = BASE_TIMES[technique];
  const multiplier = LEVEL_MULTIPLIERS[agentLevel];
  const struggleMultiplier = isAboveSkillLevel ? STRUGGLE_MULTIPLIER : 1.0;
  const scanMultiplier = BASIC_TECHNIQUES.has(technique)
    ? earlyPuzzleMultiplier(filledCells)
    : 1.0;
  const jitter = 1 + (Math.random() * 2 - 1) * JITTER_PERCENTAGE;
  return Math.max(
    100,
    baseTime * multiplier * struggleMultiplier * scanMultiplier * jitter
  );
}
