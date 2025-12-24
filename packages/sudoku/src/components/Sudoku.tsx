'use client';
import { Puzzle, PuzzleRowOrColumn } from '../types/puzzle';
import { calculateBoxId } from '../helpers/calculateId';
import { TimerDisplay } from '@sudoku-web/ui/components/TimerDisplay';
import { GameState, GameStateMetadata } from '../types/state';
import { puzzleToPuzzleText } from '../helpers/puzzleTextToPuzzle';
import SudokuBox from '../components/SudokuBox';
import RaceTrack from '@sudoku-web/games/components/RaceTrack';
import { isPuzzleCheated } from '../helpers/cheatDetection';
import { calculateCompletionPercentage } from '../helpers/calculateCompletionPercentage';
import { isInitialCell } from '../helpers/checkAnswer';
import {
  addDailyPuzzleId,
  getDailyPuzzleCount,
} from '../utils/dailyPuzzleCounter';
import { useGameState } from '../hooks/gameState';
import SudokuControls from '../components/SudokuControls';
import { calculateSeconds } from '@sudoku-web/template/helpers/calculateSeconds';
import Sidebar from '@sudoku-web/template/components/Sidebar';
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
import {
  UserContext,
  UserContextInterface,
} from '@sudoku-web/auth/providers/AuthProvider';
import { RevenueCatContext } from '@sudoku-web/template/providers/RevenueCatProvider';
import { SubscriptionContext } from '@sudoku-web/types/subscriptionContext';
import { DAILY_LIMITS } from '@sudoku-web/template/config/dailyLimits';
import { useSessions } from '@sudoku-web/template/providers/SessionsProvider';
import { AppDownloadModal } from '@sudoku-web/template/components/AppDownloadModal';
import { CelebrationAnimation } from '@sudoku-web/ui/components/CelebrationAnimation';
import { isCapacitor } from '@sudoku-web/template/helpers/capacitor';
import MemoisedSidebarButton from '@sudoku-web/games/components/SidebarButton';
import { useRouter } from 'next/navigation';
import RacingPromptModal from '@sudoku-web/template/components/RacingPromptModal';

const app = 'sudoku';
const appName = 'Sudoku Race';

const SimpleStateWrapper = ({ state }: { state: ServerState }) => (
  <SimpleSudoku state={state} />
);

const Sudoku = ({
  puzzle: { initial, final, puzzleId, redirectUri, metadata },
  alreadyCompleted,
  showRacingPrompt: showRacingPromptProp = true,
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
}) => {
  const router = useRouter();
  const context = useContext(UserContext) as UserContextInterface | undefined;
  const { user } = context || {};
  const { isSubscribed, subscribeModal } = useContext(RevenueCatContext) || {};
  const { sessions } = useSessions<GameState>();

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
  } = useGameState({
    final,
    initial,
    puzzleId,
    metadata,
  });
  const friendsOnClick = useCallback(() => {
    setShowSidebar((showSidebar) => !showSidebar);
  }, [setShowSidebar]);
  const raceTrackOnClick = useCallback(
    () => setShowSidebar(true),
    [setShowSidebar]
  );

  // Reference to the grid for the celebration animation
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

  // State for racing prompt modal
  const [showRacingPrompt, setShowRacingPrompt] = useState(false);
  const [hasSelectedMode, setHasSelectedMode] = useState(false);

  // State for app download modal
  const [showAppDownload, setShowAppDownload] = useState(false);
  const [hasShownAppDownload, setHasShownAppDownload] = useState(false);

  // Update racing prompt visibility when conditions change
  useEffect(() => {
    const shouldShowRacingPrompt =
      !alreadyCompleted && showRacingPromptProp && !hasOtherPlayers;

    // Only show racing prompt if app download modal is not showing/hasn't been dismissed yet
    setShowRacingPrompt(shouldShowRacingPrompt && !showAppDownload);
    setHasSelectedMode(alreadyCompleted || hasOtherPlayers);
  }, [
    alreadyCompleted,
    showRacingPromptProp,
    hasOtherPlayers,
    showAppDownload,
  ]);

  // Update app download modal visibility - only for web users who haven't seen it yet
  useEffect(() => {
    const shouldShowAppDownload = !isCapacitor() && !hasShownAppDownload;
    setShowAppDownload(shouldShowAppDownload);
  }, [hasShownAppDownload]);

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

  // Racing prompt handlers
  const handleRaceMode = useCallback(() => {
    setHasSelectedMode(true);
    setShowSidebar(true); // Show friends sidebar immediately
  }, [setShowSidebar]);

  const handleSoloMode = useCallback(() => {
    setHasSelectedMode(true);
  }, []);

  // App download modal handlers
  const handleAppDownloadClose = useCallback(() => {
    setShowAppDownload(false);
    setHasShownAppDownload(true);
    // Racing prompt will show automatically via useEffect if conditions are met
  }, []);

  const handleContinueWeb = useCallback(() => {
    setShowAppDownload(false);
    setHasShownAppDownload(true);
    // Racing prompt will show automatically via useEffect if conditions are met
  }, []);

  // Show animation when the puzzle is completed
  useEffect(() => {
    if (completed && !alreadyCompleted && !isPuzzleCheated(answerStack)) {
      setShowAnimation(true);

      // Reset animation after it completes - extended to 10 seconds to match the animation duration
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
    if (timer?.countdown === 1 && !isSubscribed && !completed) {
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
      className={`${showAdvancedControls ? 'pb-120' : 'pb-90'} lg:pb-0 landscape:mb-120 sm:landscape:pb-[calc(60vh)] lg:landscape:mb-0 lg:landscape:pb-0`}
    >
      {/* App download prompt modal - shows first for web users */}
      <AppDownloadModal
        isOpen={showAppDownload}
        onClose={handleAppDownloadClose}
        onContinueWeb={handleContinueWeb}
        appName="Sudoku Race"
        appStoreUrl="https://apps.apple.com/app/sudoku-race/id6517357180"
        googlePlayUrl="https://play.google.com/store/apps/details?id=com.bubblyclouds.sudoku"
        deepLinkScheme="com.bubblyclouds.sudoku"
        mobileDescription="Get the best racing experience with our Sudoku Race app!"
        desktopDescription="Download Sudoku Race"
        openInAppLabel="Open Puzzle"
      />

      {/* Racing mode selection modal */}
      <RacingPromptModal
        isOpen={showRacingPrompt}
        onClose={() => setShowRacingPrompt(false)}
        onRaceMode={handleRaceMode}
        onSoloMode={handleSoloMode}
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
        SimpleState={SimpleStateWrapper}
        calculateCompletionPercentageFromState={
          calculateCompletionPercentageFromState
        }
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
              <div className="mr-auto ml-auto max-w-xl px-4 pb-1 lg:mr-0">
                <div className="text-right">
                  <span className="bg-theme-primary inline-flex items-center bg-clip-text text-sm text-transparent">
                    Sudoku Race
                  </span>
                </div>
              </div>

              <div className="mr-auto ml-auto flex max-w-xl px-4 pb-1 lg:mr-0">
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
                  className={`border-theme-primary dark:border-theme-primary-light landscape:max-w-[calc(100dvh - 400px)] portrait:max-h-[calc(50dvh - 400px)] relative mr-auto ml-auto grid max-h-full max-w-xl grid-cols-3 grid-rows-3 border border-2 bg-zinc-50 lg:mr-0 portrait:max-w-[calc(50dvh)] dark:bg-zinc-900 ${
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
                          isZoomMode={isZoomMode}
                          onDragStart={handleDragStart}
                        />
                      );
                    })
                  )}
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
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sudoku;
