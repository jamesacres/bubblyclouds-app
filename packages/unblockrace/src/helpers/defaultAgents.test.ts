import { DreyfusLevel } from '@bubblyclouds-app/games/types/Agent';
import { DEFAULT_AGENT_CONFIGS } from './defaultAgents';
import en from '../locales/en.json';

describe('DEFAULT_AGENT_CONFIGS', () => {
  it('mirrors the sudoku roster of 13 personas', () => {
    expect(DEFAULT_AGENT_CONFIGS).toHaveLength(13);
  });

  it('has unique names and emoji names', () => {
    const names = DEFAULT_AGENT_CONFIGS.map((config) => config.name);
    expect(new Set(names).size).toBe(names.length);

    const emojiNames = DEFAULT_AGENT_CONFIGS.map((config) => config.emojiName);
    expect(new Set(emojiNames).size).toBe(emojiNames.length);
  });

  it('has unique lowercase ids derived from the legacy names', () => {
    const ids = DEFAULT_AGENT_CONFIGS.map((config) => config.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const config of DEFAULT_AGENT_CONFIGS) {
      expect(config.id).toBe(config.name.toLowerCase());
    }
  });

  it('covers every Dreyfus skill level', () => {
    const levels = new Set(
      DEFAULT_AGENT_CONFIGS.map((config) => config.skillLevel)
    );
    for (const level of Object.values(DreyfusLevel)) {
      expect(levels).toContain(level);
    }
  });

  it('has sane timing curves', () => {
    for (const { timingCurve } of DEFAULT_AGENT_CONFIGS) {
      expect(timingCurve.baseDelayMs).toBeGreaterThan(0);
      expect(timingCurve.jitterMs).toBeGreaterThanOrEqual(0);
      expect(timingCurve.burstChance).toBeGreaterThanOrEqual(0);
      expect(timingCurve.burstChance).toBeLessThanOrEqual(1);
      expect(timingCurve.burstLength[0]).toBeLessThanOrEqual(
        timingCurve.burstLength[1]
      );
      expect(timingCurve.hesitationDelayMs[0]).toBeLessThanOrEqual(
        timingCurve.hesitationDelayMs[1]
      );
      expect(timingCurve.endgameStart).toBeGreaterThan(0);
      expect(timingCurve.endgameStart).toBeLessThanOrEqual(1);
    }
  });

  it('has a name, emoji name and personality locale entry for every agent', () => {
    for (const config of DEFAULT_AGENT_CONFIGS) {
      const entry = en.agents[config.id as keyof typeof en.agents];
      expect(entry.name).toBe(config.name);
      expect(entry.emojiName).toBe(config.emojiName);
      expect(entry.personality.length).toBeGreaterThan(0);
    }
  });
});
