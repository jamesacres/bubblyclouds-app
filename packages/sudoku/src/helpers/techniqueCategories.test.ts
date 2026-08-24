import { Technique } from 'human-sudoku-solver';
import { DreyfusLevel } from '@bubblyclouds-app/games/types/Agent';
import { getTechniqueLevel, canAgentUseTechnique } from './techniqueCategories';

describe('getTechniqueLevel', () => {
  it('maps basic singles techniques to Novice', () => {
    expect(getTechniqueLevel('nakedSingle')).toBe(DreyfusLevel.Novice);
    expect(getTechniqueLevel('hiddenSingleBox')).toBe(DreyfusLevel.Novice);
    expect(getTechniqueLevel('hiddenSingleRow')).toBe(DreyfusLevel.Novice);
    expect(getTechniqueLevel('hiddenSingleCol')).toBe(DreyfusLevel.Novice);
  });

  it('maps pairs and locked candidates to AdvancedBeginner', () => {
    expect(getTechniqueLevel('nakedPair')).toBe(DreyfusLevel.AdvancedBeginner);
    expect(getTechniqueLevel('hiddenPair')).toBe(DreyfusLevel.AdvancedBeginner);
    expect(getTechniqueLevel('lockedCandidatePointing')).toBe(
      DreyfusLevel.AdvancedBeginner
    );
    expect(getTechniqueLevel('lockedCandidateClaiming')).toBe(
      DreyfusLevel.AdvancedBeginner
    );
  });

  it('maps triples/quads and fish techniques to Competent', () => {
    expect(getTechniqueLevel('nakedTriple')).toBe(DreyfusLevel.Competent);
    expect(getTechniqueLevel('nakedQuad')).toBe(DreyfusLevel.Competent);
    expect(getTechniqueLevel('xWing')).toBe(DreyfusLevel.Competent);
    expect(getTechniqueLevel('skyscraper')).toBe(DreyfusLevel.Competent);
  });

  it('maps advanced fish and wing techniques to Proficient', () => {
    expect(getTechniqueLevel('swordfish')).toBe(DreyfusLevel.Proficient);
    expect(getTechniqueLevel('jellyfish')).toBe(DreyfusLevel.Proficient);
    expect(getTechniqueLevel('yWing')).toBe(DreyfusLevel.Proficient);
    expect(getTechniqueLevel('uniqueRectangleType1')).toBe(
      DreyfusLevel.Proficient
    );
  });

  it('maps chains and forcing techniques to Expert', () => {
    expect(getTechniqueLevel('xyChain')).toBe(DreyfusLevel.Expert);
    expect(getTechniqueLevel('aic')).toBe(DreyfusLevel.Expert);
    expect(getTechniqueLevel('forcingChain')).toBe(DreyfusLevel.Expert);
    expect(getTechniqueLevel('nishioNet')).toBe(DreyfusLevel.Expert);
  });
});

describe('canAgentUseTechnique', () => {
  it('allows a Novice agent to use only Novice-level techniques', () => {
    expect(canAgentUseTechnique(DreyfusLevel.Novice, 'nakedSingle')).toBe(true);
    expect(canAgentUseTechnique(DreyfusLevel.Novice, 'nakedPair')).toBe(false);
    expect(canAgentUseTechnique(DreyfusLevel.Novice, 'xyChain')).toBe(false);
  });

  it('allows an Expert agent to use every technique', () => {
    const allTechniques: Technique[] = [
      'nakedSingle',
      'nakedPair',
      'nakedTriple',
      'swordfish',
      'xyChain',
      'forcingChain',
    ];
    for (const technique of allTechniques) {
      expect(canAgentUseTechnique(DreyfusLevel.Expert, technique)).toBe(true);
    }
  });

  it('allows a technique exactly at the agent skill level', () => {
    expect(canAgentUseTechnique(DreyfusLevel.Competent, 'nakedTriple')).toBe(
      true
    );
  });

  it('disallows a technique one level above the agent skill level', () => {
    expect(canAgentUseTechnique(DreyfusLevel.Competent, 'swordfish')).toBe(
      false
    );
  });

  it('allows techniques below the agent skill level', () => {
    expect(canAgentUseTechnique(DreyfusLevel.Proficient, 'nakedSingle')).toBe(
      true
    );
    expect(canAgentUseTechnique(DreyfusLevel.Proficient, 'nakedPair')).toBe(
      true
    );
  });

  it('is consistent with getTechniqueLevel ordering for AdvancedBeginner', () => {
    expect(
      canAgentUseTechnique(
        DreyfusLevel.AdvancedBeginner,
        'lockedCandidatePointing'
      )
    ).toBe(true);
    expect(
      canAgentUseTechnique(DreyfusLevel.AdvancedBeginner, 'nakedQuad')
    ).toBe(false);
  });
});
