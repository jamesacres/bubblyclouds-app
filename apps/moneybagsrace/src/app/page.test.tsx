import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from './page';
import * as nextNavigation from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('../components/MyStatesTab', () => {
  return function MockMyStatesTab() {
    return <div data-testid="my-states-tab">My States Tab</div>;
  };
});

jest.mock('../components/RacingTeamsTab', () => {
  return function MockRacingTeamsTab({
    onRefresh,
  }: {
    onRefresh?: () => void;
  }) {
    return (
      <div data-testid="racing-teams-tab">
        Racing Teams Tab
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

jest.mock('@bubblyclouds-app/template/hooks/online', () => ({
  useOnline: jest.fn(() => ({
    forceOffline: jest.fn(),
    isOnline: true,
  })),
}));

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
}));

describe('Home Page', () => {
  const mockPush = jest.fn();
  const mockReplaceState = jest.fn();
  const mockScrollTo = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

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
      expect(screen.getByText('This month')).toBeInTheDocument();
    });

    it('should display all footer tab buttons', () => {
      render(<Home />);
      expect(screen.getAllByTestId('zap-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('award-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('users-icon').length).toBeGreaterThan(0);
    });

    it('should switch to MY_PUZZLES tab when clicked', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('My States'));
      expect(screen.getByTestId('my-states-tab')).toBeInTheDocument();
    });

    it('should switch to FRIENDS tab when clicked', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('Racing Teams'));
      expect(screen.getByTestId('racing-teams-tab')).toBeInTheDocument();
    });

    it('should handle tab switching and maintain state', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('My States'));
      expect(screen.getByTestId('my-states-tab')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Home'));
      expect(screen.getByText('This month')).toBeInTheDocument();
    });
  });

  describe('Footer tabs styling', () => {
    it('should highlight active tab', () => {
      render(<Home />);
      const homeButton = screen.getByText('Home').closest('button');
      expect(homeButton).toHaveClass('text-theme-primary');
    });

    it('should show inactive tabs in gray', () => {
      render(<Home />);
      const myStatesButton = screen.getByText('My States').closest('button');
      expect(myStatesButton).toHaveClass('text-gray-500');
    });
  });

  describe('Premium Features section', () => {
    it('should render premium features component', () => {
      render(<Home />);
      expect(screen.getByTestId('premium-features')).toBeInTheDocument();
    });
  });

  describe('Activity widget', () => {
    it('should show activity widget on MY_PUZZLES tab', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('My States'));
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
      fireEvent.click(screen.getByText('My States'));
      expect(mockReplaceState).toHaveBeenCalled();
    });

    it('should scroll to top when changing tabs', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('My States'));
      expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });

  describe('Content padding', () => {
    it('should have bottom padding to avoid footer overlap', () => {
      const { container } = render(<Home />);
      expect(container.querySelector('.h-32')).toBeInTheDocument();
    });
  });

  describe('This month button', () => {
    it('should prompt login and not navigate when user is not logged in', async () => {
      render(<Home />);
      fireEvent.click(screen.getByText('Open'));
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should navigate to the state page when user is logged in', async () => {
      const AuthProvider = jest.requireMock(
        '@bubblyclouds-app/auth/providers/AuthProvider'
      );
      const originalContext = AuthProvider.UserContext;
      AuthProvider.UserContext = React.createContext({
        user: { sub: 'user-1' },
        showLoginModal: jest.fn(),
      });

      render(<Home />);
      fireEvent.click(screen.getByText('Open'));
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/state?month=')
      );

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
      expect(screen.getByText(/With Me, Alex and more/)).toBeInTheDocument();
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

  describe('Racing teams shortcut in activity widget', () => {
    it('should switch to the Friends tab without triggering the widget click', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('View team'));
      expect(screen.getByTestId('racing-teams-tab')).toBeInTheDocument();
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

      await screen.findByTestId('racing-teams-tab');
      expect(mockRefreshParties).toHaveBeenCalled();
    });
  });
});
