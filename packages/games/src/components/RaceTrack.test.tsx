import React from 'react';
import { render, screen } from '@testing-library/react';
import RaceTrack from './RaceTrack';
import * as usePartiesModule from '@bubblyclouds-app/template/hooks/useParties';
import * as playerColorsModule from '@bubblyclouds-app/template/utils/playerColors';
import { AgentProgress } from '@bubblyclouds-app/types/agentTypes';
import { Parties, Session } from '@bubblyclouds-app/types/serverTypes';
import { BaseServerState } from '@bubblyclouds-app/template/types/state';
import { PlayerRunResult } from '../types/scoringTypes';

jest.mock('@bubblyclouds-app/template/hooks/useParties');
jest.mock('@bubblyclouds-app/template/utils/playerColors', () => ({
  ...jest.requireActual('@bubblyclouds-app/template/utils/playerColors'),
  getAllUserIds: jest.fn(),
}));
jest.mock('@bubblyclouds-app/ui/hooks/useThemeColorName', () => ({
  useThemeColorName: () => undefined,
}));
// RateAppButton only renders on Capacitor or mobile web; force mobile-web so
// the rate-app prompt is exercised.
jest.mock('@bubblyclouds-app/template/helpers/capacitor', () => ({
  isCapacitor: () => false,
  isIOS: () => false,
  isAndroid: () => false,
}));

const setUserAgent = (value: string) => {
  Object.defineProperty(window.navigator, 'userAgent', {
    value,
    writable: true,
  });
};

const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
const IOS_UA =
  'Mozilla/5.0 (iPad; CPU OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15';

const mockUseParties = usePartiesModule.useParties as jest.Mock;
const mockGetAllUserIds = playerColorsModule.getAllUserIds as jest.Mock;
const mockCalculateCompletionPercentageFromState = jest.fn();
const mockIsPuzzleCheated = jest.fn();

const agent = (
  overrides: Partial<AgentProgress<BaseServerState>>
): AgentProgress<BaseServerState> => ({
  agentId: 'agent-0',
  name: 'Bumblebee',
  emoji: '🐝',
  percentage: 40,
  skillLevel: 'novice',
  ...overrides,
});

const shortTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${`${seconds % 60}`.padStart(2, '0')}`;
};

describe('RaceTrack', () => {
  const mockSessionParties: Parties<Session<BaseServerState>> = {
    party1: {
      memberSessions: {
        userId2: {
          sessionId: 'session-userId2',
          updatedAt: new Date(),
          state: {
            initial: [],
            final: [],
            answerStack: [[]],
            completed: { seconds: 120, at: new Date().toISOString() },
          },
        },
      },
    },
  };

  const currentUserState: BaseServerState = {
    initial: [],
    final: [],
    answerStack: [],
    completed: { seconds: 100, at: new Date().toISOString() },
  };

  const defaultProps = {
    sessionParties: mockSessionParties,
    state: currentUserState,
    userId: 'userId1',
    onClick: jest.fn(),
    refreshSessionParties: jest.fn(),
    isPolling: false,
    calculateCompletionPercentageFromState:
      mockCalculateCompletionPercentageFromState,
    isPuzzleCheated: mockIsPuzzleCheated,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setUserAgent(DESKTOP_UA);
    mockUseParties.mockReturnValue({
      getNicknameByUserId: () => 'Player 2',
      parties: [],
      refreshParties: jest.fn(),
    });
    mockGetAllUserIds.mockReturnValue(['userId1', 'userId2']);
    mockCalculateCompletionPercentageFromState.mockReturnValue(50);
    mockIsPuzzleCheated.mockReturnValue(false);
  });

  it('renders the race track with players', () => {
    render(<RaceTrack {...defaultProps} />);
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Finish')).toBeInTheDocument();
    expect(screen.getByText(/Player 2/)).toBeInTheDocument();
  });

  it('displays a leaderboard of finished players', () => {
    mockCalculateCompletionPercentageFromState.mockReturnValue(100);
    render(<RaceTrack {...defaultProps} />);
    expect(screen.getByText(/1\./)).toBeInTheDocument();
  });

  it('shows completion UI when the current user has finished', () => {
    mockCalculateCompletionPercentageFromState.mockImplementation((state) =>
      state === defaultProps.state ? 100 : 50
    );
    render(<RaceTrack {...defaultProps} />);
    expect(screen.getByText(/Leaderboard/)).toBeInTheDocument();
  });

  it('links the secondary CTA to the puzzle book by default', () => {
    mockCalculateCompletionPercentageFromState.mockImplementation((state) =>
      state === defaultProps.state ? 100 : 50
    );
    render(<RaceTrack {...defaultProps} />);
    const bookLink = screen.getByText('Puzzle book').closest('a');
    expect(bookLink).toHaveAttribute('href', '/book');
  });

  it('uses the secondary CTA override when provided', () => {
    mockCalculateCompletionPercentageFromState.mockImplementation((state) =>
      state === defaultProps.state ? 100 : 50
    );
    render(
      <RaceTrack
        {...defaultProps}
        secondaryCta={{
          href: '/collection',
          label: 'Collection',
          icon: 'collection',
        }}
      />
    );
    const link = screen.getByText('Collection').closest('a');
    expect(link).toHaveAttribute('href', '/collection');
    expect(screen.queryByText('Puzzle book')).not.toBeInTheDocument();
  });

  it('shows per-player stats on the leaderboard when provided', () => {
    mockCalculateCompletionPercentageFromState.mockReturnValue(100);
    const calculateStatsDisplayFromState = jest
      .fn()
      .mockImplementation((state) =>
        state === defaultProps.state ? '9 moves' : '12 moves'
      );
    render(
      <RaceTrack
        {...defaultProps}
        calculateStatsDisplayFromState={calculateStatsDisplayFromState}
      />
    );
    expect(screen.getByText('9 moves')).toBeInTheDocument();
    expect(screen.getByText('12 moves')).toBeInTheDocument();
  });

  it('omits stats when calculateStatsDisplayFromState is not passed', () => {
    mockCalculateCompletionPercentageFromState.mockReturnValue(100);
    render(<RaceTrack {...defaultProps} />);
    expect(screen.queryByText(/moves/)).not.toBeInTheDocument();
  });

  it('shows the percentage in the legend by default', () => {
    mockCalculateCompletionPercentageFromState.mockReturnValue(42);
    render(<RaceTrack {...defaultProps} />);
    expect(screen.getAllByText('(42%)').length).toBeGreaterThan(0);
  });

  it('keeps the percentage in the legend for finished players without a formatter', () => {
    mockCalculateCompletionPercentageFromState.mockReturnValue(100);
    render(<RaceTrack {...defaultProps} />);
    // No formatFinishTime prop: the legend stays on percentages even once
    // finished, preserving sudoku's behaviour.
    expect(screen.getAllByText('(100%)').length).toBeGreaterThan(0);
  });

  it('shows finish times in the legend when a formatter is passed', () => {
    mockCalculateCompletionPercentageFromState.mockReturnValue(100);
    render(<RaceTrack {...defaultProps} formatFinishTime={shortTime} />);
    // userId2 finished at 120s -> "2:00" (shown in the legend chip)
    expect(screen.getAllByText('2:00').length).toBeGreaterThan(0);
  });

  it('replaces the legend percentage with the progress stats when provided', () => {
    mockCalculateCompletionPercentageFromState.mockReturnValue(42);
    const calculateProgressStatsDisplayFromState = jest
      .fn()
      .mockImplementation((state) =>
        state === defaultProps.state ? '3/24 moves ⚡' : '8/24 moves ⚡'
      );
    render(
      <RaceTrack
        {...defaultProps}
        calculateProgressStatsDisplayFromState={
          calculateProgressStatsDisplayFromState
        }
      />
    );
    expect(screen.getByText('3/24 moves ⚡')).toBeInTheDocument();
    expect(screen.getByText('8/24 moves ⚡')).toBeInTheDocument();
    expect(screen.queryByText('(42%)')).not.toBeInTheDocument();
  });

  it('drives an emoji kart and a legend chip for each agent', () => {
    render(
      <RaceTrack
        {...defaultProps}
        localAgentProgress={[agent({ percentage: 40 })]}
      />
    );

    expect(screen.getByTestId('agent-kart-agent-0')).toHaveTextContent('🐝');
    const legend = screen.getByTestId('agent-legend-agent-0');
    expect(legend).toHaveTextContent('Bumblebee');
    expect(legend).toHaveTextContent('40%');
  });

  it('shows the finish time on a finished agent chip when a formatter is passed', () => {
    render(
      <RaceTrack
        {...defaultProps}
        formatFinishTime={shortTime}
        localAgentProgress={[agent({ percentage: 100, finishTime: 65 })]}
      />
    );

    expect(screen.getByTestId('agent-legend-agent-0')).toHaveTextContent(
      '1:05'
    );
  });

  it('merges finished agents into the single-stage finished list by time', () => {
    // Player finished at 100s (userId1); the 5s agent should beat them.
    mockCalculateCompletionPercentageFromState.mockImplementation((state) =>
      state === defaultProps.state ? 100 : 50
    );
    const calculateStatsDisplayFromState = jest.fn(() => '3 moves');
    render(
      <RaceTrack
        {...defaultProps}
        calculateStatsDisplayFromState={calculateStatsDisplayFromState}
        localAgentProgress={[
          agent({
            percentage: 100,
            finishTime: 5,
            state: currentUserState,
          }),
        ]}
      />
    );

    // The 5s agent beat the player's 100s finish
    expect(screen.getByText('1.').parentElement).toHaveTextContent('Bumblebee');
    expect(screen.getByText('2.').parentElement).toHaveTextContent('You');
  });

  it('renders the multi-stage run leaderboard when runResults is passed', () => {
    const runResults: PlayerRunResult[] = [
      {
        userId: 'agent-Sage',
        isCurrentUser: false,
        stageResults: [{ seconds: 8, movesMade: 3, movesRequired: 3 }],
        totalSeconds: 8,
        totalMoves: 3,
        totalMovesDelta: 0,
        completedStageCount: 1,
        nickname: 'Sage',
        isAgent: true,
        emoji: '🦉',
      },
      {
        userId: 'userId1',
        isCurrentUser: true,
        stageResults: [{ seconds: 10, movesMade: 4, movesRequired: 3 }],
        totalSeconds: 10,
        totalMoves: 4,
        totalMovesDelta: 1,
        completedStageCount: 1,
      },
      {
        userId: 'userId2',
        isCurrentUser: false,
        stageResults: [{ seconds: 12, movesMade: 3, movesRequired: 3 }],
        totalSeconds: 12,
        totalMoves: 3,
        totalMovesDelta: 0,
        completedStageCount: 1,
      },
    ];

    render(
      <RaceTrack
        {...defaultProps}
        runResults={runResults}
        formatFinishTime={shortTime}
      />
    );

    expect(screen.getByTestId('run-leaderboard')).toBeInTheDocument();
    const agentRow = screen.getByTestId('run-leaderboard-row-0');
    expect(agentRow).toHaveTextContent('Sage');
    expect(agentRow).toHaveTextContent('🦉');
    expect(screen.getByTestId('run-leaderboard-row-1')).toHaveTextContent(
      'You'
    );
    // Humans still resolve through the party nickname lookup
    expect(screen.getByTestId('run-leaderboard-row-2')).toHaveTextContent(
      'Player 2'
    );
  });

  it('renders the rate-app prompt on the completed block when rateApp is passed', () => {
    setUserAgent(IOS_UA);
    mockCalculateCompletionPercentageFromState.mockImplementation((state) =>
      state === defaultProps.state ? 100 : 50
    );
    render(
      <RaceTrack
        {...defaultProps}
        rateApp={{
          appName: 'Sudoku Race',
          appStoreUrl: 'https://apps.apple.com/app/sudoku-race/id123',
          googlePlayUrl:
            'https://play.google.com/store/apps/details?id=com.bubblyclouds.sudoku',
        }}
      />
    );
    expect(screen.getByText(/Enjoying Sudoku Race\?/i)).toBeInTheDocument();
  });

  it('omits the rate-app prompt when rateApp is not passed', () => {
    mockCalculateCompletionPercentageFromState.mockImplementation((state) =>
      state === defaultProps.state ? 100 : 50
    );
    render(<RaceTrack {...defaultProps} />);
    expect(screen.queryByText(/Enjoying/i)).not.toBeInTheDocument();
  });
});
