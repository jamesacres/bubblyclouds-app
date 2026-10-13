import en from '../locales/en.json';
import { DEFAULT_AGENT_CONFIGS } from './defaultAgents';

describe('DEFAULT_AGENT_CONFIGS', () => {
  it('has unique names', () => {
    const names = DEFAULT_AGENT_CONFIGS.map((config) => config.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('has unique lowercase ids derived from the legacy names', () => {
    const ids = DEFAULT_AGENT_CONFIGS.map((config) => config.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const config of DEFAULT_AGENT_CONFIGS) {
      expect(config.id).toBe(config.name.toLowerCase());
    }
  });

  it('has a name, emoji name and personality locale entry for every agent', () => {
    const entries = new Map(Object.entries(en.agents));
    for (const config of DEFAULT_AGENT_CONFIGS) {
      const entry = entries.get(config.id);
      expect(entry?.name).toBe(config.name);
      expect(entry?.emojiName).toBe(config.emojiName);
      expect(entry?.personality.length).toBeGreaterThan(0);
    }
  });
});
