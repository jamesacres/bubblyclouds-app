import { LocalAgent } from '../types/Agent';
import { ServerState } from '../types/state';
import { AgentProgress } from '@bubblyclouds-app/types/agentTypes';
import { calculateCompletionPercentageFromState } from './calculateCompletionPercentage';

export function getAgentCurrentState(
  agent: LocalAgent,
  elapsedTimeMs: number
): ServerState | null {
  const { steps } = agent.timeline;

  if (steps.length === 0) return null;

  if (elapsedTimeMs < 0) {
    return {
      initial: steps[0].state.initial,
      final: steps[0].state.final,
      answerStack: [],
    };
  }

  const lastCompletedStep = steps.findLast(
    (step) => step.timestamp <= elapsedTimeMs
  );

  if (!lastCompletedStep) {
    return {
      initial: steps[0].state.initial,
      final: steps[0].state.final,
      answerStack: [],
    };
  }

  return lastCompletedStep.state;
}

export function calculateAgentProgress(
  agent: LocalAgent,
  elapsedTimeMs: number
): number {
  const state = getAgentCurrentState(agent, elapsedTimeMs);
  if (!state) return 0;
  return calculateCompletionPercentageFromState(state);
}

export function getAllAgentProgress(
  agents: LocalAgent[],
  startTimeMs: number | null
): AgentProgress[] {
  const elapsedTime = startTimeMs === null ? -1 : Date.now() - startTimeMs;

  return agents.map((agent) => {
    const state = getAgentCurrentState(agent, elapsedTime);
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
