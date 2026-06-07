export interface AgentProgress {
  agentId: string;
  name: string;
  emoji: string;
  percentage: number;
  finishTime?: number;
  state?: unknown;
  skillLevel?: string;
}
