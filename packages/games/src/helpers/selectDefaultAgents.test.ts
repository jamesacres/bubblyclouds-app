import {
  selectDefaultAgents,
  selectAgentConfigsByName,
} from './selectDefaultAgents';
import { AgentConfig, DreyfusLevel } from '../types/Agent';

const makeConfig = (name: string, skillLevel: DreyfusLevel): AgentConfig => ({
  name,
  emoji: '🤖',
  emojiName: 'robot',
  emotionalRole: 'neutral',
  skillLevel,
  personality: '',
  timingCurve: {
    baseDelayMs: 0,
    jitterMs: 0,
    burstChance: 0,
    burstLength: [0, 0],
    hesitationChance: 0,
    hesitationDelayMs: [0, 0],
    endgameStart: 0,
    endgameSpeedMultiplier: 0,
    endgameHesitationSpike: 0,
  },
  voiceLines: { neutral: [], playerAhead: [], playerBehind: [], endgame: [] },
});

const AGENT_CONFIGS: AgentConfig[] = [
  makeConfig('Novice1', DreyfusLevel.Novice),
  makeConfig('AdvancedBeginner1', DreyfusLevel.AdvancedBeginner),
  makeConfig('Competent1', DreyfusLevel.Competent),
  makeConfig('Proficient1', DreyfusLevel.Proficient),
  makeConfig('Expert1', DreyfusLevel.Expert),
  makeConfig('Expert2', DreyfusLevel.Expert),
];

describe('selectDefaultAgents', () => {
  it('picks exactly one agent per Dreyfus level', () => {
    const selection = selectDefaultAgents(AGENT_CONFIGS);
    expect(selection).toHaveLength(5);
    const selectedConfigs = selection.map(
      (name) => AGENT_CONFIGS.find((c) => c.name === name)!
    );
    expect(new Set(selectedConfigs.map((c) => c.skillLevel))).toEqual(
      new Set([
        DreyfusLevel.Novice,
        DreyfusLevel.AdvancedBeginner,
        DreyfusLevel.Competent,
        DreyfusLevel.Proficient,
        DreyfusLevel.Expert,
      ])
    );
  });

  it('varies the expert pick across calls', () => {
    const picks = new Set(
      Array.from({ length: 50 }, () => selectDefaultAgents(AGENT_CONFIGS)[4])
    );
    expect(picks.size).toBeGreaterThan(1);
  });

  it('throws when a Dreyfus level has no configs', () => {
    const missingLevel = AGENT_CONFIGS.filter(
      (c) => c.skillLevel !== DreyfusLevel.Expert
    );
    expect(() => selectDefaultAgents(missingLevel)).toThrow(
      DreyfusLevel.Expert
    );
  });
});

describe('selectAgentConfigsByName', () => {
  it('returns configs matching the given names, in config order', () => {
    const result = selectAgentConfigsByName(AGENT_CONFIGS, [
      'Expert2',
      'Novice1',
    ]);
    expect(result.map((c) => c.name)).toEqual(['Novice1', 'Expert2']);
  });

  it('ignores names that do not match any config', () => {
    const result = selectAgentConfigsByName(AGENT_CONFIGS, [
      'Novice1',
      'Unknown',
    ]);
    expect(result.map((c) => c.name)).toEqual(['Novice1']);
  });

  it('returns an empty array when given no names', () => {
    expect(selectAgentConfigsByName(AGENT_CONFIGS, [])).toEqual([]);
  });
});
