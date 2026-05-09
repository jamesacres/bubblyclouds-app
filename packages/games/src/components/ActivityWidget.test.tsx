import React from 'react';
import { render, screen } from '@testing-library/react';
import ActivityWidget from './ActivityWidget';
import { BaseServerState } from '@bubblyclouds-app/template/types/state';
import { ServerStateResult } from '@bubblyclouds-app/types/serverTypes';
import { DayActivity } from '../helpers/calculateActivityStats';

jest.mock('../helpers/calculateActivityStats', () => ({
  calculateActivityStats: jest.fn(),
}));

const { calculateActivityStats } = jest.requireMock(
  '../helpers/calculateActivityStats'
) as { calculateActivityStats: jest.Mock };

const makeSevenDays = (overrides: Partial<DayActivity>[] = []): DayActivity[] =>
  Array.from({ length: 7 }, (_, i) => ({
    label: ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'][i],
    puzzleCount: 0,
    isToday: i === 6,
    ...overrides[i],
  }));

const makeSession = (daysAgo: number): ServerStateResult<BaseServerState> => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    updatedAt: date,
    sessionId: `session-${daysAgo}`,
    state: {} as BaseServerState,
  };
};

describe('ActivityWidget', () => {
  beforeEach(() => {
    calculateActivityStats.mockReturnValue({
      daysPlayedInThirtyDays: 0,
      puzzlesPlayedInThirtyDays: 0,
      currentStreak: 0,
      lastSevenDays: makeSevenDays(),
    });
  });

  it('renders 7 day dots', () => {
    render(<ActivityWidget sessions={[]} />);
    for (let i = 0; i < 7; i++) {
      expect(screen.getByTestId(`day-dot-${i}`)).toBeInTheDocument();
    }
  });

  it('renders day labels', () => {
    render(<ActivityWidget sessions={[]} />);
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('W')).toBeInTheDocument();
  });

  it('renders with undefined sessions', () => {
    render(<ActivityWidget sessions={undefined} />);
    expect(screen.getByTestId('streak-count')).toBeInTheDocument();
  });

  it('passes sessions to calculateActivityStats', () => {
    const sessions = [makeSession(0), makeSession(1)];
    render(<ActivityWidget sessions={sessions} />);
    expect(calculateActivityStats).toHaveBeenCalledWith(sessions);
  });

  it('displays streak and puzzle counts', () => {
    calculateActivityStats.mockReturnValue({
      daysPlayedInThirtyDays: 7,
      puzzlesPlayedInThirtyDays: 12,
      currentStreak: 3,
      lastSevenDays: makeSevenDays(),
    });

    render(<ActivityWidget sessions={[]} />);
    expect(screen.getByTestId('streak-count')).toHaveTextContent(
      '3 day streak'
    );
    expect(screen.getByTestId('puzzles-count')).toHaveTextContent(
      '12 this month'
    );
  });

  it('shows puzzle count number inside dot when puzzleCount > 0', () => {
    const days = makeSevenDays();
    days[3].puzzleCount = 3;
    calculateActivityStats.mockReturnValue({
      daysPlayedInThirtyDays: 1,
      puzzlesPlayedInThirtyDays: 3,
      currentStreak: 1,
      lastSevenDays: days,
    });

    render(<ActivityWidget sessions={[]} />);
    const playedDot = screen.getByTestId('day-dot-3');
    expect(playedDot).toHaveClass('bg-theme-primary');
    expect(playedDot).toHaveTextContent('3');
  });

  it('caps displayed count at 9+', () => {
    const days = makeSevenDays();
    days[0].puzzleCount = 12;
    calculateActivityStats.mockReturnValue({
      daysPlayedInThirtyDays: 1,
      puzzlesPlayedInThirtyDays: 12,
      currentStreak: 1,
      lastSevenDays: days,
    });

    render(<ActivityWidget sessions={[]} />);
    expect(screen.getByTestId('day-dot-0')).toHaveTextContent('9+');
  });

  it('marks today with ring when no puzzles played', () => {
    render(<ActivityWidget sessions={[]} />);
    const todayDot = screen.getByTestId('day-dot-6');
    expect(todayDot).toHaveClass('ring-2');
  });

  it('accepts dark variant without crashing', () => {
    render(<ActivityWidget sessions={[]} variant="dark" />);
    expect(screen.getByTestId('streak-count')).toBeInTheDocument();
  });
});
