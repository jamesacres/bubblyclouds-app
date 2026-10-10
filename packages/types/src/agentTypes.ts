export interface AgentProgress<State = unknown> {
  agentId: string;
  configId: string;
  name: string;
  emoji: string;
  percentage: number;
  finishTime?: number;
  state?: State;
  skillLevel?: string;
}
