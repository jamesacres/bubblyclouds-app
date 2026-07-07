import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
  return function MockFriendsTab() {
    return <div data-testid="friends-tab">Friends Tab</div>;
  };
});

jest.mock('@bubblyclouds-app/games/components/ActivityWidget', () => {
  return function MockActivityWidget() {
    return <div data-testid="activity-widget">Activity Widget</div>;
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
      expect(screen.getByText('Daily challenges')).toBeInTheDocument();
    });

    it('should display all footer tab buttons', () => {
      render(<Home />);
      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
      expect(screen.getByTestId('award-icon')).toBeInTheDocument();
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
      expect(screen.getByText('Daily challenges')).toBeInTheDocument();
    });
  });

  describe('Daily challenges section', () => {
    it('should render daily challenges heading', () => {
      render(<Home />);
      expect(screen.getByText('Daily challenges')).toBeInTheDocument();
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
});
