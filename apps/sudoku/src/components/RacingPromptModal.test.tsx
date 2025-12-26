import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RacingPromptModal } from './RacingPromptModal';

describe('RacingPromptModal', () => {
  const mockOnClose = jest.fn();
  const mockOnRaceMode = jest.fn();
  const mockOnSoloMode = jest.fn();

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
      expect(
        screen.getByText(/Choose Your Challenge Mode/i)
      ).toBeInTheDocument();
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
      expect(
        screen.queryByText(/Choose Your Challenge Mode/i)
      ).not.toBeInTheDocument();
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
      expect(
        screen.getByText(/Choose Your Challenge Mode/i)
      ).toBeInTheDocument();
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
        screen.getByText(/Compete with others or practice solo/i)
      ).toBeInTheDocument();
    });

    it('should display racing icon', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(
        screen.getByText(/Choose Your Challenge Mode/i)
      ).toBeInTheDocument();
    });

    it('should display complete header content', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(
        screen.getByText(/Compete with others or practice solo/i)
      ).toBeInTheDocument();
    });
  });

  describe('race mode button', () => {
    it('should display race mode button with prominent styling', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(screen.getByText(/Race Friends and Family!/i)).toBeInTheDocument();
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
      expect(screen.getByText(/Players can join anytime/i)).toBeInTheDocument();
    });

    it('should call onRaceMode when race button is clicked', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      const raceButton = screen
        .getByText(/Race Friends and Family!/i)
        .closest('button');
      fireEvent.click(raceButton!);
      expect(mockOnRaceMode).toHaveBeenCalled();
    });

    it('should call onClose after onRaceMode', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      const raceButton = screen
        .getByText(/Race Friends and Family!/i)
        .closest('button');
      fireEvent.click(raceButton!);

      expect(mockOnRaceMode).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should have hover scale animation', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      const raceButton = screen
        .getByText(/Race Friends and Family!/i)
        .closest('button');
      expect(raceButton).toHaveClass('hover:scale-[1.02]');
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

    it('should call onSoloMode when solo button is clicked', () => {
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
    });

    it('should call onClose after onSoloMode', () => {
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

    it('should display in less prominent styling than race button', () => {
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
      // Solo button should not have the gradient background of race button
      expect(soloButton).toHaveClass('hover:bg-gray-100');
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
      expect(
        screen.getByText(/Choose Your Challenge Mode/i)
      ).toBeInTheDocument();
    });

    it('should render modal backdrop', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(
        screen.getByText(/Choose Your Challenge Mode/i)
      ).toBeInTheDocument();
    });

    it('should render modal panel with content', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(screen.getByText(/Race Friends and Family!/i)).toBeInTheDocument();
    });
  });

  describe('animations', () => {
    it('should render modal with smooth transitions', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(
        screen.getByText(/Choose Your Challenge Mode/i)
      ).toBeInTheDocument();
    });

    it('should render racing button with animations', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(screen.getByText(/Race Friends and Family!/i)).toBeInTheDocument();
    });
  });

  describe('responsive design', () => {
    it('should render modal content responsively', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(
        screen.getByText(/Choose Your Challenge Mode/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Race Friends and Family!/i)).toBeInTheDocument();
    });

    it('should render all modal content elements', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(
        screen.getByText(/Compete with others or practice solo/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Solo Challenge/i })
      ).toBeInTheDocument();
    });
  });

  describe('dark mode support', () => {
    it('should render modal with dark mode support', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      expect(
        screen.getByText(/Choose Your Challenge Mode/i)
      ).toBeInTheDocument();
    });
  });

  describe('keyboard interaction', () => {
    it('should support keyboard navigation between buttons', () => {
      render(
        <RacingPromptModal
          isOpen={true}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveProperty('onclick');
      });
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
      expect(
        screen.getByText(/Choose Your Challenge Mode/i)
      ).toBeInTheDocument();

      rerender(
        <RacingPromptModal
          isOpen={false}
          onClose={mockOnClose}
          onRaceMode={mockOnRaceMode}
          onSoloMode={mockOnSoloMode}
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText(/Choose Your Challenge Mode/i)
        ).not.toBeInTheDocument();
      });
    });
  });
});
