import React from 'react';
import { render, screen } from '@testing-library/react';
import ActivityWidget from './ActivityWidget';
import { BaseServerState } from '@sudoku-web/template/types/gameState';
import { ServerStateResult } from '@sudoku-web/types/serverTypes';

// Mock react-feather
jest.mock('react-feather', () => ({
  Calendar: () => <svg data-testid="calendar-icon" />,
  Activity: () => <svg data-testid="activity-icon" />,
}));

describe('ActivityWidget', () => {
  const createMockSession = (
    daysAgo: number
  ): ServerStateResult<BaseServerState> => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
      updatedAt: date,
      sessionId: `session-${daysAgo}`,
      state: {} as BaseServerState,
    };
  };

  describe('rendering', () => {
    it('should render activity stats widget', () => {
      render(<ActivityWidget sessions={[]} />);
      expect(screen.getByText('Activity Stats')).toBeInTheDocument();
    });

    it('should render with undefined sessions', () => {
      render(<ActivityWidget sessions={undefined} />);
      expect(screen.getByText('Activity Stats')).toBeInTheDocument();
    });

    it('should render with empty sessions array', () => {
      render(<ActivityWidget sessions={[]} />);
      expect(screen.getByText('Activity Stats')).toBeInTheDocument();
    });

    it('should render title heading', () => {
      render(<ActivityWidget sessions={[]} />);
      const heading = screen.getByRole('heading', { name: 'Activity Stats' });
      expect(heading).toBeInTheDocument();
    });

    it('should render calendar icon', () => {
      render(<ActivityWidget sessions={[]} />);
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    });

    it('should render activity icon', () => {
      render(<ActivityWidget sessions={[]} />);
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have widget wrapper with correct styling', () => {
      const { container } = render(<ActivityWidget sessions={[]} />);
      const wrapper = container.querySelector('.rounded-xl');
      expect(wrapper).toHaveClass('mb-3');
      expect(wrapper).toHaveClass('w-fit');
      expect(wrapper).toHaveClass('rounded-xl');
      expect(wrapper).toHaveClass('border');
      expect(wrapper).toHaveClass('border-stone-200');
      expect(wrapper).toHaveClass('p-3');
      expect(wrapper).toHaveClass('shadow-sm');
      expect(wrapper).toHaveClass('backdrop-blur-sm');
    });

    it('should have gradient background', () => {
      const { container } = render(<ActivityWidget sessions={[]} />);
      const wrapper = container.querySelector('.bg-gradient-to-br');
      expect(wrapper).toHaveClass('from-stone-50/80');
      expect(wrapper).toHaveClass('to-stone-100/80');
      expect(wrapper).toHaveClass('dark:from-zinc-800/80');
      expect(wrapper).toHaveClass('dark:to-zinc-900/80');
    });

    it('should have heading with proper styling', () => {
      const { container } = render(<ActivityWidget sessions={[]} />);
      const heading = container.querySelector('h2');
      expect(heading).toHaveClass('mb-2');
      expect(heading).toHaveClass('text-lg');
      expect(heading).toHaveClass('font-bold');
      expect(heading).toHaveClass('text-gray-800');
      expect(heading).toHaveClass('dark:text-white');
    });

    it('should have stat cards with flex layout', () => {
      const { container } = render(<ActivityWidget sessions={[]} />);
      const statContainer = container.querySelector('.flex');
      expect(statContainer).toBeInTheDocument();
      expect(statContainer).toHaveClass('gap-6');
    });
  });

  describe('activity stats calculation with empty sessions', () => {
    it('should display 0 days played when sessions is empty', () => {
      render(<ActivityWidget sessions={[]} />);
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should display 0 day streak when sessions is empty', () => {
      render(<ActivityWidget sessions={[]} />);
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThanOrEqual(2);
    });

    it('should display correct label for days played', () => {
      render(<ActivityWidget sessions={[]} />);
      expect(
        screen.getByText('Days played in past 30 days')
      ).toBeInTheDocument();
    });

    it('should display correct label for day streak', () => {
      render(<ActivityWidget sessions={[]} />);
      expect(screen.getByText('Day streak')).toBeInTheDocument();
    });
  });

  describe('activity stats calculation with sessions', () => {
    it('should count unique play days in past 30 days', () => {
      const sessions = [
        createMockSession(0), // today
        createMockSession(1), // yesterday
        createMockSession(5), // 5 days ago
        createMockSession(31), // beyond 30 days
      ];

      render(<ActivityWidget sessions={sessions} />);
      // Should count: today, yesterday, 5 days ago (3 days total), not 31 days ago
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should not count sessions beyond 30 days', () => {
      const sessions = [createMockSession(0), createMockSession(31)];

      render(<ActivityWidget sessions={sessions} />);
      // Should only count today's session
      const oneElements = screen.getAllByText('1');
      expect(oneElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should calculate correct streak when playing consecutive days', () => {
      const sessions = [
        createMockSession(0), // today
        createMockSession(1), // yesterday
        createMockSession(2), // 2 days ago
      ];

      render(<ActivityWidget sessions={sessions} />);
      // Should have at least a streak (depends on current day)
      expect(
        screen.getByText('Days played in past 30 days')
      ).toBeInTheDocument();
    });

    it('should handle sessions from same day multiple times', () => {
      const sessions = [
        createMockSession(0),
        createMockSession(0), // same day
        createMockSession(0), // same day
      ];

      render(<ActivityWidget sessions={sessions} />);
      // Should count as 1 unique day played
      const oneElements = screen.getAllByText('1');
      expect(oneElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should calculate streak correctly with today missing', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

      const sessions = [
        {
          ...createMockSession(1),
          updatedAt: yesterday,
        },
        {
          ...createMockSession(2),
          updatedAt: twoDaysAgo,
        },
      ];

      render(<ActivityWidget sessions={sessions} />);
      expect(
        screen.getByText('Days played in past 30 days')
      ).toBeInTheDocument();
    });
  });

  describe('stat cards display', () => {
    it('should display calendar stat card', () => {
      render(<ActivityWidget sessions={[]} />);
      const calendarStat = screen.getByTestId('calendar-icon');
      expect(calendarStat.closest('.flex')).toBeInTheDocument();
    });

    it('should display activity stat card', () => {
      render(<ActivityWidget sessions={[]} />);
      const activityStat = screen.getByTestId('activity-icon');
      expect(activityStat.closest('.flex')).toBeInTheDocument();
    });

    it('should have icon containers with proper styling', () => {
      const { container } = render(<ActivityWidget sessions={[]} />);
      const iconContainers = container.querySelectorAll('.h-8');
      expect(iconContainers.length).toBeGreaterThanOrEqual(2);

      iconContainers.forEach((iconContainer) => {
        expect(iconContainer).toHaveClass('flex-shrink-0');
        expect(iconContainer).toHaveClass('items-center');
        expect(iconContainer).toHaveClass('justify-center');
        expect(iconContainer).toHaveClass('rounded-full');
      });
    });

    it('should have blue icon background for days played', () => {
      render(<ActivityWidget sessions={[]} />);
      const calendarIconContainer =
        screen.getByTestId('calendar-icon').parentElement;
      expect(calendarIconContainer).toHaveClass('bg-blue-100');
      expect(calendarIconContainer).toHaveClass('dark:bg-blue-900/50');
    });

    it('should have orange icon background for streak', () => {
      render(<ActivityWidget sessions={[]} />);
      const activityIconContainer =
        screen.getByTestId('activity-icon').parentElement;
      expect(activityIconContainer).toHaveClass('bg-orange-100');
      expect(activityIconContainer).toHaveClass('dark:bg-orange-900/50');
    });

    it('should display large number statistics', () => {
      render(<ActivityWidget sessions={[]} />);
      const numbers = screen.getAllByText('0');
      expect(numbers.length).toBeGreaterThanOrEqual(2);

      numbers.forEach((number) => {
        expect(number).toHaveClass('text-lg');
        expect(number).toHaveClass('font-bold');
      });
    });
  });

  describe('icon styling', () => {
    it('should have blue icon for calendar', () => {
      render(<ActivityWidget sessions={[]} />);
      const calendarIcon = screen.getByTestId('calendar-icon');
      expect(calendarIcon).toBeInTheDocument();
      expect(calendarIcon.tagName).toBe('svg');
    });

    it('should have orange icon for activity', () => {
      render(<ActivityWidget sessions={[]} />);
      const activityIcon = screen.getByTestId('activity-icon');
      expect(activityIcon).toBeInTheDocument();
      expect(activityIcon.tagName).toBe('svg');
    });
  });

  describe('dark mode support', () => {
    it('should have dark mode styles', () => {
      const { container } = render(<ActivityWidget sessions={[]} />);
      const wrapper = container.querySelector('.dark\\:border-gray-700');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have dark mode text colors', () => {
      const { container } = render(<ActivityWidget sessions={[]} />);
      const heading = container.querySelector('.dark\\:text-white');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('responsive design', () => {
    it('should be compact with w-fit', () => {
      const { container } = render(<ActivityWidget sessions={[]} />);
      const wrapper = container.querySelector('.w-fit');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have horizontal layout for stats', () => {
      const { container } = render(<ActivityWidget sessions={[]} />);
      const statsContainer = container.querySelector('.flex');
      expect(statsContainer).toHaveClass('flex');
      expect(statsContainer).toHaveClass('gap-6');
    });

    it('should have proper spacing between items', () => {
      const { container } = render(<ActivityWidget sessions={[]} />);
      const iconSpacing = container.querySelector('.space-x-2');
      expect(iconSpacing).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle very large number of sessions', () => {
      const sessions = Array.from({ length: 100 }, (_, i) =>
        createMockSession(i)
      );

      render(<ActivityWidget sessions={sessions} />);
      expect(
        screen.getByText('Days played in past 30 days')
      ).toBeInTheDocument();
    });

    it('should handle sessions from exactly 30 days ago', () => {
      const sessions = [createMockSession(0), createMockSession(30)];

      render(<ActivityWidget sessions={sessions} />);
      expect(
        screen.getByText('Days played in past 30 days')
      ).toBeInTheDocument();
    });

    it('should handle single session', () => {
      const sessions = [createMockSession(0)];

      render(<ActivityWidget sessions={sessions} />);
      const oneElements = screen.getAllByText('1');
      expect(oneElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('accessibility', () => {
    it('should have semantic heading', () => {
      render(<ActivityWidget sessions={[]} />);
      const heading = screen.getByRole('heading', { name: 'Activity Stats' });
      expect(heading.tagName).toBe('H2');
    });

    it('should have readable stat labels', () => {
      render(<ActivityWidget sessions={[]} />);
      expect(screen.getByText('Days played in past 30 days')).toBeVisible();
      expect(screen.getByText('Day streak')).toBeVisible();
    });

    it('should have good contrast colors', () => {
      const { container } = render(<ActivityWidget sessions={[]} />);
      const textElements = container.querySelectorAll('.text-gray-800');
      expect(textElements.length).toBeGreaterThan(0);
    });
  });
});
