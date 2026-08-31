import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Home from './page';
import * as nextNavigation from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@bubblyclouds-app/template/components/MyPuzzlesTab', () => {
  return function MockMyPuzzlesTab() {
    return <div data-testid="my-puzzles-tab">My Puzzles Tab</div>;
  };
});

jest.mock('@bubblyclouds-app/template/components/FriendsTab', () => {
  return function MockFriendsTab({ onRefresh }: { onRefresh?: () => void }) {
    return (
      <div data-testid="friends-tab">
        Friends Tab
        <button onClick={onRefresh}>Refresh leaderboard</button>
      </div>
    );
  };
});

jest.mock('@bubblyclouds-app/games/components/ActivityWidget', () => {
  return function MockActivityWidget({
    onClick,
    action,
  }: {
    onClick?: () => void;
    action?: React.ReactNode;
  }) {
    return (
      <div data-testid="activity-widget" onClick={onClick}>
        Activity Widget
        {action}
      </div>
    );
  };
});

jest.mock('@bubblyclouds-app/games/components/Leaderboard', () => {
  return function MockLeaderboard() {
    return <div data-testid="leaderboard">Leaderboard</div>;
  };
});

jest.mock('@bubblyclouds-app/template/hooks/online', () => ({
  useOnline: jest.fn(() => ({
    forceOffline: jest.fn(),
    isOnline: true,
  })),
}));

const mockGetUnblockRaceOfTheDay = jest.fn();
jest.mock(
  '@bubblyclouds-app/unblockrace/hooks/useUnblockServerStorage',
  () => ({
    useUnblockServerStorage: () => ({
      getUnblockRaceOfTheDay: mockGetUnblockRaceOfTheDay,
    }),
  })
);

jest.mock('@bubblyclouds-app/template/providers/SessionsProvider', () => {
  const mockUseSessions = jest.fn(() => ({
    sessions: [],
    refetchSessions: jest.fn(),
    lazyLoadFriendSessions: jest.fn(),
    fetchFriendSessions: jest.fn(),
  }));

  return {
    SessionsProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    useSessions: mockUseSessions,
  };
});

jest.mock('@bubblyclouds-app/auth/providers/AuthProvider', () => ({
  UserContext: React.createContext({
    user: null,
    loginRedirect: jest.fn(),
    isInitialised: true,
  }),
}));

jest.mock('@bubblyclouds-app/template/providers/PartiesProvider', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

jest.mock('@bubblyclouds-app/template/hooks/useParties', () => ({
  useParties: jest.fn(() => ({
    parties: [],
    refreshParties: jest.fn(),
  })),
}));

jest.mock('@bubblyclouds-app/types/tabs', () => ({
  Tab: {
    START_PUZZLE: 'START_PUZZLE',
    MY_PUZZLES: 'MY_PUZZLES',
    FRIENDS: 'FRIENDS',
  },
}));

jest.mock('@bubblyclouds-app/template/components/PremiumFeatures', () => ({
  PremiumFeatures: function MockPremiumFeatures() {
    return <div data-testid="premium-features">Premium Features</div>;
  },
}));

jest.mock('@bubblyclouds-app/template/components/SocialProof', () => {
  return function MockSocialProof() {
    return <div data-testid="social-proof">Social Proof</div>;
  };
});

// RateAppButton only renders on Capacitor or mobile web; force mobile-web so
// the rate-app prompt is exercised.
jest.mock('@bubblyclouds-app/template/helpers/capacitor', () => ({
  isCapacitor: () => false,
  isIOS: () => false,
  isAndroid: () => false,
}));

jest.mock('@bubblyclouds-app/ui/components/Footer', () => ({
  __esModule: true,
  default: function MockFooter({ children }: { children: React.ReactNode }) {
    return <footer data-testid="footer">{children}</footer>;
  },
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) => {
    const { ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} />;
  },
}));

jest.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon">Users Icon</div>,
  Zap: () => <div data-testid="zap-icon">Zap Icon</div>,
  Award: () => <div data-testid="award-icon">Award Icon</div>,
  BookOpen: () => <div data-testid="book-open-icon">BookOpen Icon</div>,
  ChevronsRight: () => (
    <div data-testid="chevrons-right-icon">ChevronsRight Icon</div>
  ),
  Star: () => <div data-testid="star-icon">Star Icon</div>,
  ExternalLink: () => (
    <div data-testid="external-link-icon">ExternalLink Icon</div>
  ),
  ArrowRight: () => <div data-testid="arrow-right-icon">ArrowRight Icon</div>,
  Flag: () => <div data-testid="flag-icon">Flag Icon</div>,
}));

describe('Home Page', () => {
  const mockPush = jest.fn();
  const mockReplaceState = jest.fn();
  const mockScrollTo = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetUnblockRaceOfTheDay.mockResolvedValue({
      runId: 'oftheday-20260708',
      puzzles: [
        { initial: 'a', final: 'a', movesRequired: 3, difficulty: 'beginner' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    (nextNavigation.useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (nextNavigation.useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((key: string) => {
        if (key === 'tab') return null;
        return null;
      }),
    });

    window.history.replaceState = mockReplaceState;
    window.scrollTo = mockScrollTo;
  });

  describe('Default Home export with Suspense', () => {
    it('should render Home component wrapped in Suspense', () => {
      render(<Home />);
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Tab navigation', () => {
    it('should render START_PUZZLE tab by default', () => {
      render(<Home />);
      expect(screen.getByText('Daily race')).toBeInTheDocument();
    });

    it('should display all footer tab buttons', () => {
      render(<Home />);
      expect(screen.getAllByTestId('zap-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('award-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('users-icon').length).toBeGreaterThan(0);
    });

    it('should switch to MY_PUZZLES tab when clicked', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('My Puzzles'));
      expect(screen.getByTestId('my-puzzles-tab')).toBeInTheDocument();
    });

    it('should switch to FRIENDS tab when clicked', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('Racing Teams'));
      expect(screen.getByTestId('friends-tab')).toBeInTheDocument();
    });

    it('should handle tab switching and maintain state', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('My Puzzles'));
      expect(screen.getByTestId('my-puzzles-tab')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Start Race'));
      expect(screen.getByText('Daily race')).toBeInTheDocument();
    });
  });

  describe('Daily race section', () => {
    it('should render daily race heading', () => {
      render(<Home />);
      expect(screen.getByText('Daily race')).toBeInTheDocument();
    });
  });

  describe('Monthly collection section', () => {
    it('should link to the collection page', () => {
      render(<Home />);
      expect(screen.getAllByText('Browse puzzles').length).toBeGreaterThan(0);
    });

    it('should not navigate directly when user is not logged in', () => {
      render(<Home />);
      const browseButtons = screen.getAllByText('puzzle collection');
      fireEvent.click(browseButtons[0]);
      expect(mockPush).not.toHaveBeenCalledWith('/collection');
    });
  });

  describe('Footer tabs styling', () => {
    it('should highlight active tab', () => {
      render(<Home />);
      const startRaceButton = screen.getByText('Start Race').closest('button');
      expect(startRaceButton).toHaveClass('text-theme-primary');
    });

    it('should show inactive tabs in gray', () => {
      render(<Home />);
      const myPuzzlesButton = screen.getByText('My Puzzles').closest('button');
      expect(myPuzzlesButton).toHaveClass('text-gray-500');
    });
  });

  describe('Premium Features section', () => {
    it('should render premium features component', () => {
      render(<Home />);
      expect(screen.getByTestId('premium-features')).toBeInTheDocument();
    });
  });

  describe('Rate app section', () => {
    const originalUserAgent = window.navigator.userAgent;

    afterEach(() => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true,
      });
    });

    it('should render the rate-app prompt on the START tab', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPad; CPU OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      });
      render(<Home />);
      expect(screen.getByText(/Enjoying Unblock Race\?/i)).toBeInTheDocument();
    });
  });

  describe('Activity widget', () => {
    it('should show activity widget on MY_PUZZLES tab', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('My Puzzles'));
      expect(screen.getByTestId('activity-widget')).toBeInTheDocument();
    });

    it('should show activity widget on START_PUZZLE tab', () => {
      render(<Home />);
      expect(screen.getByTestId('activity-widget')).toBeInTheDocument();
    });
  });

  describe('URL management', () => {
    it('should use history.replaceState when changing tabs', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('My Puzzles'));
      expect(mockReplaceState).toHaveBeenCalled();
    });

    it('should scroll to top when changing tabs', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('My Puzzles'));
      expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });

  describe('Team Racing section', () => {
    it('should render team racing section', () => {
      render(<Home />);
      expect(screen.getAllByText('Racing teams').length).toBeGreaterThan(0);
    });

    it('should navigate to FRIENDS tab when Racing teams is clicked', () => {
      render(<Home />);
      const racingTeamsButton = screen
        .getAllByRole('button')
        .find(
          (btn) =>
            btn.textContent?.includes('Racing teams') &&
            btn.textContent?.includes('Challenge friends')
        );
      expect(racingTeamsButton).toBeDefined();
      fireEvent.click(racingTeamsButton!);
      expect(screen.getByTestId('friends-tab')).toBeInTheDocument();
    });
  });

  describe('Content padding', () => {
    it('should have bottom padding to avoid footer overlap', () => {
      const { container } = render(<Home />);
      expect(container.querySelector('.h-32')).toBeInTheDocument();
    });
  });

  describe('Search params integration', () => {
    it('should respect tab from search params', () => {
      const mockGetSearchParams = jest.fn((key: string) => {
        if (key === 'tab') return 'my-puzzles';
        return null;
      });

      (nextNavigation.useSearchParams as jest.Mock).mockReturnValue({
        get: mockGetSearchParams,
      });

      render(<Home />);
      expect(mockGetSearchParams).toHaveBeenCalledWith('tab');
    });
  });

  describe('Daily race button', () => {
    it('should prompt login and not navigate when user is not logged in', async () => {
      render(<Home />);
      fireEvent.click(screen.getByText('Start racing'));
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should navigate to a puzzle URL when user is logged in', async () => {
      const AuthProvider = jest.requireMock(
        '@bubblyclouds-app/auth/providers/AuthProvider'
      );
      const originalContext = AuthProvider.UserContext;
      AuthProvider.UserContext = React.createContext({
        user: { sub: 'user-1' },
        showLoginModal: jest.fn(),
      });

      render(<Home />);
      await act(async () => {
        fireEvent.click(screen.getByText('Start racing'));
      });
      expect(mockGetUnblockRaceOfTheDay).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalled();
      expect(mockPush.mock.calls[0][0]).toEqual(
        expect.stringContaining('runId=oftheday-')
      );

      AuthProvider.UserContext = originalContext;
    });

    it('should not navigate when the daily run fetch fails', async () => {
      mockGetUnblockRaceOfTheDay.mockResolvedValue(undefined);
      const AuthProvider = jest.requireMock(
        '@bubblyclouds-app/auth/providers/AuthProvider'
      );
      const originalContext = AuthProvider.UserContext;
      AuthProvider.UserContext = React.createContext({
        user: { sub: 'user-1' },
        showLoginModal: jest.fn(),
      });

      render(<Home />);
      await act(async () => {
        fireEvent.click(screen.getByText('Start racing'));
      });

      expect(mockPush).not.toHaveBeenCalled();

      AuthProvider.UserContext = originalContext;
    });
  });

  describe('Monthly collection navigation when logged in', () => {
    it('should navigate to /collection when the card is clicked', () => {
      const AuthProvider = jest.requireMock(
        '@bubblyclouds-app/auth/providers/AuthProvider'
      );
      const originalContext = AuthProvider.UserContext;
      AuthProvider.UserContext = React.createContext({
        user: { sub: 'user-1' },
        showLoginModal: jest.fn(),
      });

      render(<Home />);
      fireEvent.click(screen.getAllByText('Browse puzzles')[0]);
      expect(mockPush).toHaveBeenCalledWith('/collection');

      AuthProvider.UserContext = originalContext;
    });
  });

  describe('Friends list from parties', () => {
    it('should list friend nicknames excluding the current user', () => {
      const useParties = jest.requireMock(
        '@bubblyclouds-app/template/hooks/useParties'
      ).useParties;
      useParties.mockReturnValue({
        parties: [
          {
            members: [
              { userId: 'user-1', memberNickname: 'Me' },
              { userId: 'user-2', memberNickname: 'Alex' },
              { userId: 'user-3', memberNickname: 'Sam' },
            ],
          },
        ],
        refreshParties: jest.fn(),
      });

      render(<Home />);
      expect(screen.getByText(/Race Me, Alex and more/)).toBeInTheDocument();
    });

    it('should lazily load friend sessions once parties are available', () => {
      const useParties = jest.requireMock(
        '@bubblyclouds-app/template/hooks/useParties'
      ).useParties;
      const useSessions = jest.requireMock(
        '@bubblyclouds-app/template/providers/SessionsProvider'
      ).useSessions;
      const mockLazyLoad = jest.fn();
      useParties.mockReturnValue({
        parties: [{ members: [] }],
        refreshParties: jest.fn(),
      });
      useSessions.mockReturnValue({
        sessions: [],
        refetchSessions: jest.fn(),
        lazyLoadFriendSessions: mockLazyLoad,
        fetchFriendSessions: jest.fn(),
      });

      render(<Home />);
      expect(mockLazyLoad).toHaveBeenCalledWith([{ members: [] }]);
    });
  });

  describe('Leaderboard shortcut in activity widget', () => {
    it('should switch to the Friends tab without triggering the widget click', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('Leaderboard'));
      expect(screen.getByTestId('friends-tab')).toBeInTheDocument();
    });
  });

  describe('Refreshing the leaderboard', () => {
    it('should refresh parties and refetch friend sessions when parties exist', async () => {
      const useParties = jest.requireMock(
        '@bubblyclouds-app/template/hooks/useParties'
      ).useParties;
      const useSessions = jest.requireMock(
        '@bubblyclouds-app/template/providers/SessionsProvider'
      ).useSessions;
      const mockRefreshParties = jest.fn().mockResolvedValue(undefined);
      const mockFetchFriendSessions = jest.fn().mockResolvedValue(undefined);
      useParties.mockReturnValue({
        parties: [{ members: [] }],
        refreshParties: mockRefreshParties,
      });
      useSessions.mockReturnValue({
        sessions: [],
        refetchSessions: jest.fn(),
        lazyLoadFriendSessions: jest.fn(),
        fetchFriendSessions: mockFetchFriendSessions,
      });

      render(<Home />);
      fireEvent.click(screen.getByText('Racing Teams'));
      fireEvent.click(screen.getByText('Refresh leaderboard'));

      await screen.findByTestId('friends-tab');
      expect(mockRefreshParties).toHaveBeenCalled();
    });
  });
});
