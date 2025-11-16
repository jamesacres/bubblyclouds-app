import React from 'react';
import { render, screen } from '@testing-library/react';
import RaceTrack from './RaceTrack';
import * as usePartiesModule from '@sudoku-web/template/hooks/useParties';
import * as playerColorsModule from '@sudoku-web/template/utils/playerColors';
import { Parties, Session } from '@sudoku-web/types/serverTypes';
import { BaseServerState } from '@sudoku-web/template/types/gameState';

jest.mock('@sudoku-web/template/hooks/useParties');
jest.mock('@sudoku-web/template/utils/playerColors');
jest.mock('./TrafficLight', () => ({
  __esModule: true,
  default: function MockTrafficLight() {
    return <div data-testid="traffic-light" />;
  },
}));

const mockUseParties = usePartiesModule.useParties as jest.Mock;
const mockGetPlayerColor = playerColorsModule.getPlayerColor as jest.Mock;
const mockGetAllUserIds = playerColorsModule.getAllUserIds as jest.Mock;
const mockCalculateCompletionPercentage = jest.fn().mockResolvedValue(0);
const mockIsPuzzleCheated = jest.fn().mockResolvedValue(false);

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
          } as any,
        },
      },
    },
  };

  const defaultProps = {
    sessionParties: mockSessionParties,
    initial: [],
    final: [],
    answer: [],
    userId: 'userId1',
    onClick: jest.fn(),
    countdown: undefined,
    completed: { seconds: 100, at: new Date().toISOString() },
    refreshSessionParties: jest.fn(),
    isPolling: false,
    answerStack: [],
    calculateCompletionPercentage: mockCalculateCompletionPercentage,
    isPuzzleCheated: mockIsPuzzleCheated,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParties.mockReturnValue({
      getNicknameByUserId: () => 'Player 2',
      parties: [],
      refreshParties: jest.fn(),
    });
    mockGetAllUserIds.mockReturnValue(['userId1', 'userId2']);
    mockGetPlayerColor.mockReturnValue('bg-blue-500');
    mockCalculateCompletionPercentage.mockReturnValue(50);
    mockIsPuzzleCheated.mockReturnValue(false);
  });

  it('renders the race track with players', () => {
    render(<RaceTrack {...defaultProps} />);
    expect(screen.getByText('START')).toBeInTheDocument();
    expect(screen.getByText('FINISH')).toBeInTheDocument();
    expect(screen.getByText(/Player 2/)).toBeInTheDocument();
  });

  it('shows the traffic light when countdown is active', () => {
    render(<RaceTrack {...defaultProps} countdown={3} />);
    expect(screen.getByTestId('traffic-light')).toBeInTheDocument();
  });

  it('displays a leaderboard of finished players', () => {
    mockCalculateCompletionPercentage.mockReturnValue(100);
    render(<RaceTrack {...defaultProps} />);
    expect(screen.getByText(/1\./)).toBeInTheDocument();
  });

  it('shows completion UI when the current user has finished', () => {
    mockCalculateCompletionPercentage.mockImplementation(
      (initial, final, answer) => (answer === defaultProps.answer ? 100 : 50)
    );
    render(<RaceTrack {...defaultProps} />);
    expect(screen.getByText(/View Monthly Leaderboard/)).toBeInTheDocument();
  });
});
