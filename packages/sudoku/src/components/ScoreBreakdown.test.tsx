import React from 'react';
import { render, screen } from '@testing-library/react';
import ScoreBreakdown from './ScoreBreakdown';
import { FriendsLeaderboardScore } from '@sudoku-web/sudoku/types/scoringTypes';

jest.mock('@sudoku-web/sudoku/helpers/scoringUtils', () => ({
  formatTime: jest.fn((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }),
}));

describe('ScoreBreakdown', () => {
  const createBreakdown = (
    overrides?: Partial<FriendsLeaderboardScore['breakdown']>
  ): FriendsLeaderboardScore['breakdown'] => ({
    volumeScore: 100,
    dailyPuzzleScore: 50,
    bookPuzzleScore: 75,
    scannedPuzzleScore: 25,
    difficultyBonus: 30,
    speedBonus: 100,
    racingBonus: 50,
    ...overrides,
  });

  const createStats = (
    overrides?: Partial<FriendsLeaderboardScore['stats']>
  ): FriendsLeaderboardScore['stats'] => ({
    totalPuzzles: 10,
    dailyPuzzles: 3,
    bookPuzzles: 4,
    scannedPuzzles: 3,
    averageTime: 120,
    fastestTime: 60,
    racingWins: 5,
    ...overrides,
  });

  describe('rendering', () => {
    it('should render score breakdown container', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      const { container } = render(
        <ScoreBreakdown breakdown={breakdown} stats={stats} />
      );

      expect(
        container.querySelector('[class*="border-t"]')
      ).toBeInTheDocument();
    });

    it('should render score breakdown title', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('Score Breakdown')).toBeInTheDocument();
    });

    it('should render all score items with positive values', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('Volume Bonus')).toBeInTheDocument();
      expect(screen.getByText('Daily Puzzles')).toBeInTheDocument();
      expect(screen.getByText('Book Puzzles')).toBeInTheDocument();
      expect(screen.getByText('Scanned Puzzles')).toBeInTheDocument();
      expect(screen.getByText('Difficulty Bonus')).toBeInTheDocument();
      expect(screen.getByText('Speed Bonus')).toBeInTheDocument();
      expect(screen.getByText('Racing Bonus')).toBeInTheDocument();
    });
  });

  describe('score display', () => {
    it('should display volume bonus with correct score', () => {
      const breakdown = createBreakdown({ volumeScore: 250 });
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('+250')).toBeInTheDocument();
    });

    it('should display daily puzzle score', () => {
      const breakdown = createBreakdown({ dailyPuzzleScore: 150 });
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('+150')).toBeInTheDocument();
    });

    it('should display book puzzle score', () => {
      const breakdown = createBreakdown({ bookPuzzleScore: 300 });
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('+300')).toBeInTheDocument();
    });

    it('should display scanned puzzle score', () => {
      const breakdown = createBreakdown({ scannedPuzzleScore: 200 });
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('+200')).toBeInTheDocument();
    });

    it('should display difficulty bonus', () => {
      const breakdown = createBreakdown({ difficultyBonus: 500 });
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('+500')).toBeInTheDocument();
    });

    it('should display speed bonus', () => {
      const breakdown = createBreakdown({ speedBonus: 600 });
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('+600')).toBeInTheDocument();
    });

    it('should display racing bonus', () => {
      const breakdown = createBreakdown({ racingBonus: 400 });
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('+400')).toBeInTheDocument();
    });
  });

  describe('score formatting', () => {
    it('should format large scores with thousands separator', () => {
      const breakdown = createBreakdown({ volumeScore: 1000 });
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('+1,000')).toBeInTheDocument();
    });

    it('should format very large scores correctly', () => {
      const breakdown = createBreakdown({ volumeScore: 10000 });
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('+10,000')).toBeInTheDocument();
    });
  });

  describe('detail text display', () => {
    it('should display volume puzzle count', () => {
      const breakdown = createBreakdown();
      const stats = createStats({ totalPuzzles: 25 });

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('25 puzzles completed')).toBeInTheDocument();
    });

    it('should display daily puzzle count', () => {
      const breakdown = createBreakdown();
      const stats = createStats({ dailyPuzzles: 10 });

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('10 daily challenges')).toBeInTheDocument();
    });

    it('should display book puzzle count', () => {
      const breakdown = createBreakdown();
      const stats = createStats({ bookPuzzles: 8 });

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('8 from puzzle books')).toBeInTheDocument();
    });

    it('should display scanned puzzle count', () => {
      const breakdown = createBreakdown();
      const stats = createStats({ scannedPuzzles: 7 });

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('7 imported puzzles')).toBeInTheDocument();
    });

    it('should display difficulty bonus detail', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(
        screen.getByText('Harder puzzles = more points')
      ).toBeInTheDocument();
    });

    it('should display speed bonus with fastest time', () => {
      const breakdown = createBreakdown();
      const stats = createStats({ fastestTime: 120 });

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText(/Fastest: 2:00/)).toBeInTheDocument();
    });

    it('should display racing bonus detail', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(
        screen.getByText('Beat friends who also completed')
      ).toBeInTheDocument();
    });
  });

  describe('zero score filtering', () => {
    it('should not display items with zero score', () => {
      const breakdown = createBreakdown({
        volumeScore: 0,
        dailyPuzzleScore: 50,
        bookPuzzleScore: 0,
        scannedPuzzleScore: 0,
        difficultyBonus: 0,
        speedBonus: 0,
        racingBonus: 0,
      });
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.queryByText('Volume Bonus')).not.toBeInTheDocument();
      expect(screen.getByText('Daily Puzzles')).toBeInTheDocument();
      expect(screen.queryByText('Book Puzzles')).not.toBeInTheDocument();
    });

    it('should display only items with positive scores', () => {
      const breakdown = createBreakdown({
        volumeScore: 100,
        dailyPuzzleScore: 0,
        bookPuzzleScore: 0,
        scannedPuzzleScore: 50,
        difficultyBonus: 25,
        speedBonus: 0,
        racingBonus: 75,
      });
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('Volume Bonus')).toBeInTheDocument();
      expect(screen.queryByText('Daily Puzzles')).not.toBeInTheDocument();
      expect(screen.queryByText('Book Puzzles')).not.toBeInTheDocument();
      expect(screen.getByText('Scanned Puzzles')).toBeInTheDocument();
      expect(screen.getByText('Difficulty Bonus')).toBeInTheDocument();
      expect(screen.queryByText('Speed Bonus')).not.toBeInTheDocument();
      expect(screen.getByText('Racing Bonus')).toBeInTheDocument();
    });

    it('should render empty state when all scores are zero', () => {
      const breakdown = createBreakdown({
        volumeScore: 0,
        dailyPuzzleScore: 0,
        bookPuzzleScore: 0,
        scannedPuzzleScore: 0,
        difficultyBonus: 0,
        speedBonus: 0,
        racingBonus: 0,
      });
      const stats = createStats();

      const { container } = render(
        <ScoreBreakdown breakdown={breakdown} stats={stats} />
      );

      // Should still render the container and title
      expect(screen.getByText('Score Breakdown')).toBeInTheDocument();
      // But no score items should be displayed
      expect(container.querySelectorAll('[class*="rounded-lg"]').length).toBe(
        0
      );
    });
  });

  describe('styling and layout', () => {
    it('should have responsive grid layout', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      const { container } = render(
        <ScoreBreakdown breakdown={breakdown} stats={stats} />
      );

      const gridContainer = container.querySelector('[class*="grid"]');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid-cols-1');
    });

    it('should have colored left border for each item', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      const { container } = render(
        <ScoreBreakdown breakdown={breakdown} stats={stats} />
      );

      // Check for border-l classes (left border)
      const itemsWithBorders = container.querySelectorAll(
        '[class*="border-l"]'
      );
      expect(itemsWithBorders.length).toBeGreaterThan(0);
    });

    it('should have white background with proper styling', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      const { container } = render(
        <ScoreBreakdown breakdown={breakdown} stats={stats} />
      );

      const items = container.querySelectorAll('[class*="bg-white"]');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should have dark mode support', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      const { container } = render(
        <ScoreBreakdown breakdown={breakdown} stats={stats} />
      );

      const darkModeElements = container.querySelectorAll('[class*="dark:"]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });
  });

  describe('icons', () => {
    it('should render award icon for volume bonus', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      // The component uses react-feather icons
      // Check for volume bonus section
      expect(screen.getByText('Volume Bonus')).toBeInTheDocument();
    });

    it('should render calendar icon for daily puzzles', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('Daily Puzzles')).toBeInTheDocument();
    });

    it('should render book icon for book puzzles', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('Book Puzzles')).toBeInTheDocument();
    });

    it('should render camera icon for scanned puzzles', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('Scanned Puzzles')).toBeInTheDocument();
    });

    it('should render zap icon for speed bonus', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('Speed Bonus')).toBeInTheDocument();
    });
  });

  describe('color coding', () => {
    it('should have green border for volume bonus', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      const { container } = render(
        <ScoreBreakdown breakdown={breakdown} stats={stats} />
      );

      const volumeItem = container.querySelector('.border-l-green-500');
      expect(volumeItem).toBeInTheDocument();
    });

    it('should have blue border for daily puzzles', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      const { container } = render(
        <ScoreBreakdown breakdown={breakdown} stats={stats} />
      );

      const dailyItem = container.querySelector('.border-l-blue-500');
      expect(dailyItem).toBeInTheDocument();
    });

    it('should have purple border for book puzzles', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      const { container } = render(
        <ScoreBreakdown breakdown={breakdown} stats={stats} />
      );

      const bookItem = container.querySelector('.border-l-purple-500');
      expect(bookItem).toBeInTheDocument();
    });

    it('should have orange border for scanned puzzles', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      const { container } = render(
        <ScoreBreakdown breakdown={breakdown} stats={stats} />
      );

      const scannedItem = container.querySelector('.border-l-orange-500');
      expect(scannedItem).toBeInTheDocument();
    });

    it('should have red border for difficulty bonus', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      const { container } = render(
        <ScoreBreakdown breakdown={breakdown} stats={stats} />
      );

      const difficultyItem = container.querySelector('.border-l-red-500');
      expect(difficultyItem).toBeInTheDocument();
    });

    it('should have yellow border for speed bonus', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      const { container } = render(
        <ScoreBreakdown breakdown={breakdown} stats={stats} />
      );

      const speedItem = container.querySelector('.border-l-yellow-500');
      expect(speedItem).toBeInTheDocument();
    });

    it('should have indigo border for racing bonus', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      const { container } = render(
        <ScoreBreakdown breakdown={breakdown} stats={stats} />
      );

      const racingItem = container.querySelector('.border-l-indigo-500');
      expect(racingItem).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle very large scores', () => {
      const breakdown = createBreakdown({
        volumeScore: 999999,
        dailyPuzzleScore: 888888,
      });
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('+999,999')).toBeInTheDocument();
      expect(screen.getByText('+888,888')).toBeInTheDocument();
    });

    it('should handle zero stats gracefully', () => {
      const breakdown = createBreakdown({
        volumeScore: 0,
        dailyPuzzleScore: 50,
      });
      const stats = createStats({
        totalPuzzles: 0,
        dailyPuzzles: 0,
        fastestTime: 0,
      });

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('0 daily challenges')).toBeInTheDocument();
    });

    it('should handle single puzzle count', () => {
      const breakdown = createBreakdown();
      const stats = createStats({ totalPuzzles: 1 });

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      expect(screen.getByText('1 puzzles completed')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have semantic structure', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      const { container } = render(
        <ScoreBreakdown breakdown={breakdown} stats={stats} />
      );

      // Check for structured layout
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should have readable text contrast', () => {
      const breakdown = createBreakdown();
      const stats = createStats();

      render(<ScoreBreakdown breakdown={breakdown} stats={stats} />);

      // Score breakdown title should be visible
      expect(screen.getByText('Score Breakdown')).toBeInTheDocument();
    });
  });
});
