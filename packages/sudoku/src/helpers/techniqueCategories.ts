import { Technique } from 'human-sudoku-solver';
import { DreyfusLevel } from '@bubblyclouds-app/games/types/Agent';

export const TECHNIQUE_LEVELS: Record<Technique, DreyfusLevel> = {
  nakedSingle: DreyfusLevel.Novice,
  hiddenSingleBox: DreyfusLevel.Novice,
  hiddenSingleRow: DreyfusLevel.Novice,
  hiddenSingleCol: DreyfusLevel.Novice,

  nakedPair: DreyfusLevel.AdvancedBeginner,
  hiddenPair: DreyfusLevel.AdvancedBeginner,
  lockedCandidatePointing: DreyfusLevel.AdvancedBeginner,
  lockedCandidateClaiming: DreyfusLevel.AdvancedBeginner,

  nakedTriple: DreyfusLevel.Competent,
  nakedQuad: DreyfusLevel.Competent,
  hiddenTriple: DreyfusLevel.Competent,
  hiddenQuad: DreyfusLevel.Competent,
  xWing: DreyfusLevel.Competent,
  skyscraper: DreyfusLevel.Competent,
  twoStringKite: DreyfusLevel.Competent,

  swordfish: DreyfusLevel.Proficient,
  jellyfish: DreyfusLevel.Proficient,
  yWing: DreyfusLevel.Proficient,
  xyzWing: DreyfusLevel.Proficient,
  wWing: DreyfusLevel.Proficient,
  emptyRectangle: DreyfusLevel.Proficient,
  finnedXWing: DreyfusLevel.Proficient,
  finnedSwordfish: DreyfusLevel.Proficient,
  finnedJellyfish: DreyfusLevel.Proficient,
  uniqueRectangleType1: DreyfusLevel.Proficient,
  uniqueRectangleType2: DreyfusLevel.Proficient,
  uniqueRectangleType3: DreyfusLevel.Proficient,
  uniqueRectangleType4: DreyfusLevel.Proficient,
  uniqueRectangleType5: DreyfusLevel.Proficient,
  bug: DreyfusLevel.Proficient,

  xyChain: DreyfusLevel.Expert,
  aic: DreyfusLevel.Expert,
  aicRing: DreyfusLevel.Expert,
  groupedAIC: DreyfusLevel.Expert,
  alsXZ: DreyfusLevel.Expert,
  sueDeCoq: DreyfusLevel.Expert,
  deathBlossom: DreyfusLevel.Expert,
  nishio: DreyfusLevel.Expert,
  nishioNet: DreyfusLevel.Expert,
  cellRegionForcingChain: DreyfusLevel.Expert,
  cellRegionForcingNet: DreyfusLevel.Expert,
  forcingChain: DreyfusLevel.Expert,
};

const DREYFUS_LEVEL_ORDER: Record<DreyfusLevel, number> = {
  [DreyfusLevel.Novice]: 0,
  [DreyfusLevel.AdvancedBeginner]: 1,
  [DreyfusLevel.Competent]: 2,
  [DreyfusLevel.Proficient]: 3,
  [DreyfusLevel.Expert]: 4,
};

export function getTechniqueLevel(technique: Technique): DreyfusLevel {
  return TECHNIQUE_LEVELS[technique];
}

export function canAgentUseTechnique(
  agentLevel: DreyfusLevel,
  technique: Technique
): boolean {
  const techniqueLevel = getTechniqueLevel(technique);
  return DREYFUS_LEVEL_ORDER[agentLevel] >= DREYFUS_LEVEL_ORDER[techniqueLevel];
}
