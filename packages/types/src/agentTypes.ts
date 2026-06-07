export interface AgentProgress<State = unknown> {
  agentId: string;
  name: string;
  emoji: string;
  percentage: number;
  finishTime?: number;
  state?: State;
  skillLevel?: string;
}
