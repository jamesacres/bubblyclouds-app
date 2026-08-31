import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentPartyRow } from './AgentPartyRow';
import { AgentProgress } from '@bubblyclouds-app/types/agentTypes';
import { BaseServerState } from '../types/state';

jest.mock('@bubblyclouds-app/ui/components/TimerDisplay', () => ({
  TimerDisplay: ({ seconds }: { seconds: number }) => (
    <div data-testid="timer">{seconds}</div>
  ),
}));

interface TestState extends BaseServerState {
  foo?: string;
}

const SimpleState = ({ state }: { state: TestState }) => (
  <div data-testid="simple-state">{state?.foo}</div>
);

describe('AgentPartyRow', () => {
  const baseAgent: AgentProgress = {
    agentId: 'agent1',
    name: 'Robo',
    emoji: '🤖',
    percentage: 42,
  };

  it('renders zero rivals text when list is empty', () => {
    render(
      <ul>
        <AgentPartyRow localAgentProgress={[]} SimpleState={SimpleState} />
      </ul>
    );
    expect(screen.getByText('0 rivals')).toBeInTheDocument();
  });

  it('renders singular "rival" for exactly one agent', () => {
    render(
      <ul>
        <AgentPartyRow
          localAgentProgress={[baseAgent]}
          SimpleState={SimpleState}
        />
      </ul>
    );
    expect(screen.getByText('1 rival')).toBeInTheDocument();
  });

  it('renders plural "rivals" for multiple agents', () => {
    render(
      <ul>
        <AgentPartyRow
          localAgentProgress={[
            baseAgent,
            { ...baseAgent, agentId: 'agent2', name: 'Bolt' },
          ]}
          SimpleState={SimpleState}
        />
      </ul>
    );
    expect(screen.getByText('2 rivals')).toBeInTheDocument();
  });

  it('renders agent name and emoji', () => {
    render(
      <ul>
        <AgentPartyRow
          localAgentProgress={[baseAgent]}
          SimpleState={SimpleState}
        />
      </ul>
    );
    expect(screen.getByText('🤖 Robo')).toBeInTheDocument();
  });

  it('falls back to robot emoji when agent has no emoji', () => {
    render(
      <ul>
        <AgentPartyRow
          localAgentProgress={[{ ...baseAgent, emoji: '' }]}
          SimpleState={SimpleState}
        />
      </ul>
    );
    expect(screen.getByText('🤖 Robo')).toBeInTheDocument();
  });

  it('clamps completion percentage between 0 and 100', () => {
    render(
      <ul>
        <AgentPartyRow
          localAgentProgress={[
            { ...baseAgent, percentage: 150 },
            { ...baseAgent, agentId: 'agent2', percentage: -10 },
          ]}
          SimpleState={SimpleState}
        />
      </ul>
    );
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows a timer instead of percentage once the agent has finished', () => {
    render(
      <ul>
        <AgentPartyRow
          localAgentProgress={[{ ...baseAgent, finishTime: 123 }]}
          SimpleState={SimpleState}
        />
      </ul>
    );
    expect(screen.getByTestId('timer')).toHaveTextContent('123');
    expect(screen.queryByText('42%')).not.toBeInTheDocument();
  });

  it('does not render leave-party button when onLeaveParty is omitted', () => {
    render(
      <ul>
        <AgentPartyRow
          localAgentProgress={[baseAgent]}
          SimpleState={SimpleState}
        />
      </ul>
    );
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('opens confirmation dialog and calls onLeaveParty when confirmed', async () => {
    const onLeaveParty = jest.fn();
    render(
      <ul>
        <AgentPartyRow
          localAgentProgress={[baseAgent]}
          SimpleState={SimpleState}
          onLeaveParty={onLeaveParty}
        />
      </ul>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/remove all AI Rivals/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Remove$/ }));
    await waitFor(() => {
      expect(onLeaveParty).toHaveBeenCalledTimes(1);
    });
  });

  it('does not render remove-agent button when onRemoveAgent is omitted', () => {
    render(
      <ul>
        <AgentPartyRow
          localAgentProgress={[baseAgent]}
          SimpleState={SimpleState}
        />
      </ul>
    );
    expect(screen.queryByTitle('Remove Local Agent')).not.toBeInTheDocument();
  });

  it('opens confirmation dialog and calls onRemoveAgent with the correct agentId when confirmed', async () => {
    const onRemoveAgent = jest.fn();
    render(
      <ul>
        <AgentPartyRow
          localAgentProgress={[baseAgent]}
          SimpleState={SimpleState}
          onRemoveAgent={onRemoveAgent}
        />
      </ul>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Remove Local Agent')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Remove$/ }));
    await waitFor(() => {
      expect(onRemoveAgent).toHaveBeenCalledWith('agent1');
    });
  });

  it('renders provided avatar image with agent name as alt text', () => {
    render(
      <ul>
        <AgentPartyRow
          localAgentProgress={[baseAgent]}
          SimpleState={SimpleState}
        />
      </ul>
    );
    const img = screen.getByAltText('Robo') as HTMLImageElement;
    expect(img.src).toContain('/opponents/robo.webp');
  });
});
