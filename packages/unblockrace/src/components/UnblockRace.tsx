'use client';

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { TimerDisplay } from '@bubblyclouds-app/ui/components/TimerDisplay';
import Lobby from '@bubblyclouds-app/template/components/Lobby';
import { AppDownloadModal } from '@bubblyclouds-app/template/components/AppDownloadModal';
import { CelebrationAnimation } from '@bubblyclouds-app/ui/components/CelebrationAnimation';
import { isCapacitor } from '@bubblyclouds-app/template/helpers/capacitor';
import { calculateSeconds } from '@bubblyclouds-app/template/helpers/calculateSeconds';
import { useSessions } from '@bubblyclouds-app/template/providers/SessionsProvider';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { RevenueCatContext } from '@bubblyclouds-app/template/providers/RevenueCatProvider';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';
import { getDifficultyDisplay } from '@bubblyclouds-app/games/helpers/getDifficultyDisplay';
import { GameState, GameStateMetadata, ServerState } from '../types/state';
import { useGameState } from '../hooks/useGameState';
import { calculateCompletionPercentageFromState } from '../helpers/calculateCompletionPercentage';
import { isPuzzleCheated } from '../helpers/cheatDetection';
import { solvedBoardString } from '../helpers/boardToString';
import { difficultyForMoves } from '../helpers/difficulty';
import { unblockDifficultyDisplay } from '../helpers/difficultyDisplay';
import { buildPuzzleUrl } from '../helpers/buildPuzzleUrl';
import { getDailyNumber } from '../helpers/mockData';
import { addDailyRunId, canStartRun } from '../utils/dailyRunCounter';
import {
  RunStage,
  completedStagesFromStorage,
  firstIncompleteStage,
} from '../helpers/stageResults';
import Board from './Board';
import Controls from './Controls';
import RaceHud from './RaceHud';
import SimpleBoard from './SimpleBoard';
import UnblockRaceTrack from './UnblockRaceTrack';
import StageResultPanel from './StageResultPanel';
import CountdownOverlay from './CountdownOverlay';
import StageTransition from './StageTransition';

// A short beat after solving a non-final stage before the slide-across takes
// over, so the win registers but the car's exit flows straight into the next
// board (SPEC.md §4). Kept small: the carousel replays the exit in lockstep
// with the slide, so a long pause here would just look like a stall.
const SOLVE_TO_SLIDE_DELAY_MS = 240;

const SimpleStateWrapper = ({ state }: { state: ServerState }) => (
  <SimpleBoard state={state} />
);

const CompactSimpleStateWrapper = ({ state }: { state: ServerState }) => (
  <SimpleBoard state={state} compact />
);

const UnblockRace = ({
  run,
  metadata,
  alreadyCompleted,
  showRacingPrompt = true,
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
  run: {
    stages: RunStage[];
    runId?: string;
  };
  metadata: Partial<GameStateMetadata>;
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

  const { stages } = run;
  // The board string doubles as the run id when none was minted (§4: the
  // board string is the identifier)
  const runId = run.runId || stages[0].boardString;

  const [currentStageIndex, setCurrentStageIndex] = useState(() =>
    firstIncompleteStage(app, stages)
  );
  // Ticked off in the stage-preview strip; kept in sync with storage on
  // mount and updated eagerly when a stage completes in this session
  const [completedStages, setCompletedStages] = useState(() =>
    completedStagesFromStorage(app, stages)
  );
  // The seamless slide-across between stages (SPEC.md §4: the car's exit
  // motion continues into the next board sliding in). Non-null only while
  // the carousel is animating; carries the outgoing solved board and the
  // slide direction. 'forward' advances to the next stage, 'back' jumps to
  // an earlier one from the preview strip.
  const [transition, setTransition] = useState<{
    fromBoardString: string;
    direction: 'forward' | 'back';
  } | null>(null);
  const stage = stages[currentStageIndex];
  const initial = stage.boardString;
  const puzzleId = initial;
  const final = useMemo(() => solvedBoardString(initial), [initial]);

  const stageMetadata = useMemo<Partial<GameStateMetadata>>(
    () => ({
      ...metadata,
      difficulty: difficultyForMoves(stage.movesRequired),
      runId,
      stageIndex: String(currentStageIndex),
      movesRequired: String(stage.movesRequired),
    }),
    [metadata, stage.movesRequired, runId, currentStageIndex]
  );

  const [hasShownAppDownload, setHasShownAppDownload] = useState(false);
  const [raceStarted, setRaceStarted] = useState(false);
  const [hasManuallySelectedMode, setHasManuallySelectedMode] = useState(
    () => !alreadyCompleted && showRacingPrompt
  );
  const [showAnimation, setShowAnimation] = useState(false);
  // Set only when a non-final stage is solved live this session (not when a
  // completed stage is restored on a jump-back), so auto-advance never fires
  // for a stage the player deliberately navigated to review.
  const [autoAdvanceArmed, setAutoAdvanceArmed] = useState(false);

  const isFinalStage = currentStageIndex === stages.length - 1;

  const onComplete = useCallback(
    (
      completedAnswerStack: string[],
      completedMovesMade: number,
      completedSeconds: number
    ) => {
      if (alreadyCompleted || isPuzzleCheated(completedAnswerStack)) {
        return;
      }
      setCompletedStages((prev) => {
        const next = new Map(prev);
        next.set(currentStageIndex, {
          seconds: completedSeconds,
          movesMade: completedMovesMade,
          movesRequired: stage.movesRequired,
        });
        return next;
      });
      if (isFinalStage) {
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 10000);
      } else {
        setAutoAdvanceArmed(true);
      }
    },
    [alreadyCompleted, isFinalStage, currentStageIndex, stage.movesRequired]
  );

  const {
    answer,
    answerStack,
    movesMade,
    pushMove,
    undo,
    redo,
    isUndoDisabled,
    isRedoDisabled,
    timer,
    reset,
    completed,
    setPauseTimer,
    setTimerNewSession,
    refreshSessionParties,
    isPolling,
    sessionParties,
    showLobby,
    setShowLobby,
    isPaused,
  } = useGameState({
    final,
    initial,
    puzzleId,
    metadata: stageMetadata,
    app,
    apiUrl,
    initialShowLobby: !alreadyCompleted && showRacingPrompt,
    onComplete,
  });

  // Latest live board, read by the deferred auto-advance without re-creating
  // its timer. Captured as the outgoing (solved) board for the slide so the
  // carousel shows exactly the arrangement the player finished on.
  const answerRef = useRef(answer);
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  const friendsOnClick = useCallback(() => {
    setShowLobby((prev) => !prev);
  }, [setShowLobby]);
  const raceTrackOnClick = useCallback(
    () => setShowLobby(true),
    [setShowLobby]
  );

  const handleStartRace = useCallback(() => {
    if (!raceStarted) {
      setTimerNewSession();
    }
    setRaceStarted(true);
    setHasManuallySelectedMode(true);
  }, [setTimerNewSession, raceStarted]);

  const handleInviteFriends = useCallback(() => {
    setShowLobby(true);
  }, [setShowLobby]);

  // Slide to another stage without unmounting the racing chrome (SPEC.md §6).
  // The board carousel plays first; the destination's timer only starts once
  // the slide (and, when advancing off a win, the car's exit) has finished —
  // that happens in handleTransitionDone. `direction` drives the slide
  // (SPEC.md §4): forward continues the car's exit into the next board.
  const goToStage = useCallback(
    (index: number, direction: 'forward' | 'back') => {
      if (index === currentStageIndex || transition) {
        return;
      }
      setAutoAdvanceArmed(false);
      setTransition({ fromBoardString: answerRef.current, direction });
      setCurrentStageIndex(index);
      setRaceStarted(true);
    },
    [currentStageIndex, transition]
  );

  const advanceStage = useCallback(() => {
    if (currentStageIndex < stages.length - 1) {
      goToStage(currentStageIndex + 1, 'forward');
    }
  }, [currentStageIndex, stages.length, goToStage]);

  // After solving a non-final stage live, kick off the seamless slide once
  // the win has registered (SPEC.md §4: "auto slide ... after we've seen the
  // animations"). The car's exit then continues across into the next board.
  useEffect(() => {
    if (!autoAdvanceArmed || transition) {
      return;
    }
    const timeout = setTimeout(() => {
      setAutoAdvanceArmed(false);
      advanceStage();
    }, SOLVE_TO_SLIDE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [autoAdvanceArmed, transition, advanceStage]);

  // The slide is done: the destination stage is now centered. Start its timer
  // fresh so the countdown (3-2-1) only appears after the animation, then the
  // race clock begins (fixes the "timer doesn't start on the next puzzle"
  // bug — a stopped/absent timer for the new puzzleId is reset here). A stage
  // that's already completed (jumping back to review it) keeps its finished
  // clock; the restore effect will settle it either way.
  const handleTransitionDone = useCallback(() => {
    setTransition(null);
    if (!completedStages.has(currentStageIndex)) {
      setTimerNewSession(null);
    }
  }, [completedStages, currentStageIndex, setTimerNewSession]);

  // Reference to the board for the celebration animation
  const gridRef = useRef<HTMLDivElement>(null);

  const showAppDownload = useMemo(
    () => !isCapacitor() && !hasShownAppDownload,
    [hasShownAppDownload]
  );

  const handleAppDownloadClose = useCallback(() => {
    setHasShownAppDownload(true);
  }, []);

  const handleContinueWeb = useCallback(() => {
    setHasShownAppDownload(true);
  }, []);

  const hasSelectedMode = useMemo(
    () => alreadyCompleted || hasManuallySelectedMode,
    [alreadyCompleted, hasManuallySelectedMode]
  );

  // Calculate completed games count for rating prompt
  const completedGamesCount = useMemo(() => {
    if (!sessions) {
      return 0;
    }
    return sessions.filter((session) => session.state.completed).length;
  }, [sessions]);

  // Daily run limit (SPEC.md §6): free runs per day, then gated behind Plus.
  // canStartRun is id-based so a run resumed after a refresh never blocks or
  // double-counts.
  useEffect(() => {
    if (
      timer?.countdown === 1 &&
      !isSubscribed &&
      !completed &&
      !isPaused &&
      !alreadyCompleted &&
      currentStageIndex === 0
    ) {
      if (canStartRun(runId)) {
        addDailyRunId(runId);
      } else {
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
    alreadyCompleted,
    currentStageIndex,
    runId,
  ]);

  // Timer and scroll management
  useEffect(() => {
    // Freeze the clock during the stage slide so the next stage's time only
    // starts on its post-slide countdown, not while the board is animating.
    const shouldPause =
      !hasSelectedMode || showLobby || showAppDownload || !!transition;

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
  }, [hasSelectedMode, showLobby, showAppDownload, transition, setPauseTimer]);

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

  const puzzleDifficultyDisplay = useMemo(
    () => getDifficultyDisplay(difficultyForMoves(stage.movesRequired)),
    [stage.movesRequired]
  );

  const redirectUri = useMemo(
    () =>
      buildPuzzleUrl(
        stages.map((s) => s.boardString),
        stages.map((s) => s.movesRequired),
        { runId }
      ),
    [stages, runId]
  );

  // The current user's live state for the race track, with the live move
  // count in metadata — the same shape opponents' synced sessions have, so
  // one state-based calculation covers both.
  const raceTrackState = useMemo<ServerState>(
    () => ({
      initial,
      final,
      answerStack,
      completed,
      metadata: { ...stageMetadata, movesMade: String(movesMade) },
    }),
    [initial, final, answerStack, completed, stageMetadata, movesMade]
  );

  // Opponent comparison for the summary card (SPEC.md §7): fastest completed
  // friend session for this stage, omitted when no friend finished yet
  const opponentDeltaSeconds = useMemo(() => {
    if (!completed) {
      return undefined;
    }
    let fastestFriendSeconds: number | undefined;
    for (const party of Object.values(sessionParties)) {
      for (const [memberUserId, session] of Object.entries(
        party?.memberSessions || {}
      )) {
        const friendSeconds = session?.state.completed?.seconds;
        if (
          memberUserId !== user?.sub &&
          friendSeconds !== undefined &&
          (fastestFriendSeconds === undefined ||
            friendSeconds < fastestFriendSeconds)
        ) {
          fastestFriendSeconds = friendSeconds;
        }
      }
    }
    if (fastestFriendSeconds === undefined) {
      return undefined;
    }
    return fastestFriendSeconds - completed.seconds;
  }, [completed, sessionParties, user?.sub]);

  const isDailyRun = runId.startsWith('oftheday-');

  const stageDifficulty = unblockDifficultyDisplay(
    difficultyForMoves(stage.movesRequired)
  );

  const completedStageIndexes = useMemo(
    () => new Set(completedStages.keys()),
    [completedStages]
  );

  return (
    <div className="relative isolate pb-32 lg:pb-0">
      {/* Ambient neon backdrop, matching the marketing page's blob
          treatment so the game screen shares the brand atmosphere, plus
          slow-drifting speed lines so the screen reads "race" even at rest */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <style>{`
          @keyframes unblock-speed-line {
            from { transform: translateX(-110%); }
            to { transform: translateX(360%); }
          }
          @media (prefers-reduced-motion: reduce) {
            .unblock-speed-line { animation: none !important; opacity: 0 !important; }
          }
        `}</style>
        <div className="bg-theme-primary absolute -top-24 right-[-10%] h-80 w-80 rounded-full opacity-[0.11] blur-3xl dark:opacity-[0.2]" />
        <div className="absolute left-[-12%] top-1/3 h-72 w-72 rounded-full bg-fuchsia-500 opacity-[0.08] blur-3xl dark:opacity-[0.15]" />
        <div className="absolute bottom-0 right-[10%] h-64 w-64 rounded-full bg-cyan-500 opacity-[0.08] blur-3xl dark:opacity-[0.15]" />
        {[
          { top: '18%', duration: 7, delay: 0, color: 'var(--theme-primary)' },
          { top: '46%', duration: 10, delay: 2.5, color: '#d946ef' },
          { top: '74%', duration: 8.5, delay: 5, color: '#06b6d4' },
        ].map((line) => (
          <div
            key={line.top}
            className="unblock-speed-line absolute h-px w-1/3 opacity-25 dark:opacity-35"
            style={{
              top: line.top,
              left: 0,
              background: `linear-gradient(90deg, transparent, ${line.color}, transparent)`,
              filter: 'blur(0.5px)',
              animation: `unblock-speed-line ${line.duration}s linear ${line.delay}s infinite`,
            }}
          />
        ))}
      </div>

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
        puzzleDifficulty={puzzleDifficultyDisplay.name}
        puzzleDifficultyBadgeColor={puzzleDifficultyDisplay.badgeColor}
        puzzleMetaLabel={
          stages.length > 1
            ? `Stage ${currentStageIndex + 1} of ${stages.length}`
            : undefined
        }
        initialState={puzzleInitialState}
        onStartRace={handleStartRace}
      />

      {raceStarted &&
        !showLobby &&
        !transition &&
        timer?.countdown != null &&
        timer.countdown > 0 && <CountdownOverlay countdown={timer.countdown} />}

      {completed && (
        <CelebrationAnimation
          isVisible={showAnimation}
          gridRef={gridRef}
          completedGamesCount={completedGamesCount}
          isCapacitor={isCapacitor}
        />
      )}

      {/* Centered, board-width game column. Keeping the whole column at
          max-w-xl means every inner block's `lg:mr-0` (a Sudoku-Race carry
          over that hugs the right edge) has no extra space to hug into, so
          the board, race track, timer and slide all stay centred on desktop
          instead of pinned right. */}
      <div className="flex flex-col items-center">
        <div className="mx-auto w-full max-w-xl px-4 pb-4 lg:pb-0">
          <div className="flex flex-col">
            <div className="mt-auto">
              <RaceHud
                onOpponentsClick={friendsOnClick}
                stageCount={stages.length}
                currentStageIndex={currentStageIndex}
                completedStageIndexes={completedStageIndexes}
                difficulty={stageDifficulty}
                timer={
                  <div
                    className={
                      timer?.countdown || !!completed ? 'text-2xl' : ''
                    }
                  >
                    <TimerDisplay
                      seconds={calculateSeconds(timer)}
                      countdown={timer?.countdown}
                      isComplete={!!completed}
                    />
                  </div>
                }
              />

              <Controls
                undo={undo}
                redo={redo}
                reset={reset}
                isUndoDisabled={!!completed || isUndoDisabled}
                isRedoDisabled={!!completed || isRedoDisabled}
                isDisabled={!!completed}
                movesMade={movesMade}
                movesRequired={stage.movesRequired}
              />

              <div ref={gridRef}>
                {transition ? (
                  <StageTransition
                    fromBoardString={transition.fromBoardString}
                    direction={transition.direction}
                    onDone={handleTransitionDone}
                  >
                    <Board
                      key={puzzleId}
                      boardString={answer}
                      onMove={pushMove}
                      isDisabled
                    />
                  </StageTransition>
                ) : (
                  <Board
                    key={puzzleId}
                    boardString={answer}
                    onMove={pushMove}
                    isDisabled={!!completed || showLobby}
                  />
                )}
              </div>

              {!showAnimation && (
                <UnblockRaceTrack
                  sessionParties={sessionParties}
                  state={raceTrackState}
                  userId={user?.sub || 'guest'}
                  onClick={raceTrackOnClick}
                  isPolling={isPolling}
                  refreshSessionParties={refreshSessionParties}
                  onInviteFriends={handleInviteFriends}
                />
              )}

              {/* Inline stats (SPEC.md §7): per-stage times/moves for the
                  whole run in one view — no modal — plus the run total once
                  every stage is done. */}
              {stages.length > 1 && (
                <StageResultPanel
                  results={completedStages}
                  stages={stages}
                  currentStageIndex={currentStageIndex}
                  goToStage={goToStage}
                  isTransitioning={!!transition}
                  opponentDeltaSeconds={opponentDeltaSeconds}
                  runComplete={isFinalStage && !!completed}
                  dailyNumber={isDailyRun ? getDailyNumber() : undefined}
                  collectionPuzzleLabel={
                    metadata.unblockCollectionPuzzleId
                      ? `Collection puzzle ${metadata.unblockCollectionPuzzleId.split('-').pop()}`
                      : undefined
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnblockRace;
