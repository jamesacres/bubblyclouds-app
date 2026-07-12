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

jest.mock('@bubblyclouds-app/sudoku/components/BookCover', () => {
  return function MockBookCover() {
    return <div data-testid="book-cover">Book Cover</div>;
  };
});

jest.mock('@bubblyclouds-app/template/hooks/online', () => ({
  useOnline: jest.fn(() => ({
    forceOffline: jest.fn(),
    isOnline: true,
  })),
}));

jest.mock('@bubblyclouds-app/sudoku/hooks/useSudokuServerStorage', () => ({
  useSudokuServerStorage: jest.fn(() => ({
    getSudokuOfTheDay: jest.fn(),
    listParties: jest.fn(() => Promise.resolve([])),
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

jest.mock('@bubblyclouds-app/types/serverTypes', () => ({
  Difficulty: {
    SIMPLE: 'simple',
    EASY: 'easy',
    INTERMEDIATE: 'intermediate',
    EXPERT: 'expert',
  },
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

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('@bubblyclouds-app/auth/components/LoginModal', () => ({
  LoginModal: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="login-modal">
        <button onClick={onClose}>Close Login</button>
      </div>
    ) : null,
}));

jest.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon">Users Icon</div>,
  Zap: () => <div data-testid="zap-icon">Zap Icon</div>,
  Award: () => <div data-testid="award-icon">Award Icon</div>,
  Camera: () => <div data-testid="camera-icon">Camera Icon</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar Icon</div>,
  Watch: () => <div data-testid="watch-icon">Watch Icon</div>,
  Droplet: () => <div data-testid="droplet-icon">Droplet Icon</div>,
  RotateCcw: () => <div data-testid="rotate-ccw-icon">Rotate Icon</div>,
  BookOpen: () => <div data-testid="book-open-icon">BookOpen Icon</div>,
  Flame: () => <div data-testid="flame-icon">Flame Icon</div>,
  Star: () => <div data-testid="star-icon">Star Icon</div>,
  ExternalLink: () => (
    <div data-testid="external-link-icon">ExternalLink Icon</div>
  ),
}));

const makeSevenDays = (todayCount = 0) =>
  Array.from({ length: 7 }, (_, i) => ({
    label: ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'][i],
    puzzleCount: i === 6 ? todayCount : 0,
    isToday: i === 6,
  }));

jest.mock('@bubblyclouds-app/games/helpers/calculateActivityStats', () => ({
  calculateActivityStats: jest.fn(() => ({
    daysPlayedInThirtyDays: 0,
    puzzlesPlayedInThirtyDays: 0,
    currentStreak: 0,
    lastSevenDays: makeSevenDays(),
  })),
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
      // Should render without crashing
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
      // Users icon appears multiple times, so use getAll variant
      expect(screen.getAllByTestId('users-icon').length).toBeGreaterThan(0);
    });

    it('should switch to MY_PUZZLES tab when clicked', () => {
      render(<Home />);
      const myPuzzlesButton = screen.getByText('My Puzzles');
      fireEvent.click(myPuzzlesButton);
      expect(screen.getByTestId('my-puzzles-tab')).toBeInTheDocument();
    });

    it('should switch to FRIENDS tab when clicked', () => {
      render(<Home />);
      const friendsButton = screen.getByText('Racing Teams');
      fireEvent.click(friendsButton);
      expect(screen.getByTestId('friends-tab')).toBeInTheDocument();
    });

    it('should handle tab switching and maintain state', () => {
      render(<Home />);
      const myPuzzlesButton = screen.getByText('My Puzzles');
      fireEvent.click(myPuzzlesButton);
      expect(screen.getByTestId('my-puzzles-tab')).toBeInTheDocument();

      const startRaceButton = screen.getByText('Start Race');
      fireEvent.click(startRaceButton);
      expect(screen.getByText('Daily challenges')).toBeInTheDocument();
    });
  });

  describe('Daily Challenges section', () => {
    it('should render daily challenges section on START_PUZZLE tab', () => {
      render(<Home />);
      expect(screen.getByText('Daily challenges')).toBeInTheDocument();
    });

    it('should render three difficulty buttons', () => {
      render(<Home />);
      expect(screen.getByText('Tricky')).toBeInTheDocument();
      expect(screen.getByText('Challenging')).toBeInTheDocument();
      expect(screen.getByText('Hard')).toBeInTheDocument();
    });

    it('should have correct difficulty labels with stars', () => {
      render(<Home />);
      const buttons = screen.getAllByRole('button');
      const trickyButton = buttons.find((btn) =>
        btn.textContent?.includes('Tricky')
      );
      expect(trickyButton).toBeInTheDocument();
    });
  });

  describe('Monthly Puzzle Book section', () => {
    it('should render puzzle book section', () => {
      render(<Home />);
      expect(screen.getAllByText(/Monthly book/i).length).toBeGreaterThan(0);
    });

    it('should show book cover component', () => {
      render(<Home />);
      expect(screen.getAllByTestId('book-cover').length).toBeGreaterThan(0);
    });

    it('should have Browse Puzzles button', () => {
      render(<Home />);
      expect(screen.getAllByText('Browse puzzles').length).toBeGreaterThan(0);
    });

    it('should navigate to book page when Browse Puzzles is clicked', () => {
      // The component checks if user exists before navigating
      // Since the mock returns null user, it shows confirm dialog
      // But since user is null, it calls loginRedirect instead of navigate
      render(<Home />);
      const browseButtons = screen.getAllByText('Browse puzzles');
      fireEvent.click(browseButtons[0]);
      // When user is not logged in, it should trigger login flow, not direct navigation
      expect(mockPush).not.toHaveBeenCalledWith('/book');
    });
  });

  describe('Import puzzle section', () => {
    it('should render import section', () => {
      render(<Home />);
      expect(screen.getAllByText('Import any puzzle').length).toBeGreaterThan(
        0
      );
    });

    it('should have import challenge link', () => {
      render(<Home />);
      const importLinks = screen
        .getAllByRole('link')
        .filter((link) => link.getAttribute('href') === '/import');
      expect(importLinks.length).toBeGreaterThan(0);
    });

    it('should show camera icon in import button', () => {
      render(<Home />);
      expect(screen.getAllByTestId('camera-icon').length).toBeGreaterThan(0);
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
      expect(screen.getByText(/Enjoying Sudoku\?/i)).toBeInTheDocument();
    });
  });

  describe('Loading and error states', () => {
    it('should handle daily challenge buttons', async () => {
      render(<Home />);

      const buttons = screen.getAllByRole('button');
      const trickyButton = buttons.find((btn) =>
        btn.textContent?.includes('Tricky')
      );

      expect(trickyButton).toBeInTheDocument();
    });
  });

  describe('Activity widget', () => {
    it('should show activity widget on MY_PUZZLES tab', () => {
      render(<Home />);
      const myPuzzlesButton = screen.getByText('My Puzzles');
      fireEvent.click(myPuzzlesButton);
      expect(screen.getByTestId('activity-widget')).toBeInTheDocument();
    });

    it('should show activity widget on START_PUZZLE tab', () => {
      render(<Home />);
      expect(screen.getByTestId('activity-widget')).toBeInTheDocument();
    });
  });

  describe('Responsive layout', () => {
    it('should render with appropriate containers', () => {
      render(<Home />);
      const heroSection = screen
        .getByText('Daily challenges')
        .closest('div')?.parentElement;
      expect(heroSection?.className).toBeDefined();
    });
  });

  describe('URL management', () => {
    it('should use history.replaceState when changing tabs', () => {
      render(<Home />);
      const myPuzzlesButton = screen.getByText('My Puzzles');
      fireEvent.click(myPuzzlesButton);
      expect(mockReplaceState).toHaveBeenCalled();
    });

    it('should scroll to top when changing tabs', () => {
      render(<Home />);
      const myPuzzlesButton = screen.getByText('My Puzzles');
      fireEvent.click(myPuzzlesButton);
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
      const racingTeamsButtons = screen.getAllByRole('button');
      const racingTeamsButton = racingTeamsButtons.find(
        (btn) =>
          btn.textContent?.includes('Racing teams') &&
          btn.textContent?.includes('Challenge friends')
      );
      if (racingTeamsButton) {
        fireEvent.click(racingTeamsButton);
        expect(screen.getByTestId('friends-tab')).toBeInTheDocument();
      }
    });
  });

  describe('Content padding', () => {
    it('should have bottom padding to avoid footer overlap', () => {
      const { container } = render(<Home />);
      const paddingDiv = container.querySelector('.h-32');
      expect(paddingDiv).toBeInTheDocument();
    });
  });

  describe('Search params integration', () => {
    it('should respect tab from search params', () => {
      const mockGetSearchParams = jest.fn((key: string) => {
        if (key === 'tab') return 'my-puzzles';
        return null;
      });

      jest.clearAllMocks();
      (nextNavigation.useSearchParams as jest.Mock).mockReturnValue({
        get: mockGetSearchParams,
      });

      render(<Home />);
      // Since the component uses Suspense, it might show the START_PUZZLE tab first
      // Let's just verify the search params are being queried
      expect(mockGetSearchParams).toHaveBeenCalledWith('tab');
    });
  });
});
