import { AgentProgress } from '@bubblyclouds-app/types/agentTypes';
import { LocalAgent } from '../types/Agent';

export function getAgentCurrentState<Extra, State>(
  agent: LocalAgent<Extra, State>,
  elapsedTimeMs: number,
  buildPristineState: (firstState: State) => State
): State | null {
  const { steps } = agent.timeline;

  if (steps.length === 0) return null;

  if (elapsedTimeMs < 0) {
    return buildPristineState(steps[0].state);
  }

  const lastCompletedStep = steps.findLast(
    (step) => step.timestamp <= elapsedTimeMs
  );

  if (!lastCompletedStep) {
    return buildPristineState(steps[0].state);
  }

  return lastCompletedStep.state;
}

export function calculateAgentProgress<Extra, State>(
  agent: LocalAgent<Extra, State>,
  elapsedTimeMs: number,
  buildPristineState: (firstState: State) => State,
  calculateCompletionPercentageFromState: (state: State) => number
): number {
  const state = getAgentCurrentState(agent, elapsedTimeMs, buildPristineState);
  if (!state) return 0;
  return calculateCompletionPercentageFromState(state);
}

export function getAllAgentProgress<Extra, State>(
  agents: LocalAgent<Extra, State>[],
  startTimeMs: number | null,
  buildPristineState: (firstState: State) => State,
  calculateCompletionPercentageFromState: (state: State) => number
): AgentProgress<State>[] {
  const elapsedTime = startTimeMs === null ? -1 : Date.now() - startTimeMs;

  return agents.map((agent) => {
    const state = getAgentCurrentState(agent, elapsedTime, buildPristineState);
    const percentage = state
      ? calculateCompletionPercentageFromState(state)
      : 0;
    const finishTime =
      percentage === 100
        ? Math.round(agent.timeline.totalDuration / 1000)
        : undefined;
    return {
      agentId: agent.id,
      name: agent.name,
      emoji: agent.emoji,
      percentage,
      finishTime,
      state: state ?? undefined,
      skillLevel: agent.skillLevel,
    };
  });
}
