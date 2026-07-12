import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CollectionPage from './page';
import * as nextNavigation from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('lucide-react', () => ({
  ArrowUp: () => <div data-testid="arrow-up-icon">Arrow Up</div>,
}));

jest.mock('@bubblyclouds-app/unblockrace/components/CollectionCover', () => ({
  __esModule: true,
  default: function MockCollectionCover({ size }: { size?: string }) {
    return (
      <div data-testid={`collection-cover-${size || 'default'}`}>
        Collection Cover
      </div>
    );
  },
}));

jest.mock('@bubblyclouds-app/template/components/IntegratedSessionRow', () => {
  return function MockIntegratedSessionRow({
    bookPuzzle,
  }: {
    bookPuzzle: { index: number };
  }) {
    return (
      <li data-testid={`puzzle-row-${bookPuzzle.index}`}>
        Puzzle {bookPuzzle.index}
      </li>
    );
  };
});

jest.mock('@bubblyclouds-app/unblockrace/providers/CollectionProvider', () => ({
  useCollection: jest.fn(),
}));

jest.mock('@bubblyclouds-app/template/hooks/useParties', () => ({
  useParties: jest.fn(),
}));

jest.mock('@bubblyclouds-app/template/providers/SessionsProvider', () => ({
  useSessions: jest.fn(),
}));

jest.mock('@bubblyclouds-app/auth/providers/AuthProvider', () => ({
  UserContext: React.createContext({
    user: { sub: 'test-user-123' },
  }),
}));

const BOARD = ['oooooo', 'oooooo', 'AAoBoo', 'oooBoo', 'oooooo', 'oooooo'].join(
  ''
);

const collectionPuzzle = (initial: string, difficulty: string) => ({
  initial,
  final: initial,
  movesRequired: 5,
  difficulty,
});

describe('Collection Page', () => {
  const mockPush = jest.fn();
  const mockFetchCollectionData = jest.fn();
  const mockRefetchSessions = jest.fn();
  const mockLazyLoadFriendSessions = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (nextNavigation.useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    const {
      useCollection,
    } = require('@bubblyclouds-app/unblockrace/providers/CollectionProvider');
    useCollection.mockReturnValue({
      collectionData: null,
      isLoading: false,
      error: null,
      fetchCollectionData: mockFetchCollectionData,
    });

    const {
      useSessions,
    } = require('@bubblyclouds-app/template/providers/SessionsProvider');
    useSessions.mockReturnValue({
      sessions: [],
      isLoading: false,
      refetchSessions: mockRefetchSessions,
      lazyLoadFriendSessions: mockLazyLoadFriendSessions,
    });

    const {
      useParties,
    } = require('@bubblyclouds-app/template/hooks/useParties');
    useParties.mockReturnValue({
      parties: [],
    });
  });

  it('should show a loading spinner while the collection loads', () => {
    const {
      useCollection,
    } = require('@bubblyclouds-app/unblockrace/providers/CollectionProvider');
    useCollection.mockReturnValue({
      collectionData: null,
      isLoading: true,
      error: null,
      fetchCollectionData: mockFetchCollectionData,
    });

    const { container } = render(<CollectionPage />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should show the error state with retry', () => {
    const {
      useCollection,
    } = require('@bubblyclouds-app/unblockrace/providers/CollectionProvider');
    useCollection.mockReturnValue({
      collectionData: null,
      isLoading: false,
      error: 'Failed to load puzzle collection',
      fetchCollectionData: mockFetchCollectionData,
    });

    render(<CollectionPage />);
    expect(
      screen.getByText('Failed to load puzzle collection')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('Try again'));
    expect(mockFetchCollectionData).toHaveBeenCalled();
  });

  it('should show empty state and navigate home', () => {
    render(<CollectionPage />);
    expect(
      screen.getByText('No puzzle collection data available.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('Back to home'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should render the collection heading, cover and puzzle grid', () => {
    const {
      useCollection,
    } = require('@bubblyclouds-app/unblockrace/providers/CollectionProvider');
    useCollection.mockReturnValue({
      collectionData: {
        unblockCollectionId: 'ofthemonth-202607',
        puzzles: [
          collectionPuzzle(BOARD, 'simple'),
          collectionPuzzle(`${BOARD.slice(0, -1)}x`, 'expert'),
        ],
      },
      isLoading: false,
      error: null,
      fetchCollectionData: mockFetchCollectionData,
    });

    render(<CollectionPage />);
    expect(screen.getByText(/puzzle collection/i)).toBeInTheDocument();
    expect(screen.getByTestId('collection-cover-medium')).toBeInTheDocument();
    expect(screen.getByTestId('puzzle-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('puzzle-row-1')).toBeInTheDocument();
  });

  it('should render difficulty jump buttons only for present difficulties', () => {
    const {
      useCollection,
    } = require('@bubblyclouds-app/unblockrace/providers/CollectionProvider');
    useCollection.mockReturnValue({
      collectionData: {
        unblockCollectionId: 'ofthemonth-202607',
        puzzles: [collectionPuzzle(BOARD, 'simple')],
      },
      isLoading: false,
      error: null,
      fetchCollectionData: mockFetchCollectionData,
    });

    render(<CollectionPage />);
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.queryByText('Expert')).not.toBeInTheDocument();
  });

  it('should fetch collection data and sessions on mount', async () => {
    render(<CollectionPage />);
    await waitFor(() => {
      expect(mockFetchCollectionData).toHaveBeenCalled();
      expect(mockRefetchSessions).toHaveBeenCalled();
    });
  });
});
