import { DreyfusLevel } from '@bubblyclouds-app/games/types/Agent';
import { DEFAULT_AGENT_CONFIGS } from './defaultAgents';

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

  it('covers every Dreyfus skill level', () => {
    const levels = new Set(
      DEFAULT_AGENT_CONFIGS.map((config) => config.skillLevel)
    );
    for (const level of Object.values(DreyfusLevel)) {
      expect(levels).toContain(level);
    }
  });

  it('has sane timing curves', () => {
    for (const { timingCurve, voiceLines } of DEFAULT_AGENT_CONFIGS) {
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
      expect(voiceLines.neutral.length).toBeGreaterThan(0);
      expect(voiceLines.playerAhead.length).toBeGreaterThan(0);
      expect(voiceLines.playerBehind.length).toBeGreaterThan(0);
      expect(voiceLines.endgame.length).toBeGreaterThan(0);
    }
  });
});
