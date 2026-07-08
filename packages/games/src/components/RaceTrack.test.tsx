import React from 'react';
import { render, screen } from '@testing-library/react';
import RaceTrack from './RaceTrack';
import * as usePartiesModule from '@bubblyclouds-app/template/hooks/useParties';
import * as playerColorsModule from '@bubblyclouds-app/template/utils/playerColors';
import { Parties, Session } from '@bubblyclouds-app/types/serverTypes';
import { BaseServerState } from '@bubblyclouds-app/template/types/state';

jest.mock('@bubblyclouds-app/template/hooks/useParties');
jest.mock('@bubblyclouds-app/template/utils/playerColors');

const mockUseParties = usePartiesModule.useParties as jest.Mock;
const mockGetPlayerColor = playerColorsModule.getPlayerColor as jest.Mock;
const mockGetAllUserIds = playerColorsModule.getAllUserIds as jest.Mock;
const mockCalculateCompletionPercentageFromState = jest
  .fn()
  .mockResolvedValue(0);
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
    mockUseParties.mockReturnValue({
      getNicknameByUserId: () => 'Player 2',
      parties: [],
      refreshParties: jest.fn(),
    });
    mockGetAllUserIds.mockReturnValue(['userId1', 'userId2']);
    mockGetPlayerColor.mockReturnValue('bg-blue-500');
    mockCalculateCompletionPercentageFromState.mockReturnValue(50);
    mockIsPuzzleCheated.mockReturnValue(false);
  });

  it('renders the race track with players', () => {
    render(<RaceTrack {...defaultProps} />);
    expect(screen.getByText('START')).toBeInTheDocument();
    expect(screen.getByText('FINISH')).toBeInTheDocument();
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
});
