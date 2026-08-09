import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import UnblockRace from './UnblockRace';
import {
  UserContext,
  type UserContextInterface,
} from '@bubblyclouds-app/auth/providers/AuthProvider';
import { useGameState } from '../hooks/useGameState';
import { solvedBoardString } from '../helpers/boardToString';
import { getHint } from '../helpers/hint';
import { createLocalAgents } from '../helpers/agentTimeline';
import { DreyfusLevel, LocalAgent } from '../types/Agent';
import { RevenueCatContext } from '@bubblyclouds-app/template/providers/RevenueCatProvider';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';
import { lockedCollectionIndexes } from '../helpers/collectionLocks';

jest.mock('../hooks/useGameState');
// No wasm in jsdom: the warm-up loader resolves to a stub and the hint flow
// is driven through the mocked getHint.
jest.mock('../services/solver', () => ({
  isSolverSupported: jest.fn(() => true),
  loadSolver: jest.fn(() => Promise.resolve({ solve: jest.fn() })),
}));
jest.mock('../helpers/hint', () => ({
  getHint: jest.fn(),
}));
// Agent timelines are solver-built; the mock returns deterministic agents so
// the tests control every timestamp.
jest.mock('../helpers/agentTimeline', () => ({
  createLocalAgents: jest.fn(),
}));
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ replace: mockReplace, push: mockPush })),
}));
const mockUseSessions = jest.fn<{ sessions: unknown[] }, []>(() => ({
  sessions: [],
}));
jest.mock('@bubblyclouds-app/template/providers/SessionsProvider', () => ({
  useSessions: () => mockUseSessions(),
}));
const mockFetchCollectionData = jest.fn();
const mockUseCollection = jest.fn<
  { collectionData: unknown; fetchCollectionData: () => void },
  []
>(() => ({
  collectionData: null,
  fetchCollectionData: mockFetchCollectionData,
}));
jest.mock('../providers/CollectionProvider', () => ({
  useCollection: () => mockUseCollection(),
}));
// Login is required before UnblockRace mounts its Lobby/board subtree at
// all, so every test here runs as an authenticated, initialised user by
// default; the auth-gate tests below override the context per-render to
// cover the loading and signed-out states.
jest.mock('@bubblyclouds-app/auth/providers/AuthProvider', () => ({
  UserContext: React.createContext<UserContextInterface>({
    user: { sub: 'user-123' },
    loginRedirect: jest.fn(),
    showLoginModal: jest.fn(),
    isLoggingIn: false,
    isInitialised: true,
    logout: jest.fn(),
    handleAuthUrl: jest.fn(),
    handleRestoreState: jest.fn(),
    app: 'unblockrace',
    gameName: 'Unblock Race',
  }),
}));
jest.mock('@bubblyclouds-app/template/providers/RevenueCatProvider', () => ({
  RevenueCatContext: React.createContext({}),
}));
jest.mock('@bubblyclouds-app/ui/components/TimerDisplay', () => ({
  TimerDisplay: () => <div data-testid="timer-display">Timer</div>,
}));
const mockLobbyProps = jest.fn();
jest.mock('@bubblyclouds-app/template/components/Lobby', () => {
  return function DummyLobby(props: object) {
    mockLobbyProps(props);
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
jest.mock('./RaceCelebration', () => {
  const DummyRaceCelebration = function DummyRaceCelebration() {
    return <div data-testid="celebration">Celebration</div>;
  };
  return {
    __esModule: true,
    default: DummyRaceCelebration,
    RACE_CELEBRATION_MS: 5500,
  };
});
const mockRaceTrackProps = jest.fn();
jest.mock('@bubblyclouds-app/games/components/RaceTrack', () => {
  const DummyRaceTrack = function DummyRaceTrack(props: object) {
    mockRaceTrackProps(props);
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
const mockGetHint = getHint as jest.MockedFunction<typeof getHint>;
const mockCreateLocalAgents = createLocalAgents as jest.MockedFunction<
  typeof createLocalAgents
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
  runStageParties: {},
  showLobby: false,
  setShowLobby: jest.fn(),
  isPaused: false,
  registerInteraction: jest.fn(),
  setMode: jest.fn(),
  setAgentNames: jest.fn(),
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
// onComplete callback the component passed in (it raises the stage-clear
// slam whose button drives the advance).
const lastGameStateArgs = () =>
  mockUseGameState.mock.calls[mockUseGameState.mock.calls.length - 1][0];

// Drive a stage transition to completion under fake timers. Two separate
// act() advances so React flushes passive effects between them: the first
// lets the freshly-mounted StageTransition schedule its onDone timer, the
// second fires that onDone. A single combined advance would elapse before
// the mid-flush onDone timer is even scheduled.
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
    mockUseSessions.mockReturnValue({ sessions: [] });
    mockUseCollection.mockReturnValue({
      collectionData: null,
      fetchCollectionData: mockFetchCollectionData,
    });
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

  it('passes the lobby the challenging label and its badge colour, not the sudoku vocabulary', () => {
    // Regression test: the lobby's difficulty chip used @games'
    // getDifficultyDisplay, whose map only covers sudoku's difficulty ids
    // (simple/easy/intermediate/expert). Unblock Race's own difficultyForMoves
    // returns beginner/challenging/hard/expert, none of which match, so it
    // fell through to the raw-string, uncoloured fallback — "challenging"
    // rendered with no chip colour. It must use Unblock's own display map.
    render(
      <UnblockRace
        {...defaultProps}
        run={{
          stages: [{ boardString: STAGE_1, movesRequired: 18 }],
        }}
      />
    );
    const lobbyProps = mockLobbyProps.mock.calls[
      mockLobbyProps.mock.calls.length - 1
    ][0] as { puzzleDifficulty: string; puzzleDifficultyBadgeColor: string };
    expect(lobbyProps.puzzleDifficulty).toBe('Challenging');
    expect(lobbyProps.puzzleDifficultyBadgeColor).toBe(
      'bg-amber-500 text-white'
    );
  });

  it('passes runStageIds to the hook and per-stage run results to the race track', () => {
    render(<UnblockRace {...defaultProps} />);
    expect(mockUseGameState).toHaveBeenLastCalledWith(
      expect.objectContaining({ runStageIds: [STAGE_1, STAGE_2] })
    );
    // Nothing finished yet, so the run leaderboard has no rows
    expect(mockRaceTrackProps.mock.calls.at(-1)?.[0].runResults).toEqual([]);

    act(() => {
      lastGameStateArgs().onComplete?.([STAGE_1, STAGE_1_COMPLETED], 3, 42);
    });

    // Completing stage 1 puts the player's own line on the leaderboard:
    // their stage 1 time and the run total so far
    expect(mockRaceTrackProps.mock.calls.at(-1)?.[0].runResults).toEqual([
      expect.objectContaining({
        userId: 'user-123',
        isCurrentUser: true,
        stageResults: [
          { seconds: 42, movesMade: 3, movesRequired: 3 },
          undefined,
        ],
        totalSeconds: 42,
        totalMoves: 3,
        completedStageCount: 1,
      }),
    ]);
  });

  it('advances to the next stage via the stage-clear button without unmounting the racing chrome', () => {
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

      // Solving a non-final stage raises the stage-clear slam and holds —
      // no timer advances the run on its own.
      const onComplete = lastGameStateArgs().onComplete;
      act(() => {
        onComplete?.([STAGE_1, STAGE_1_COMPLETED], 3, 42);
      });
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(screen.getByTestId('stage-clear-slam')).toBeInTheDocument();
      // The slam carries the stage's full result: time, moves vs par and
      // the par verdict.
      expect(screen.getByTestId('stage-clear-time')).toHaveTextContent('0:42');
      expect(screen.getByTestId('stage-clear-moves')).toHaveTextContent('3/3');
      expect(screen.getByTestId('stage-clear-par')).toHaveTextContent('On par');
      expect(screen.getByTestId('stage-preview-0')).toHaveAttribute(
        'aria-current',
        'true'
      );

      // The player taps Next stage; the slam dismisses and the board slides
      // across into the next puzzle (SPEC.md §4).
      fireEvent.click(screen.getByTestId('next-stage-button'));
      expect(screen.queryByTestId('stage-clear-slam')).not.toBeInTheDocument();
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
      // panel (SPEC.md §7) — while the stage-clear slam is still holding.
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
      // animations: the player taps Next stage, then the slide's onDone
      // fires.
      fireEvent.click(screen.getByTestId('next-stage-button'));
      expect(setTimerNewSession).not.toHaveBeenCalled();
      runTransition();

      expect(setTimerNewSession).toHaveBeenCalledWith(null);
    } finally {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it('shows the hint overlay on the board when a hint resolves to a move', async () => {
    mockGetHint.mockResolvedValue({
      kind: 'move',
      move: { piece: 0, steps: 1 },
    });

    render(<UnblockRace {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Hint'));

    expect(await screen.findByTestId('hint-ring')).toBeInTheDocument();
    expect(screen.getByTestId('hint-ghost')).toBeInTheDocument();
    expect(mockGetHint).toHaveBeenCalledWith(STAGE_1);
  });

  it('clears the hint as soon as the board changes', async () => {
    mockGetHint.mockResolvedValue({
      kind: 'move',
      move: { piece: 0, steps: 1 },
    });

    const { rerender } = render(<UnblockRace {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Hint'));
    await screen.findByTestId('hint-ring');

    // The player makes a move: the hook returns the new answer and the
    // effect on it drops the now-stale hint
    mockUseGameState.mockReturnValue({
      ...baseGameState,
      answer: STAGE_1_COMPLETED,
      answerStack: [STAGE_1, STAGE_1_COMPLETED],
    } as ReturnType<typeof useGameState>);
    rerender(<UnblockRace {...defaultProps} />);

    expect(screen.queryByTestId('hint-ring')).not.toBeInTheDocument();
    expect(screen.queryByTestId('hint-ghost')).not.toBeInTheDocument();
  });

  it('shows a dismissible notice when the position is unsolvable', async () => {
    mockGetHint.mockResolvedValue({ kind: 'unsolvable' });

    render(<UnblockRace {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Hint'));

    const notice = await screen.findByTestId('hint-notice');
    expect(notice).toHaveTextContent('No way through from here');
    expect(screen.queryByTestId('hint-ring')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Dismiss hint notice'));
    expect(screen.queryByTestId('hint-notice')).not.toBeInTheDocument();
  });

  it('disables the hint button once the stage is complete', () => {
    mockUseGameState.mockReturnValue({
      ...baseGameState,
      answer: STAGE_1_COMPLETED,
      answerStack: [STAGE_1, STAGE_1_COMPLETED],
      completed: { at: new Date().toISOString(), seconds: 42 },
    } as ReturnType<typeof useGameState>);

    render(<UnblockRace {...defaultProps} />);

    expect(screen.getByLabelText('Hint')).toBeDisabled();
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

    expect(screen.getByTestId('stage-result-0')).toHaveTextContent('0:30');
    expect(screen.getByTestId('stage-result-0')).toHaveTextContent('3/3');
  });

  describe('end-of-puzzle payoff', () => {
    it('shows animated stars, a points count-up and a progress line on stage clear', () => {
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

        // 3 moves against par 3 → three filled stars
        expect(screen.getByTestId('stage-clear-stars')).toBeInTheDocument();
        expect(screen.getByLabelText('3 of 3 stars')).toBeInTheDocument();
        // Points readout labelled as leaderboard points
        expect(screen.getByTestId('stage-clear-points')).toHaveTextContent(
          'Leaderboard points'
        );
        // Progress line frames how far through the 2-stage run this win is
        expect(screen.getByTestId('stage-clear-progress')).toHaveTextContent(
          'Stage 1 of 2 — 1 to go'
        );
      } finally {
        jest.clearAllTimers();
        jest.useRealTimers();
      }
    });
  });

  // Render inside a RevenueCat context so the hint/lock paywall paths can be
  // exercised. The default mock provides an empty context ({}), which is the
  // free, no-modal case; these helpers opt into a subscriber or a modal.
  const renderWithRevenueCat = (
    ui: React.ReactElement,
    value: {
      isSubscribed?: boolean;
      showModalIfRequired?: jest.Mock;
    }
  ) =>
    render(
      <RevenueCatContext.Provider
        value={
          {
            isSubscribed: value.isSubscribed ?? false,
            subscribeModal: value.showModalIfRequired
              ? { showModalIfRequired: value.showModalIfRequired }
              : undefined,
          } as unknown as React.ContextType<typeof RevenueCatContext>
        }
      >
        {ui}
      </RevenueCatContext.Provider>
    );

  describe('hint paywall', () => {
    beforeEach(() => {
      mockGetHint.mockResolvedValue({
        kind: 'move',
        move: { piece: 0, steps: 1 },
      });
    });

    it('lets a subscriber hint without a badge or a paywall', async () => {
      const showModalIfRequired = jest.fn();
      renderWithRevenueCat(<UnblockRace {...defaultProps} />, {
        isSubscribed: true,
        showModalIfRequired,
      });

      expect(screen.queryByTestId('hint-badge')).not.toBeInTheDocument();
      fireEvent.click(screen.getByLabelText('Hint'));
      expect(await screen.findByTestId('hint-ring')).toBeInTheDocument();
      expect(showModalIfRequired).not.toHaveBeenCalled();
    });

    it('lets a free user hint with no count badge shown', async () => {
      renderWithRevenueCat(<UnblockRace {...defaultProps} />, {});

      expect(screen.queryByTestId('hint-badge')).not.toBeInTheDocument();
      fireEvent.click(screen.getByLabelText('Hint'));
      await screen.findByTestId('hint-ring');
      expect(screen.queryByTestId('hint-badge')).not.toBeInTheDocument();
    });

    it("opens the paywall on the free user's third hint of the day", async () => {
      const showModalIfRequired = jest.fn();
      window.localStorage.setItem(
        'daily-action-counter',
        JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          hintCount: 2,
          undoCount: 0,
          checkGridCount: 0,
        })
      );

      renderWithRevenueCat(<UnblockRace {...defaultProps} />, {
        showModalIfRequired,
      });

      expect(screen.queryByTestId('hint-badge')).not.toBeInTheDocument();
      fireEvent.click(screen.getByLabelText('Hint'));

      expect(showModalIfRequired).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        SubscriptionContext.HINT
      );
      // The hint itself is withheld until the paywall's proceed callback runs
      expect(screen.queryByTestId('hint-ring')).not.toBeInTheDocument();
    });
  });

  describe('retry and reset confirms', () => {
    it('retries the current stage after confirming, on a fresh timer session', () => {
      const reset = jest.fn();
      const setTimerNewSession = jest.fn();
      mockUseGameState.mockReturnValue({
        ...baseGameState,
        answer: STAGE_1,
        movesMade: 2,
        reset,
        setTimerNewSession,
      } as ReturnType<typeof useGameState>);

      render(<UnblockRace {...defaultProps} />);

      fireEvent.click(screen.getByTestId('retry-stage-button'));
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));

      expect(reset).toHaveBeenCalled();
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });

    it('does not retry when the confirm is cancelled', () => {
      const reset = jest.fn();
      mockUseGameState.mockReturnValue({
        ...baseGameState,
        answer: STAGE_1,
        movesMade: 2,
        reset,
      } as ReturnType<typeof useGameState>);

      render(<UnblockRace {...defaultProps} />);

      fireEvent.click(screen.getByTestId('retry-stage-button'));
      fireEvent.click(screen.getByTestId('confirm-dialog-cancel'));

      expect(reset).not.toHaveBeenCalled();
    });

    it('clears a completed stage from the results panel when retried so the new result overwrites', () => {
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
      window.localStorage.setItem(
        `unblockrace-${STAGE_2}`,
        JSON.stringify({
          state: {
            initial: STAGE_2,
            answerStack: [solvedBoardString(STAGE_2)],
            completed: { at: new Date().toISOString(), seconds: 44 },
            metadata: { movesMade: '5' },
          },
        })
      );
      const reset = jest.fn();
      mockUseGameState.mockReturnValue({
        ...baseGameState,
        answer: STAGE_1,
        reset,
      } as ReturnType<typeof useGameState>);

      // Both stages complete in storage → resumes on the final stage (index
      // 1), whose result the retry must clear.
      render(<UnblockRace {...defaultProps} />);
      expect(screen.getByTestId('stage-preview-1')).toHaveAttribute(
        'aria-current',
        'true'
      );
      expect(screen.getByTestId('stage-result-1')).toHaveTextContent('0:44');

      fireEvent.click(screen.getByTestId('retry-stage-button'));
      fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));

      // Its entry is dropped so the fresh solve overwrites rather than being
      // ignored, and reset() starts a new timer session.
      expect(reset).toHaveBeenCalled();
      expect(screen.getByTestId('stage-result-1')).not.toHaveTextContent(
        '0:44'
      );
    });

    it('confirms before the destructive Controls reset fires', () => {
      const reset = jest.fn();
      mockUseGameState.mockReturnValue({
        ...baseGameState,
        answer: STAGE_1,
        reset,
      } as ReturnType<typeof useGameState>);

      render(<UnblockRace {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Reset'));
      expect(screen.getByTestId('confirm-dialog')).toHaveTextContent(
        'Reset this puzzle?'
      );
      // reset only fires after confirming
      expect(reset).not.toHaveBeenCalled();
      fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));
      expect(reset).toHaveBeenCalled();
    });
  });

  describe('previous stage button', () => {
    it('is hidden on the first stage', () => {
      render(<UnblockRace {...defaultProps} />);
      expect(
        screen.queryByTestId('previous-stage-button')
      ).not.toBeInTheDocument();
    });

    it('slides back to the earlier stage when on a later stage', () => {
      jest.useFakeTimers();
      try {
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
        // Resumes on stage 1 (stage 0 complete), so Previous is available
        expect(screen.getByTestId('stage-preview-1')).toHaveAttribute(
          'aria-current',
          'true'
        );

        fireEvent.click(screen.getByTestId('previous-stage-button'));
        runTransition();

        expect(screen.getByTestId('stage-preview-0')).toHaveAttribute(
          'aria-current',
          'true'
        );
      } finally {
        jest.clearAllTimers();
        jest.useRealTimers();
      }
    });
  });

  describe('locked deep-link gate', () => {
    const LOCKED_MONTH = '202607';

    // Three beginner (all free) + three expert (only 1 free) → indexes 4 and 5
    // are the Plus puzzles; 0–3 are free (matches FREE_PUZZLES_PER_DIFFICULTY).
    const gateCollectionData = {
      unblockCollectionId: `ofthemonth-${LOCKED_MONTH}`,
      puzzles: [0, 1, 2, 3, 4, 5].map((i) => ({
        initial: `puzzle-${i}`,
        final: `puzzle-${i}`,
        movesRequired: 3 + i,
        difficulty: i < 3 ? 'beginner' : 'expert',
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const locked = lockedCollectionIndexes(gateCollectionData.puzzles);
    const lockedIndex = [...locked][0];
    const freeIndex = gateCollectionData.puzzles.findIndex(
      (_, index) => !locked.has(index)
    );

    const lockedProps = {
      ...defaultProps,
      run: { stages: [{ boardString: STAGE_1, movesRequired: 3 }] },
    };

    beforeEach(() => {
      mockUseCollection.mockReturnValue({
        collectionData: gateCollectionData,
        fetchCollectionData: mockFetchCollectionData,
      });
    });

    it('opens the Plus modal for a free user deep-linking into a locked collection puzzle', () => {
      const showModalIfRequired = jest.fn();
      renderWithRevenueCat(
        <UnblockRace
          {...lockedProps}
          metadata={{
            unblockCollectionPuzzleId: `ofthemonth-${LOCKED_MONTH}-puzzle-${lockedIndex}`,
          }}
        />,
        { showModalIfRequired }
      );
      expect(showModalIfRequired).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        SubscriptionContext.COLLECTION_LOCKED
      );
    });

    it('opens the modal only once even when subscribeModal is a fresh object on every render', () => {
      // Regression test: RevenueCatProvider builds its context value's
      // subscribeModal as a new object literal every render (including the
      // one showModalIfRequired's own setIsOpen triggers). Depending on that
      // object directly in the trigger effect caused an infinite open loop
      // ("Maximum update depth exceeded") the moment the modal opened.
      const showModalIfRequired = jest.fn();
      const { rerender } = renderWithRevenueCat(
        <UnblockRace
          {...lockedProps}
          metadata={{
            unblockCollectionPuzzleId: `ofthemonth-${LOCKED_MONTH}-puzzle-${lockedIndex}`,
          }}
        />,
        { showModalIfRequired }
      );

      rerender(
        <RevenueCatContext.Provider
          value={
            {
              isSubscribed: false,
              subscribeModal: { showModalIfRequired },
            } as unknown as React.ContextType<typeof RevenueCatContext>
          }
        >
          <UnblockRace
            {...lockedProps}
            metadata={{
              unblockCollectionPuzzleId: `ofthemonth-${LOCKED_MONTH}-puzzle-${lockedIndex}`,
            }}
          />
        </RevenueCatContext.Provider>
      );

      expect(showModalIfRequired).toHaveBeenCalledTimes(1);
    });

    it('does not gate an unlocked (first-half) collection puzzle', () => {
      const showModalIfRequired = jest.fn();
      renderWithRevenueCat(
        <UnblockRace
          {...lockedProps}
          metadata={{
            unblockCollectionPuzzleId: `ofthemonth-${LOCKED_MONTH}-puzzle-${freeIndex}`,
          }}
        />,
        { showModalIfRequired }
      );
      expect(showModalIfRequired).not.toHaveBeenCalled();
    });

    it('lets a subscriber through the locked puzzle without opening the modal', () => {
      const showModalIfRequired = jest.fn();
      renderWithRevenueCat(
        <UnblockRace
          {...lockedProps}
          metadata={{
            unblockCollectionPuzzleId: `ofthemonth-${LOCKED_MONTH}-puzzle-${lockedIndex}`,
          }}
        />,
        { isSubscribed: true, showModalIfRequired }
      );
      expect(showModalIfRequired).not.toHaveBeenCalled();
    });

    it('backing out of the Plus modal returns to the collection', () => {
      const showModalIfRequired = jest.fn();
      renderWithRevenueCat(
        <UnblockRace
          {...lockedProps}
          metadata={{
            unblockCollectionPuzzleId: `ofthemonth-${LOCKED_MONTH}-puzzle-${lockedIndex}`,
          }}
        />,
        { showModalIfRequired }
      );

      const cancelCallback = showModalIfRequired.mock.calls[0][1] as () => void;
      act(() => {
        cancelCallback();
      });

      expect(mockReplace).toHaveBeenCalledWith('/collection');
    });

    it('pauses the timer and disables the board while collectionData is still loading, before the lock is confirmed', () => {
      // Regression test: collectionData is fetched async (via
      // fetchCollectionData in an effect), so on first mount for a
      // collection-puzzle deep link it can still be null. Without treating
      // that as "gated", the puzzle would be briefly playable and the timer
      // would briefly run before flipping to locked once the fetch
      // resolves — the bug report was exactly this: no Plus modal, and the
      // countdown started running.
      mockUseCollection.mockReturnValue({
        collectionData: null,
        fetchCollectionData: mockFetchCollectionData,
      });
      const showModalIfRequired = jest.fn();

      renderWithRevenueCat(
        <UnblockRace
          {...lockedProps}
          metadata={{
            unblockCollectionPuzzleId: `ofthemonth-${LOCKED_MONTH}-puzzle-${lockedIndex}`,
          }}
        />,
        { showModalIfRequired }
      );

      // Not yet known to be locked, so the modal doesn't open (it would be
      // wrong to claim that before we've confirmed it)...
      expect(showModalIfRequired).not.toHaveBeenCalled();
      // ...but the board must not be playable and the timer must not run
      // during this pending window.
      expect(baseGameState.setPauseTimer).toHaveBeenLastCalledWith(true);
    });

    it('does not start a countdown when the lobby is dismissed on a locked puzzle', () => {
      // Regression test: "Start playing" in the lobby used to unconditionally
      // start a countdown session. On a locked puzzle isBoardGated freezes
      // that countdown immediately (shouldPause), so it got stuck mid-count
      // as a full-screen overlay (z-[120]) permanently hiding whatever paywall
      // UI sat underneath it — no countdown finishing, no Plus info visible.
      renderWithRevenueCat(
        <UnblockRace
          {...lockedProps}
          metadata={{
            unblockCollectionPuzzleId: `ofthemonth-${LOCKED_MONTH}-puzzle-${lockedIndex}`,
          }}
        />,
        { showModalIfRequired: jest.fn() }
      );

      const lobbyProps = mockLobbyProps.mock.calls[
        mockLobbyProps.mock.calls.length - 1
      ][0] as {
        onStartRace?: () => void;
        setShowLobby: (_value: boolean) => void;
      };

      act(() => {
        lobbyProps.onStartRace?.();
        lobbyProps.setShowLobby(false);
      });

      expect(screen.queryByText('Get ready')).not.toBeInTheDocument();
    });
  });

  describe('no play limits', () => {
    it('never opens a paywall from starting runs, however many are played', () => {
      const showModalIfRequired = jest.fn();
      window.localStorage.setItem(
        'daily-run-ids',
        JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          runIds: ['a', 'b', 'c', 'd', 'e'],
        })
      );
      mockUseGameState.mockReturnValue({
        ...baseGameState,
        answer: STAGE_1,
        timer: {
          countdown: 1,
          seconds: 0,
          inProgress: {
            start: new Date().toISOString(),
            lastInteraction: new Date().toISOString(),
          },
        },
      } as ReturnType<typeof useGameState>);

      renderWithRevenueCat(<UnblockRace {...defaultProps} />, {
        showModalIfRequired,
      });

      expect(showModalIfRequired).not.toHaveBeenCalled();
    });
  });

  describe('continue-to-next-puzzle', () => {
    // Six distinct board strings so each is its own collection puzzle.
    const P0 = STAGE_1;
    const P1 = STAGE_2;
    const P2 = STAGE_1_COMPLETED;
    const P3 = [
      'oooooo',
      'oooooo',
      'ooAABo',
      'ooooBo',
      'oooooo',
      'oooooo',
    ].join('');
    const P4 = [
      'oooooo',
      'oooooo',
      'oAABBo',
      'oooooo',
      'oooooo',
      'oooooo',
    ].join('');
    const P5 = [
      'oooooo',
      'oooooo',
      'AABBoo',
      'oooooo',
      'oooooo',
      'oooooo',
    ].join('');
    // Three beginner (all 3 free) + three expert (only 1 free) → indexes 4 and
    // 5 are the Plus puzzles; 0–3 are free.
    const collectionData = {
      unblockCollectionId: 'ofthemonth-202607',
      puzzles: [P0, P1, P2, P3, P4, P5].map((initial, i) => ({
        initial,
        final: initial,
        movesRequired: 3 + i,
        difficulty: i < 3 ? 'beginner' : 'expert',
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const collectionProps = {
      ...defaultProps,
      run: { stages: [{ boardString: P0, movesRequired: 3 }] },
      metadata: { unblockCollectionPuzzleId: 'ofthemonth-202607-puzzle-0' },
    };

    const completedSession = (initial: string) => ({
      sessionId: `unblockrace-${initial}`,
      state: {
        initial,
        answerStack: [initial],
        completed: { at: new Date().toISOString(), seconds: 20 },
      },
    });

    it('renders the next-puzzle panel pointing at the next collection puzzle when completed', () => {
      mockUseCollection.mockReturnValue({
        collectionData,
        fetchCollectionData: mockFetchCollectionData,
      });
      mockUseGameState.mockReturnValue({
        ...baseGameState,
        answer: P0,
        answerStack: [P0],
        completed: { at: new Date().toISOString(), seconds: 30 },
      } as ReturnType<typeof useGameState>);

      render(<UnblockRace {...collectionProps} />);

      expect(screen.getByTestId('next-puzzle-panel')).toBeInTheDocument();
      // The resolver skips the just-finished P0 and steers to the next free
      // puzzle (index 1).
      expect(screen.getByTestId('next-puzzle-continue')).toHaveTextContent(
        'Continue — next puzzle'
      );
    });

    it('shows the Plus-locked label when the next collection puzzle is locked', () => {
      // Every free puzzle (0–3) is done, so the resolver's only remaining
      // stops are the Plus puzzles (4, 5) — a free user sees the (Plus) CTA.
      mockUseCollection.mockReturnValue({
        collectionData,
        fetchCollectionData: mockFetchCollectionData,
      });
      mockUseSessions.mockReturnValue({
        sessions: [
          completedSession(P1),
          completedSession(P2),
          completedSession(P3),
        ],
      });
      mockUseGameState.mockReturnValue({
        ...baseGameState,
        answer: P0,
        answerStack: [P0],
        completed: { at: new Date().toISOString(), seconds: 30 },
      } as ReturnType<typeof useGameState>);

      render(<UnblockRace {...collectionProps} />);

      expect(screen.getByTestId('next-puzzle-continue')).toHaveTextContent(
        'Continue (Plus)'
      );
    });

    it('regression: clicking continue into a locked puzzle pushes a URL that gates on arrival (last-free-puzzle repro)', () => {
      // End-to-end version of the bug report: finish the last free puzzle,
      // click continue, and confirm both (a) the URL actually points at the
      // locked puzzle's own id/board (not back at the one just finished),
      // and (b) mounting UnblockRace fresh with exactly those props — the
      // same as a hard page reload — opens the Plus modal immediately.
      mockUseCollection.mockReturnValue({
        collectionData,
        fetchCollectionData: mockFetchCollectionData,
      });
      mockUseSessions.mockReturnValue({
        sessions: [
          completedSession(P1),
          completedSession(P2),
          completedSession(P3),
        ],
      });
      mockUseGameState.mockReturnValue({
        ...baseGameState,
        answer: P0,
        answerStack: [P0],
        completed: { at: new Date().toISOString(), seconds: 30 },
      } as ReturnType<typeof useGameState>);

      render(<UnblockRace {...collectionProps} />);
      fireEvent.click(screen.getByTestId('next-puzzle-continue'));

      expect(mockPush).toHaveBeenCalledTimes(1);
      const pushedUrl = mockPush.mock.calls[0][0] as string;
      const params = new URLSearchParams(pushedUrl.split('?')[1]);
      const nextBoard = params.get('board');
      const nextUnblockCollectionPuzzleId = params.get(
        'unblockCollectionPuzzleId'
      );

      // Sanity: it's genuinely a different, Plus-only puzzle (index 4 or 5).
      expect(nextUnblockCollectionPuzzleId).toMatch(
        /^ofthemonth-202607-puzzle-[45]$/
      );
      expect(nextBoard).not.toBe(P0);

      // Now simulate landing on that URL fresh (a full reload): render a
      // brand-new UnblockRace with the metadata the URL carries — a valid
      // board is substituted here (STAGE_2) since P4/P5 are simplified
      // fixtures never meant to be parsed as real boards; the gate check
      // depends only on metadata.unblockCollectionPuzzleId + collectionData,
      // not on which board is showing.
      mockUseGameState.mockReturnValue({
        ...baseGameState,
        answer: STAGE_2,
        answerStack: [STAGE_2],
        completed: undefined,
      } as ReturnType<typeof useGameState>);

      const showModalIfRequired = jest.fn();
      renderWithRevenueCat(
        <UnblockRace
          {...defaultProps}
          run={{ stages: [{ boardString: STAGE_2, movesRequired: 7 }] }}
          metadata={{
            unblockCollectionPuzzleId: nextUnblockCollectionPuzzleId!,
          }}
        />,
        { showModalIfRequired }
      );

      expect(showModalIfRequired).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        SubscriptionContext.COLLECTION_LOCKED
      );
    });

    it('omits the panel when there is no next collection puzzle', () => {
      mockUseCollection.mockReturnValue({
        collectionData: null,
        fetchCollectionData: mockFetchCollectionData,
      });
      mockUseGameState.mockReturnValue({
        ...baseGameState,
        answer: P0,
        answerStack: [P0],
        completed: { at: new Date().toISOString(), seconds: 30 },
      } as ReturnType<typeof useGameState>);

      render(<UnblockRace {...collectionProps} />);

      expect(screen.queryByTestId('next-puzzle-panel')).not.toBeInTheDocument();
    });
  });

  describe('AI agents', () => {
    const SOLVED_STAGE_1 = solvedBoardString(STAGE_1);

    // A two-move timeline finishing at 2s: 33% after 1s, solved after 2s.
    // States mirror what createAgentTimeline snapshots, so the real
    // getAllAgentProgress derives percentages from them unmocked.
    const testAgent = (
      id: string,
      name: string,
      emoji: string
    ): LocalAgent => ({
      id,
      name,
      emoji,
      skillLevel: DreyfusLevel.Novice,
      timeline: {
        steps: [
          {
            move: { piece: 0, steps: 1 },
            timestamp: 1000,
            state: {
              initial: STAGE_1,
              final: SOLVED_STAGE_1,
              answerStack: [STAGE_1_COMPLETED],
              metadata: { movesRequired: '3', movesMade: '1' },
            },
          },
          {
            move: { piece: 0, steps: 3 },
            timestamp: 2000,
            state: {
              initial: STAGE_1,
              final: SOLVED_STAGE_1,
              answerStack: [SOLVED_STAGE_1],
              metadata: { movesRequired: '3', movesMade: '2' },
            },
          },
        ],
        totalDuration: 2000,
      },
    });

    const lastLobbyProps = () =>
      mockLobbyProps.mock.calls[mockLobbyProps.mock.calls.length - 1][0];
    const lastTrackProps = () =>
      mockRaceTrackProps.mock.calls[
        mockRaceTrackProps.mock.calls.length - 1
      ][0];

    it('offers the bot roster to the lobby', () => {
      render(<UnblockRace {...defaultProps} />);
      const lobbyProps = lastLobbyProps();
      expect(lobbyProps.onAgentMode).toEqual(expect.any(Function));
      expect(lobbyProps.onRemoveAgent).toEqual(expect.any(Function));
      expect(lobbyProps.agentOptions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Bumblebee', emoji: '🐝' }),
        ])
      );
      expect(lobbyProps.defaultSelectedAgentNames).toEqual([]);
    });

    it('builds solver timelines for the picked bots and puts their karts on the track', async () => {
      mockCreateLocalAgents.mockResolvedValue([
        testAgent('agent-0', 'Bumblebee', '🐝'),
      ]);

      render(<UnblockRace {...defaultProps} />);
      await act(async () => {
        lastLobbyProps().onAgentMode(['Bumblebee']);
      });

      expect(mockCreateLocalAgents).toHaveBeenCalledWith(
        STAGE_1,
        SOLVED_STAGE_1,
        [expect.objectContaining({ name: 'Bumblebee' })],
        'beginner'
      );
      expect(baseGameState.setMode).toHaveBeenCalledWith('ai');
      expect(baseGameState.setAgentNames).toHaveBeenCalledWith('Bumblebee');
      expect(lastTrackProps().localAgentProgress).toEqual([
        expect.objectContaining({
          agentId: 'agent-0',
          name: 'Bumblebee',
          emoji: '🐝',
          percentage: 0,
        }),
      ]);
    });

    it('advances the karts once the clock runs and records the run leaderboard line at stage end', async () => {
      jest.useFakeTimers();
      try {
        mockUseGameState.mockReturnValue({
          ...baseGameState,
          answer: STAGE_1_COMPLETED,
          answerStack: [STAGE_1, STAGE_1_COMPLETED],
          timer: {
            seconds: 0,
            inProgress: {
              start: new Date().toISOString(),
              lastInteraction: new Date().toISOString(),
            },
          },
          completed: { at: new Date().toISOString(), seconds: 42 },
        } as ReturnType<typeof useGameState>);
        mockCreateLocalAgents.mockResolvedValue([
          testAgent('agent-0', 'Bumblebee', '🐝'),
        ]);

        render(<UnblockRace {...defaultProps} />);
        await act(async () => {
          lastLobbyProps().onAgentMode(['Bumblebee']);
        });

        // The 1s tick drives the kart: a third of the moves after 1s,
        // finished (with its 2s time) after 2s — even though the player has
        // already completed the stage.
        act(() => {
          jest.advanceTimersByTime(1100);
        });
        expect(lastTrackProps().localAgentProgress[0].percentage).toBe(33);
        act(() => {
          jest.advanceTimersByTime(1000);
        });
        expect(lastTrackProps().localAgentProgress[0]).toEqual(
          expect.objectContaining({ percentage: 100, finishTime: 2 })
        );

        // The stage completing settles the agent's deterministic result
        // onto the run leaderboard next to the player's own line.
        act(() => {
          lastGameStateArgs().onComplete?.([STAGE_1, STAGE_1_COMPLETED], 3, 42);
        });
        expect(lastTrackProps().runResults).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              userId: 'agent-Bumblebee',
              nickname: 'Bumblebee',
              isAgent: true,
              emoji: '🐝',
              stageResults: [
                { seconds: 2, movesMade: 2, movesRequired: 3 },
                undefined,
              ],
              totalSeconds: 2,
              completedStageCount: 1,
            }),
            expect.objectContaining({
              userId: 'user-123',
              isCurrentUser: true,
            }),
          ])
        );
      } finally {
        jest.clearAllTimers();
        jest.useRealTimers();
      }
    });

    it('removes a bot from the race and the saved selection', async () => {
      mockCreateLocalAgents.mockResolvedValue([
        testAgent('agent-0', 'Bumblebee', '🐝'),
        testAgent('agent-1', 'Sage', '🦉'),
      ]);

      render(<UnblockRace {...defaultProps} />);
      await act(async () => {
        lastLobbyProps().onAgentMode(['Bumblebee', 'Sage']);
      });
      expect(lastTrackProps().localAgentProgress).toHaveLength(2);

      act(() => {
        lastLobbyProps().onRemoveAgent('agent-0');
      });

      expect(baseGameState.setAgentNames).toHaveBeenLastCalledWith('Sage');
      expect(lastTrackProps().localAgentProgress).toEqual([
        expect.objectContaining({ agentId: 'agent-1', name: 'Sage' }),
      ]);
    });

    it('rebuilds the timelines for the next stage when the run advances', async () => {
      jest.useFakeTimers();
      try {
        mockUseGameState.mockReturnValue({
          ...baseGameState,
          answer: STAGE_1_COMPLETED,
          answerStack: [STAGE_1, STAGE_1_COMPLETED],
          completed: { at: new Date().toISOString(), seconds: 42 },
        } as ReturnType<typeof useGameState>);
        mockCreateLocalAgents.mockResolvedValue([
          testAgent('agent-0', 'Bumblebee', '🐝'),
        ]);

        render(<UnblockRace {...defaultProps} />);
        await act(async () => {
          lastLobbyProps().onAgentMode(['Bumblebee']);
        });

        act(() => {
          lastGameStateArgs().onComplete?.([STAGE_1, STAGE_1_COMPLETED], 3, 42);
        });
        fireEvent.click(screen.getByTestId('next-stage-button'));
        runTransition();
        // Flush the stage-2 rebuild's solve so its setState lands inside act
        await act(async () => {});

        expect(mockCreateLocalAgents).toHaveBeenLastCalledWith(
          STAGE_2,
          solvedBoardString(STAGE_2),
          [expect.objectContaining({ name: 'Bumblebee' })],
          'beginner'
        );
      } finally {
        jest.clearAllTimers();
        jest.useRealTimers();
      }
    });
  });

  // Guest play was removed: login is required before the Lobby/board subtree
  // mounts at all, so the puzzle-playing UI (and useGameState's restore
  // effect that would create server game-state) never renders for a
  // signed-out or still-resolving visitor. These tests override a handful
  // of fields on the default auth context (see the AuthProvider mock above)
  // per-render to cover the loading, signed-out, and signed-in states.
  const defaultAuthContext: UserContextInterface = {
    user: { sub: 'user-123' },
    loginRedirect: jest.fn(),
    showLoginModal: jest.fn(),
    isLoggingIn: false,
    isInitialised: true,
    logout: jest.fn(),
    handleAuthUrl: jest.fn(),
    handleRestoreState: jest.fn(),
    app: 'unblockrace',
    gameName: 'Unblock Race',
  };

  const renderWithAuth = (
    ui: React.ReactElement,
    overrides: Partial<UserContextInterface>
  ) =>
    render(
      <UserContext.Provider value={{ ...defaultAuthContext, ...overrides }}>
        {ui}
      </UserContext.Provider>
    );

  describe('auth gate', () => {
    it('shows a loading state and no board while auth is still resolving', () => {
      renderWithAuth(<UnblockRace {...defaultProps} />, {
        user: undefined,
        isInitialised: false,
      });

      expect(screen.getByTestId('auth-gate-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('unblock-board')).not.toBeInTheDocument();
      expect(screen.queryByTestId('race-track')).not.toBeInTheDocument();
    });

    it('shows the sign-in gate and no board once auth resolves without a user', () => {
      renderWithAuth(<UnblockRace {...defaultProps} />, {
        user: undefined,
        isInitialised: true,
      });

      expect(screen.getByTestId('auth-gate')).toBeInTheDocument();
      expect(screen.queryByTestId('unblock-board')).not.toBeInTheDocument();
      expect(screen.queryByTestId('race-track')).not.toBeInTheDocument();
    });

    it('opens the login modal automatically once auth resolves without a user', () => {
      const showLoginModal = jest.fn();
      renderWithAuth(<UnblockRace {...defaultProps} />, {
        user: undefined,
        isInitialised: true,
        showLoginModal,
      });

      expect(showLoginModal).toHaveBeenCalledWith(undefined, 'puzzleEntry');
    });

    it('renders the board once a user is confirmed', () => {
      renderWithAuth(<UnblockRace {...defaultProps} />, {
        user: { sub: 'user-123' },
        isInitialised: true,
      });

      expect(screen.queryByTestId('auth-gate')).not.toBeInTheDocument();
      expect(screen.getByTestId('unblock-board')).toBeInTheDocument();
    });
  });
});
