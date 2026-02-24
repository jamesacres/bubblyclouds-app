import { ServerState } from './state';
import { Technique } from './Technique';

export enum DreyfusLevel {
  Novice = 'novice',
  AdvancedBeginner = 'advancedBeginner',
  Competent = 'competent',
  Proficient = 'proficient',
  Expert = 'expert',
}

export interface AgentStep {
  technique: Technique;
  timestamp: number;
  state: ServerState;
  wasBlocked: boolean;
}

export interface AgentTimeline {
  steps: AgentStep[];
  totalDuration: number;
}

export interface LocalAgent {
  id: string;
  name: string;
  emoji: string;
  skillLevel: DreyfusLevel;
  timeline: AgentTimeline;
}
