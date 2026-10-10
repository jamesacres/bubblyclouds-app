export enum DreyfusLevel {
  Novice = 'novice',
  AdvancedBeginner = 'advancedBeginner',
  Competent = 'competent',
  Proficient = 'proficient',
  Expert = 'expert',
}

export type AgentStep<Extra, State> = Extra & {
  timestamp: number;
  state: State;
};

export interface AgentTimeline<Extra, State> {
  steps: AgentStep<Extra, State>[];
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
  id: string;
  name: string;
  emoji: string;
  emojiName: string;
  emotionalRole: string;
  skillLevel: DreyfusLevel;
  timingCurve: TimingCurve;
}

export interface AgentIdentity {
  id: string;
  name: string;
}

export type AgentDisplayResolver = (agent: AgentIdentity) => string;

export interface LocalAgent<Extra, State> {
  id: string;
  configId: string;
  name: string;
  emoji: string;
  skillLevel: DreyfusLevel;
  timeline: AgentTimeline<Extra, State>;
}
