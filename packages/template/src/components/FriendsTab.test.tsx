import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FriendsTab } from './FriendsTab';
import { useSessions } from '../providers/SessionsProvider';
import { UserProfile } from '@sudoku-web/types/userProfile';
import { Party } from '@sudoku-web/types/serverTypes';
jest.mock('react-feather', () => ({
  Loader: () => <div data-testid="loader" />,
  ChevronDown: () => <div data-testid="chevron-down" />,
  ChevronRight: () => <div data-testid="chevron-right" />,
  RotateCcw: () => <div data-testid="rotate-ccw" />,
  Calendar: () => <div data-testid="calendar" />,
  Watch: () => <div data-testid="watch" />,
  Users: () => <div data-testid="users" />,
  Droplet: () => <div data-testid="droplet" />,
}));
jest.mock('./IntegratedSessionRow', () => ({
  __esModule: true,
  default: ({ session }: any) => (
    <div data-testid={`session-${session.sessionId}`} />
  ),
}));
jest.mock('@sudoku-web/games/components/Leaderboard', () => ({
  __esModule: true,
  default: () => <div data-testid="leaderboard" />,
}));
jest.mock('../providers/SessionsProvider', () => ({
  useSessions: jest.fn(),
}));

const mockUseSessions = useSessions as jest.Mock;

describe('FriendsTab', () => {
  const mockUser: UserProfile = { sub: 'user1', name: 'Test User' };
  const mockParties: Party[] = [
    {
      partyId: 'party1',
      appId: 'app-1',
      partyName: 'Test Party',
      createdBy: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isOwner: true,
      members: [
        {
          userId: 'user1',
          resourceId: 'party1',
          memberNickname: 'Test User',
          createdAt: new Date(),
          updatedAt: new Date(),
          isOwner: true,
          isUser: true,
        },
        {
          userId: 'user2',
          resourceId: 'party1',
          memberNickname: 'Friend',
          createdAt: new Date(),
          updatedAt: new Date(),
          isOwner: false,
          isUser: false,
        },
      ],
    },
  ];

  beforeEach(() => {
    mockUseSessions.mockReturnValue({ sessions: [], friendSessions: {} });
  });

  const renderComponent = (
    props: Partial<React.ComponentProps<typeof FriendsTab>> = {}
  ) => {
    return render(
      <FriendsTab
        user={mockUser}
        parties={mockParties}
        mySessions={[]}
        {...props}
      />
    );
  };

  it('renders the main title and party tabs', () => {
    renderComponent();
    expect(screen.getByText('Racing Teams')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    // Test Party appears in multiple places (tabs, rows), so check all exist
    expect(screen.getAllByText('Test Party').length).toBeGreaterThan(0);
  });

  it('renders the leaderboard and friends list', () => {
    renderComponent();
    expect(screen.getByTestId('leaderboard')).toBeInTheDocument();
    expect(screen.getByText("Browse Friends' Puzzles")).toBeInTheDocument();
    expect(screen.getByText('Friend')).toBeInTheDocument();
  });

  it('expands to show friend sessions on click', async () => {
    mockUseSessions.mockReturnValue({
      friendSessions: {
        user2: {
          isLoading: false,
          sessions: [{ sessionId: 'session1' }],
        },
      },
    });
    renderComponent();
    fireEvent.click(screen.getByText('Friend'));
    await waitFor(() => {
      expect(screen.getByTestId('session-session1')).toBeInTheDocument();
    });
  });

  it('shows a loading state for friend sessions', () => {
    mockUseSessions.mockReturnValue({
      friendSessions: { user2: { isLoading: true } },
    });
    renderComponent();
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('calls onRefresh when the refresh button is clicked', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    renderComponent({ onRefresh });
    fireEvent.click(screen.getByText('Refresh'));
    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalled();
    });
  });
});
