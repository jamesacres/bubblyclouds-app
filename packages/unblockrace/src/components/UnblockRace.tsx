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
import { ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';
import Lobby from '@bubblyclouds-app/template/components/Lobby';
import { AppDownloadModal } from '@bubblyclouds-app/template/components/AppDownloadModal';
import { isCapacitor } from '@bubblyclouds-app/template/helpers/capacitor';
import { calculateSeconds } from '@bubblyclouds-app/template/helpers/calculateSeconds';
import { useSessions } from '@bubblyclouds-app/template/providers/SessionsProvider';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { RevenueCatContext } from '@bubblyclouds-app/template/providers/RevenueCatProvider';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';
import { AgentProgress } from '@bubblyclouds-app/types/agentTypes';
import { getDifficultyDisplay } from '@bubblyclouds-app/games/helpers/getDifficultyDisplay';
import { calculateSessionScore } from '@bubblyclouds-app/games/helpers/scoringUtils';
import { SCORING_CONFIG } from '@bubblyclouds-app/games/helpers/scoringConfig';
import { StarRating } from '@bubblyclouds-app/ui/components/StarRating';
import { CountUp } from '@bubblyclouds-app/ui/components/CountUp';
import { ServerStateResult } from '@bubblyclouds-app/types/serverTypes';
import { useCollection } from '../providers/CollectionProvider';
import { GameState, GameStateMetadata, ServerState } from '../types/state';
import { Move } from '../types/board';
import { AgentConfig, LocalAgent } from '../types/Agent';
import { useGameState } from '../hooks/useGameState';
import { DEFAULT_AGENT_CONFIGS } from '../helpers/defaultAgents';
import { createLocalAgents } from '../helpers/agentTimeline';
import { getAllAgentProgress } from '../helpers/agentProgress';
import { getHint } from '../helpers/hint';
import { loadSolver } from '../services/solver';
import { calculateCompletionPercentageFromState } from '../helpers/calculateCompletionPercentage';
import { isPuzzleCheated } from '../helpers/cheatDetection';
import { solvedBoardString } from '../helpers/boardToString';
import { difficultyForMoves } from '../helpers/difficulty';
import { unblockDifficultyDisplay } from '../helpers/difficultyDisplay';
import { buildPuzzleUrl } from '../helpers/buildPuzzleUrl';
import { getDailyNumber } from '../helpers/mockData';
import { formatSecondsShort } from '../helpers/formatSecondsShort';
import { starRatingForMoves } from '../helpers/starRating';
import { isCollectionPuzzleIdLocked } from '../helpers/collectionLocks';
import {
  canUseHint,
  incrementHintCount,
  getRemainingHints,
} from '@bubblyclouds-app/template/utils/dailyActionCounter';
import {
  NextCollectionPuzzle,
  getNextCollectionPuzzle,
} from '../helpers/nextCollectionPuzzle';
import {
  RunStage,
  StageResult,
  completedStagesFromStorage,
  firstIncompleteStage,
} from '../helpers/stageResults';
import { AgentRunInput, calculateRunResults } from '../helpers/runResults';
import NextPuzzlePanel from './NextPuzzlePanel';
import PuzzleGate from './PuzzleGate';
import ConfirmDialog from './ConfirmDialog';
import HintNudge from './HintNudge';
import Board from './Board';
import Controls from './Controls';
import RaceCelebration, { RACE_CELEBRATION_MS } from './RaceCelebration';
import RaceHud from './RaceHud';
import RaceTimer from './RaceTimer';
import SimpleBoard from './SimpleBoard';
import UnblockRaceTrack from './UnblockRaceTrack';
import StageResultPanel from './StageResultPanel';
import CountdownOverlay from './CountdownOverlay';
import StageTransition from './StageTransition';

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
  const { collectionData } = useCollection();

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
    // The outgoing stage's starting layout, so the frozen board keeps the
    // piece colours the player just saw (colours are pinned per stage).
    fromInitialBoardString: string;
    direction: 'forward' | 'back';
  } | null>(null);
  const stage = stages[currentStageIndex];
  const initial = stage.boardString;
  const puzzleId = initial;
  const runStageIds = useMemo(
    () => stages.map((runStage) => runStage.boardString),
    [stages]
  );
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
  // Per-stage win moment (non-final stages only): the "STAGE N CLEAR" slam
  // over the board. It holds until the player taps its Next-stage button —
  // advancing is the player's call, not a timer's — and only that button or
  // a preview-strip jump dismisses it.
  const [stageClear, setStageClear] = useState<{
    stage: number;
    seconds: number;
    movesMade: number;
    movesRequired: number;
  } | null>(null);

  const isFinalStage = currentStageIndex === stages.length - 1;

  // Local AI rivals (SPEC: agents race per stage). Their timelines are
  // solver-built asynchronously, so the selected configs live in a ref the
  // per-stage rebuild reads, and a build id discards any solve that lands
  // after the stage (or the selection) has moved on.
  const agentStartTimeMsRef = useRef<number | null>(null);
  const agentConfigsRef = useRef<AgentConfig[]>([]);
  const agentBuildIdRef = useRef(0);
  const [agents, setAgents] = useState<LocalAgent[]>([]);
  const [localAgentProgress, setLocalAgentProgress] = useState<
    AgentProgress<ServerState>[]
  >([]);
  // Each agent's recorded result per stage, keyed by agent name (stable
  // across the per-stage timeline rebuilds) — the deterministic side of the
  // run leaderboard.
  const [agentStageResults, setAgentStageResults] = useState<
    Map<string, { emoji: string; stages: Map<number, StageResult> }>
  >(new Map());

  // Agents finish "offscreen" deterministically: the moment a stage ends
  // (solved, or left via the preview strip) their precomputed time and move
  // count for it go on the run leaderboard. Recording is idempotent, so a
  // stage that is both completed and then advanced away from writes the
  // same values twice.
  const recordAgentStageResults = useCallback(
    (stageIndex: number, stageMovesRequired: number) => {
      if (agents.length === 0) {
        return;
      }
      setAgentStageResults((prev) => {
        const next = new Map(prev);
        for (const agent of agents) {
          if (agent.timeline.steps.length === 0) {
            continue;
          }
          const existing = next.get(agent.name);
          const stageMap = new Map(existing?.stages);
          stageMap.set(stageIndex, {
            seconds: Math.round(agent.timeline.totalDuration / 1000),
            movesMade: agent.timeline.steps.length,
            movesRequired: stageMovesRequired,
          });
          next.set(agent.name, { emoji: agent.emoji, stages: stageMap });
        }
        return next;
      });
    },
    [agents]
  );

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
      recordAgentStageResults(currentStageIndex, stage.movesRequired);
      if (isFinalStage) {
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), RACE_CELEBRATION_MS);
      } else {
        setStageClear({
          stage: currentStageIndex + 1,
          seconds: completedSeconds,
          movesMade: completedMovesMade,
          movesRequired: stage.movesRequired,
        });
      }
    },
    [
      alreadyCompleted,
      isFinalStage,
      currentStageIndex,
      stage.movesRequired,
      recordAgentStageResults,
    ]
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
    runStageParties,
    showLobby,
    setShowLobby,
    isPaused,
    setMode,
    setAgentNames,
  } = useGameState({
    final,
    initial,
    puzzleId,
    metadata: stageMetadata,
    app,
    apiUrl,
    initialShowLobby: !alreadyCompleted && showRacingPrompt,
    onComplete,
    runStageIds,
  });

  // Latest live board, read by the deferred auto-advance without re-creating
  // its timer. Captured as the outgoing (solved) board for the slide so the
  // carousel shows exactly the arrangement the player finished on. The hint
  // handler also compares against it to discard results for a stale board.
  const answerRef = useRef(answer);
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  // Bot selection from the lobby's agent sheet: build solver-driven
  // timelines for the picked personas on the current stage. Mode and names
  // persist immediately (they record the player's choice); the karts appear
  // when the solve resolves — unless the stage moved on first.
  const handleAgentMode = useCallback(
    (selectedAgentNames: string[]) => {
      const nameSet = new Set(selectedAgentNames);
      const selectedConfigs = DEFAULT_AGENT_CONFIGS.filter((config) =>
        nameSet.has(config.name)
      );
      agentConfigsRef.current = selectedConfigs;
      setMode('ai');
      setAgentNames(selectedAgentNames.join(','));
      const buildId = ++agentBuildIdRef.current;
      void createLocalAgents(
        initial,
        final,
        selectedConfigs,
        difficultyForMoves(stage.movesRequired)
      ).then((created) => {
        if (agentBuildIdRef.current !== buildId) {
          return;
        }
        setAgents(created);
        setLocalAgentProgress(getAllAgentProgress(created, null));
      });
    },
    [initial, final, stage.movesRequired, setMode, setAgentNames]
  );

  const onRemoveAgent = useCallback(
    (agentId: string) => {
      setAgents((prev) => {
        const next = prev.filter((agent) => agent.id !== agentId);
        agentConfigsRef.current = agentConfigsRef.current.filter((config) =>
          next.some((agent) => agent.name === config.name)
        );
        setAgentNames(next.map((agent) => agent.name).join(',') || undefined);
        return next;
      });
      setLocalAgentProgress((prev) =>
        prev.filter((progress) => progress.agentId !== agentId)
      );
    },
    [setAgentNames]
  );

  // Per-stage rebuild (agents race per stage): when the run moves to another
  // board while agents are active, solve it and rebuild their timelines. The
  // build id also discards a pending lobby-selection build for the old stage.
  useEffect(() => {
    agentStartTimeMsRef.current = null;
    const configs = agentConfigsRef.current;
    if (configs.length === 0) {
      return;
    }
    const buildId = ++agentBuildIdRef.current;
    let cancelled = false;
    void createLocalAgents(
      initial,
      final,
      configs,
      difficultyForMoves(stage.movesRequired)
    ).then((created) => {
      if (cancelled || agentBuildIdRef.current !== buildId) {
        return;
      }
      setAgents(created);
      setLocalAgentProgress(getAllAgentProgress(created, null));
    });
    return () => {
      cancelled = true;
    };
  }, [initial, final, stage.movesRequired]);

  // The agents' race clock starts when the stage's countdown finishes (the
  // per-stage rebuild clears it for the next board).
  useEffect(() => {
    if (timer && !timer.countdown && agentStartTimeMsRef.current === null) {
      agentStartTimeMsRef.current = Date.now();
    }
  }, [timer]);

  // Tick the AI karts once a second — including after the player finishes,
  // until every agent reaches 100%. State updates happen only inside the
  // interval callback (the set-state-in-effect rule), and the interval
  // retires itself once all agents are home.
  useEffect(() => {
    if (agents.length === 0) {
      return;
    }
    const intervalId = setInterval(() => {
      const startTimeMs = agentStartTimeMsRef.current;
      const next = getAllAgentProgress(agents, startTimeMs);
      setLocalAgentProgress((prev) =>
        prev.length === next.length &&
        prev.every(
          (progress, index) => progress.percentage === next[index].percentage
        )
          ? prev
          : next
      );
      if (
        startTimeMs !== null &&
        next.every((progress) => progress.percentage === 100)
      ) {
        clearInterval(intervalId);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [agents]);

  // "Ask for help" (2 free hints/day, then Plus — hinted moves still count
  // toward par): the solver's next best move, drawn on the interactive board.
  // Both hint and notice are stored keyed to the board they were computed for
  // and only shown while the live board still matches — any move, undo, redo
  // or stage change hides them without a clearing effect, and a solve that
  // resolves after the board moved on is stale by construction.
  const [hintState, setHintState] = useState<{
    boardString: string;
    move: Move;
  } | null>(null);
  const [hintNoticeState, setHintNoticeState] = useState<{
    boardString: string;
    message: string;
  } | null>(null);
  const hint =
    hintState && hintState.boardString === answer ? hintState.move : null;
  const hintNotice =
    hintNoticeState && hintNoticeState.boardString === answer
      ? hintNoticeState.message
      : null;

  // Bumped whenever a free hint is spent so the button's "N left" badge
  // recomputes from getRemainingHints() (localStorage is not reactive).
  const [hintTick, setHintTick] = useState(0);

  const handleHint = useCallback(() => {
    const performHint = () => {
      const boardAtRequest = answerRef.current;
      void getHint(boardAtRequest).then((result) => {
        if (result.kind === 'move') {
          setHintState({ boardString: boardAtRequest, move: result.move });
        } else if (result.kind === 'unsolvable') {
          setHintNoticeState({
            boardString: boardAtRequest,
            message:
              'No way through from here — undo or reset to get back on track',
          });
        }
      });
      // Count the hint against the daily allowance only for non-subscribers
      if (!isSubscribed) {
        incrementHintCount();
        setHintTick((tick) => tick + 1);
      }
    };

    if (isSubscribed || canUseHint()) {
      performHint();
    } else if (subscribeModal) {
      subscribeModal.showModalIfRequired(
        performHint,
        () => {},
        SubscriptionContext.HINT
      );
    }
  }, [isSubscribed, subscribeModal]);

  // The badge on the hint button: "2 left" for free users, absent for
  // subscribers (unlimited). Recomputed when a hint is spent (hintTick).
  const hintBadge = useMemo(() => {
    if (isSubscribed) {
      return undefined;
    }
    void hintTick;
    return `${getRemainingHints()} left`;
  }, [isSubscribed, hintTick]);

  // Warm the solver so the first hint answers instantly; a load failure is
  // swallowed here — getHint degrades to 'unavailable' on its own retry.
  useEffect(() => {
    void loadSolver().catch(() => undefined);
  }, []);

  // A free user deep-linking into a locked collection puzzle (the latter half
  // of a difficulty band): seal the board behind a gate so no countdown ever
  // starts. Only collection runs carry an unblockCollectionPuzzleId, and an
  // already-completed puzzle stays playable (they earned it).
  const isLockedCollectionPuzzle =
    !isSubscribed &&
    !completed &&
    !alreadyCompleted &&
    !!metadata.unblockCollectionPuzzleId &&
    isCollectionPuzzleIdLocked(metadata.unblockCollectionPuzzleId);

  const handleUnlockCollection = useCallback(() => {
    subscribeModal?.showModalIfRequired(
      () => {},
      () => {},
      SubscriptionContext.COLLECTION_LOCKED
    );
  }, [subscribeModal]);

  const handleBackToCollection = useCallback(() => {
    router.replace('/collection');
  }, [router]);

  // "Stuck? Try a hint" nudge: a speech bubble over the hint button when the
  // player is either over par or idle ~20s on a live board. It's dismissed on
  // the next board pointer-down and re-arms at most once more per stage, so it
  // never becomes noise. It must never pop while paused, mid-transition, in
  // the lobby, or on a completed/gated board — the idle clock is the game
  // clock's, not the wall clock's.
  const NUDGE_IDLE_MS = 20000;
  const [showNudge, setShowNudge] = useState(false);
  // How many times the nudge may still appear on this stage (arms twice, then
  // stays quiet until the stage changes).
  const nudgeArmedRef = useRef(2);
  // When the answer stack last changed — the idle timer measures from here.
  const lastAnswerChangeRef = useRef<number | null>(null);
  // Set when the player dismisses the bubble by touching the board; blocks it
  // from re-popping (over par is a persistent condition) until the next
  // answer change gives a fresh trigger edge.
  const nudgeDismissedRef = useRef(false);
  // Last answer/stage the nudge state was reset for, so the interval can spot
  // a change and re-arm without a synchronous set-state in a separate effect.
  const nudgeAnswerRef = useRef(answer);
  const nudgePuzzleRef = useRef(puzzleId);

  const isOverPar = movesMade > stage.movesRequired;

  // A single interval owns every nudge state change (the set-state-in-effect
  // rule: local state is only ever mutated inside this async callback). It
  // re-arms on an answer or stage change, hides when the board is not a live
  // playable one, and pops on over-par or ~20s idle up to twice per stage.
  useEffect(() => {
    const evaluate = () => {
      const now = Date.now();
      if (
        nudgePuzzleRef.current !== puzzleId ||
        nudgeAnswerRef.current !== answer
      ) {
        const stageChanged = nudgePuzzleRef.current !== puzzleId;
        nudgePuzzleRef.current = puzzleId;
        nudgeAnswerRef.current = answer;
        lastAnswerChangeRef.current = now;
        nudgeDismissedRef.current = false;
        if (stageChanged) {
          nudgeArmedRef.current = 2;
        }
        setShowNudge(false);
        return;
      }
      if (lastAnswerChangeRef.current === null) {
        lastAnswerChangeRef.current = now;
      }
      const nudgeSuppressed =
        !!completed ||
        !!transition ||
        isPaused ||
        showLobby ||
        isLockedCollectionPuzzle;
      if (nudgeSuppressed) {
        setShowNudge((prev) => (prev ? false : prev));
        return;
      }
      if (nudgeArmedRef.current <= 0 || nudgeDismissedRef.current) {
        return;
      }
      const idle = now - lastAnswerChangeRef.current >= NUDGE_IDLE_MS;
      if (isOverPar || idle) {
        nudgeArmedRef.current -= 1;
        setShowNudge(true);
      }
    };
    evaluate();
    const intervalId = setInterval(evaluate, 1000);
    return () => clearInterval(intervalId);
  }, [
    answer,
    puzzleId,
    completed,
    transition,
    isPaused,
    showLobby,
    isLockedCollectionPuzzle,
    isOverPar,
  ]);

  // The next board pointer-down dismisses the nudge; it re-arms for a later
  // over-par/idle trigger on this stage (up to the twice-per-stage cap) once
  // the player next changes the board.
  const handleBoardPointerDown = useCallback(() => {
    nudgeDismissedRef.current = true;
    setShowNudge(false);
  }, []);

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
      // Leaving a stage settles the agents' deterministic results for it
      recordAgentStageResults(
        currentStageIndex,
        stages[currentStageIndex].movesRequired
      );
      setStageClear(null);
      setTransition({
        fromBoardString: answerRef.current,
        fromInitialBoardString: stages[currentStageIndex].boardString,
        direction,
      });
      setCurrentStageIndex(index);
      setRaceStarted(true);
    },
    [currentStageIndex, transition, stages, recordAgentStageResults]
  );

  // The stage-clear slam's call to action: dismiss the slam and kick off the
  // seamless slide into the next board (SPEC.md §4's carousel, now started by
  // the player instead of a timer).
  const advanceStage = useCallback(() => {
    setStageClear(null);
    if (currentStageIndex < stages.length - 1) {
      goToStage(currentStageIndex + 1, 'forward');
    }
  }, [currentStageIndex, stages.length, goToStage]);

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

  // Top-bar Retry and the destructive Controls Reset both funnel through an
  // "are you sure?" confirm before wiping the stage. The pending action is
  // held here so the same ConfirmDialog serves both, with its own copy.
  const [confirmAction, setConfirmAction] = useState<'retry' | 'reset' | null>(
    null
  );

  // Retry (top bar): throw away this stage's time and moves and start over on
  // a fresh timer session. For an already-completed stage this must also drop
  // its entry in completedStages so the fresh solve overwrites the old result
  // rather than being ignored (onComplete would otherwise re-record it, but
  // the pip/panel would flicker as "done" until then, and a re-solve that ties
  // must still count). reset() clears the stack + completed flag and starts a
  // new timer session, so the re-solve is a genuinely new session that cheat
  // detection reads as legitimate.
  const performRetry = useCallback(() => {
    setStageClear(null);
    setHintState(null);
    setHintNoticeState(null);
    setCompletedStages((prev) => {
      if (!prev.has(currentStageIndex)) {
        return prev;
      }
      const next = new Map(prev);
      next.delete(currentStageIndex);
      return next;
    });
    reset();
  }, [currentStageIndex, reset]);

  const performReset = useCallback(() => {
    setHintState(null);
    setHintNoticeState(null);
    reset();
  }, [reset]);

  const handleConfirmDialogConfirm = useCallback(() => {
    if (confirmAction === 'retry') {
      performRetry();
    } else if (confirmAction === 'reset') {
      performReset();
    }
    setConfirmAction(null);
  }, [confirmAction, performRetry, performReset]);

  const handleRetryClick = useCallback(() => setConfirmAction('retry'), []);
  const handleResetClick = useCallback(() => setConfirmAction('reset'), []);

  const handlePreviousStage = useCallback(() => {
    if (currentStageIndex > 0) {
      goToStage(currentStageIndex - 1, 'back');
    }
  }, [currentStageIndex, goToStage]);

  // Whole-run totals for the finish banner; the celebration fires only once
  // every stage is in the map, so this is the full run by then.
  const runTotals = useMemo(() => {
    let seconds = 0;
    let moves = 0;
    for (const result of completedStages.values()) {
      seconds += result.seconds;
      moves += result.movesMade;
    }
    return { seconds, moves };
  }, [completedStages]);

  // The end-of-puzzle points payoff shares the leaderboard's own scoring: a
  // completed stage is scored as a session the same way it will count once
  // saved (daily/book base + difficulty + speed + daily combo), so the
  // "+N pts" the player sees is the real number their total goes up by.
  // dayPuzzleIndex is how many other puzzles they'd already finished today —
  // the combo multiplier compounds through the day — read from the sessions
  // list already in scope (the current stage's own session is excluded so it
  // isn't double-counted while it settles).
  const dayPuzzleIndex = useMemo(() => {
    if (!sessions) {
      return 0;
    }
    const todayKey = new Date().toISOString().slice(0, 10);
    const currentSessionId = `${app}-${puzzleId}`;
    return sessions.filter((session) => {
      if (session.sessionId === currentSessionId) {
        return false;
      }
      const completedAt = session.state.completed?.at;
      if (!completedAt) {
        return false;
      }
      if (isPuzzleCheated(session.state.answerStack)) {
        return false;
      }
      return new Date(completedAt).toISOString().slice(0, 10) === todayKey;
    }).length;
  }, [sessions, app, puzzleId]);

  // Score one completed stage as calculateSessionScore expects, from the
  // stage's own time/difficulty and the run's metadata (runId/collection id
  // decide daily vs book base). Each stage in a chained run adds its own
  // combo index so a longer run compounds correctly.
  const scoreStage = useCallback(
    (
      seconds: number,
      stageMovesRequired: number,
      stageComboIndex: number
    ): number => {
      const session: ServerStateResult<ServerState> = {
        sessionId: `${app}-${puzzleId}`,
        updatedAt: new Date(),
        state: {
          initial,
          final,
          answerStack: [],
          completed: { at: new Date().toISOString(), seconds },
          metadata: {
            ...metadata,
            runId,
            difficulty: difficultyForMoves(stageMovesRequired),
            movesRequired: String(stageMovesRequired),
          },
        },
      };
      return calculateSessionScore(session, {
        dailyCombo: SCORING_CONFIG.DAILY_COMBO,
        dayPuzzleIndex: stageComboIndex,
      }).total;
    },
    [app, puzzleId, initial, final, metadata, runId]
  );

  // The just-cleared stage's stars (moves vs par) and points, for the
  // stage-clear slam's animated payoff.
  const stageClearStars = stageClear
    ? starRatingForMoves(stageClear.movesMade, stageClear.movesRequired)
    : 0;
  const stageClearPoints = stageClear
    ? scoreStage(stageClear.seconds, stageClear.movesRequired, dayPuzzleIndex)
    : 0;

  // Run-total payoff for the finish celebration: stars grade the whole run's
  // moves against total par, points sum every stage (each with its own
  // through-the-day combo index building on dayPuzzleIndex).
  const runTotalPar = useMemo(
    () => stages.reduce((sum, runStage) => sum + runStage.movesRequired, 0),
    [stages]
  );
  const runStars = useMemo(
    () =>
      runTotals.moves > 0
        ? starRatingForMoves(runTotals.moves, runTotalPar)
        : undefined,
    [runTotals.moves, runTotalPar]
  );
  const runPoints = useMemo(() => {
    if (completedStages.size === 0) {
      return undefined;
    }
    let points = 0;
    let comboIndex = dayPuzzleIndex;
    for (const result of [...completedStages.keys()]
      .sort((a, b) => a - b)
      .map((key) => completedStages.get(key))) {
      if (!result) {
        continue;
      }
      points += scoreStage(result.seconds, result.movesRequired, comboIndex);
      comboIndex += 1;
    }
    return points;
  }, [completedStages, dayPuzzleIndex, scoreStage]);

  const isCollectionPuzzle = !!metadata.unblockCollectionPuzzleId;
  const isDailyRun = runId.startsWith('oftheday-');

  // The continue-to-next-puzzle target: which collection puzzle to steer the
  // player into next once they finish. Shown for a single-stage collection
  // puzzle (continue through the pack) and after the final stage of the daily
  // run (keep the streak going in the collection). Skipped otherwise.
  const nextCollectionPuzzle = useMemo<NextCollectionPuzzle | undefined>(() => {
    if (!collectionData) {
      return undefined;
    }
    if (!isCollectionPuzzle && !isDailyRun) {
      return undefined;
    }
    const completedInitials = new Set(
      (sessions || [])
        .filter(
          (session) =>
            session.state.completed &&
            !isPuzzleCheated(session.state.answerStack)
        )
        .map((session) => session.state.initial)
    );
    return getNextCollectionPuzzle({
      collection: collectionData,
      completedInitials,
      currentInitial: isCollectionPuzzle ? initial : undefined,
      isSubscribed: !!isSubscribed,
    });
  }, [
    collectionData,
    isCollectionPuzzle,
    isDailyRun,
    sessions,
    initial,
    isSubscribed,
  ]);

  const handleContinueToNext = useCallback(() => {
    const next = nextCollectionPuzzle;
    if (!next) {
      return;
    }
    router.push(
      buildPuzzleUrl([next.puzzle.initial], [next.puzzle.movesRequired], {
        unblockCollectionPuzzleId: next.unblockCollectionPuzzleId,
      })
    );
  }, [nextCollectionPuzzle, router]);

  const nextPuzzleProgressLabel = useMemo(() => {
    if (!nextCollectionPuzzle) {
      return '';
    }
    if (isDailyRun && !isCollectionPuzzle) {
      return 'Keep the streak going in the collection';
    }
    const difficulty = nextCollectionPuzzle.puzzle.difficulty;
    const bandPuzzles = (collectionData?.puzzles || []).filter(
      (puzzle) => puzzle.difficulty === difficulty
    );
    const completedInBand = bandPuzzles.filter((puzzle) =>
      (sessions || []).some(
        (session) =>
          session.state.initial === puzzle.initial &&
          session.state.completed &&
          !isPuzzleCheated(session.state.answerStack)
      )
    ).length;
    const bandLabel = unblockDifficultyDisplay(difficulty).label;
    return `${completedInBand} of ${bandPuzzles.length} ${bandLabel} complete`;
  }, [
    nextCollectionPuzzle,
    isDailyRun,
    isCollectionPuzzle,
    collectionData,
    sessions,
  ]);

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

  // Timer and scroll management
  useEffect(() => {
    // Freeze the clock during the stage slide so the next stage's time only
    // starts on its post-slide countdown, not while the board is animating.
    const shouldPause =
      !hasSelectedMode ||
      showLobby ||
      showAppDownload ||
      !!transition ||
      isLockedCollectionPuzzle;

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
    transition,
    isLockedCollectionPuzzle,
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

  const stageDifficulty = unblockDifficultyDisplay(
    difficultyForMoves(stage.movesRequired)
  );

  const completedStageIndexes = useMemo(
    () => new Set(completedStages.keys()),
    [completedStages]
  );

  // The end-of-stage leaderboard's rows (multi-stage runs only): each
  // player's time per stage plus their running total, from the per-stage
  // sessions useGameState refreshes when a stage completes. Memoised so the
  // memoised track only re-renders when the results actually change.
  const agentRunInputs = useMemo(
    () =>
      [...agentStageResults.entries()].map(
        ([name, { emoji, stages: stageMap }]): AgentRunInput => ({
          agentId: `agent-${name}`,
          name,
          emoji,
          stageResults: stageMap,
        })
      ),
    [agentStageResults]
  );

  const runResults = useMemo(
    () =>
      stages.length > 1
        ? calculateRunResults({
            stages,
            runStageParties,
            userId: user?.sub || 'guest',
            ownResults: completedStages,
            agentResults: agentRunInputs,
          })
        : undefined,
    [stages, runStageParties, user?.sub, completedStages, agentRunInputs]
  );

  const currentAgentNames = useMemo(
    () => agents.map((agent) => agent.name),
    [agents]
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
        localAgentProgress={showLobby ? localAgentProgress : undefined}
        onRemoveAgent={onRemoveAgent}
        agentOptions={DEFAULT_AGENT_CONFIGS}
        defaultSelectedAgentNames={currentAgentNames}
        onAgentMode={handleAgentMode}
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
        <RaceCelebration
          isVisible={showAnimation}
          totalSeconds={runTotals.seconds}
          totalMoves={runTotals.moves}
          stars={runStars}
          points={runPoints}
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
              {/* Top bar near the stage pips: jump back to the previous stage
                  (multi-stage runs only) and retry the current one. Retry and
                  the destructive Reset both confirm before wiping. */}
              <div
                data-testid="stage-top-bar"
                className="mb-2 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  {currentStageIndex > 0 && (
                    <button
                      type="button"
                      data-testid="previous-stage-button"
                      onClick={handlePreviousStage}
                      disabled={!!transition}
                      className="flex cursor-pointer items-center gap-1 rounded-full border border-stone-200/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-stone-700 backdrop-blur transition-all duration-200 hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      Previous
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  data-testid="retry-stage-button"
                  onClick={handleRetryClick}
                  disabled={!!transition}
                  className="flex cursor-pointer items-center gap-1 rounded-full border border-stone-200/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-stone-700 backdrop-blur transition-all duration-200 hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Retry
                </button>
              </div>

              {/* One HUD card: race status on the top row, move gauge and
                  toolbar on the bottom, so the chrome above the board reads
                  as a single instrument cluster instead of two loose rows */}
              <div className="mb-2 rounded-2xl border border-stone-200/70 bg-white/50 backdrop-blur dark:border-white/10 dark:bg-zinc-900/40">
                <RaceHud
                  onOpponentsClick={friendsOnClick}
                  stageCount={stages.length}
                  currentStageIndex={currentStageIndex}
                  completedStageIndexes={completedStageIndexes}
                  difficulty={stageDifficulty}
                />

                <Controls
                  undo={undo}
                  redo={redo}
                  reset={handleResetClick}
                  isUndoDisabled={!!completed || isUndoDisabled}
                  isRedoDisabled={!!completed || isRedoDisabled}
                  isDisabled={!!completed}
                  onHint={handleHint}
                  isHintDisabled={!!completed || !!transition || showLobby}
                  hintBadge={hintBadge}
                  movesMade={movesMade}
                  movesRequired={stage.movesRequired}
                  timer={
                    <RaceTimer
                      seconds={calculateSeconds(timer)}
                      countdown={timer?.countdown}
                      isComplete={!!completed}
                    />
                  }
                />
              </div>

              {/* Hint verdict row: the same amber the move gauge flips to
                  when a stage goes over par — a warning, not an error */}
              {hintNotice && (
                <div
                  data-testid="hint-notice"
                  className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400"
                >
                  <span>{hintNotice}</span>
                  <button
                    type="button"
                    aria-label="Dismiss hint notice"
                    className="shrink-0 cursor-pointer opacity-70 transition-opacity hover:opacity-100"
                    onClick={() => setHintNoticeState(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="relative">
                {transition ? (
                  <StageTransition
                    fromBoardString={transition.fromBoardString}
                    fromInitialBoardString={transition.fromInitialBoardString}
                    direction={transition.direction}
                    onDone={handleTransitionDone}
                  >
                    <Board
                      key={puzzleId}
                      boardString={answer}
                      initialBoardString={initial}
                      onMove={pushMove}
                      isDisabled
                    />
                  </StageTransition>
                ) : (
                  <div onPointerDownCapture={handleBoardPointerDown}>
                    <Board
                      key={puzzleId}
                      boardString={answer}
                      initialBoardString={initial}
                      onMove={pushMove}
                      isDisabled={
                        !!completed || showLobby || isLockedCollectionPuzzle
                      }
                      hint={hint}
                    />
                  </div>
                )}

                {/* Locked deep-link gate: a free user landing on a locked
                    collection puzzle sees the board sealed behind a paywall
                    gate — the timer is already frozen by shouldPause. */}
                {isLockedCollectionPuzzle && (
                  <PuzzleGate
                    title="Locked pack"
                    body="This puzzle is in the locked half of this month's pack. Unlock the entire pack with Plus."
                    primaryLabel="Unlock the pack with Plus"
                    onPrimary={handleUnlockCollection}
                    secondaryLabel="Back to collection"
                    onSecondary={handleBackToCollection}
                  />
                )}

                {/* "Stuck? Try a hint" nudge, anchored over the hint button
                    area in the HUD — appears on over-par or ~20s idle, hidden
                    on the next board pointer-down. */}
                {showNudge && (
                  <div className="pointer-events-none absolute -top-2 right-2 z-30 flex -translate-y-full justify-end">
                    <HintNudge />
                  </div>
                )}

                {/* Stage-clear slam: slams in over the solved board and
                    holds — the run only continues when the player taps the
                    Next-stage button, so every win gets its moment without
                    the next puzzle stealing it */}
                {stageClear && (
                  <div
                    data-testid="stage-clear-slam"
                    className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-1 rounded-2xl bg-black/30 backdrop-blur-[2px]"
                    style={{
                      animation: 'unblock-stage-clear 450ms ease-out both',
                    }}
                  >
                    <style>{`
                      @keyframes unblock-stage-clear {
                        0% { transform: scale(1.7); opacity: 0; }
                        55% { transform: scale(0.96); opacity: 1; }
                        100% { transform: scale(1); opacity: 1; }
                      }
                      @keyframes unblock-stage-clear-ring {
                        from { transform: scale(0.35); opacity: 0.8; }
                        to { transform: scale(1.6); opacity: 0; }
                      }
                      @keyframes unblock-stage-clear-cta {
                        from { transform: translateY(12px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                      }
                      @media (prefers-reduced-motion: reduce) {
                        [data-testid="stage-clear-slam"],
                        [data-testid="stage-clear-slam"] * { animation: none !important; }
                      }
                    `}</style>
                    {/* Theme-colour shockwave rippling out behind the
                        headline, so the win lands as an impact, not just
                        text */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div
                        className="h-44 w-44 rounded-full"
                        style={{
                          border:
                            '3px solid color-mix(in srgb, var(--theme-primary) 85%, white)',
                          boxShadow:
                            '0 0 24px color-mix(in srgb, var(--theme-primary) 60%, transparent), inset 0 0 24px color-mix(in srgb, var(--theme-primary) 40%, transparent)',
                          animation:
                            'unblock-stage-clear-ring 700ms ease-out forwards',
                        }}
                      />
                    </div>
                    <div
                      className="text-4xl font-black uppercase tracking-tight text-white"
                      style={{
                        textShadow:
                          '0 2px 12px rgba(0,0,0,0.55), 0 0 34px color-mix(in srgb, var(--theme-primary) 80%, transparent)',
                      }}
                    >
                      Stage {stageClear.stage} clear
                    </div>
                    {/* Stars pop in one-by-one (moves vs par) — the first
                        beat of the payoff, before the numbers land */}
                    <div
                      data-testid="stage-clear-stars"
                      className="pointer-events-none"
                    >
                      <StarRating
                        rating={stageClearStars}
                        size="lg"
                        animated
                        staggerMs={220}
                      />
                    </div>
                    {/* Result instruments: the same tiny-label-over-mono
                        readout as the HUD's clock and gauge, so the win card
                        reads as the dashboard's verdict — moves graded
                        against par in the run's usual colours */}
                    <div
                      className="mt-1.5 flex items-stretch gap-2"
                      style={{
                        animation:
                          'unblock-stage-clear-cta 400ms ease-out 150ms both',
                      }}
                    >
                      <div
                        data-testid="stage-clear-time"
                        className="flex min-w-24 flex-col items-center gap-1 rounded-xl bg-zinc-900/75 px-4 py-2 ring-1 ring-white/15 backdrop-blur"
                      >
                        <span className="text-[0.6rem] font-black uppercase tracking-widest text-white/50">
                          Time
                        </span>
                        <span className="font-mono text-xl font-bold tabular-nums leading-none text-white">
                          {formatSecondsShort(stageClear.seconds)}
                        </span>
                      </div>
                      <div
                        data-testid="stage-clear-moves"
                        className="flex min-w-24 flex-col items-center gap-1 rounded-xl bg-zinc-900/75 px-4 py-2 ring-1 ring-white/15 backdrop-blur"
                      >
                        <span className="text-[0.6rem] font-black uppercase tracking-widest text-white/50">
                          Moves
                        </span>
                        <span
                          className={`font-mono text-xl font-bold tabular-nums leading-none ${
                            stageClear.movesMade > stageClear.movesRequired
                              ? 'text-amber-400'
                              : stageClear.movesMade < stageClear.movesRequired
                                ? 'text-emerald-400'
                                : 'text-white'
                          }`}
                        >
                          {stageClear.movesMade}/{stageClear.movesRequired}
                        </span>
                      </div>
                    </div>
                    <div
                      data-testid="stage-clear-par"
                      className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest ${
                        stageClear.movesMade > stageClear.movesRequired
                          ? 'bg-amber-500/20 text-amber-300'
                          : stageClear.movesMade < stageClear.movesRequired
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-white/15 text-white/85'
                      }`}
                      style={{
                        animation:
                          'unblock-stage-clear-cta 400ms ease-out 250ms both',
                      }}
                    >
                      {stageClear.movesMade > stageClear.movesRequired
                        ? `${stageClear.movesMade - stageClear.movesRequired} over par`
                        : stageClear.movesMade < stageClear.movesRequired
                          ? `${stageClear.movesRequired - stageClear.movesMade} under par`
                          : 'On par'}
                    </div>
                    {/* Leaderboard points count up once the stars have
                        landed — the same number the run's total will rise by
                        when this stage saves */}
                    <div
                      data-testid="stage-clear-points"
                      className="mt-2 flex flex-col items-center gap-0.5"
                      style={{
                        animation:
                          'unblock-stage-clear-cta 400ms ease-out 300ms both',
                      }}
                    >
                      <CountUp
                        value={stageClearPoints}
                        prefix="+"
                        suffix=" pts"
                        startDelayMs={stageClearStars * 220 + 200}
                        className="font-mono text-2xl font-black tabular-nums text-amber-300"
                      />
                      <span className="text-[0.6rem] font-black uppercase tracking-widest text-white/55">
                        Leaderboard points
                      </span>
                    </div>
                    <style>{`
                      @keyframes unblock-next-stage-pulse {
                        0%, 100% { box-shadow: 0 0 24px color-mix(in srgb, var(--theme-primary) 55%, transparent), 0 2px 8px rgba(0,0,0,0.35); }
                        50% { box-shadow: 0 0 36px color-mix(in srgb, var(--theme-primary) 85%, transparent), 0 2px 8px rgba(0,0,0,0.35); }
                      }
                      @media (prefers-reduced-motion: reduce) {
                        [data-testid="next-stage-button"] { animation: none !important; }
                      }
                    `}</style>
                    <button
                      type="button"
                      data-testid="next-stage-button"
                      onClick={advanceStage}
                      className="bg-theme-primary hover:bg-theme-primary-dark pointer-events-auto mt-3 flex cursor-pointer items-center gap-1 rounded-full px-6 py-2.5 text-sm font-black uppercase tracking-widest text-white transition-all duration-200 hover:scale-[1.03] active:scale-95"
                      style={{
                        boxShadow:
                          '0 0 24px color-mix(in srgb, var(--theme-primary) 55%, transparent), 0 2px 8px rgba(0,0,0,0.35)',
                        animation:
                          'unblock-stage-clear-cta 400ms ease-out 350ms both, unblock-next-stage-pulse 1.8s ease-in-out 900ms infinite',
                      }}
                    >
                      Next stage
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {/* Progress line: how far through the run this win takes
                        them, so the CTA reads as momentum, not just "next" */}
                    <div
                      data-testid="stage-clear-progress"
                      className="mt-2 text-[0.65rem] font-bold uppercase tracking-widest text-white/60"
                      style={{
                        animation:
                          'unblock-stage-clear-cta 400ms ease-out 450ms both',
                      }}
                    >
                      Stage {stageClear.stage} of {stages.length} —{' '}
                      {stages.length - stageClear.stage} to go
                    </div>
                  </div>
                )}
              </div>

              {/* Continue-to-next-puzzle flow: once this puzzle is finished,
                  steer the player into the next collection puzzle. Shown for a
                  single-stage collection puzzle and after the final daily
                  stage; it sits under the board and persists after the finish
                  celebration fades so the momentum carries. */}
              {completed &&
                nextCollectionPuzzle &&
                (isCollectionPuzzle || (isDailyRun && isFinalStage)) && (
                  <NextPuzzlePanel
                    next={nextCollectionPuzzle}
                    progressLabel={nextPuzzleProgressLabel}
                    onContinue={handleContinueToNext}
                  />
                )}

              <UnblockRaceTrack
                sessionParties={sessionParties}
                state={raceTrackState}
                userId={user?.sub || 'guest'}
                onClick={raceTrackOnClick}
                isPolling={isPolling}
                refreshSessionParties={refreshSessionParties}
                onInviteFriends={handleInviteFriends}
                runResults={runResults}
                localAgentProgress={localAgentProgress}
                rateApp={{ appName, appStoreUrl, googlePlayUrl }}
              />

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

      <ConfirmDialog
        isOpen={confirmAction !== null}
        title={
          confirmAction === 'retry' ? 'Retry this stage?' : 'Reset this puzzle?'
        }
        body={
          confirmAction === 'retry'
            ? 'Your current time and moves will be replaced.'
            : 'This clears your moves and starts the puzzle over.'
        }
        confirmLabel={confirmAction === 'retry' ? 'Retry' : 'Reset'}
        onConfirm={handleConfirmDialogConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};

export default UnblockRace;
