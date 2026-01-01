import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Leaderboard from './Leaderboard';
import { UserProfile } from '@bubblyclouds-app/types/userProfile';
import { UserSessions } from '@bubblyclouds-app/types/userSessions';
import { BaseServerState } from '@bubblyclouds-app/template/types/state';
import { FriendsLeaderboardScore } from '../types/scoringTypes';
import { ServerStateResult, Party } from '@bubblyclouds-app/types/serverTypes';
import * as scoringUtils from '../helpers/scoringUtils';

const isPuzzleCheated = jest.fn().mockReturnValue(false);

// Mock the scoring utils
jest.mock('../helpers/scoringUtils', () => ({
  calculateUserScore: jest.fn(),
  getUsernameFromParties: jest.fn(),
}));

// Mock child components
jest.mock('./FriendLeaderboardEntry', () => {
  return {
    __esModule: true,
    default: ({
      entry,
      rank,
      isCurrentUser,
    }: {
      entry: FriendsLeaderboardScore;
      rank: number;
      isCurrentUser: boolean;
    }) => (
      <div data-testid={`leaderboard-entry-${entry.userId}`}>
        <div data-testid={`rank-${rank}`}>{rank}</div>
        <div data-testid={`username-${entry.userId}`}>{entry.username}</div>
        <div data-testid={`score-${entry.userId}`}>{entry.totalScore}</div>
        {isCurrentUser && <div data-testid="current-user">You</div>}
      </div>
    ),
  };
});

jest.mock('./ScoringLegend', () => {
  return {
    __esModule: true,
    default: ({
      isOpen,
      onClose,
      gameName,
    }: {
      isOpen: boolean;
      onClose: () => void;
      gameName: string;
    }) =>
      isOpen ? (
        <div data-testid="scoring-legend" onClick={onClose} role="dialog">
          Scoring Legend - {gameName}
          <button onClick={onClose}>Close</button>
        </div>
      ) : null,
  };
});

const createEmptyPuzzle = () => {
  const createBox = () => ({
    '0': [],
    '1': [],
    '2': [],
  });

  return {
    '0': {
      '0': createBox(),
      '1': createBox(),
      '2': createBox(),
    },
    '1': {
      '0': createBox(),
      '1': createBox(),
      '2': createBox(),
    },
    '2': {
      '0': createBox(),
      '1': createBox(),
      '2': createBox(),
    },
  };
};

const createSession = (
  userId: string,
  completed: boolean
): ServerStateResult<BaseServerState> => ({
  sessionId: `session-${userId}`,
  updatedAt: new Date(),
  state: {
    initial: createEmptyPuzzle(),
    final: createEmptyPuzzle(),
    answerStack: [],
    completed: completed
      ? { at: new Date().toISOString(), seconds: 120 }
      : undefined,
    metadata: {},
  },
});

const createUser = (sub: string, name: string): UserProfile => ({
  sub,
  name,
});

const createParty = (
  partyId: string,
  members: { userId: string; memberNickname: string }[]
): Party => ({
  partyId,
  appId: 'app-1',
  partyName: `Party ${partyId}`,
  createdBy: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  isOwner: true,
  members: members.map((m) => ({
    userId: m.userId,
    resourceId: partyId,
    memberNickname: m.memberNickname,
    createdAt: new Date(),
    updatedAt: new Date(),
    isOwner: false,
    isUser: false,
  })),
});

describe('Leaderboard', () => {
  beforeEach(() => {
    (scoringUtils.calculateUserScore as jest.Mock).mockReturnValue({
      volumeScore: 100,
      dailyPuzzleScore: 50,
      bookPuzzleScore: 75,
      scannedPuzzleScore: 25,
      difficultyBonus: 30,
      speedBonus: 100,
      racingBonus: 50,
      stats: {
        totalPuzzles: 10,
        dailyPuzzles: 3,
        bookPuzzles: 4,
        scannedPuzzles: 3,
        averageTime: 120,
        fastestTime: 60,
        racingWins: 5,
      },
    });
    (scoringUtils.getUsernameFromParties as jest.Mock).mockReturnValue(
      'Friend Name'
    );
  });

  it('should render leaderboard with data', () => {
    const user = createUser('user-1', 'Alice');
    const sessions = [createSession('user-1', true)];
    const friendSessions: UserSessions<BaseServerState> = {
      'user-2': {
        isLoading: false,
        sessions: [createSession('user-2', true)],
      },
    };
    render(
      <Leaderboard
        sessions={sessions as any}
        friendSessions={friendSessions as any}
        parties={[]}
        user={user}
        isPuzzleCheated={isPuzzleCheated}
      />
    );
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByTestId('username-user-1')).toBeInTheDocument();
    expect(screen.getByTestId('username-user-2')).toBeInTheDocument();
  });

  it('should filter by party', () => {
    const user = createUser('user-1', 'Alice');
    const party = createParty('party-1', [
      { userId: 'user-1', memberNickname: 'Alice' },
      { userId: 'user-2', memberNickname: 'Bob' },
    ]);
    const sessions = [createSession('user-1', true)];
    const friendSessions: UserSessions<BaseServerState> = {
      'user-2': {
        isLoading: false,
        sessions: [createSession('user-2', true)],
      },
      'user-3': {
        isLoading: false,
        sessions: [createSession('user-3', true)],
      },
    };
    render(
      <Leaderboard
        sessions={sessions as any}
        friendSessions={friendSessions as any}
        parties={[party]}
        user={user}
        selectedParty={party}
        isPuzzleCheated={isPuzzleCheated}
      />
    );
    expect(screen.getByTestId('username-user-2')).toBeInTheDocument();
    expect(screen.queryByTestId('username-user-3')).not.toBeInTheDocument();
  });

  it('should open and close scoring legend', () => {
    const user = createUser('user-1', 'Alice');
    const sessions = [createSession('user-1', true)];
    render(
      <Leaderboard
        sessions={sessions as any}
        friendSessions={{}}
        parties={[]}
        user={user}
        isPuzzleCheated={isPuzzleCheated}
      />
    );
    fireEvent.click(screen.getByText(/How scoring works/));
    expect(screen.getByTestId('scoring-legend')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('scoring-legend')).not.toBeInTheDocument();
  });
});
