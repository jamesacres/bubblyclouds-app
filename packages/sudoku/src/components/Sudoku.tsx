'use client';
import { Puzzle, PuzzleRowOrColumn } from '../types/puzzle';
import { calculateBoxId, calculateCellId } from '../helpers/calculateId';
import { TimerDisplay } from '@bubblyclouds-app/ui/components/TimerDisplay';
import { GameState, GameStateMetadata } from '../types/state';
import { puzzleToPuzzleText } from '../helpers/puzzleTextToPuzzle';
import SudokuBox from '../components/SudokuBox';
import RaceTrack from '@bubblyclouds-app/games/components/RaceTrack';
import { isPuzzleCheated } from '../helpers/cheatDetection';
import { calculateCompletionPercentage } from '../helpers/calculateCompletionPercentage';
import { isInitialCell } from '../helpers/checkAnswer';
import {
  addDailyPuzzleId,
  getDailyPuzzleCount,
} from '../utils/dailyPuzzleCounter';
import { useGameState } from '../hooks/gameState';
import SudokuControls from '../components/SudokuControls';
import { calculateSeconds } from '@bubblyclouds-app/template/helpers/calculateSeconds';
import Sidebar from '@bubblyclouds-app/template/components/Sidebar';
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
import { useSessions } from '@bubblyclouds-app/template/providers/SessionsProvider';
import { AppDownloadModal } from '@bubblyclouds-app/template/components/AppDownloadModal';
import { CelebrationAnimation } from '@bubblyclouds-app/ui/components/CelebrationAnimation';
import { isCapacitor } from '@bubblyclouds-app/template/helpers/capacitor';
import MemoisedSidebarButton from '@bubblyclouds-app/games/components/SidebarButton';
import { useRouter } from 'next/navigation';
import RacingPromptModal from '@bubblyclouds-app/template/components/RacingPromptModal';
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
import { getAllAgentProgress } from '../helpers/agentProgress';
import { DEFAULT_AGENT_CONFIGS } from '../helpers/defaultAgents';
import { DreyfusLevel } from '../types/Agent';
import { difficultyToMultiplier } from '../helpers/techniqueTiming';

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
  const { user } = context || {};
  const { isSubscribed, subscribeModal } = useContext(RevenueCatContext) || {};
  const { sessions } = useSessions<GameState>();

  const difficultyMultiplier = difficultyToMultiplier(metadata.difficulty);

  const [defaultAgentSelection] = useState<string[]>(() => {
    const pickFromLevel = (level: DreyfusLevel) => {
      const pool = DEFAULT_AGENT_CONFIGS.filter((c) => c.skillLevel === level);
      return pool[Math.floor(Math.random() * pool.length)].name;
    };
    return [
      pickFromLevel(DreyfusLevel.Novice),
      pickFromLevel(DreyfusLevel.AdvancedBeginner),
      pickFromLevel(DreyfusLevel.Competent),
      pickFromLevel(DreyfusLevel.Proficient),
      pickFromLevel(DreyfusLevel.Expert),
    ];
  });

  const agentStartTimeMsRef = useRef<number | null>(null);
  const [agents, setAgents] = useState<ReturnType<typeof createLocalAgents>>(
    []
  );
  const [localAgentProgress, setLocalAgentProgress] = useState<
    ReturnType<typeof getAllAgentProgress>
  >([]);

  const onRemoveAgent = useCallback((agentId: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
    setLocalAgentProgress((prev) => prev.filter((p) => p.agentId !== agentId));
  }, []);

  const onLeaveAgentParty = useCallback(() => {
    setAgents([]);
    setLocalAgentProgress([]);
  }, []);

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
    showSidebar,
    setShowSidebar,
    isZoomMode,
    setIsZoomMode,
    isPolling,
    isPaused,
  } = useGameState({
    final,
    initial,
    puzzleId,
    metadata,
    app,
    apiUrl,
  });

  useEffect(() => {
    if (timer && !timer.countdown && agentStartTimeMsRef.current === null) {
      agentStartTimeMsRef.current = Date.now();
    }
    setLocalAgentProgress(
      getAllAgentProgress(agents, agentStartTimeMsRef.current)
    );
  }, [agents, timer]);

  useEffect(() => {
    if (!completed || agentStartTimeMsRef.current === null) return;

    const interval = setInterval(() => {
      const progress = getAllAgentProgress(agents, agentStartTimeMsRef.current);
      setLocalAgentProgress(progress);
      if (progress.every((p) => p.percentage === 100)) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [completed, agents]);

  const friendsOnClick = useCallback(() => {
    setShowSidebar((showSidebar) => !showSidebar);
  }, [setShowSidebar]);
  const raceTrackOnClick = useCallback(
    () => setShowSidebar(true),
    [setShowSidebar]
  );

  // Reference to the grid for the celebration animation and chain overlay
  const gridRef = useRef<HTMLDivElement>(null);

  // State to track if animation should be shown
  const [showAnimation, setShowAnimation] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  // Check if there are other players already racing
  const hasOtherPlayers = useMemo(() => {
    if (!sessionParties || !user?.sub) return false;

    return Object.values(sessionParties).some((party) => {
      if (party?.memberSessions) {
        return Object.keys(party.memberSessions).some(
          (memberId) => memberId !== user.sub
        );
      }
      return false;
    });
  }, [sessionParties, user?.sub]);

  const [hasShownAppDownload, setHasShownAppDownload] = useState(false);
  const [hasDismissedRacingPrompt, setHasDismissedRacingPrompt] =
    useState(false);
  const [hasManuallySelectedMode, setHasManuallySelectedMode] = useState(false);

  const showAppDownload = useMemo(
    () => !isCapacitor() && !hasShownAppDownload,
    [hasShownAppDownload]
  );

  const showRacingPrompt = useMemo(() => {
    const shouldShowRacingPrompt =
      !alreadyCompleted && showRacingPromptProp && !hasOtherPlayers;
    return (
      shouldShowRacingPrompt && !showAppDownload && !hasDismissedRacingPrompt
    );
  }, [
    alreadyCompleted,
    showRacingPromptProp,
    hasOtherPlayers,
    showAppDownload,
    hasDismissedRacingPrompt,
  ]);

  const hasSelectedMode = useMemo(
    () => alreadyCompleted || hasOtherPlayers || hasManuallySelectedMode,
    [alreadyCompleted, hasOtherPlayers, hasManuallySelectedMode]
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

    return hint;
  }, [answer]);

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

  const [pickRivalsView, setPickRivalsView] = useState<
    'mode-select' | 'agent-select'
  >('mode-select');
  const [showPickRivalsModal, setShowPickRivalsModal] = useState(false);

  // Racing prompt handlers
  const handleRaceMode = useCallback(() => {
    setHasManuallySelectedMode(true);
    setShowSidebar(true);
  }, [setShowSidebar]);

  const handlePickRivals = useCallback(() => {
    setPickRivalsView('agent-select');
    setShowPickRivalsModal(true);
    setShowSidebar(false);
  }, [setShowSidebar]);

  const handleSoloMode = useCallback(() => {
    setAgents([]);
    setLocalAgentProgress([]);
    setHasManuallySelectedMode(true);
  }, []);

  const handleAgentMode = useCallback(
    (selectedAgentNames: string[]) => {
      const nameSet = new Set(selectedAgentNames);
      const selectedConfigs = DEFAULT_AGENT_CONFIGS.filter((c) =>
        nameSet.has(c.name)
      );
      const created = createLocalAgents(
        initial,
        final,
        selectedConfigs,
        difficultyMultiplier,
        metadata.difficulty
      );
      setAgents(created);
      setLocalAgentProgress(getAllAgentProgress(created, null));
      setHasManuallySelectedMode(true);
      setShowPickRivalsModal(false);
      setPickRivalsView('mode-select');
    },
    [initial, final, difficultyMultiplier, metadata.difficulty]
  );

  // App download modal handlers
  const handleAppDownloadClose = useCallback(() => {
    setHasShownAppDownload(true);
  }, []);

  const handleContinueWeb = useCallback(() => {
    setHasShownAppDownload(true);
  }, []);

  useEffect(() => {
    if (completed && !alreadyCompleted && !isPuzzleCheated(answerStack)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Legitimate side effect: triggering timed animation on completion
      setShowAnimation(true);

      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [completed, alreadyCompleted, answerStack]);

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
      !hasSelectedMode || showSidebar || showRacingPrompt || showAppDownload;

    setPauseTimer(shouldPause);

    if (showSidebar || showRacingPrompt || showAppDownload) {
      // Stop scroll
      document.body.classList.add('overflow-y-hidden');
    } else {
      // Allow scroll
      document.body.classList.remove('overflow-y-hidden');
    }
  }, [
    hasSelectedMode,
    showSidebar,
    showRacingPrompt,
    showAppDownload,
    setPauseTimer,
  ]);

  // Cleanup: Always restore scrolling when component unmounts
  useEffect(() => {
    return () => {
      document.body.classList.remove('overflow-y-hidden');
    };
  }, []);

  return (
    <div
      className={`${showAdvancedControls ? 'pb-120' : 'pb-90'} landscape:mb-120 lg:pb-0 sm:landscape:pb-[calc(60vh)] lg:landscape:mb-0 lg:landscape:pb-0`}
    >
      {/* App download prompt modal - shows first for web users */}
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

      {/* Racing mode selection modal */}
      <RacingPromptModal
        key={pickRivalsView}
        isOpen={showRacingPrompt || showPickRivalsModal}
        onClose={() => {
          setHasDismissedRacingPrompt(true);
          setShowPickRivalsModal(false);
          setPickRivalsView('mode-select');
        }}
        onRaceMode={handleRaceMode}
        onSoloMode={handleSoloMode}
        onAgentMode={handleAgentMode}
        agentOptions={DEFAULT_AGENT_CONFIGS}
        defaultSelectedAgentNames={defaultAgentSelection}
        initialView={pickRivalsView}
      />

      <Sidebar
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
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
        localAgentProgress={localAgentProgress}
        onRemoveAgent={onRemoveAgent}
        onLeaveAgentParty={onLeaveAgentParty}
        onPickRivals={handlePickRivals}
      />

      {/* Display celebration animation when completed */}
      {completed && (
        <CelebrationAnimation
          isVisible={showAnimation}
          gridRef={gridRef}
          completedGamesCount={completedGamesCount}
          isCapacitor={isCapacitor}
        />
      )}

      <div className="flex flex-col items-center lg:flex-row">
        <div className="container mx-auto px-4 pb-4 lg:pb-0">
          <div className="flex flex-col">
            <div className="mt-auto">
              {/* App Branding Header */}
              <div className="ml-auto mr-auto max-w-xl px-4 pb-1 lg:mr-0">
                <div className="text-right">
                  <span className="bg-theme-primary inline-flex items-center bg-clip-text text-sm text-transparent">
                    {appName}
                  </span>
                </div>
              </div>

              <div className="ml-auto mr-auto flex max-w-xl px-4 pb-1 lg:mr-0">
                <div
                  className="flex-nowrap items-center xl:hidden"
                  role="group"
                  aria-label="Button group"
                >
                  <MemoisedSidebarButton friendsOnClick={friendsOnClick} />
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
                  className={`border-theme-primary dark:border-theme-primary-light landscape:max-w-[calc(100dvh - 400px)] portrait:max-h-[calc(50dvh - 400px)] relative ml-auto mr-auto grid max-h-full max-w-xl grid-cols-3 grid-rows-3 border border-2 bg-zinc-50 lg:mr-0 portrait:max-w-[calc(50dvh)] dark:bg-zinc-900 ${
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

              {/* Race Track Progress */}
              {!showAnimation && (
                <RaceTrack
                  sessionParties={sessionParties}
                  initial={initial}
                  final={final}
                  answer={answer}
                  userId={user?.sub || 'guest'}
                  onClick={raceTrackOnClick}
                  countdown={timer?.countdown}
                  completed={completed}
                  isPolling={isPolling}
                  refreshSessionParties={refreshSessionParties}
                  answerStack={answerStack}
                  calculateCompletionPercentage={calculateCompletionPercentage}
                  isPuzzleCheated={isPuzzleCheated}
                  localAgentProgress={localAgentProgress}
                />
              )}
            </div>
          </div>
        </div>
        {/* Sticky controls for mobile, regular positioning for desktop */}
        <div className="lg:container lg:mx-auto lg:basis-3/5">
          {!completed && (
            <div className="fixed inset-x-0 bottom-0 z-10 lg:relative">
              <SudokuControls
                selectedCell={selectedCell}
                isInputDisabled={
                  !selectedCell || isInitialCell(selectedCell, initial)
                }
                isValidateCellDisabled={
                  !selectedCell ||
                  isInitialCell(selectedCell, initial) ||
                  !selectedAnswer()
                }
                isDeleteDisabled={
                  !selectedCell ||
                  isInitialCell(selectedCell, initial) ||
                  (!selectedAnswer() && !selectedCellHasNotes())
                }
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
                user={user}
                onShowWhere={onShowWhere}
                onRevealEliminations={onRevealEliminations}
                onClearSelection={() => setSelectedCell(null)}
                onHideHint={() => {
                  setCellHighlights(new Map());
                  setChainPath([]);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sudoku;
