import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import UnblockRace from './UnblockRace';
import { useGameState } from '../hooks/useGameState';
import { solvedBoardString } from '../helpers/boardToString';

jest.mock('../hooks/useGameState');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn(), push: jest.fn() })),
}));
jest.mock('@bubblyclouds-app/template/providers/SessionsProvider', () => ({
  useSessions: jest.fn(() => ({ sessions: [] })),
}));
jest.mock('@bubblyclouds-app/auth/providers/AuthProvider', () => ({
  UserContext: React.createContext({}),
}));
jest.mock('@bubblyclouds-app/template/providers/RevenueCatProvider', () => ({
  RevenueCatContext: React.createContext({}),
}));
jest.mock('@bubblyclouds-app/ui/components/TimerDisplay', () => ({
  TimerDisplay: () => <div data-testid="timer-display">Timer</div>,
}));
jest.mock('@bubblyclouds-app/template/components/Lobby', () => {
  return function DummyLobby() {
    return <div data-testid="lobby">Lobby</div>;
  };
});
jest.mock('@bubblyclouds-app/games/components/LobbyButton', () => {
  const DummyLobbyButton = function DummyLobbyButton() {
    return <div data-testid="lobby-button">Button</div>;
  };
  return {
    __esModule: true,
    default: DummyLobbyButton,
  };
});
jest.mock('@bubblyclouds-app/ui/components/CelebrationAnimation', () => ({
  CelebrationAnimation: () => <div data-testid="celebration">Celebration</div>,
}));
jest.mock('@bubblyclouds-app/games/components/RaceTrack', () => {
  const DummyRaceTrack = function DummyRaceTrack() {
    return <div data-testid="race-track">Race Track</div>;
  };
  return {
    __esModule: true,
    default: DummyRaceTrack,
  };
});
jest.mock('@bubblyclouds-app/template/components/AppDownloadModal', () => ({
  AppDownloadModal: () => null,
}));
jest.mock('@bubblyclouds-app/template/helpers/capacitor', () => ({
  isCapacitor: jest.fn(() => true),
}));

const STAGE_1 = [
  'oooooo',
  'oooooo',
  'AAoBoo',
  'oooBoo',
  'oooooo',
  'oooooo',
].join('');
const STAGE_2 = [
  'oooooo',
  'oooooo',
  'oAAoBo',
  'ooooBo',
  'oooooo',
  'oooooo',
].join('');
// STAGE_1 with only piece A nudged one cell — a single-piece change from
// STAGE_1, so isPuzzleCheated lets it through. onComplete only needs a
// non-cheating final stack, not a literally-solved board (the hook is
// mocked; it decides completion, the component just reacts).
const STAGE_1_COMPLETED = [
  'oooooo',
  'oooooo',
  'oAABoo',
  'oooBoo',
  'oooooo',
  'oooooo',
].join('');

const mockUseGameState = useGameState as jest.MockedFunction<
  typeof useGameState
>;

const baseGameState = {
  answerStack: [STAGE_1],
  pushMove: jest.fn(),
  undo: jest.fn(),
  redo: jest.fn(),
  isUndoDisabled: true,
  isRedoDisabled: true,
  timer: null,
  reset: jest.fn(),
  completed: undefined,
  setPauseTimer: jest.fn(),
  setTimerNewSession: jest.fn(),
  refreshSessionParties: jest.fn(),
  isPolling: false,
  sessionParties: {},
  showLobby: false,
  setShowLobby: jest.fn(),
  isPaused: false,
  registerInteraction: jest.fn(),
} as unknown as ReturnType<typeof useGameState>;

const defaultProps = {
  run: {
    stages: [
      { boardString: STAGE_1, movesRequired: 3 },
      { boardString: STAGE_2, movesRequired: 5 },
    ],
    runId: 'test-run',
  },
  metadata: {},
  showRacingPrompt: false,
  app: 'unblockrace',
  appName: 'Unblock Race',
  apiUrl: 'https://api.test.com',
  appUrl: 'https://unblockrace.test.com',
  appStoreUrl: 'https://apps.apple.com/test',
  googlePlayUrl: 'https://play.google.com/test',
  deepLinkScheme: 'com.test.unblockrace',
  mobileDescription: 'mobile',
  desktopDescription: 'desktop',
  openInAppLabel: 'Open',
};

// The props of the most recent useGameState call — how the test reaches the
// onComplete callback the component passed in (it drives auto-advance).
const lastGameStateArgs = () =>
  mockUseGameState.mock.calls[mockUseGameState.mock.calls.length - 1][0];

// Drive a stage transition to completion under fake timers. Two separate
// act() advances so React flushes passive effects between them: the first
// fires the armed auto-advance (which mounts StageTransition and schedules
// its onDone timer), the second fires that onDone. A single combined advance
// would elapse before the mid-flush onDone timer is even scheduled.
const runTransition = () => {
  act(() => {
    jest.advanceTimersByTime(1200);
  });
  act(() => {
    jest.advanceTimersByTime(1200);
  });
};

describe('UnblockRace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockUseGameState.mockReturnValue({
      ...baseGameState,
      answer: STAGE_1,
    } as ReturnType<typeof useGameState>);
  });

  it('renders the board, race track and marks the current stage', () => {
    render(<UnblockRace {...defaultProps} />);
    expect(screen.getByTestId('unblock-board')).toBeInTheDocument();
    expect(screen.getByTestId('race-track')).toBeInTheDocument();
    expect(screen.getByTestId('stage-preview-0')).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  it('shows a preview strip of upcoming stages', () => {
    render(<UnblockRace {...defaultProps} />);
    expect(screen.getByTestId('stage-preview-0')).toBeInTheDocument();
    expect(screen.getByTestId('stage-preview-1')).toBeInTheDocument();
  });

  it('starts the first stage with its board string', () => {
    render(<UnblockRace {...defaultProps} />);
    expect(mockUseGameState).toHaveBeenCalledWith(
      expect.objectContaining({
        initial: STAGE_1,
        final: solvedBoardString(STAGE_1),
        puzzleId: STAGE_1,
      })
    );
  });

  it('tags each stage session with the runId and stage index', () => {
    render(<UnblockRace {...defaultProps} />);
    expect(mockUseGameState).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          runId: 'test-run',
          stageIndex: '0',
          movesRequired: '3',
        }),
      })
    );
  });

  it('auto-advances to the next stage without unmounting the racing chrome', () => {
    jest.useFakeTimers();
    try {
      mockUseGameState.mockReturnValue({
        ...baseGameState,
        answer: STAGE_1_COMPLETED,
        answerStack: [STAGE_1, STAGE_1_COMPLETED],
        completed: { at: new Date().toISOString(), seconds: 42 },
      } as ReturnType<typeof useGameState>);

      render(<UnblockRace {...defaultProps} />);
      const raceTrack = screen.getByTestId('race-track');

      // Solving a non-final stage arms the auto-advance; the car exit plays,
      // then the board slides across into the next puzzle (SPEC.md §4).
      const onComplete = lastGameStateArgs().onComplete;
      act(() => {
        onComplete?.([STAGE_1, STAGE_1_COMPLETED], 3, 42);
      });
      runTransition();

      expect(screen.getByTestId('stage-preview-1')).toHaveAttribute(
        'aria-current',
        'true'
      );
      expect(mockUseGameState).toHaveBeenLastCalledWith(
        expect.objectContaining({
          initial: STAGE_2,
          puzzleId: STAGE_2,
          metadata: expect.objectContaining({ stageIndex: '1' }),
        })
      );
      // Same DOM node — the chrome stayed mounted across the stage swap
      expect(screen.getByTestId('race-track')).toBe(raceTrack);
    } finally {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it('resumes at the first incomplete stage after a refresh', () => {
    window.localStorage.setItem(
      `unblockrace-${STAGE_1}`,
      JSON.stringify({
        state: {
          initial: STAGE_1,
          answerStack: [solvedBoardString(STAGE_1)],
          completed: { at: new Date().toISOString(), seconds: 30 },
        },
      })
    );

    render(<UnblockRace {...defaultProps} />);
    expect(screen.getByTestId('stage-preview-1')).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  it('omits the stage chain for single-puzzle runs', () => {
    render(
      <UnblockRace
        {...defaultProps}
        run={{ stages: [{ boardString: STAGE_1, movesRequired: 3 }] }}
      />
    );
    expect(screen.queryByTestId('stage-preview-0')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stage-result-panel')).not.toBeInTheDocument();
  });

  it('ticks off a stage already completed in storage', () => {
    window.localStorage.setItem(
      `unblockrace-${STAGE_1}`,
      JSON.stringify({
        state: {
          initial: STAGE_1,
          answerStack: [solvedBoardString(STAGE_1)],
          completed: { at: new Date().toISOString(), seconds: 30 },
        },
      })
    );

    render(<UnblockRace {...defaultProps} />);

    expect(screen.getByTestId('stage-preview-0-complete')).toBeInTheDocument();
    expect(
      screen.queryByTestId('stage-preview-1-complete')
    ).not.toBeInTheDocument();
  });

  it('ticks off the current stage and records its stats as soon as it completes', () => {
    jest.useFakeTimers();
    try {
      mockUseGameState.mockReturnValue({
        ...baseGameState,
        answer: STAGE_1_COMPLETED,
        answerStack: [STAGE_1, STAGE_1_COMPLETED],
        completed: { at: new Date().toISOString(), seconds: 42 },
      } as ReturnType<typeof useGameState>);

      render(<UnblockRace {...defaultProps} />);

      act(() => {
        lastGameStateArgs().onComplete?.([STAGE_1, STAGE_1_COMPLETED], 3, 42);
      });

      // Ticked off in the chain strip and recorded in the inline results
      // panel (SPEC.md §7) — before the auto-advance slide runs.
      expect(
        screen.getByTestId('stage-preview-0-complete')
      ).toBeInTheDocument();
      expect(screen.getByTestId('stage-result-0')).toHaveTextContent('3/3');
    } finally {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it('slides to a clicked stage and re-fetches its latest state from the server', () => {
    jest.useFakeTimers();
    try {
      render(<UnblockRace {...defaultProps} />);

      fireEvent.click(screen.getByTestId('stage-preview-1'));
      runTransition();

      expect(screen.getByTestId('stage-preview-1')).toHaveAttribute(
        'aria-current',
        'true'
      );
      // Changing puzzleId re-triggers useGameState's restore effect, which
      // fetches the latest server state (all players' sessions) for that
      // stage.
      expect(mockUseGameState).toHaveBeenLastCalledWith(
        expect.objectContaining({
          initial: STAGE_2,
          puzzleId: STAGE_2,
          metadata: expect.objectContaining({ stageIndex: '1' }),
        })
      );
    } finally {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it('ignores a click on the already-current stage', () => {
    render(<UnblockRace {...defaultProps} />);
    const callsBefore = mockUseGameState.mock.calls.length;

    fireEvent.click(screen.getByTestId('stage-preview-0'));

    expect(screen.getByTestId('stage-preview-0')).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(mockUseGameState.mock.calls.length).toBe(callsBefore);
  });

  it('starts a fresh timer session only once the stage slide has finished', () => {
    jest.useFakeTimers();
    try {
      mockUseGameState.mockReturnValue({
        ...baseGameState,
        answer: STAGE_1_COMPLETED,
        answerStack: [STAGE_1, STAGE_1_COMPLETED],
        completed: { at: new Date().toISOString(), seconds: 42 },
      } as ReturnType<typeof useGameState>);

      render(<UnblockRace {...defaultProps} />);
      const setTimerNewSession = baseGameState.setTimerNewSession as jest.Mock;

      act(() => {
        lastGameStateArgs().onComplete?.([STAGE_1, STAGE_1_COMPLETED], 3, 42);
      });
      setTimerNewSession.mockClear();
      // The countdown/timer for the next stage only starts after the
      // animations, i.e. once the slide's onDone fires.
      runTransition();

      expect(setTimerNewSession).toHaveBeenCalledWith(null);
    } finally {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it('shows time and move stats for a completed stage in the results panel', () => {
    window.localStorage.setItem(
      `unblockrace-${STAGE_1}`,
      JSON.stringify({
        state: {
          initial: STAGE_1,
          answerStack: [solvedBoardString(STAGE_1)],
          completed: { at: new Date().toISOString(), seconds: 30 },
          metadata: { movesMade: '3' },
        },
      })
    );

    render(<UnblockRace {...defaultProps} />);

    expect(screen.getByTestId('stage-result-0')).toHaveTextContent('00:00:30');
    expect(screen.getByTestId('stage-result-0')).toHaveTextContent('3/3');
  });
});
