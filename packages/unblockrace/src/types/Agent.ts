import { Move } from './board';
import { ServerState } from './state';

export enum DreyfusLevel {
  Novice = 'novice',
  AdvancedBeginner = 'advancedBeginner',
  Competent = 'competent',
  Proficient = 'proficient',
  Expert = 'expert',
}

export interface AgentStep {
  move: Move;
  timestamp: number;
  state: ServerState;
}

export interface AgentTimeline {
  steps: AgentStep[];
  totalDuration: number;
}

export interface TimingCurve {
  baseDelayMs: number;
  jitterMs: number;
  burstChance: number;
  burstLength: [number, number];
  hesitationChance: number;
  hesitationDelayMs: [number, number];
  endgameStart: number;
  endgameSpeedMultiplier: number;
  endgameHesitationSpike: number;
}

export interface TimingState {
  burstsRemaining: number;
}

export interface AgentConfig {
  name: string;
  emoji: string;
  emojiName: string;
  emotionalRole: string;
  skillLevel: DreyfusLevel;
  personality: string;
  timingCurve: TimingCurve;
  voiceLines: {
    neutral: string[];
    playerAhead: string[];
    playerBehind: string[];
    endgame: string[];
  };
}

export interface LocalAgent {
  id: string;
  name: string;
  emoji: string;
  skillLevel: DreyfusLevel;
  timeline: AgentTimeline;
}
