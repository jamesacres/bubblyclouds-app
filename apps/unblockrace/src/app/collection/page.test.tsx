import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CollectionPage from './page';
import * as nextNavigation from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('lucide-react', () => ({
  ArrowUp: () => <div data-testid="arrow-up-icon">Arrow Up</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
}));

jest.mock(
  '@bubblyclouds-app/unblockrace/components/UnblockCollectionCover',
  () => ({
    __esModule: true,
    default: function MockCollectionCover({ size }: { size?: string }) {
      return (
        <div data-testid={`collection-cover-${size || 'default'}`}>
          Collection Cover
        </div>
      );
    },
  })
);

jest.mock('@bubblyclouds-app/template/components/IntegratedSessionRow', () => {
  return function MockIntegratedSessionRow({
    bookPuzzle,
    isLocked,
    onLockedClick,
  }: {
    bookPuzzle: { index: number };
    isLocked?: boolean;
    onLockedClick?: () => void;
  }) {
    return (
      <li data-testid={`puzzle-row-${bookPuzzle.index}`}>
        Puzzle {bookPuzzle.index}
        {isLocked && (
          <button onClick={onLockedClick}>
            Locked puzzle {bookPuzzle.index}
          </button>
        )}
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
    showLoginModal: jest.fn(),
  }),
}));

jest.mock('@bubblyclouds-app/template/providers/RevenueCatProvider', () => ({
  RevenueCatContext: React.createContext({
    isSubscribed: true,
    subscribeModal: { showModalIfRequired: jest.fn() },
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

    fireEvent.click(screen.getByText('Back to home'));
    expect(mockPush).toHaveBeenCalledWith('/');
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
          collectionPuzzle(BOARD, 'beginner'),
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
        puzzles: [collectionPuzzle(BOARD, 'beginner')],
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

  it('should not fetch collection data when there is no user', () => {
    const AuthProvider = jest.requireMock(
      '@bubblyclouds-app/auth/providers/AuthProvider'
    );
    const originalContext = AuthProvider.UserContext;
    AuthProvider.UserContext = React.createContext({
      user: null,
      showLoginModal: jest.fn(),
    });

    render(<CollectionPage />);
    expect(mockFetchCollectionData).not.toHaveBeenCalled();

    AuthProvider.UserContext = originalContext;
  });

  it('should prompt sign-in when there is no user and no collection data', () => {
    const AuthProvider = jest.requireMock(
      '@bubblyclouds-app/auth/providers/AuthProvider'
    );
    const mockShowLoginModal = jest.fn();
    const originalContext = AuthProvider.UserContext;
    AuthProvider.UserContext = React.createContext({
      user: null,
      showLoginModal: mockShowLoginModal,
    });

    render(<CollectionPage />);
    expect(
      screen.getByText('Sign in to access the puzzle collection.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('Sign in'));
    expect(mockShowLoginModal).toHaveBeenCalled();

    AuthProvider.UserContext = originalContext;
  });

  it('should load friend sessions once parties are available', () => {
    const {
      useParties,
    } = require('@bubblyclouds-app/template/hooks/useParties');
    useParties.mockReturnValue({ parties: [{ members: [] }] });

    render(<CollectionPage />);
    expect(mockLazyLoadFriendSessions).toHaveBeenCalledWith([{ members: [] }]);
  });

  describe('Completed / in-progress counts and Plus banner', () => {
    const collectionData = {
      unblockCollectionId: 'ofthemonth-202607',
      puzzles: [
        collectionPuzzle(BOARD, 'beginner'),
        collectionPuzzle(`${BOARD.slice(0, -1)}x`, 'beginner'),
      ],
    };

    const sessionFor = (
      initial: string,
      overrides: Record<string, unknown>
    ) => ({
      sessionId: `unblockrace-${initial}`,
      state: {
        initial,
        answerStack: [initial],
        completed: false,
        ...overrides,
      },
      updatedAt: new Date(),
    });

    beforeEach(() => {
      const {
        useCollection,
      } = require('@bubblyclouds-app/unblockrace/providers/CollectionProvider');
      useCollection.mockReturnValue({
        collectionData,
        isLoading: false,
        error: null,
        fetchCollectionData: mockFetchCollectionData,
      });

      const {
        useSessions,
      } = require('@bubblyclouds-app/template/providers/SessionsProvider');
      useSessions.mockReturnValue({
        sessions: [
          sessionFor(collectionData.puzzles[0].initial, { completed: true }),
          sessionFor(collectionData.puzzles[1].initial, {
            answerStack: [collectionData.puzzles[1].initial, 'next'],
          }),
        ],
        isLoading: false,
        refetchSessions: mockRefetchSessions,
        lazyLoadFriendSessions: mockLazyLoadFriendSessions,
      });
    });

    it('should count completed and in-progress puzzles from sessions', () => {
      render(<CollectionPage />);
      expect(
        screen.getByText((_, element) => element?.textContent === '1 completed')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          (_, element) => element?.textContent === '1 in progress'
        )
      ).toBeInTheDocument();
    });

    it('should show the Plus upsell banner when not subscribed and open the subscribe modal', () => {
      const RevenueCatProvider = jest.requireMock(
        '@bubblyclouds-app/template/providers/RevenueCatProvider'
      );
      const mockShowModalIfRequired = jest.fn();
      const originalContext = RevenueCatProvider.RevenueCatContext;
      RevenueCatProvider.RevenueCatContext = React.createContext({
        isSubscribed: false,
        subscribeModal: { showModalIfRequired: mockShowModalIfRequired },
      });

      render(<CollectionPage />);
      fireEvent.click(screen.getByText('Unlock every puzzle with Plus'));
      expect(mockShowModalIfRequired).toHaveBeenCalled();

      RevenueCatProvider.RevenueCatContext = originalContext;
    });

    it('should not show the Plus upsell banner when subscribed', () => {
      render(<CollectionPage />);
      expect(
        screen.queryByText('Unlock every puzzle with Plus')
      ).not.toBeInTheDocument();
    });
  });

  describe('Difficulty jump buttons', () => {
    it('should scroll the first matching puzzle into view when clicked', () => {
      const {
        useCollection,
      } = require('@bubblyclouds-app/unblockrace/providers/CollectionProvider');
      useCollection.mockReturnValue({
        collectionData: {
          unblockCollectionId: 'ofthemonth-202607',
          puzzles: [collectionPuzzle(BOARD, 'beginner')],
        },
        isLoading: false,
        error: null,
        fetchCollectionData: mockFetchCollectionData,
      });

      const mockScrollIntoView = jest.fn();
      HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

      render(<CollectionPage />);
      fireEvent.click(screen.getByText('Beginner'));
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });
  });

  describe('Locked puzzles', () => {
    it('should open the subscribe modal instead of navigating when a locked puzzle is clicked', () => {
      const {
        useCollection,
      } = require('@bubblyclouds-app/unblockrace/providers/CollectionProvider');
      useCollection.mockReturnValue({
        collectionData: {
          unblockCollectionId: 'ofthemonth-202607',
          puzzles: [
            collectionPuzzle(BOARD, 'expert'),
            collectionPuzzle(`${BOARD.slice(0, -1)}x`, 'expert'),
          ],
        },
        isLoading: false,
        error: null,
        fetchCollectionData: mockFetchCollectionData,
      });

      const RevenueCatProvider = jest.requireMock(
        '@bubblyclouds-app/template/providers/RevenueCatProvider'
      );
      const mockShowModalIfRequired = jest.fn((onSuccess: () => void) =>
        onSuccess()
      );
      const originalContext = RevenueCatProvider.RevenueCatContext;
      RevenueCatProvider.RevenueCatContext = React.createContext({
        isSubscribed: false,
        subscribeModal: { showModalIfRequired: mockShowModalIfRequired },
      });

      render(<CollectionPage />);
      fireEvent.click(screen.getByText('Locked puzzle 1'));
      expect(mockShowModalIfRequired).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalled();

      RevenueCatProvider.RevenueCatContext = originalContext;
    });
  });

  describe('Scroll to top', () => {
    it('should show and use the scroll-to-top button after scrolling', () => {
      const {
        useCollection,
      } = require('@bubblyclouds-app/unblockrace/providers/CollectionProvider');
      useCollection.mockReturnValue({
        collectionData: {
          unblockCollectionId: 'ofthemonth-202607',
          puzzles: [collectionPuzzle(BOARD, 'beginner')],
        },
        isLoading: false,
        error: null,
        fetchCollectionData: mockFetchCollectionData,
      });

      render(<CollectionPage />);
      expect(screen.queryByLabelText('Scroll to top')).not.toBeInTheDocument();

      Object.defineProperty(window, 'scrollY', {
        value: 500,
        writable: true,
      });
      const mockScrollTo = jest.fn();
      window.scrollTo = mockScrollTo;
      fireEvent.scroll(window);

      const scrollTopButton = screen.getByLabelText('Scroll to top');
      expect(scrollTopButton).toBeInTheDocument();
      fireEvent.click(scrollTopButton);
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    });
  });
});
