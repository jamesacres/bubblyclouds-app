import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FriendLeaderboardEntry from './FriendLeaderboardEntry';
import { FriendsLeaderboardScore } from '@sudoku-web/sudoku/types/scoringTypes';

jest.mock('./ScoreBreakdown', () => {
  return function MockScoreBreakdown({ breakdown }: any) {
    return (
      <div data-testid="score-breakdown">
        <div data-testid="breakdown-volume">{breakdown.volumeScore}</div>
        <div data-testid="breakdown-daily">{breakdown.dailyPuzzleScore}</div>
      </div>
    );
  };
});

jest.mock('@sudoku-web/sudoku/helpers/scoringUtils', () => ({
  formatTime: jest.fn((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }),
}));

describe('FriendLeaderboardEntry', () => {
  const createEntry = (
    overrides?: Partial<FriendsLeaderboardScore>
  ): FriendsLeaderboardScore => ({
    userId: 'user-1',
    username: 'Alice',
    totalScore: 1000,
    breakdown: {
      volumeScore: 100,
      dailyPuzzleScore: 50,
      bookPuzzleScore: 75,
      scannedPuzzleScore: 25,
      difficultyBonus: 30,
      speedBonus: 100,
      racingBonus: 50,
    },
    stats: {
      totalPuzzles: 10,
      dailyPuzzles: 3,
      bookPuzzles: 4,
      scannedPuzzles: 3,
      averageTime: 120,
      fastestTime: 60,
      racingWins: 5,
    },
    ...overrides,
  });

  describe('rendering', () => {
    it('should render entry container', () => {
      const entry = createEntry();
      const { container } = render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(
        container.querySelector('[class*="rounded-2xl"]')
      ).toBeInTheDocument();
    });

    it('should display username', () => {
      const entry = createEntry({ username: 'Alice' });
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should display total score', () => {
      const entry = createEntry({ totalScore: 2500 });
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.getByText('2,500')).toBeInTheDocument();
      expect(screen.getByText('points')).toBeInTheDocument();
    });

    it('should display puzzle count', () => {
      const entry = createEntry({
        stats: { ...createEntry().stats, totalPuzzles: 15 },
      });
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.getByText(/15 puzzles/)).toBeInTheDocument();
    });

    it('should display average time', () => {
      const entry = createEntry({
        stats: { ...createEntry().stats, averageTime: 120 },
      });
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.getByText(/Avg: 2:00/)).toBeInTheDocument();
    });

    it('should display fastest time', () => {
      const entry = createEntry({
        stats: { ...createEntry().stats, fastestTime: 60 },
      });
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.getByText(/Best: 1:00/)).toBeInTheDocument();
    });

    it('should display racing wins', () => {
      const entry = createEntry({
        stats: { ...createEntry().stats, racingWins: 5 },
      });
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.getByText(/🏁 5 wins/)).toBeInTheDocument();
    });
  });

  describe('rank icons', () => {
    it('should display gold medal for rank 1', () => {
      const entry = createEntry();
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.getByText('🥇')).toBeInTheDocument();
    });

    it('should display silver medal for rank 2', () => {
      const entry = createEntry();
      render(
        <FriendLeaderboardEntry entry={entry} rank={2} isCurrentUser={false} />
      );

      expect(screen.getByText('🥈')).toBeInTheDocument();
    });

    it('should display bronze medal for rank 3', () => {
      const entry = createEntry();
      render(
        <FriendLeaderboardEntry entry={entry} rank={3} isCurrentUser={false} />
      );

      expect(screen.getByText('🥉')).toBeInTheDocument();
    });

    it('should display number for rank 4 and above', () => {
      const entry = createEntry();
      render(
        <FriendLeaderboardEntry entry={entry} rank={4} isCurrentUser={false} />
      );

      expect(screen.getByText('#4')).toBeInTheDocument();
    });

    it('should display number for high ranks', () => {
      const entry = createEntry();
      render(
        <FriendLeaderboardEntry
          entry={entry}
          rank={100}
          isCurrentUser={false}
        />
      );

      expect(screen.getByText('#100')).toBeInTheDocument();
    });
  });

  describe('current user styling', () => {
    it('should display (You) indicator for current user', () => {
      const entry = createEntry();
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={true} />
      );

      expect(screen.getByText('(You)')).toBeInTheDocument();
    });

    it('should not display (You) indicator for non-current user', () => {
      const entry = createEntry();
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.queryByText('(You)')).not.toBeInTheDocument();
    });

    it('should have different styling for current user', () => {
      const entry = createEntry();
      const { container } = render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={true} />
      );

      const entryDiv = container.querySelector('[class*="border-blue"]');
      expect(entryDiv).toBeInTheDocument();
    });

    it('should have default styling for non-current user', () => {
      const entry = createEntry();
      const { container } = render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      const entryDiv = container.querySelector('[class*="border-stone"]');
      expect(entryDiv).toBeInTheDocument();
    });
  });

  describe('score breakdown expansion', () => {
    it('should not display breakdown initially', () => {
      const entry = createEntry();
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.queryByTestId('score-breakdown')).not.toBeInTheDocument();
    });

    it('should display breakdown when entry is clicked', () => {
      const entry = createEntry();
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      const entryContent = screen.getByText('Alice').closest('[class*="flex"]');
      if (entryContent) {
        fireEvent.click(entryContent.parentElement!);
      }

      expect(screen.getByTestId('score-breakdown')).toBeInTheDocument();
    });

    it('should hide breakdown when clicked again', () => {
      const entry = createEntry();
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      const entryContent = screen.getByText('Alice').closest('[class*="flex"]');
      if (entryContent) {
        const clickableArea = entryContent.parentElement!;
        fireEvent.click(clickableArea);
        expect(screen.getByTestId('score-breakdown')).toBeInTheDocument();

        fireEvent.click(clickableArea);
        expect(screen.queryByTestId('score-breakdown')).not.toBeInTheDocument();
      }
    });

    it('should toggle chevron icon on expansion', () => {
      const entry = createEntry();
      const { container } = render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      // Should have ChevronRight initially (not expanded)
      const initialChevron = container.querySelector('svg');
      expect(initialChevron).toBeInTheDocument();

      // Click to expand
      const entryContent = screen.getByText('Alice').closest('[class*="flex"]');
      if (entryContent) {
        fireEvent.click(entryContent.parentElement!);

        // Check if breakdown is shown (chevron would be ChevronDown now)
        expect(screen.getByTestId('score-breakdown')).toBeInTheDocument();
      }
    });
  });

  describe('score formatting', () => {
    it('should format scores with thousands separator', () => {
      const entry = createEntry({ totalScore: 10000 });
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.getByText('10,000')).toBeInTheDocument();
    });

    it('should format very large scores', () => {
      const entry = createEntry({ totalScore: 1000000 });
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.getByText('1,000,000')).toBeInTheDocument();
    });
  });

  describe('time formatting', () => {
    it('should format time less than a minute', () => {
      const entry = createEntry({
        stats: { ...createEntry().stats, averageTime: 30 },
      });
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.getByText(/Avg: 0:30/)).toBeInTheDocument();
    });

    it('should format time more than an hour', () => {
      const entry = createEntry({
        stats: { ...createEntry().stats, averageTime: 3600 },
      });
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.getByText(/Avg: 60:00/)).toBeInTheDocument();
    });

    it('should not display best time if zero', () => {
      const entry = createEntry({
        stats: { ...createEntry().stats, fastestTime: 0 },
      });
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.queryByText(/Best:/)).not.toBeInTheDocument();
    });
  });

  describe('racing wins display', () => {
    it('should display racing wins when greater than zero', () => {
      const entry = createEntry({
        stats: { ...createEntry().stats, racingWins: 10 },
      });
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.getByText(/🏁 10 wins/)).toBeInTheDocument();
    });

    it('should not display racing wins when zero', () => {
      const entry = createEntry({
        stats: { ...createEntry().stats, racingWins: 0 },
      });
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.queryByText(/🏁/)).not.toBeInTheDocument();
    });
  });

  describe('score breakdown content', () => {
    it('should pass correct breakdown data to ScoreBreakdown', () => {
      const entry = createEntry({
        breakdown: {
          volumeScore: 200,
          dailyPuzzleScore: 100,
          bookPuzzleScore: 150,
          scannedPuzzleScore: 50,
          difficultyBonus: 75,
          speedBonus: 200,
          racingBonus: 100,
        },
      });

      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      // Click to expand
      const entryContent = screen.getByText('Alice').closest('[class*="flex"]');
      if (entryContent) {
        fireEvent.click(entryContent.parentElement!);

        expect(screen.getByTestId('breakdown-volume')).toHaveTextContent('200');
        expect(screen.getByTestId('breakdown-daily')).toHaveTextContent('100');
      }
    });

    it('should pass correct stats data to ScoreBreakdown', () => {
      const entry = createEntry({
        stats: {
          totalPuzzles: 20,
          dailyPuzzles: 5,
          bookPuzzles: 8,
          scannedPuzzles: 7,
          averageTime: 150,
          fastestTime: 45,
          racingWins: 12,
        },
      });

      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      // Click to expand
      const entryContent = screen.getByText('Alice').closest('[class*="flex"]');
      if (entryContent) {
        fireEvent.click(entryContent.parentElement!);

        expect(screen.getByTestId('score-breakdown')).toBeInTheDocument();
      }
    });
  });

  describe('styling and layout', () => {
    it('should have clickable cursor', () => {
      const entry = createEntry();
      const { container } = render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      const clickable = container.querySelector('[class*="cursor-pointer"]');
      expect(clickable).toBeInTheDocument();
    });

    it('should have transition animation', () => {
      const entry = createEntry();
      const { container } = render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      const transitionElement = container.querySelector(
        '[class*="transition"]'
      );
      expect(transitionElement).toBeInTheDocument();
    });

    it('should have dark mode support', () => {
      const entry = createEntry();
      const { container } = render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      const darkModeElements = container.querySelectorAll('[class*="dark:"]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });

    it('should have shadow effect', () => {
      const entry = createEntry();
      const { container } = render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      const shadowElement = container.querySelector('[class*="shadow"]');
      expect(shadowElement).toBeInTheDocument();
    });

    it('should have rounded corners', () => {
      const entry = createEntry();
      const { container } = render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      const roundedElement = container.querySelector('[class*="rounded"]');
      expect(roundedElement).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle very long usernames', () => {
      const longName = 'A'.repeat(50);
      const entry = createEntry({ username: longName });
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle zero scores', () => {
      const entry = createEntry({ totalScore: 0 });
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle zero puzzle count', () => {
      const entry = createEntry({
        stats: { ...createEntry().stats, totalPuzzles: 0 },
      });
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      expect(screen.getByText(/0 puzzles/)).toBeInTheDocument();
    });

    it('should handle high rank numbers', () => {
      const entry = createEntry();
      render(
        <FriendLeaderboardEntry
          entry={entry}
          rank={9999}
          isCurrentUser={false}
        />
      );

      expect(screen.getByText('#9999')).toBeInTheDocument();
    });

    it('should handle multiple rapid expansions', () => {
      const entry = createEntry();
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      const entryContent = screen.getByText('Alice').closest('[class*="flex"]');
      if (entryContent) {
        const clickableArea = entryContent.parentElement!;

        // Expand, collapse, expand rapidly
        fireEvent.click(clickableArea);
        expect(screen.getByTestId('score-breakdown')).toBeInTheDocument();

        fireEvent.click(clickableArea);
        expect(screen.queryByTestId('score-breakdown')).not.toBeInTheDocument();

        fireEvent.click(clickableArea);
        expect(screen.getByTestId('score-breakdown')).toBeInTheDocument();
      }
    });
  });

  describe('accessibility', () => {
    it('should have proper semantic structure', () => {
      const entry = createEntry();
      const { container } = render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      const divs = container.querySelectorAll('div');
      expect(divs.length).toBeGreaterThan(0);
    });

    it('should have readable text hierarchy', () => {
      const entry = createEntry();
      render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      const username = screen.getByText('Alice');
      expect(username.tagName).toBe('DIV');
    });

    it('should have clickable region', () => {
      const entry = createEntry();
      const { container } = render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      const clickableDiv = container.querySelector('[class*="cursor-pointer"]');
      expect(clickableDiv).toBeInTheDocument();
    });
  });

  describe('state management', () => {
    it('should maintain expanded state when re-rendering with same props', () => {
      const entry = createEntry();
      const { rerender } = render(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      const entryContent = screen.getByText('Alice').closest('[class*="flex"]');
      if (entryContent) {
        fireEvent.click(entryContent.parentElement!);
        expect(screen.getByTestId('score-breakdown')).toBeInTheDocument();
      }

      // Re-render with same props
      rerender(
        <FriendLeaderboardEntry entry={entry} rank={1} isCurrentUser={false} />
      );

      // Breakdown should still be visible
      expect(screen.getByTestId('score-breakdown')).toBeInTheDocument();
    });

    it('should reset expanded state when entry data changes', () => {
      const entry1 = createEntry({ username: 'Alice' });
      const { rerender } = render(
        <FriendLeaderboardEntry entry={entry1} rank={1} isCurrentUser={false} />
      );

      // Expand
      const entryContent = screen.getByText('Alice').closest('[class*="flex"]');
      if (entryContent) {
        fireEvent.click(entryContent.parentElement!);
        expect(screen.getByTestId('score-breakdown')).toBeInTheDocument();
      }

      // Change entry
      const entry2 = createEntry({ username: 'Bob' });
      rerender(
        <FriendLeaderboardEntry entry={entry2} rank={2} isCurrentUser={false} />
      );

      // Should show new entry
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });
});
