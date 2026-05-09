import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RacingPromptModal } from './RacingPromptModal';

const AGENT_OPTIONS = [
  {
    name: 'Bumblebee',
    emoji: '🐝',
    emojiName: 'bee',
    skillLevel: 'novice',
    personality: 'Restless and enthusiastic.',
  },
  {
    name: 'Sage',
    emoji: '🦉',
    emojiName: 'owl',
    skillLevel: 'expert',
    personality: 'Calm and deliberate.',
  },
  {
    name: 'Ember',
    emoji: '🦊',
    emojiName: 'fox',
    skillLevel: 'proficient',
    personality: 'Intense and competitive.',
  },
];

describe('RacingPromptModal', () => {
  const mockOnClose = jest.fn();
  const mockOnRaceMode = jest.fn();
  const mockOnSoloMode = jest.fn();
  const mockOnAgentMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    it('should render when isOpen is true', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(screen.getByText(/Choose Your Mode/i)).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <RacingPromptModal
          isOpen={false}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(screen.queryByText(/Choose Your Mode/i)).not.toBeInTheDocument();
    });
  });

  describe('header content', () => {
    it('should display the modal title', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(screen.getByText(/Choose Your Mode/i)).toBeInTheDocument();
    });

    it('should display subtitle text', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(
        screen.getByText(/Race others, challenge AI, or go solo/i)
      ).toBeInTheDocument();
    });
  });

  describe('race mode button', () => {
    it('should display race mode button', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(screen.getByText(/Race Friends & Family/i)).toBeInTheDocument();
    });

    it('should display race mode description', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(screen.getByText(/Share a link/i)).toBeInTheDocument();
    });

    it('should call onRaceMode and onClose when race button is clicked', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      const raceButton = screen
        .getByText(/Race Friends & Family/i)
        .closest('button');
      fireEvent.click(raceButton!);
      expect(mockOnRaceMode).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('solo mode button', () => {
    it('should display solo mode button', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(screen.getByText(/Solo Challenge/i)).toBeInTheDocument();
    });

    it('should call onSoloMode and onClose when solo button is clicked', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      const soloButton = screen.getByRole('button', {
        name: /Solo Challenge/i,
      });
      fireEvent.click(soloButton);
      expect(mockOnSoloMode).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('agent mode', () => {
    it('should not show AI option when onAgentMode is not provided', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(screen.queryByText(/Race AI Opponents/i)).not.toBeInTheDocument();
    });

    it('should show AI option when onAgentMode and agentOptions are provided', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
          onAgentMode={mockOnAgentMode}
          agentOptions={AGENT_OPTIONS}
        />
      );
      expect(screen.getByText(/Race AI Opponents/i)).toBeInTheDocument();
    });

    it('should navigate to agent select view when AI option is clicked', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
          onAgentMode={mockOnAgentMode}
          agentOptions={AGENT_OPTIONS}
        />
      );
      fireEvent.click(
        screen.getByText(/Race AI Opponents/i).closest('button')!
      );
      expect(screen.getByText(/Pick Your Rivals/i)).toBeInTheDocument();
    });

    it('should display agent cards in agent select view', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
          onAgentMode={mockOnAgentMode}
          agentOptions={AGENT_OPTIONS}
        />
      );
      fireEvent.click(
        screen.getByText(/Race AI Opponents/i).closest('button')!
      );
      expect(screen.getByText('Bumblebee')).toBeInTheDocument();
      expect(screen.getByText('Sage')).toBeInTheDocument();
      expect(screen.getByText('Ember')).toBeInTheDocument();
    });

    it('should pre-select default agents', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
          onAgentMode={mockOnAgentMode}
          agentOptions={AGENT_OPTIONS}
          defaultSelectedAgentNames={['Bumblebee', 'Sage']}
        />
      );
      fireEvent.click(
        screen.getByText(/Race AI Opponents/i).closest('button')!
      );
      expect(screen.getByText(/Race 2 Rivals/i)).toBeInTheDocument();
    });

    it('should call onAgentMode with selected agent names on start', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
          onAgentMode={mockOnAgentMode}
          agentOptions={AGENT_OPTIONS}
          defaultSelectedAgentNames={['Bumblebee']}
        />
      );
      fireEvent.click(
        screen.getByText(/Race AI Opponents/i).closest('button')!
      );
      fireEvent.click(screen.getByText(/Race 1 Rival/i));
      expect(mockOnAgentMode).toHaveBeenCalledWith(['Bumblebee']);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should toggle agent selection when card is clicked', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
          onAgentMode={mockOnAgentMode}
          agentOptions={AGENT_OPTIONS}
          defaultSelectedAgentNames={[]}
        />
      );
      fireEvent.click(
        screen.getByText(/Race AI Opponents/i).closest('button')!
      );
      expect(
        screen.getByText(/Select at least one rival/i)
      ).toBeInTheDocument();
      fireEvent.click(screen.getByText('Bumblebee').closest('button')!);
      expect(screen.getByText(/Race 1 Rival/i)).toBeInTheDocument();
    });

    it('should navigate back to mode select when back button is clicked', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
          onAgentMode={mockOnAgentMode}
          agentOptions={AGENT_OPTIONS}
        />
      );
      fireEvent.click(
        screen.getByText(/Race AI Opponents/i).closest('button')!
      );
      expect(screen.getByText(/Pick Your Rivals/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Back/i }));
      expect(screen.getByText(/Choose Your Mode/i)).toBeInTheDocument();
    });

    it('should disable start button when no agents are selected', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
          onAgentMode={mockOnAgentMode}
          agentOptions={AGENT_OPTIONS}
          defaultSelectedAgentNames={[]}
        />
      );
      fireEvent.click(
        screen.getByText(/Race AI Opponents/i).closest('button')!
      );
      const startButton = screen.getByText(/Select at least one rival/i);
      expect(startButton.closest('button')).toBeDisabled();
    });
  });

  describe('dialog structure', () => {
    it('should render modal dialog', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(screen.getByText(/Choose Your Mode/i)).toBeInTheDocument();
    });

    it('should render all mode options', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
          onAgentMode={mockOnAgentMode}
          agentOptions={AGENT_OPTIONS}
        />
      );
      expect(screen.getByText(/Race Friends & Family/i)).toBeInTheDocument();
      expect(screen.getByText(/Race AI Opponents/i)).toBeInTheDocument();
      expect(screen.getByText(/Solo Challenge/i)).toBeInTheDocument();
    });
  });

  describe('transition behavior', () => {
    it('should transition modal visibility smoothly', async () => {
      const { rerender } = render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(screen.getByText(/Choose Your Mode/i)).toBeInTheDocument();

      rerender(
        <RacingPromptModal
          isOpen={false}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText(/Choose Your Mode/i)).not.toBeInTheDocument();
      });
    });
  });
});
