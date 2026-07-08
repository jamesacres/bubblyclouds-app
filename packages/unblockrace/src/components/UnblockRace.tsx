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
import RaceTrack from '@bubblyclouds-app/games/components/RaceTrack';
import LobbyButton from '@bubblyclouds-app/games/components/LobbyButton';
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
import { calculateCompletionPercentage } from '../helpers/calculateCompletionPercentage';
import { calculateCompletionPercentageFromState } from '../helpers/calculateCompletionPercentage';
import { isPuzzleCheated } from '../helpers/cheatDetection';
import { solvedBoardString } from '../helpers/boardToString';
import { difficultyForMoves } from '../helpers/difficulty';
import { buildPuzzleUrl } from '../helpers/buildPuzzleUrl';
import { getDailyNumber } from '../helpers/mockData';
import { addDailyRunId, canStartRun } from '../utils/dailyRunCounter';
import Board from './Board';
import Controls from './Controls';
import SimpleBoard from './SimpleBoard';
import RaceSummaryCard from './RaceSummaryCard';
import CountdownOverlay from './CountdownOverlay';

const SimpleStateWrapper = ({ state }: { state: ServerState }) => (
  <SimpleBoard state={state} />
);

const CompactSimpleStateWrapper = ({ state }: { state: ServerState }) => (
  <SimpleBoard state={state} compact />
);

export interface RunStage {
  boardString: string;
  movesRequired: number;
}

// Restore mid-run progress from the sessions saved per stage (SPEC.md §4):
// resume at the first stage without a completed local session.
const firstIncompleteStage = (app: string, stages: RunStage[]): number => {
  if (typeof window === 'undefined') {
    return 0;
  }
  for (let i = 0; i < stages.length; i++) {
    try {
      const stored = localStorage.getItem(`${app}-${stages[i].boardString}`);
      if (!stored) {
        return i;
      }
      const parsed = JSON.parse(stored) as { state?: GameState };
      if (!parsed.state?.completed) {
        return i;
      }
    } catch {
      return i;
    }
  }
  return stages.length - 1;
};

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
  const [showSummary, setShowSummary] = useState(false);

  const isFinalStage = currentStageIndex === stages.length - 1;

  // Run totals accumulated as stages complete for the run-level summary
  // (SPEC.md §7): moves added when a stage completes, seconds when it
  // advances (the current stage's own time is added at render time below)
  const [runTotals, setRunTotals] = useState({ seconds: 0, moves: 0 });

  const onComplete = useCallback(
    (completedAnswerStack: string[]) => {
      if (alreadyCompleted || isPuzzleCheated(completedAnswerStack)) {
        return;
      }
      setRunTotals((totals) => ({
        ...totals,
        moves: totals.moves + completedAnswerStack.length - 1,
      }));
      if (isFinalStage) {
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 10000);
      }
      // Let the primary piece finish its slide off the grid (§9) before the
      // stage summary appears
      setTimeout(() => setShowSummary(true), 700);
    },
    [alreadyCompleted, isFinalStage]
  );

  const {
    answer,
    answerStack,
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

  const advanceStage = useCallback(() => {
    setShowSummary(false);
    if (completed) {
      setRunTotals((totals) => ({
        ...totals,
        seconds: totals.seconds + completed.seconds,
      }));
    }
    if (currentStageIndex < stages.length - 1) {
      // Swap the board without unmounting the racing chrome (SPEC.md §6) and
      // start the next stage's timer fresh
      setCurrentStageIndex(currentStageIndex + 1);
      setTimerNewSession(null);
      setRaceStarted(true);
    }
  }, [completed, currentStageIndex, stages.length, setTimerNewSession]);

  const closeSummary = useCallback(() => {
    setShowSummary(false);
  }, []);

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
    const shouldPause = !hasSelectedMode || showLobby || showAppDownload;

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
  }, [hasSelectedMode, showLobby, showAppDownload, setPauseTimer]);

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

  const movesMade = answerStack.length - 1;

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

  return (
    <div className="pb-32 lg:pb-0">
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

      {showSummary && completed && (
        <RaceSummaryCard
          dailyNumber={isDailyRun ? getDailyNumber() : undefined}
          collectionPuzzleLabel={
            metadata.unblockCollectionPuzzleId
              ? `Collection puzzle ${metadata.unblockCollectionPuzzleId.split('-').pop()}`
              : undefined
          }
          seconds={completed.seconds}
          movesMade={movesMade}
          movesRequired={stage.movesRequired}
          opponentDeltaSeconds={opponentDeltaSeconds}
          stageIndex={currentStageIndex}
          stageCount={stages.length}
          runTotals={
            isFinalStage
              ? {
                  seconds: runTotals.seconds + completed.seconds,
                  moves: runTotals.moves,
                }
              : undefined
          }
          onNextStage={advanceStage}
          onClose={closeSummary}
        />
      )}

      <div className="flex flex-col items-center lg:flex-row">
        <div className="container mx-auto px-4 pb-4 lg:pb-0">
          <div className="flex flex-col">
            <div className="mt-auto">
              <div className="ml-auto mr-auto max-w-xl px-4 pb-1 lg:mr-0">
                <div className="flex items-center justify-between">
                  {stages.length > 1 ? (
                    <span
                      data-testid="stage-chip"
                      className="bg-theme-primary/10 text-theme-primary dark:text-theme-primary-light inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
                    >
                      Stage {currentStageIndex + 1}/{stages.length}
                    </span>
                  ) : (
                    <span />
                  )}
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

              <div ref={gridRef}>
                <Board
                  boardString={answer}
                  onMove={pushMove}
                  isDisabled={!!completed || showLobby}
                />
              </div>

              {!showAnimation && (
                <RaceTrack
                  sessionParties={sessionParties}
                  initial={initial}
                  final={final}
                  answer={answer}
                  userId={user?.sub || 'guest'}
                  onClick={raceTrackOnClick}
                  completed={completed}
                  isPolling={isPolling}
                  refreshSessionParties={refreshSessionParties}
                  answerStack={answerStack}
                  calculateCompletionPercentage={calculateCompletionPercentage}
                  isPuzzleCheated={isPuzzleCheated}
                  onInviteFriends={handleInviteFriends}
                />
              )}

              <Controls
                movesMade={movesMade}
                movesRequired={stage.movesRequired}
                undo={undo}
                redo={redo}
                reset={reset}
                isUndoDisabled={isUndoDisabled}
                isRedoDisabled={isRedoDisabled}
                isDisabled={!!completed}
              />

              {/* Keep the run advanceable after the summary card is closed */}
              {completed && !showSummary && !isFinalStage && (
                <div className="ml-auto mr-auto max-w-xl px-4 pb-3 lg:mr-0">
                  <button
                    type="button"
                    onClick={advanceStage}
                    className="bg-theme-primary hover:bg-theme-primary-dark w-full cursor-pointer rounded-xl px-4 py-3 text-sm font-bold text-white transition-all duration-200 active:scale-95"
                  >
                    Next puzzle →
                  </button>
                </div>
              )}

              {/* Scrolling right shows what's coming up (SPEC.md §1) */}
              {stages.length > 1 && (
                <div className="ml-auto mr-auto max-w-xl px-4 lg:mr-0">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {stages.map((s, i) => (
                      <div
                        key={s.boardString}
                        data-testid={`stage-preview-${i}`}
                        className={`h-16 w-16 shrink-0 ${
                          i === currentStageIndex
                            ? 'ring-theme-primary rounded-lg ring-2'
                            : i < currentStageIndex
                              ? 'opacity-40'
                              : 'opacity-70'
                        }`}
                      >
                        <SimpleBoard initial={s.boardString} compact />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnblockRace;
