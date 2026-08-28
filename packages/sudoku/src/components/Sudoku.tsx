'use client';
import { Puzzle, PuzzleRowOrColumn } from '../types/puzzle';
import { calculateBoxId, calculateCellId } from '../helpers/calculateId';
import { TimerDisplay } from '@bubblyclouds-app/ui/components/TimerDisplay';
import { GameState, GameStateMetadata } from '../types/state';
import { puzzleToPuzzleText } from '../helpers/puzzleTextToPuzzle';
import SudokuBox from '../components/SudokuBox';
import RaceTrack from '@bubblyclouds-app/games/components/RaceTrack';
import { isPuzzleCheated } from '../helpers/cheatDetection';
import { isInitialCell } from '../helpers/checkAnswer';
import {
  addDailyPuzzleId,
  getDailyPuzzleCount,
} from '../utils/dailyPuzzleCounter';
import { useGameState } from '../hooks/gameState';
import SudokuControls from '../components/SudokuControls';
import { calculateSeconds } from '@bubblyclouds-app/template/helpers/calculateSeconds';
import Lobby from '@bubblyclouds-app/template/components/Lobby';
import AuthGate from '@bubblyclouds-app/template/components/AuthGate';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';
import SimpleSudoku from '../components/SimpleSudoku';
import { calculateCompletionPercentageFromState } from '../helpers/calculateCompletionPercentage';
import { ServerState } from '../types/state';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDrag } from '../hooks/useDrag';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { RevenueCatContext } from '@bubblyclouds-app/template/providers/RevenueCatProvider';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';
import { DAILY_LIMITS } from '@bubblyclouds-app/template/config/dailyLimits';
import {
  canUseHint,
  incrementHintCount,
} from '@bubblyclouds-app/template/utils/dailyActionCounter';
import { useSessions } from '@bubblyclouds-app/template/providers/SessionsProvider';
import { AppDownloadModal } from '@bubblyclouds-app/template/components/AppDownloadModal';
import { CelebrationAnimation } from '@bubblyclouds-app/ui/components/CelebrationAnimation';
import RaceCelebrationOverlay from '@bubblyclouds-app/ui/components/RaceCelebrationOverlay';
import { isCapacitor } from '@bubblyclouds-app/template/helpers/capacitor';
import LobbyButton from '@bubblyclouds-app/games/components/LobbyButton';
import { useRouter } from 'next/navigation';
import {
  puzzleToGrid,
  buildCandidates,
  findHint,
  isGridInvalid,
  HintResult,
  ChainNode,
} from 'human-sudoku-solver';
import { CellHighlight } from '../types/CellHighlight';
import ChainOverlay from '../components/ChainOverlay';
import { createLocalAgents } from '../helpers/agentTimeline';
import { getAllAgentProgress } from '@bubblyclouds-app/games/helpers/agentProgress';
import { AgentProgress } from '@bubblyclouds-app/types/agentTypes';
import { DEFAULT_AGENT_CONFIGS } from '../helpers/defaultAgents';
import {
  selectDefaultAgents,
  selectAgentConfigsByName,
} from '@bubblyclouds-app/games/helpers/selectDefaultAgents';
import { difficultyToMultiplier } from '../helpers/techniqueTiming';
import { getDifficultyDisplay } from '@bubblyclouds-app/games/helpers/getDifficultyDisplay';
import { derivePuzzleMetaLabel } from '../helpers/puzzleMetaLabel';
import CountdownOverlay from '@bubblyclouds-app/games/components/CountdownOverlay';
import { useBook } from '../providers/BookProvider';
import { isBookPuzzleIdLocked } from '../helpers/bookLocks';

const buildPristineAgentState = (firstState: ServerState): ServerState => ({
  initial: firstState.initial,
  final: firstState.final,
  answerStack: [],
});

const SimpleStateWrapper = ({ state }: { state: ServerState }) => (
  <SimpleSudoku state={state} />
);

const CompactSimpleStateWrapper = ({ state }: { state: ServerState }) => (
  <SimpleSudoku state={state} compact />
);

const Sudoku = ({
  puzzle: { initial, final, puzzleId, redirectUri, metadata },
  alreadyCompleted,
  showRacingPrompt: showRacingPromptProp = true,
  app,
  appName,
  apiUrl,
  appUrl,
  appStoreUrl,
  googlePlayUrl,
  deepLinkScheme,
  mobileDescription,
  desktopDescription,
  openInAppLabel,
}: {
  puzzle: {
    initial: Puzzle<number>;
    final: Puzzle<number>;
    puzzleId: string;
    redirectUri: string;
    metadata: Partial<GameStateMetadata>;
  };
  alreadyCompleted?: boolean;
  showRacingPrompt?: boolean;
  app: string;
  appName: string;
  apiUrl: string;
  appUrl: string;
  appStoreUrl: string;
  googlePlayUrl: string;
  deepLinkScheme: string;
  mobileDescription: string;
  desktopDescription: string;
  openInAppLabel: string;
}) => {
  const router = useRouter();
  const context = useContext(UserContext);
  const { user, isInitialised, showLoginModal } = context || {};
  const { isSubscribed, subscribeModal } = useContext(RevenueCatContext) || {};
  const { sessions } = useSessions<GameState>();
  const { bookData, fetchBookData } = useBook();

  // A free user deep-linking into a locked book puzzle (the latter half of a
  // difficulty band): seal the board behind a gate so no countdown ever
  // starts and no input is accepted. An already-completed puzzle stays
  // playable (they earned it) — that half of the check lives here since
  // `completed` (session-in-progress state) isn't known until useGameState
  // runs below; useGameState ANDs it back in via isBoardGatedIgnoringCompleted
  // to block keyboard input on a locked puzzle too.
  //
  // Whether a given puzzle is locked can't be known until bookData has
  // loaded (fetched async below), so isPendingLockCheck holds the puzzle in
  // the same disabled/timer-paused state as a confirmed lock for that
  // window.
  const isBookPuzzle = !!metadata.sudokuBookPuzzleId;
  const isPendingLockCheckIgnoringCompleted =
    !isSubscribed && !alreadyCompleted && isBookPuzzle && !bookData;
  const isLockedBookPuzzleIgnoringCompleted =
    !isSubscribed &&
    !alreadyCompleted &&
    !!metadata.sudokuBookPuzzleId &&
    isBookPuzzleIdLocked(metadata.sudokuBookPuzzleId, bookData?.puzzles || []);
  const isBoardGatedIgnoringCompleted =
    isPendingLockCheckIgnoringCompleted || isLockedBookPuzzleIgnoringCompleted;

  const difficultyMultiplier = difficultyToMultiplier(metadata.difficulty);

  const [defaultAgentSelection] = useState<string[]>(() =>
    selectDefaultAgents(DEFAULT_AGENT_CONFIGS)
  );

  const shouldAutoOpen = !alreadyCompleted && showRacingPromptProp;

  const agentStartTimeMsRef = useRef<number | null>(null);
  const [agents, setAgents] = useState<ReturnType<typeof createLocalAgents>>(
    () => {
      if (!shouldAutoOpen) return [];
      const selectedConfigs = selectAgentConfigsByName(
        DEFAULT_AGENT_CONFIGS,
        defaultAgentSelection
      );
      return createLocalAgents(
        initial,
        final,
        selectedConfigs,
        difficultyMultiplier,
        metadata.difficulty
      );
    }
  );
  const [localAgentProgress, setLocalAgentProgress] = useState<
    AgentProgress<ServerState>[]
  >(() =>
    shouldAutoOpen
      ? getAllAgentProgress(
          agents,
          null,
          buildPristineAgentState,
          calculateCompletionPercentageFromState
        )
      : []
  );

  const [hasShownAppDownload, setHasShownAppDownload] = useState(false);
  const [hasManuallySelectedMode, setHasManuallySelectedMode] = useState(
    () => shouldAutoOpen
  );

  const [showAnimation, setShowAnimation] = useState(false);
  const onComplete = useCallback(
    (completedAnswerStack: Puzzle[]) => {
      if (alreadyCompleted || isPuzzleCheated(completedAnswerStack)) return;
      setShowAnimation(true);
      const timerId = setTimeout(() => setShowAnimation(false), 10000);
      return () => clearTimeout(timerId);
    },
    [alreadyCompleted]
  );

  const {
    answer,
    answerStack,
    selectedCell,
    setIsNotesMode,
    isNotesMode,
    undo,
    redo,
    selectNumber,
    setSelectedCell,
    selectedAnswer,
    selectedCellHasNotes,
    isUndoDisabled,
    isRedoDisabled,
    validation,
    validateCell,
    validateGrid,
    timer,
    reset,
    reveal,
    completed,
    setPauseTimer,
    setTimerNewSession,
    refreshSessionParties,
    sessionParties,
    showLobby,
    setShowLobby,
    isZoomMode,
    setIsZoomMode,
    isPolling,
    isPaused,
    setMode,
    setAgentNames,
  } = useGameState({
    final,
    initial,
    puzzleId,
    metadata,
    app,
    apiUrl,
    initialMode: shouldAutoOpen ? 'ai' : undefined,
    initialAgentNames: shouldAutoOpen
      ? defaultAgentSelection.join(',')
      : undefined,
    initialShowLobby: shouldAutoOpen,
    onComplete,
    isBoardGatedIgnoringCompleted,
  });

  const onRemoveAgent = useCallback(
    (agentId: string) => {
      setAgents((prev) => {
        const next = prev.filter((a) => a.id !== agentId);
        setAgentNames(next.map((a) => a.name).join(',') || undefined);
        return next;
      });
      setLocalAgentProgress((prev) =>
        prev.filter((p) => p.agentId !== agentId)
      );
    },
    [setAgentNames]
  );

  useEffect(() => {
    if (timer && !timer.countdown && agentStartTimeMsRef.current === null) {
      agentStartTimeMsRef.current = Date.now();
    }
    const next = getAllAgentProgress(
      agents,
      agentStartTimeMsRef.current,
      buildPristineAgentState,
      calculateCompletionPercentageFromState
    );
    setLocalAgentProgress((prev) =>
      prev.length === next.length &&
      prev.every((p, i) => p.percentage === next[i].percentage)
        ? prev
        : next
    );
  }, [agents, timer]);

  useEffect(() => {
    if (!completed || agentStartTimeMsRef.current === null) return;

    const interval = setInterval(() => {
      const next = getAllAgentProgress(
        agents,
        agentStartTimeMsRef.current,
        buildPristineAgentState,
        calculateCompletionPercentageFromState
      );
      setLocalAgentProgress((prev) => {
        if (
          prev.length === next.length &&
          prev.every((p, i) => p.percentage === next[i].percentage)
        )
          return prev;
        if (next.every((p) => p.percentage === 100)) clearInterval(interval);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [completed, agents]);

  const friendsOnClick = useCallback(() => {
    setShowLobby((prev) => !prev);
  }, [setShowLobby]);
  const raceTrackOnClick = useCallback(
    () => setShowLobby(true),
    [setShowLobby]
  );

  const [raceStarted, setRaceStarted] = useState(false);

  // The book lock gate only concerns book puzzles; nothing else fetches
  // bookData, so a deep link straight to a puzzle URL would otherwise leave
  // it null forever.
  useEffect(() => {
    if (isBookPuzzle) {
      fetchBookData();
    }
  }, [isBookPuzzle, fetchBookData]);

  // completed (session-in-progress state, only known post-useGameState) also
  // lifts the gate, same as alreadyCompleted above.
  const isLockedBookPuzzle = !completed && isLockedBookPuzzleIgnoringCompleted;
  const isBoardGated = !completed && isBoardGatedIgnoringCompleted;

  const handleBackToBook = useCallback(() => {
    router.replace('/book');
  }, [router]);

  // A locked deep-link opens the same Plus modal the book grid uses for a
  // locked puzzle (SubscriptionContext.COLLECTION_LOCKED already carries
  // that messaging), so there's one place that explains Plus. Backing out
  // of the modal returns to the book rather than leaving the player
  // stranded on a sealed board.
  //
  // hasOpenedLockModalRef guards against re-opening: subscribeModal is a new
  // object every RevenueCatProvider render (including the one its own
  // showModalIfRequired triggers), so depending on it directly would re-run
  // this effect and reopen the modal in an infinite loop.
  const hasOpenedLockModalRef = useRef(false);
  useEffect(() => {
    if (isLockedBookPuzzle && !hasOpenedLockModalRef.current) {
      hasOpenedLockModalRef.current = true;
      subscribeModal?.showModalIfRequired(
        () => {},
        handleBackToBook,
        SubscriptionContext.COLLECTION_LOCKED
      );
    }
  }, [isLockedBookPuzzle, subscribeModal, handleBackToBook]);

  const handleStartRace = useCallback(() => {
    if (isBoardGated) {
      setHasManuallySelectedMode(true);
      return;
    }
    if (!raceStarted) setTimerNewSession();
    setRaceStarted(true);
    setHasManuallySelectedMode(true);
  }, [setTimerNewSession, raceStarted, isBoardGated]);

  const handleInviteFriends = useCallback(() => {
    setShowLobby(true);
  }, [setShowLobby]);

  // Reference to the grid for the celebration animation and chain overlay
  const gridRef = useRef<HTMLDivElement>(null);

  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  const showAppDownload = useMemo(
    () => !isCapacitor() && !hasShownAppDownload,
    [hasShownAppDownload]
  );

  const hasSelectedMode = useMemo(
    () => alreadyCompleted || hasManuallySelectedMode,
    [alreadyCompleted, hasManuallySelectedMode]
  );

  // Calculate completed games count for rating prompt
  const completedGamesCount = useMemo(() => {
    if (!sessions) return 0;
    return sessions.filter((session) => session.state.completed).length;
  }, [sessions]);

  const copyGrid = useCallback(() => {
    // Copy to clipboard
    navigator.clipboard
      .writeText(puzzleToPuzzleText(answer).replaceAll('.', '0'))
      .catch((err) => {
        console.error('Failed to copy grid:', err);
      });
  }, [answer]);

  const hintEliminationsRef = useRef<Map<number, Set<number>>>(new Map());
  const hintCandidatesRef = useRef<number[][]>([]);

  const getHint = useCallback(() => {
    const grid = puzzleToGrid(answer);
    if (isGridInvalid(grid)) return 'invalid' as const;

    const candidates = buildCandidates(grid);

    for (const [cell, digits] of hintEliminationsRef.current) {
      for (const digit of digits) {
        candidates[cell].delete(digit);
      }
    }

    hintCandidatesRef.current = candidates.map((s) => Array.from(s));

    const hint = findHint(grid, candidates);

    if (hint) {
      for (const { cell, digit } of hint.eliminations) {
        const existing = hintEliminationsRef.current.get(cell) ?? new Set();
        existing.add(digit);
        hintEliminationsRef.current.set(cell, existing);
      }
    }

    // Count the hint against the daily allowance only for non-subscribers
    if (!isSubscribed) {
      incrementHintCount();
    }

    return hint;
  }, [answer, isSubscribed]);

  // 2 free hints/day, then Plus — gated ahead of getHint so a blocked
  // request never opens the chat UI with a hint that was never computed.
  const canRequestHint = useCallback(() => {
    if (isSubscribed || canUseHint()) {
      return true;
    }
    subscribeModal?.showModalIfRequired(
      () => {},
      () => {},
      SubscriptionContext.HINT
    );
    return false;
  }, [isSubscribed, subscribeModal]);

  const [cellHighlights, setCellHighlights] = useState<
    Map<string, CellHighlight>
  >(new Map());
  const [chainPath, setChainPath] = useState<ChainNode[]>([]);

  const indexToCellId = useCallback((idx: number) => {
    const row = Math.floor(idx / 9);
    const col = idx % 9;
    const boxX = Math.floor(col / 3);
    const boxY = Math.floor(row / 3);
    const cellX = col % 3;
    const cellY = row % 3;
    return calculateCellId(calculateBoxId(boxX, boxY), cellX, cellY);
  }, []);

  const buildPatternHighlights = useCallback(
    (hint: HintResult): Map<string, CellHighlight> => {
      const highlights = new Map<string, CellHighlight>();
      const cands = hintCandidatesRef.current;

      const withDigits = (
        idx: number,
        role: CellHighlight['role']
      ): CellHighlight => ({
        role,
        visibleDigits: cands[idx] ?? [],
      });

      if (
        hint.technique === 'deathBlossom' &&
        hint.stemCell !== undefined &&
        hint.petalCells
      ) {
        highlights.set(
          indexToCellId(hint.stemCell),
          withDigits(hint.stemCell, 'stem')
        );
        const petalLabels: Array<'petalA' | 'petalB'> = ['petalA', 'petalB'];
        for (let i = 0; i < hint.petalCells.length; i++) {
          const role = petalLabels[i] ?? 'pattern';
          for (const c of hint.petalCells[i]) {
            highlights.set(indexToCellId(c), withDigits(c, role));
          }
        }
      } else if (
        hint.technique === 'alsXZ' &&
        hint.als1Cells &&
        hint.als2Cells
      ) {
        for (const c of hint.als1Cells) {
          highlights.set(indexToCellId(c), withDigits(c, 'petalA'));
        }
        for (const c of hint.als2Cells) {
          highlights.set(indexToCellId(c), withDigits(c, 'petalB'));
        }
      } else if (hint.chainPath && hint.chainPath.length > 0) {
        for (const node of hint.chainPath) {
          const cellId = indexToCellId(node.cell);
          if (!highlights.has(cellId)) {
            highlights.set(
              cellId,
              withDigits(node.cell, node.isOn ? 'chainOn' : 'chainOff')
            );
          }
        }
      } else {
        for (const c of hint.patternCells) {
          const cellId = indexToCellId(c);
          if (!highlights.has(cellId)) {
            highlights.set(cellId, withDigits(c, 'pattern'));
          }
        }
      }

      return highlights;
    },
    [indexToCellId]
  );

  const onShowWhere = useCallback(
    (hint: HintResult) => {
      setCellHighlights(buildPatternHighlights(hint));
      setChainPath(hint.chainPath ?? []);
    },
    [buildPatternHighlights]
  );

  const onRevealEliminations = useCallback(
    (hint: HintResult) => {
      setCellHighlights((prev) => {
        const next = new Map(prev);
        for (const { cell, digit } of hint.eliminations) {
          const cellId = indexToCellId(cell);
          const existing = next.get(cellId);
          const digits = existing?.eliminatedDigits
            ? [...existing.eliminatedDigits, digit]
            : [digit];
          if (existing) {
            next.set(cellId, { ...existing, eliminatedDigits: digits });
          } else {
            next.set(cellId, { role: 'elimination', eliminatedDigits: digits });
          }
        }
        return next;
      });
    },
    [indexToCellId]
  );

  const handleClearSelection = useCallback(
    () => setSelectedCell(null),
    [setSelectedCell]
  );
  const handleHideHint = useCallback(() => {
    setCellHighlights(new Map());
    setChainPath([]);
  }, []);

  const handleAgentMode = useCallback(
    (selectedAgentNames: string[]) => {
      const selectedConfigs = selectAgentConfigsByName(
        DEFAULT_AGENT_CONFIGS,
        selectedAgentNames
      );
      const created = createLocalAgents(
        initial,
        final,
        selectedConfigs,
        difficultyMultiplier,
        metadata.difficulty
      );
      setAgents(created);
      setLocalAgentProgress(
        getAllAgentProgress(
          created,
          null,
          buildPristineAgentState,
          calculateCompletionPercentageFromState
        )
      );
      setHasManuallySelectedMode(true);
      setMode('ai');
      setAgentNames(selectedAgentNames.join(','));
    },
    [
      initial,
      final,
      difficultyMultiplier,
      metadata.difficulty,
      setMode,
      setAgentNames,
    ]
  );

  // App download modal handlers
  const handleAppDownloadClose = useCallback(() => {
    setHasShownAppDownload(true);
  }, []);

  const handleContinueWeb = useCallback(() => {
    setHasShownAppDownload(true);
  }, []);

  // Add puzzle ID to daily tracking when puzzle is completed
  useEffect(() => {
    if (completed && !alreadyCompleted) {
      addDailyPuzzleId(puzzleId);
    }
  }, [puzzleId, completed, alreadyCompleted]);

  // Handle countdown finishing for subscription modal
  useEffect(() => {
    if (timer?.countdown === 1 && !isSubscribed && !completed && !isPaused) {
      if (getDailyPuzzleCount() >= DAILY_LIMITS.PUZZLE) {
        // Countdown just reached "GO!" - show subscription modal after a brief delay
        setPauseTimer(true);
        subscribeModal?.showModalIfRequired(
          () => {
            // Count down and resume
            setTimerNewSession();
            setPauseTimer(false);
          },
          () => {
            // Navigate to homepage on cancel
            router.replace('/');
          },
          SubscriptionContext.DAILY_PUZZLE_LIMIT
        );
      }
    }
  }, [
    router,
    timer?.countdown,
    isSubscribed,
    subscribeModal,
    setPauseTimer,
    setTimerNewSession,
    completed,
    isPaused,
  ]);

  // Use drag hook for all drag-related functionality
  const { dragOffset, dragStarted, zoomOrigin, handleDragStart } = useDrag({
    isZoomMode,
    selectedCell,
    gridRef,
  });

  // Timer and scroll management
  useEffect(() => {
    const shouldPause =
      !hasSelectedMode || showLobby || showAppDownload || isBoardGated;

    setPauseTimer(shouldPause);

    if (showLobby || showAppDownload) {
      document.body.classList.add('overflow-y-hidden');
      document.documentElement.style.height = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.classList.remove('overflow-y-hidden');
      document.documentElement.style.height = '';
      document.body.style.height = '';
    }
  }, [
    hasSelectedMode,
    showLobby,
    showAppDownload,
    isBoardGated,
    setPauseTimer,
  ]);

  // Cleanup: Always restore scrolling when component unmounts
  useEffect(() => {
    return () => {
      document.body.classList.remove('overflow-y-hidden');
      document.documentElement.style.height = '';
      document.body.style.height = '';
    };
  }, []);

  const puzzleInitialState = useMemo<ServerState>(
    () => ({ answerStack: [], initial, final }),
    [initial, final]
  );

  // The current user's live state for the race track, matching the shape of
  // opponents' synced sessions so one state-based calculation covers both
  const raceTrackState = useMemo<ServerState>(
    () => ({ initial, final, answerStack, completed, metadata }),
    [initial, final, answerStack, completed, metadata]
  );

  const puzzleDifficultyDisplay = useMemo(
    () =>
      metadata.difficulty
        ? getDifficultyDisplay(metadata.difficulty)
        : undefined,
    [metadata.difficulty]
  );
  const puzzleDifficulty = puzzleDifficultyDisplay?.name;
  const puzzleDifficultyBadgeColor = puzzleDifficultyDisplay?.badgeColor;

  const puzzleMetaLabel = useMemo(
    () => derivePuzzleMetaLabel(metadata),
    [metadata]
  );

  const isInputDisabled =
    isBoardGated || !selectedCell || isInitialCell(selectedCell, initial);
  const isValidateCellDisabled =
    isBoardGated ||
    !selectedCell ||
    isInitialCell(selectedCell, initial) ||
    !selectedAnswer();
  const isDeleteDisabled =
    isBoardGated ||
    !selectedCell ||
    isInitialCell(selectedCell, initial) ||
    (!selectedAnswer() && !selectedCellHasNotes());

  const currentAgentNames = useMemo(() => agents.map((a) => a.name), [agents]);

  // Login is required before the puzzle mounts at all: while auth is
  // resolving (isInitialised false) or no user is confirmed, replace the
  // whole Lobby/board subtree with the gate rather than layering it on top,
  // so no server game-state is ever created for a signed-out visitor.
  if (!isInitialised || !user) {
    return (
      <AuthGate
        isInitialised={!!isInitialised}
        onSignInRequired={() =>
          showLoginModal?.(undefined, LoginContext.PUZZLE_ENTRY)
        }
      />
    );
  }

  return (
    <div
      className={`${showAdvancedControls ? 'pb-120' : 'pb-90'} landscape:mb-120 lg:pb-0 sm:landscape:pb-[calc(60vh)] lg:landscape:mb-0 lg:landscape:pb-0`}
    >
      <AppDownloadModal
        isOpen={showAppDownload}
        onClose={handleAppDownloadClose}
        onContinueWeb={handleContinueWeb}
        appName={appName}
        appStoreUrl={appStoreUrl}
        googlePlayUrl={googlePlayUrl}
        deepLinkScheme={deepLinkScheme}
        mobileDescription={mobileDescription}
        desktopDescription={desktopDescription}
        openInAppLabel={openInAppLabel}
      />

      <Lobby
        showLobby={showLobby}
        setShowLobby={setShowLobby}
        puzzleId={puzzleId}
        redirectUri={redirectUri}
        refreshSessionParties={refreshSessionParties}
        sessionParties={sessionParties}
        app={app}
        appName={appName}
        apiUrl={apiUrl}
        appUrl={appUrl}
        SimpleState={SimpleStateWrapper}
        CompactSimpleState={CompactSimpleStateWrapper}
        calculateCompletionPercentageFromState={
          calculateCompletionPercentageFromState
        }
        localAgentProgress={showLobby ? localAgentProgress : undefined}
        onRemoveAgent={onRemoveAgent}
        agentOptions={DEFAULT_AGENT_CONFIGS}
        defaultSelectedAgentNames={currentAgentNames}
        onAgentMode={handleAgentMode}
        puzzleDifficulty={puzzleDifficulty}
        puzzleDifficultyBadgeColor={puzzleDifficultyBadgeColor}
        puzzleMetaLabel={puzzleMetaLabel}
        initialState={puzzleInitialState}
        onStartRace={handleStartRace}
      />

      {raceStarted &&
        !showLobby &&
        timer?.countdown != null &&
        timer.countdown > 0 && <CountdownOverlay countdown={timer.countdown} />}

      {completed && (
        <>
          <CelebrationAnimation
            isVisible={showAnimation}
            gridRef={gridRef}
            completedGamesCount={completedGamesCount}
            isCapacitor={isCapacitor}
          />
          {/* Layer the shared confetti + banner + flash polish on top of the
              exploding numbers. CelebrationAnimation's fireworks/numbers sit at
              z-50/z-[9999]; the overlay's own z-[110] keeps the confetti rain
              in front of the page but behind the exploding numbers so it frames
              them rather than obscuring them. Presentation-only, so the review
              prompt still lives solely in CelebrationAnimation. */}
          <RaceCelebrationOverlay isVisible={showAnimation} title="Solved!" />
        </>
      )}

      <div className="flex flex-col items-center lg:flex-row">
        <div className="container mx-auto px-4 pb-4 lg:pb-0">
          <div className="flex flex-col">
            <div className="mt-auto">
              <div className="ml-auto mr-auto max-w-xl px-4 pb-1 lg:mr-0">
                <div className="text-right">
                  <span className="bg-theme-primary inline-flex items-center bg-clip-text text-sm text-transparent">
                    {appName}
                  </span>
                </div>
              </div>

              <div className="ml-auto mr-auto flex max-w-xl px-4 pb-1 lg:mr-0">
                <div
                  className="flex-nowrap items-center"
                  role="group"
                  aria-label="Button group"
                >
                  <LobbyButton friendsOnClick={friendsOnClick} />
                </div>
                <div
                  className={`grow text-right ${timer?.countdown || !!completed ? 'text-2xl' : ''}`}
                >
                  <TimerDisplay
                    seconds={calculateSeconds(timer)}
                    countdown={timer?.countdown}
                    isComplete={!!completed}
                  />
                </div>
              </div>

              <div className="relative overflow-visible lg:overflow-hidden">
                <div
                  ref={gridRef}
                  aria-disabled={isBoardGated}
                  className={`border-theme-primary dark:border-theme-primary-light landscape:max-w-[calc(100dvh - 400px)] portrait:max-h-[calc(50dvh - 400px)] relative ml-auto mr-auto grid max-h-full max-w-xl grid-cols-3 grid-rows-3 border border-2 bg-zinc-50 lg:mr-0 portrait:max-w-[calc(50dvh)] dark:bg-zinc-900 ${
                    isBoardGated ? 'pointer-events-none' : ''
                  } ${
                    dragStarted
                      ? 'cursor-grabbing'
                      : isZoomMode && selectedCell
                        ? 'cursor-grab'
                        : ''
                  } ${dragStarted ? '' : 'transition-all duration-300'}`}
                  style={{
                    transform:
                      isZoomMode && selectedCell
                        ? `scale(1.5) translate(${dragOffset.x}px, ${dragOffset.y}px)`
                        : 'scale(1)',
                    transformOrigin: zoomOrigin,
                    touchAction: isZoomMode ? 'none' : 'auto',
                  }}
                >
                  {Array.from(Array(3)).map((_, y) =>
                    Array.from(Array(3)).map((_, x) => {
                      const boxId = calculateBoxId(x, y);
                      return (
                        <SudokuBox
                          key={boxId}
                          boxId={boxId}
                          selectedCell={selectedCell}
                          setSelectedCell={setSelectedCell}
                          answer={
                            answer[x as PuzzleRowOrColumn][
                              y as PuzzleRowOrColumn
                            ]
                          }
                          selectNumber={selectNumber}
                          validation={
                            validation &&
                            validation[x as PuzzleRowOrColumn][
                              y as PuzzleRowOrColumn
                            ]
                          }
                          initial={
                            initial[x as PuzzleRowOrColumn][
                              y as PuzzleRowOrColumn
                            ]
                          }
                          cellHighlights={cellHighlights}
                          isZoomMode={isZoomMode}
                          onDragStart={handleDragStart}
                        />
                      );
                    })
                  )}
                  <ChainOverlay chainPath={chainPath} gridRef={gridRef} />
                </div>
              </div>

              {!showAnimation && (
                <RaceTrack
                  sessionParties={sessionParties}
                  state={raceTrackState}
                  userId={user.sub}
                  onClick={raceTrackOnClick}
                  isPolling={isPolling}
                  refreshSessionParties={refreshSessionParties}
                  calculateCompletionPercentageFromState={
                    calculateCompletionPercentageFromState
                  }
                  isPuzzleCheated={isPuzzleCheated}
                  localAgentProgress={localAgentProgress}
                  onInviteFriends={handleInviteFriends}
                  rateApp={{ appName, appStoreUrl, googlePlayUrl }}
                />
              )}
            </div>
          </div>
        </div>
        <div className="lg:container lg:mx-auto lg:basis-3/5">
          {!completed && (
            <div className="fixed inset-x-0 bottom-0 z-10 lg:relative">
              <SudokuControls
                disabled={isBoardGated}
                selectedCell={selectedCell}
                isInputDisabled={isInputDisabled}
                isValidateCellDisabled={isValidateCellDisabled}
                isDeleteDisabled={isDeleteDisabled}
                validateCell={validateCell}
                validateGrid={validateGrid}
                isUndoDisabled={isUndoDisabled}
                isRedoDisabled={isRedoDisabled}
                undo={undo}
                redo={redo}
                selectNumber={selectNumber}
                isNotesMode={isNotesMode}
                setIsNotesMode={setIsNotesMode}
                isZoomMode={isZoomMode}
                setIsZoomMode={setIsZoomMode}
                reset={reset}
                reveal={reveal}
                copyGrid={copyGrid}
                onAdvancedToggle={setShowAdvancedControls}
                isSubscribed={isSubscribed}
                getHint={getHint}
                canRequestHint={canRequestHint}
                user={user}
                onShowWhere={onShowWhere}
                onRevealEliminations={onRevealEliminations}
                onClearSelection={handleClearSelection}
                onHideHint={handleHideHint}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sudoku;
