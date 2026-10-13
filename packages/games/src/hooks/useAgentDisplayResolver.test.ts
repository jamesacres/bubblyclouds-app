import { getI18n } from 'react-i18next';
import { renderHook } from '@testing-library/react';
import { useAgentDisplayResolver } from './useAgentDisplayResolver';
import { selectAgentConfigsByName } from '../helpers/selectDefaultAgents';
import { AgentConfig, DreyfusLevel } from '../types/Agent';

const NAMESPACE = 'agentResolverFixture';

const makeConfig = (id: string, name: string): AgentConfig => ({
  id,
  name,
  emoji: '🤖',
  emojiName: 'robot',
  emotionalRole: 'Calm',
  skillLevel: DreyfusLevel.Competent,
  timingCurve: {
    baseDelayMs: 1,
    jitterMs: 0,
    burstChance: 0,
    burstLength: [1, 1],
    hesitationChance: 0,
    hesitationDelayMs: [0, 0],
    endgameStart: 0.8,
    endgameSpeedMultiplier: 1,
    endgameHesitationSpike: 0,
  },
});

describe('useAgentDisplayResolver', () => {
  beforeAll(() => {
    getI18n().addResourceBundle(
      'en',
      NAMESPACE,
      { agents: { bumblebee: { name: 'Abejorro' } } },
      true,
      true
    );
  });

  it('resolves the display name from the agent id in the given namespace', () => {
    const { result } = renderHook(() => useAgentDisplayResolver(NAMESPACE));

    expect(result.current({ id: 'bumblebee', name: 'Bumblebee' })).toBe(
      'Abejorro'
    );
  });

  it('falls back to the identity name when no translation exists', () => {
    const { result } = renderHook(() => useAgentDisplayResolver(NAMESPACE));

    expect(result.current({ id: 'puddle', name: 'Puddle' })).toBe('Puddle');
  });

  it('keeps persisted names mapping to the same config while display is translated', () => {
    const configs = [
      makeConfig('bumblebee', 'Bumblebee'),
      makeConfig('puddle', 'Puddle'),
    ];
    const persistedNames = ['Bumblebee'];
    const { result } = renderHook(() => useAgentDisplayResolver(NAMESPACE));

    const selected = selectAgentConfigsByName(configs, persistedNames);

    expect(selected.map((config) => config.id)).toEqual(['bumblebee']);
    expect(selected.map((config) => result.current(config))).toEqual([
      'Abejorro',
    ]);
    expect(selected[0].name).toBe('Bumblebee');
  });
});
