import { AgentConfig, DreyfusLevel } from '../types/Agent';

// One random persona per Dreyfus level, so a fresh run's default roster
// spans the full skill range instead of clustering.
export const selectDefaultAgents = (agentConfigs: AgentConfig[]): string[] => {
  const pickFromLevel = (level: DreyfusLevel) => {
    const pool = agentConfigs.filter((c) => c.skillLevel === level);
    if (pool.length === 0) {
      throw new Error(`No agent configs found for Dreyfus level: ${level}`);
    }
    return pool[Math.floor(Math.random() * pool.length)].name;
  };
  return [
    pickFromLevel(DreyfusLevel.Novice),
    pickFromLevel(DreyfusLevel.AdvancedBeginner),
    pickFromLevel(DreyfusLevel.Competent),
    pickFromLevel(DreyfusLevel.Proficient),
    pickFromLevel(DreyfusLevel.Expert),
  ];
};

export const selectAgentConfigsByName = (
  agentConfigs: AgentConfig[],
  names: string[]
): AgentConfig[] => {
  const nameSet = new Set(names);
  return agentConfigs.filter((config) => nameSet.has(config.name));
};
