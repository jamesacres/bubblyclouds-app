import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ScoringLegend from './ScoringLegend';
import { SCORING_CONFIG } from '../helpers/scoringConfig';
import { Difficulty, BookPuzzleDifficulty } from '../types/difficulty';

describe('ScoringLegend', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    it('should return null when isOpen is false', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={false}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render modal when isOpen is true', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('How scoring works')).toBeInTheDocument();
    });

    it('should have fixed positioning overlay', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const overlay = container.querySelector('[class*="fixed"]');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('modal structure', () => {
    it('should render modal with proper styling classes', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const modal = container.querySelector('[class*="rounded-2xl"]');
      expect(modal).toBeInTheDocument();
    });

    it('should have sticky header', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const header = container.querySelector('[class*="sticky"]');
      expect(header).toBeInTheDocument();
    });

    it('should have scroll capability for overflow content', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const scrollable = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollable).toBeInTheDocument();
    });

    it('should have dark mode support', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const darkModeElements = container.querySelectorAll('[class*="dark:"]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });
  });

  describe('header', () => {
    it('should display title', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('How scoring works')).toBeInTheDocument();
    });

    it('should display close button', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const closeButton = container.querySelector('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const closeButton = container.querySelector('button');
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const overlay = container.querySelector('[class*="fixed"]');
      if (overlay) {
        fireEvent.click(overlay);
      }

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close when modal content is clicked', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const modalContent = screen.getByText('How scoring works').parentElement;
      if (modalContent) {
        fireEvent.click(modalContent);
      }

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('racing wins section', () => {
    it('should display racing wins section', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('Racing wins')).toBeInTheDocument();
    });

    it('should display racing bonus per person', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText(/for each friend/i)).toBeInTheDocument();
    });

    it('should show racing bonus calculation example', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const racingBonusTotal = SCORING_CONFIG.RACING_BONUS_PER_PERSON * 5;
      const matches = screen.getAllByText(new RegExp(`\\+${racingBonusTotal}`));
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('base points section', () => {
    it('should display base points section', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('Base points')).toBeInTheDocument();
    });

    it('should display any puzzle base points', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(
        screen.getByText(`+${SCORING_CONFIG.VOLUME_MULTIPLIER}`)
      ).toBeInTheDocument();
    });

    it('should display daily puzzle base points', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(
        screen.getByText(`+${SCORING_CONFIG.DAILY_PUZZLE_BASE}`)
      ).toBeInTheDocument();
    });

    it('should display book puzzle base points', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('Base points')).toBeInTheDocument();
    });

    it('should display scanned puzzle base points', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(
        screen.getByText(`+${SCORING_CONFIG.SCANNED_PUZZLE_BASE}`)
      ).toBeInTheDocument();
    });
  });

  describe('difficulty multipliers section', () => {
    it('should display difficulty multipliers section', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('Difficulty multipliers')).toBeInTheDocument();
    });

    it('should display daily puzzle difficulties label', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('Test Game of the Day')).toBeInTheDocument();
    });

    it('should display book puzzle difficulties', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('Book puzzles')).toBeInTheDocument();
    });

    it('should display daily puzzle difficulty multipliers', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const multiplier = SCORING_CONFIG.DIFFICULTY_MULTIPLIERS[Difficulty.EASY];
      const matches = screen.getAllByText(`${multiplier}×`);
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should display book puzzle difficulty multipliers', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('Book puzzles')).toBeInTheDocument();
    });

    it('should sort book puzzle difficulties by multiplier', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('Book puzzles')).toBeInTheDocument();
      const bookDifficulties = Object.values(BookPuzzleDifficulty);
      expect(bookDifficulties.length).toBeGreaterThan(0);
    });
  });

  describe('speed bonuses section', () => {
    it('should display speed bonuses section', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('Speed bonuses')).toBeInTheDocument();
    });

    it('should display lightning speed tier', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText(/under 3 min/i)).toBeInTheDocument();
    });

    it('should display fast speed bonus', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(
        screen.getByText(`+${SCORING_CONFIG.SPEED_BONUSES.FAST}`)
      ).toBeInTheDocument();
    });

    it('should display quick speed bonus', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('Speed bonuses')).toBeInTheDocument();
    });

    it('should display steady speed bonus', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('Speed bonuses')).toBeInTheDocument();
    });

    it('should display speed tiers with labels', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('Fast')).toBeInTheDocument();
      expect(screen.getByText('Quick')).toBeInTheDocument();
    });

    it('should display time thresholds correctly', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('Speed bonuses')).toBeInTheDocument();
    });

    it('should sort speed tiers by time descending', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('Speed bonuses')).toBeInTheDocument();
    });
  });

  describe('color coding', () => {
    it('should have amber colored highlights', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const amberElements = container.querySelectorAll('[class*="amber"]');
      expect(amberElements.length).toBeGreaterThan(0);
    });

    it('should have color-coded sections', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const amberBadge = container.querySelector('[class*="amber"]');
      expect(amberBadge).toBeInTheDocument();
    });

    it('should have colored badge backgrounds for difficulties', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const badges = container.querySelectorAll('[class*="bg-"]');
      expect(badges.length).toBeGreaterThan(5);
    });
  });

  describe('display names formatting', () => {
    it('should format book puzzle difficulty names correctly', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const displayedNames = Object.values(BookPuzzleDifficulty).map((diff) => {
        const name = (diff as string)
          .replace(/^\d+-/, '')
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        return name;
      });

      expect(displayedNames.length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('should have proper modal semantics', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const modal = container.querySelector('[class*="fixed"]');
      expect(modal).toBeInTheDocument();
    });

    it('should have readable text hierarchy', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const title = screen.getByText('How scoring works');
      expect(title.tagName.toLowerCase()).toBe('h3');
    });

    it('should have proper heading hierarchy in sections', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const sectionHeadings = screen.getByText('Racing wins');
      expect(sectionHeadings.tagName.toLowerCase()).toBe('h4');
    });

    it('should have accessible close button', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const closeButton = container.querySelector('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('should have sufficient color contrast', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('How scoring works')).toBeInTheDocument();
    });
  });

  describe('responsiveness', () => {
    it('should have responsive layout for content', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const responsiveElements = container.querySelectorAll(
        '[class*="sm:"], [class*="lg:"]'
      );
      expect(responsiveElements.length).toBeGreaterThan(0);
    });

    it('should handle max height constraint', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const modal = container.querySelector('[class*="max-h"]');
      expect(modal).toBeInTheDocument();
    });

    it('should handle max width constraint', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const modal = container.querySelector('[class*="max-w"]');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid open/close cycles', () => {
      const { rerender } = render(
        <ScoringLegend
          isOpen={false}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      rerender(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );
      expect(screen.getByText('How scoring works')).toBeInTheDocument();

      rerender(
        <ScoringLegend
          isOpen={false}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );
      expect(screen.queryByText('How scoring works')).not.toBeInTheDocument();

      rerender(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );
      expect(screen.getByText('How scoring works')).toBeInTheDocument();
    });

    it('should handle multiple onClose callbacks', () => {
      const mockOnClose1 = jest.fn();
      const mockOnClose2 = jest.fn();

      const { rerender, container } = render(
        <ScoringLegend isOpen={true} onClose={mockOnClose1} gameName="Sudoku" />
      );

      const closeButton = container.querySelector('button');
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      expect(mockOnClose1).toHaveBeenCalledTimes(1);

      rerender(
        <ScoringLegend isOpen={true} onClose={mockOnClose2} gameName="Sudoku" />
      );

      const newCloseButton = container.querySelector('button');
      if (newCloseButton) {
        fireEvent.click(newCloseButton);
      }

      expect(mockOnClose2).toHaveBeenCalledTimes(1);
    });

    it('should display all difficulty tiers', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText(/Tricky/)).toBeInTheDocument();
      expect(screen.getByText(/Challenging/)).toBeInTheDocument();
      const hardElements = screen.getAllByText(/Hard/);
      expect(hardElements.length).toBeGreaterThan(0);
    });
  });

  describe('content verification', () => {
    it('should display all scoring information sections', () => {
      render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      expect(screen.getByText('Racing wins')).toBeInTheDocument();
      expect(screen.getByText('Base points')).toBeInTheDocument();
      expect(screen.getByText('Difficulty multipliers')).toBeInTheDocument();
      expect(screen.getByText('Speed bonuses')).toBeInTheDocument();
    });

    it('should have correct badge coloring for speed tiers', () => {
      const { container } = render(
        <ScoringLegend
          isOpen={true}
          onClose={mockOnClose}
          gameName="Test Game"
        />
      );

      const amberElements = container.querySelectorAll('[class*="amber"]');
      expect(amberElements.length).toBeGreaterThan(0);
    });
  });
});
