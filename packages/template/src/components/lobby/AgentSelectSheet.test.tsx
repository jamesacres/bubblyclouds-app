import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentOption, AgentSelectSheet } from './AgentSelectSheet';

const AGENT_OPTIONS: AgentOption[] = [
  {
    id: 'bumblebee',
    name: 'Bumblebee',
    emoji: '🐝',
    emojiName: 'bee',
    skillLevel: 'novice',
  },
  {
    id: 'sage',
    name: 'Sage',
    emoji: '🦉',
    emojiName: 'owl',
    skillLevel: 'expert',
  },
  {
    id: 'ember',
    name: 'Ember',
    emoji: '🦊',
    emojiName: 'fox',
    skillLevel: 'proficient',
  },
];

const PERSONALITIES: Record<string, string> = {
  bumblebee: 'Restless and enthusiastic.',
  sage: 'Calm and deliberate.',
  ember: 'Intense and competitive.',
};

const getAgentDisplay = (agent: AgentOption) => ({
  name: agent.name,
  personality: PERSONALITIES[agent.id] ?? '',
  emojiName: agent.emojiName,
});

describe('AgentSelectSheet', () => {
  const mockOnClose = jest.fn();
  const mockOnAgentMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders agent cards when open', () => {
    render(
      <AgentSelectSheet
        open={true}
        onClose={mockOnClose}
        agentOptions={AGENT_OPTIONS}
        getAgentDisplay={getAgentDisplay}
        defaultSelectedAgentNames={[]}
        onAgentMode={mockOnAgentMode}
      />
    );
    expect(screen.getByText('Bumblebee')).toBeInTheDocument();
    expect(screen.getByText('Sage')).toBeInTheDocument();
    expect(screen.getByText('Ember')).toBeInTheDocument();
  });

  it('shows title and subtitle', () => {
    render(
      <AgentSelectSheet
        open={true}
        onClose={mockOnClose}
        agentOptions={AGENT_OPTIONS}
        getAgentDisplay={getAgentDisplay}
        defaultSelectedAgentNames={[]}
        onAgentMode={mockOnAgentMode}
      />
    );
    expect(screen.getByText(/Pick Your Rivals/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Select one or more opponents/i)
    ).toBeInTheDocument();
  });

  it('pre-selects default agents and shows correct race count', () => {
    render(
      <AgentSelectSheet
        open={true}
        onClose={mockOnClose}
        agentOptions={AGENT_OPTIONS}
        getAgentDisplay={getAgentDisplay}
        defaultSelectedAgentNames={['Bumblebee', 'Sage']}
        onAgentMode={mockOnAgentMode}
      />
    );
    expect(screen.getByText(/Race 2 Rivals/i)).toBeInTheDocument();
  });

  it('disables start button when no agents selected', () => {
    render(
      <AgentSelectSheet
        open={true}
        onClose={mockOnClose}
        agentOptions={AGENT_OPTIONS}
        getAgentDisplay={getAgentDisplay}
        defaultSelectedAgentNames={[]}
        onAgentMode={mockOnAgentMode}
      />
    );
    const button = screen
      .getByText(/Select at least one rival/i)
      .closest('button');
    expect(button).toBeDisabled();
  });

  it('toggles agent selection when card is clicked', () => {
    render(
      <AgentSelectSheet
        open={true}
        onClose={mockOnClose}
        agentOptions={AGENT_OPTIONS}
        getAgentDisplay={getAgentDisplay}
        defaultSelectedAgentNames={[]}
        onAgentMode={mockOnAgentMode}
      />
    );
    fireEvent.click(screen.getByText('Bumblebee').closest('button')!);
    expect(screen.getByText(/Race 1 Rival/i)).toBeInTheDocument();
  });

  it('calls onAgentMode with selected names and closes on start', () => {
    render(
      <AgentSelectSheet
        open={true}
        onClose={mockOnClose}
        agentOptions={AGENT_OPTIONS}
        getAgentDisplay={getAgentDisplay}
        defaultSelectedAgentNames={['Bumblebee']}
        onAgentMode={mockOnAgentMode}
      />
    );
    fireEvent.click(screen.getByText(/Race 1 Rival/i));
    expect(mockOnAgentMode).toHaveBeenCalledWith(['Bumblebee']);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('confirms selection when close button is clicked with agents selected', () => {
    render(
      <AgentSelectSheet
        open={true}
        onClose={mockOnClose}
        agentOptions={AGENT_OPTIONS}
        getAgentDisplay={getAgentDisplay}
        defaultSelectedAgentNames={['Bumblebee']}
        onAgentMode={mockOnAgentMode}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Close/i }));
    expect(mockOnAgentMode).toHaveBeenCalledWith(['Bumblebee']);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked with no agents selected', () => {
    render(
      <AgentSelectSheet
        open={true}
        onClose={mockOnClose}
        agentOptions={AGENT_OPTIONS}
        getAgentDisplay={getAgentDisplay}
        defaultSelectedAgentNames={[]}
        onAgentMode={mockOnAgentMode}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Close/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when back button is clicked', () => {
    render(
      <AgentSelectSheet
        open={true}
        onClose={mockOnClose}
        agentOptions={AGENT_OPTIONS}
        getAgentDisplay={getAgentDisplay}
        defaultSelectedAgentNames={[]}
        onAgentMode={mockOnAgentMode}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Back/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    render(
      <AgentSelectSheet
        open={true}
        onClose={mockOnClose}
        agentOptions={AGENT_OPTIONS}
        getAgentDisplay={getAgentDisplay}
        defaultSelectedAgentNames={[]}
        onAgentMode={mockOnAgentMode}
      />
    );
    fireEvent.click(screen.getByLabelText('Close sheet'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders agent text from getAgentDisplay rather than raw fields', () => {
    render(
      <AgentSelectSheet
        open={true}
        onClose={mockOnClose}
        agentOptions={AGENT_OPTIONS}
        getAgentDisplay={(agent) => ({
          name: `${agent.id}-localised`,
          personality: `${agent.id}-personality`,
          emojiName: agent.emojiName,
        })}
        defaultSelectedAgentNames={[]}
        onAgentMode={mockOnAgentMode}
      />
    );
    expect(screen.getByText('sage-localised')).toBeInTheDocument();
    expect(screen.getByText('sage-personality')).toBeInTheDocument();
    expect(screen.queryByText('Sage')).not.toBeInTheDocument();
  });
});
