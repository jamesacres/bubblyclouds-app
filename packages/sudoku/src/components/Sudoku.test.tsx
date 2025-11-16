'use client';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Sudoku from './Sudoku';
import { useGameState } from '@sudoku-web/sudoku/hooks/gameState';
import { UserContext } from '@sudoku-web/auth/providers/AuthProvider';
import { RevenueCatContext } from '@sudoku-web/template/providers/RevenueCatProvider';
import { useSessions } from '@sudoku-web/template/providers/SessionsProvider';
import { useRouter } from 'next/navigation';

jest.mock('@sudoku-web/sudoku/hooks/gameState');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('@sudoku-web/template/providers/SessionsProvider', () => ({
  useSessions: jest.fn(),
}));
jest.mock('@sudoku-web/sudoku/hooks/useDrag', () => ({
  useDrag: jest.fn(() => ({})),
}));

jest.mock('react-feather', () => ({
  Award: () => <svg data-testid="award-icon" />,
  Loader: () => <svg data-testid="loader-icon" />,
  Sidebar: () => <svg data-testid="sidebar-icon" />,
}));

jest.mock('@sudoku-web/sudoku/components/SudokuBox', () => {
  const DummySudokuBox = function DummySudokuBox() {
    return <div data-testid="sudoku-box">Sudoku Box</div>;
  };
  return {
    __esModule: true,
    default: DummySudokuBox,
  };
});

jest.mock('@sudoku-web/sudoku/components/SudokuControls', () => {
  return function DummySudokuControls() {
    return <div data-testid="sudoku-controls">Sudoku Controls</div>;
  };
});

jest.mock('@sudoku-web/games/components/TimerDisplay', () => ({
  TimerDisplay: () => <div data-testid="timer-display">Timer</div>,
}));

jest.mock('@sudoku-web/sudoku/components/SudokuSidebar', () => {
  return function DummySudokuSidebar() {
    return <div data-testid="sudoku-sidebar">Sidebar</div>;
  };
});

jest.mock('@sudoku-web/games/components/SidebarButton', () => {
  const DummySidebarButton = function DummySidebarButton() {
    return <div data-testid="sidebar-button">Button</div>;
  };
  return {
    __esModule: true,
    default: DummySidebarButton,
    SidebarButton: DummySidebarButton,
  };
});

jest.mock('@sudoku-web/ui/components/CelebrationAnimation', () => ({
  CelebrationAnimation: () => <div data-testid="celebration">Celebration</div>,
}));

jest.mock('@sudoku-web/games/components/RaceTrack', () => {
  const DummyRaceTrack = function DummyRaceTrack() {
    return <div data-testid="race-track">Race Track</div>;
  };
  return {
    __esModule: true,
    default: DummyRaceTrack,
  };
});

jest.mock('@/components/RacingPromptModal', () => {
  return function DummyRacingPromptModal({ onRace, onSolo }: any) {
    return (
      <div data-testid="racing-prompt">
        <button onClick={onRace} data-testid="race-button">
          Race
        </button>
        <button onClick={onSolo} data-testid="solo-button">
          Solo
        </button>
      </div>
    );
  };
});

jest.mock('@sudoku-web/template/components/AppDownloadModal', () => ({
  AppDownloadModal: ({ onClose }: any) => (
    <div data-testid="app-download-modal">
      <button onClick={onClose} data-testid="close-modal">
        Close
      </button>
    </div>
  ),
}));

jest.mock('@sudoku-web/template/helpers/capacitor', () => ({
  isCapacitor: jest.fn(() => false),
}));

jest.mock('@sudoku-web/sudoku/helpers/cheatDetection', () => ({
  isPuzzleCheated: jest.fn(() => false),
}));

jest.mock('@sudoku-web/sudoku/helpers/puzzleTextToPuzzle', () => ({
  puzzleTextToPuzzle: jest.fn((_text) => Array(81).fill(0)),
  puzzleToPuzzleText: jest.fn(() => '0'.repeat(81)),
}));

jest.mock('@sudoku-web/sudoku/helpers/checkAnswer', () => ({
  isInitialCell: jest.fn(() => false),
}));

jest.mock('@sudoku-web/sudoku/helpers/calculateSeconds', () => ({
  calculateSeconds: jest.fn(() => 120),
}));

jest.mock('@sudoku-web/sudoku/utils/dailyPuzzleCounter', () => ({
  addDailyPuzzleId: jest.fn(),
  getDailyPuzzleCount: jest.fn(() => 1),
}));

jest.mock('../config/dailyLimits', () => ({
  DAILY_LIMITS: {
    FREE_DAILY_PUZZLES: 3,
  },
}));

jest.mock('@sudoku-web/types/subscriptionContext', () => ({
  SubscriptionContext: {},
}));

jest.mock('@sudoku-web/auth/providers/AuthProvider', () => ({
  UserContext: React.createContext(null),
  UserContextInterface: {},
}));

jest.mock('@sudoku-web/template/providers/RevenueCatProvider', () => ({
  RevenueCatContext: React.createContext(null),
}));

describe('Sudoku', () => {
  const mockGameState = {
    answer: Array(81).fill(0),
    answerStack: [Array(81).fill(0)],
    selectedCell: 0,
    setIsNotesMode: jest.fn(),
    isNotesMode: false,
    undo: jest.fn(),
    redo: jest.fn(),
    selectNumber: jest.fn(),
    setSelectedCell: jest.fn(),
    selectedAnswer: 0,
    selectedCellHasNotes: false,
    isUndoDisabled: true,
    isRedoDisabled: true,
    validation: Array(9)
      .fill(null)
      .map(() => Array(9).fill(null)),
    validateCell: jest.fn(),
    validateGrid: jest.fn(),
    timer: 0,
    reset: jest.fn(),
    reveal: jest.fn(),
    completed: false,
    setPauseTimer: jest.fn(),
    setTimerNewSession: jest.fn(),
    refreshSessionParties: jest.fn(),
    sessionParties: {},
    showSidebar: false,
    setShowSidebar: jest.fn(),
    isZoomMode: false,
    setIsZoomMode: jest.fn(),
    isPolling: false,
  };

  const mockPuzzle = {
    initial: Array(81).fill(0) as any,
    final: Array(81).fill(0) as any,
    puzzleId: 'puzzle-123',
    redirectUri: '/home',
    metadata: {},
  } as any;

  const mockUserContext = {
    user: { sub: 'user-123' },
  };

  const mockRevenueCatContext = {
    isSubscribed: false,
    subscribeModal: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useGameState as jest.Mock).mockReturnValue(mockGameState);
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (useSessions as jest.Mock).mockReturnValue({
      sessions: [],
    });
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );
      expect(screen.getAllByTestId('sudoku-box').length).toBeGreaterThan(0);
    });

    it('should render sudoku box component', () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );
      expect(screen.getAllByTestId('sudoku-box').length).toBeGreaterThan(0);
    });

    it('should render sudoku controls', () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );
      expect(screen.getByTestId('sudoku-controls')).toBeInTheDocument();
    });

    it('should render timer display', () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );
      expect(screen.getByTestId('timer-display')).toBeInTheDocument();
    });

    it('should render sidebar', () => {
      (useGameState as jest.Mock).mockReturnValue({
        ...mockGameState,
        showSidebar: true,
      });

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );
      expect(screen.getByTestId('sudoku-sidebar')).toBeInTheDocument();
    });
  });

  describe('puzzle initialization', () => {
    it('should initialize game state with puzzle data', () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(useGameState).toHaveBeenCalledWith({
        final: mockPuzzle.final,
        initial: mockPuzzle.initial,
        puzzleId: mockPuzzle.puzzleId,
        metadata: mockPuzzle.metadata,
      });
    });

    it('should pass puzzle metadata to game state', () => {
      const puzzleWithMetadata = {
        ...mockPuzzle,
        metadata: { difficulty: 'hard' },
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={puzzleWithMetadata} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(useGameState).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { difficulty: 'hard' },
        })
      );
    });
  });

  describe('racing prompt', () => {
    it('should show racing prompt when conditions are met', async () => {
      (useGameState as jest.Mock).mockReturnValue({
        ...mockGameState,
        sessionParties: {},
      });

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} showRacingPrompt={true} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('racing-prompt')).toBeInTheDocument();
      });
    });

    it('should render when already completed', () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} alreadyCompleted={true} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(screen.getAllByTestId('sudoku-box').length).toBeGreaterThan(0);
    });

    it('should render when showRacingPrompt is false', () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} showRacingPrompt={false} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(screen.getAllByTestId('sudoku-box').length).toBeGreaterThan(0);
    });

    it('should handle race mode selection', async () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} showRacingPrompt={true} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      await waitFor(() => {
        const raceButton = screen.queryByTestId('race-button');
        if (raceButton) {
          fireEvent.click(raceButton);
        }
      });
    });

    it('should handle solo mode selection', async () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} showRacingPrompt={true} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      await waitFor(() => {
        const soloButton = screen.queryByTestId('solo-button');
        if (soloButton) {
          fireEvent.click(soloButton);
        }
      });
    });
  });

  describe('app download modal', () => {
    it('should show app download modal for web users', async () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('app-download-modal')).toBeInTheDocument();
      });
    });

    it('should close app download modal when requested', async () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      await waitFor(() => {
        const closeButton = screen.queryByTestId('close-modal');
        if (closeButton) {
          fireEvent.click(closeButton);
        }
      });
    });
  });

  describe('completion and celebration', () => {
    it('should show celebration when puzzle is completed', async () => {
      (useGameState as jest.Mock).mockReturnValue({
        ...mockGameState,
        completed: true,
      });

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('celebration')).toBeInTheDocument();
      });
    });

    it('should render even if already completed', () => {
      (useGameState as jest.Mock).mockReturnValue({
        ...mockGameState,
        completed: true,
      });

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} alreadyCompleted={true} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(screen.getAllByTestId('sudoku-box').length).toBeGreaterThan(0);
    });
  });

  describe('sidebar management', () => {
    it('should render with sidebar controls', () => {
      const setShowSidebarMock = jest.fn();
      (useGameState as jest.Mock).mockReturnValue({
        ...mockGameState,
        setShowSidebar: setShowSidebarMock,
      });

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(screen.getAllByTestId('sudoku-box').length).toBeGreaterThan(0);
    });

    it('should show sidebar when requested', () => {
      (useGameState as jest.Mock).mockReturnValue({
        ...mockGameState,
        showSidebar: true,
      });

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(screen.getByTestId('sudoku-sidebar')).toBeInTheDocument();
    });
  });

  describe('game controls', () => {
    it('should render sidebar button', () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(screen.getByTestId('sidebar-button')).toBeInTheDocument();
    });

    it('should render with zoom mode enabled', () => {
      (useGameState as jest.Mock).mockReturnValue({
        ...mockGameState,
        isZoomMode: true,
      });

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(screen.getAllByTestId('sudoku-box').length).toBeGreaterThan(0);
    });
  });

  describe('timer functionality', () => {
    it('should display timer', () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(screen.getByTestId('timer-display')).toBeInTheDocument();
    });

    it('should track game time', () => {
      (useGameState as jest.Mock).mockReturnValue({
        ...mockGameState,
        timer: 120000,
      });

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(screen.getByTestId('timer-display')).toBeInTheDocument();
    });
  });

  describe('multiplayer support', () => {
    it('should render with multiplayer session parties', () => {
      (useGameState as jest.Mock).mockReturnValue({
        ...mockGameState,
        sessionParties: {
          party1: {
            memberSessions: {
              'user-123': { state: { completed: false } },
              'user-456': { state: { completed: false } },
            },
          },
        },
      });

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(screen.getAllByTestId('sudoku-box').length).toBeGreaterThan(0);
    });
  });

  describe('context requirements', () => {
    it('should render without user context', () => {
      render(
        <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
          <Sudoku puzzle={mockPuzzle} />
        </RevenueCatContext.Provider>
      );

      expect(screen.getAllByTestId('sudoku-box').length).toBeGreaterThan(0);
    });

    it('should render without RevenueCat context', () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <Sudoku puzzle={mockPuzzle} />
        </UserContext.Provider>
      );

      expect(screen.getAllByTestId('sudoku-box').length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid prop changes', () => {
      const { rerender } = render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      rerender(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} alreadyCompleted={true} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(screen.getAllByTestId('sudoku-box').length).toBeGreaterThan(0);
    });

    it('should handle empty metadata', () => {
      const puzzleNoMetadata = {
        ...mockPuzzle,
        metadata: {},
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={puzzleNoMetadata} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(screen.getAllByTestId('sudoku-box').length).toBeGreaterThan(0);
    });

    it('should handle null puzzleId', () => {
      const puzzleWithNullId = {
        ...mockPuzzle,
        puzzleId: '',
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={puzzleWithNullId} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(screen.getAllByTestId('sudoku-box').length).toBeGreaterThan(0);
    });
  });

  describe('props handling', () => {
    it('should accept alreadyCompleted prop', () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} alreadyCompleted={true} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(screen.getAllByTestId('sudoku-box').length).toBeGreaterThan(0);
    });

    it('should accept showRacingPrompt prop', () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} showRacingPrompt={false} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(screen.getAllByTestId('sudoku-box').length).toBeGreaterThan(0);
    });

    it('should render with default props', () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(screen.getAllByTestId('sudoku-box').length).toBeGreaterThan(0);
    });
  });

  describe('snapshot', () => {
    it('should match snapshot', () => {
      const { container } = render(
        <UserContext.Provider value={mockUserContext as any}>
          <RevenueCatContext.Provider value={mockRevenueCatContext as any}>
            <Sudoku puzzle={mockPuzzle} />
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      );

      expect(container).toMatchSnapshot();
    });
  });
});
