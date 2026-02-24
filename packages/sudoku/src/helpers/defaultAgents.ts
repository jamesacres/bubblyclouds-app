import { DreyfusLevel } from '../types/Agent';

export const DEFAULT_AGENT_CONFIGS = [
  { name: 'Sage', emoji: '🦉', skillLevel: DreyfusLevel.Expert },
  { name: 'Hunter', emoji: '🐺', skillLevel: DreyfusLevel.Proficient },
  { name: 'Scout', emoji: '🦊', skillLevel: DreyfusLevel.Competent },
  { name: 'Cub', emoji: '🐻', skillLevel: DreyfusLevel.AdvancedBeginner },
  { name: 'Hopper', emoji: '🐰', skillLevel: DreyfusLevel.Novice },
];
