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
import { ChevronRight, X } from 'lucide-react';
import Lobby from '@bubblyclouds-app/template/components/Lobby';
import AuthGate from '@bubblyclouds-app/template/components/AuthGate';
import { AppDownloadModal } from '@bubblyclouds-app/template/components/AppDownloadModal';
import { isCapacitor } from '@bubblyclouds-app/template/helpers/capacitor';
import { calculateSeconds } from '@bubblyclouds-app/template/helpers/calculateSeconds';
import { useSessions } from '@bubblyclouds-app/template/providers/SessionsProvider';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { RevenueCatContext } from '@bubblyclouds-app/template/providers/RevenueCatProvider';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';
import { AgentProgress } from '@bubblyclouds-app/types/agentTypes';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';
import { calculateSessionScore } from '@bubblyclouds-app/games/helpers/scoringUtils';
import { SCORING_CONFIG } from '@bubblyclouds-app/games/helpers/scoringConfig';
import { StarRating } from '@bubblyclouds-app/ui/components/StarRating';
import { CountUp } from '@bubblyclouds-app/ui/components/CountUp';
import { ServerStateResult } from '@bubblyclouds-app/types/serverTypes';
import { useCollection } from '../providers/CollectionProvider';
import { GameState, GameStateMetadata, ServerState } from '../types/state';
import { Move } from '../types/board';
import { AgentConfig } from '@bubblyclouds-app/games/types/Agent';
import { useGameState } from '../hooks/useGameState';
import { DEFAULT_AGENT_CONFIGS } from '../helpers/defaultAgents';
import {
  selectDefaultAgents,
  selectAgentConfigsByName,
} from '@bubblyclouds-app/games/helpers/selectDefaultAgents';
import { createLocalAgents, LocalAgent } from '../helpers/agentTimeline';
import { getAllAgentProgress } from '@bubblyclouds-app/games/helpers/agentProgress';
import { getHint } from '../helpers/hint';
import { loadSolver } from '../services/solver';
import { calculateCompletionPercentageFromState } from '../helpers/calculateCompletionPercentage';
import {
  calculateStatsDisplayFromState,
  movesDisplayFromState,
} from '../helpers/calculateStatsDisplay';
import { isPuzzleCheated } from '../helpers/cheatDetection';
import { solvedBoardString } from '../helpers/boardToString';
import { difficultyForMoves } from '../helpers/difficulty';
import {
  unblockDifficultyDisplay,
  getUnblockDifficultyDisplay,
  UNBLOCK_DIFFICULTY_MULTIPLIERS,
  UNBLOCK_SPEED_THRESHOLDS,
} from '../helpers/difficultyDisplay';
import { buildPuzzleUrl } from '../helpers/buildPuzzleUrl';
import { getDailyLabel } from '../helpers/dailyLabel';
import { getCollectionPuzzleLabel } from '../helpers/collectionPuzzleLabel';
import { formatSecondsShort } from '../helpers/formatSecondsShort';
import { starRatingForMoves, starRatingFromState } from '../helpers/starRating';
import { isCollectionPuzzleIdLocked } from '../helpers/collectionLocks';
import {
  canUseHint,
  incrementHintCount,
} from '@bubblyclouds-app/template/utils/dailyActionCounter';
import {
  NextCollectionPuzzle,
  getNextCollectionPuzzle,
} from '../helpers/nextCollectionPuzzle';
import {
  RunStage,
  StageScore,
  extractScore as extractStageScoreFromGameState,
} from '../helpers/stageResults';
import {
  completedStagesFromStorage as genericCompletedStagesFromStorage,
  firstIncompleteStage as genericFirstIncompleteStage,
} from '@bubblyclouds-app/games/helpers/runStageStorage';
import {
  calculateMostRecentUpdatedAtByUserId as genericCalculateMostRecentUpdatedAtByUserId,
  calculatePresenceStageByUserId as genericCalculatePresenceStageByUserId,
} from '@bubblyclouds-app/games/helpers/runResults';
import { AgentRunInput, calculateRunResults } from '../helpers/runResults';
import NextPuzzlePanel from '@bubblyclouds-app/games/components/NextPuzzlePanel';
import CompletionSummary from '@bubblyclouds-app/games/components/CompletionSummary';
import ConfirmDialog from '@bubblyclouds-app/games/components/ConfirmDialog';
import Board from './Board';
import Controls from './Controls';
import RaceCelebration, {
  RACE_CELEBRATION_MS,
} from '@bubblyclouds-app/games/components/RaceCelebration';
import RaceHud from '@bubblyclouds-app/games/components/RaceHud';
import RaceTimer from '@bubblyclouds-app/games/components/RaceTimer';
import SimpleBoard from './SimpleBoard';
import StageResultPanel from '@bubblyclouds-app/games/components/StageResultPanel';
import StageTopBar from '@bubblyclouds-app/games/components/StageTopBar';
import RaceTrack from '@bubblyclouds-app/games/components/RaceTrack';
import CountdownOverlay from '@bubblyclouds-app/games/components/CountdownOverlay';
import StageTransition from '@bubblyclouds-app/games/components/StageTransition';
import { PlayerStageResult } from '@bubblyclouds-app/games/types/scoringTypes';
import { getPieceColor } from '../helpers/pieceColors';

const noop = () => {};

const buildPristineAgentState = (firstState: ServerState): ServerState => ({
  initial: firstState.initial,
  final: firstState.final,
  answerStack: [],
});

// Confetti wears the board's own piece palette so the celebration's rain
// reads as this game bursting, not a generic party. Scattered/coloured once
// — one shared palette per page load is indistinguishable to the player.
const CONFETTI_COLORS = Array.from({ length: 10 }, (_, i) =>
  getPieceColor(1 + i)
);

// Moves graded against par in the run's usual colours, with the golf-style
// delta saying exactly how far over or under — RaceTrack's per-stage score
// slot in the leaderboard table (SPEC.md §7).
const renderStageScore = (score: StageScore) => {
  if (score.movesMade === undefined) {
    return null;
  }
  const movesDelta = score.movesMade - score.movesRequired;
  return (
    <span
      className={`block font-mono text-[0.65rem] tabular-nums ${
        movesDelta > 0
          ? 'text-amber-600 dark:text-amber-400'
          : movesDelta < 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-stone-400 dark:text-zinc-500'
      }`}
    >
      {score.movesMade}/{score.movesRequired}
      {movesDelta !== 0 && ` ${movesDelta > 0 ? '+' : ''}${movesDelta}`}
      <span className="sr-only">
        {` moves, ${
          movesDelta === 0
            ? 'on par'
            : `${Math.abs(movesDelta)} ${movesDelta > 0 ? 'over' : 'under'} par`
        }`}
      </span>
    </span>
  );
};

// Run-total moves readout under the total time in the leaderboard's last
// column — mirrors runResults.ts's own totalMoves/totalMovesDelta math over
// the row's completed stage results.
const renderTotalScore = (
  stageResults: (PlayerStageResult<StageScore> | undefined)[]
) => {
  const completedResults = stageResults.filter(
    (stageResult): stageResult is NonNullable<typeof stageResult> =>
      stageResult !== undefined
  );
  const totalMoves = completedResults.reduce(
    (sum, stageResult) => sum + (stageResult.score.movesMade || 0),
    0
  );
  if (totalMoves <= 0) {
    return null;
  }
  const totalMovesDelta = completedResults.reduce(
    (sum, stageResult) =>
      stageResult.score.movesMade !== undefined
        ? sum + stageResult.score.movesMade - stageResult.score.movesRequired
        : sum,
    0
  );
  return (
    <span className="block text-[0.65rem] tabular-nums text-stone-400 dark:text-zinc-500">
      {totalMoves} moves
      {' · '}
      <span
        className={
          totalMovesDelta > 0
            ? 'text-amber-600 dark:text-amber-400'
            : totalMovesDelta < 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : undefined
        }
      >
        {totalMovesDelta === 0
          ? 'par'
          : `${totalMovesDelta > 0 ? '+' : ''}${totalMovesDelta}`}
      </span>
    </span>
  );
};

// StageResultPanel's per-stage difficulty chip: unblockDifficultyDisplay's
// label/chipClass pair, banded from the stage's own known-optimal par.
const getStageDifficultyDisplay = (stage: RunStage) =>
  unblockDifficultyDisplay(difficultyForMoves(stage.movesRequired));

// StageResultPanel's completed-stage result chip: moves made against par,
// with the over/under/met-par state driving the chip's colour treatment.
const renderStageResult = (result: PlayerStageResult<StageScore>) => {
  const movesMade = result.score.movesMade ?? 0;
  const movesRequired = result.score.movesRequired;
  const parState =
    movesMade > movesRequired
      ? ('over' as const)
      : movesMade < movesRequired
        ? ('under' as const)
        : ('met' as const);
  return {
    content: (
      <>
        {movesMade}/{movesRequired}
        <span className="sr-only"> moves</span>
      </>
    ),
    parState,
  };
};

// StageResultPanel's not-yet-reached stage caption.
const renderStageUpcoming = (stage: RunStage) => `par ${stage.movesRequired}`;

// StageResultPanel's run-total row: the moves half of "1:10 · 10 moves".
const renderStageResultTotal = (
  results: PlayerStageResult<StageScore>[]
): string => {
  const totalMoves = results.reduce(
    (sum, r) => sum + (r.score.movesMade ?? 0),
    0
  );
  return `${totalMoves} moves`;
};

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
  const { user, isInitialised, showLoginModal } = context || {};
  const { isSubscribed, subscribeModal } = useContext(RevenueCatContext) || {};
  const { sessions, fetchSessions } = useSessions<GameState>();
  const { collectionData, fetchCollectionData } = useCollection();

  const { stages } = run;
  // The board string doubles as the run id when none was minted (§4: the
  // board string is the identifier)
  const runId = run.runId || stages[0].stageId;

  const [currentStageIndex, setCurrentStageIndex] = useState(() =>
    genericFirstIncompleteStage<RunStage, GameState>(app, stages)
  );
  // Ticked off in the stage-preview strip; kept in sync with storage on
  // mount and updated eagerly when a stage completes in this session
  const [completedStages, setCompletedStages] = useState(() =>
    genericCompletedStagesFromStorage<RunStage, GameState, StageScore>(
      app,
      stages,
      extractStageScoreFromGameState
    )
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
  const initial = stage.stageId;
  const puzzleId = initial;
  const runStageIds = useMemo(
    () => stages.map((runStage) => runStage.stageId),
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

  // AI opponents are opted in by default (one random persona per Dreyfus
  // level, same picker as Sudoku Race): computed once so the roster is
  // stable for the life of this run.
  const [defaultAgentSelection] = useState<string[]>(() =>
    selectDefaultAgents(DEFAULT_AGENT_CONFIGS)
  );

  // Local AI rivals (SPEC: each agent races the whole run on its OWN clock,
  // independent of the player's stage AND of every other agent — a fast
  // agent must not sit waiting on a slow one). Timelines are solver-built
  // asynchronously, so the selected configs live in a ref the rebuild reads,
  // and a per-agent build id discards any solve that lands after that
  // agent's stage (or the selection) has moved on. agentStageIndexByIdRef /
  // agentStartTimeByIdRef track each agent's own progress through the run,
  // keyed by agent id — every agent always starts at stage 0, even when the
  // player resumes a later stage after a reload, and never reads from
  // `currentStageIndex` or storage.
  const agentStageIndexByIdRef = useRef<Map<string, number>>(new Map());
  const agentStartTimeByIdRef = useRef<Map<string, number | null>>(new Map());
  const agentConfigsRef = useRef<AgentConfig[]>(
    selectAgentConfigsByName(DEFAULT_AGENT_CONFIGS, defaultAgentSelection)
  );
  const agentBuildIdByIdRef = useRef<Map<string, number>>(new Map());
  // Which agents are mid-"stage clear" gap (about to rebuild for their next
  // stage) or have finished the whole run — both stop the tick loop from
  // repeatedly recording/advancing the same agent every second.
  const advancingAgentIdsRef = useRef<Set<string>>(new Set());
  const finishedAgentIdsRef = useRef<Set<string>>(new Set());
  const [agents, setAgents] = useState<LocalAgent[]>([]);
  const [localAgentProgress, setLocalAgentProgress] = useState<
    AgentProgress<ServerState>[]
  >([]);
  // Each agent's recorded result per stage, keyed by agent name (stable
  // across the per-stage timeline rebuilds) — the deterministic side of the
  // run leaderboard.
  const [agentStageResults, setAgentStageResults] = useState<
    Map<
      string,
      { emoji: string; stages: Map<number, PlayerStageResult<StageScore>> }
    >
  >(new Map());

  // Each agent finishes "offscreen" deterministically, on its OWN stage
  // clock: the moment one agent's timeline for its current stage completes,
  // its precomputed time and move count for that stage go on the run
  // leaderboard — independent of which stage the player, or any other
  // agent, is currently on. Recording is idempotent.
  const recordAgentStageResult = useCallback(
    (agent: LocalAgent, stageIndex: number, stageMovesRequired: number) => {
      if (agent.timeline.steps.length === 0) {
        return;
      }
      setAgentStageResults((prev) => {
        const next = new Map(prev);
        const existing = next.get(agent.name);
        const stageMap = new Map(existing?.stages);
        stageMap.set(stageIndex, {
          seconds: Math.round(agent.timeline.totalDuration / 1000),
          score: {
            movesMade: agent.timeline.steps.length,
            movesRequired: stageMovesRequired,
          },
        });
        next.set(agent.name, { emoji: agent.emoji, stages: stageMap });
        return next;
      });
    },
    []
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
          score: {
            movesMade: completedMovesMade,
            movesRequired: stage.movesRequired,
          },
        });
        return next;
      });
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
    hasSessionPartiesFromServer,
    runStageParties,
    showLobby,
    setShowLobby,
    setMode,
    setAgentNames,
  } = useGameState({
    final,
    initial,
    puzzleId,
    metadata: stageMetadata,
    app,
    apiUrl,
    initialMode: 'ai',
    initialAgentNames: defaultAgentSelection.join(','),
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

  // Builds (or rebuilds) a single agent's timeline for whichever stage
  // agentStageIndexByIdRef currently has for it — that agent's own board,
  // not necessarily the player's or any other agent's. A per-agent build id
  // discards any solve that lands after that agent's stage (or the roster)
  // has moved on again.
  const buildOneAgentForStage = useCallback(
    (config: AgentConfig, stageIndex: number) => {
      const agentId = `agent-${config.name}`;
      const agentStage = stages[stageIndex];
      const agentInitial = agentStage.stageId;
      const agentFinal = solvedBoardString(agentInitial);
      const buildId = (agentBuildIdByIdRef.current.get(agentId) ?? 0) + 1;
      agentBuildIdByIdRef.current.set(agentId, buildId);
      void createLocalAgents(
        agentInitial,
        agentFinal,
        [config],
        difficultyForMoves(agentStage.movesRequired)
      ).then((created) => {
        if (agentBuildIdByIdRef.current.get(agentId) !== buildId) {
          return;
        }
        const [builtAgent] = created;
        if (!builtAgent) {
          return;
        }
        setAgents((prev) => [
          ...prev.filter((agent) => agent.id !== agentId),
          builtAgent,
        ]);
        setLocalAgentProgress((prev) => [
          ...prev.filter((progress) => progress.agentId !== agentId),
          ...getAllAgentProgress(
            [builtAgent],
            null,
            buildPristineAgentState,
            calculateCompletionPercentageFromState
          ),
        ]);
      });
    },
    [stages]
  );

  // Bot selection from the lobby's agent sheet: every (re)selected agent
  // starts fresh at stage 0 (SPEC: AI opponents always start at stage 1).
  // Mode and names persist immediately (they record the player's choice);
  // each kart appears as its solve resolves.
  const handleAgentMode = useCallback(
    (selectedAgentNames: string[]) => {
      const selectedConfigs = selectAgentConfigsByName(
        DEFAULT_AGENT_CONFIGS,
        selectedAgentNames
      );
      agentConfigsRef.current = selectedConfigs;
      setMode('ai');
      setAgentNames(selectedAgentNames.join(','));
      for (const config of selectedConfigs) {
        const agentId = `agent-${config.name}`;
        agentStageIndexByIdRef.current.set(agentId, 0);
        agentStartTimeByIdRef.current.set(agentId, null);
        advancingAgentIdsRef.current.delete(agentId);
        finishedAgentIdsRef.current.delete(agentId);
        buildOneAgentForStage(config, 0);
      }
    },
    [buildOneAgentForStage, setMode, setAgentNames]
  );

  // Solve the default roster once on mount so the lobby can show it as
  // already selected (SPEC: AI opponents are opted in by default) — this
  // only builds the preview; each agent's race clock stays null until
  // handleStartRace actually starts the race.
  useEffect(() => {
    for (const config of agentConfigsRef.current) {
      const agentId = `agent-${config.name}`;
      agentStageIndexByIdRef.current.set(agentId, 0);
      agentStartTimeByIdRef.current.set(agentId, null);
      buildOneAgentForStage(config, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      agentStageIndexByIdRef.current.delete(agentId);
      agentStartTimeByIdRef.current.delete(agentId);
      advancingAgentIdsRef.current.delete(agentId);
      finishedAgentIdsRef.current.delete(agentId);
      // Invalidate any in-flight solve for this agent (e.g. the mount-time
      // roster build) so it can't resurrect the agent via setAgents once it
      // resolves after removal.
      agentBuildIdByIdRef.current.set(
        agentId,
        (agentBuildIdByIdRef.current.get(agentId) ?? 0) + 1
      );
    },
    [setAgentNames]
  );

  // Each agent's race clock starts only once the player actually starts the
  // race (not on mount, and not on the ambient session countdown, which can
  // finish while the lobby is still showing).
  useEffect(() => {
    if (!raceStarted) {
      return;
    }
    for (const agent of agents) {
      if (agentStartTimeByIdRef.current.get(agent.id) == null) {
        agentStartTimeByIdRef.current.set(agent.id, Date.now());
      }
    }
  }, [raceStarted, agents]);

  // Tick the AI karts once a second, each entirely on its OWN clock: the
  // instant one agent's timeline for its current stage completes, record
  // that stage's result and — after a short "stage clear" beat — advance
  // just that agent to its next stage and rebuild its timeline, independent
  // of whichever stage the player, or any other agent, is currently on. A
  // fast agent never waits on a slower one. Runs until every agent finishes
  // the whole run.
  const AGENT_STAGE_GAP_MS = 1500;
  useEffect(() => {
    if (agents.length === 0 || !raceStarted) {
      return;
    }
    const intervalId = setInterval(() => {
      for (const agent of agents) {
        if (
          advancingAgentIdsRef.current.has(agent.id) ||
          finishedAgentIdsRef.current.has(agent.id)
        ) {
          continue;
        }
        const startTimeMs = agentStartTimeByIdRef.current.get(agent.id);
        if (startTimeMs == null) {
          continue;
        }
        const [progress] = getAllAgentProgress(
          [agent],
          startTimeMs,
          buildPristineAgentState,
          calculateCompletionPercentageFromState
        );
        setLocalAgentProgress((prev) =>
          prev.some(
            (p) =>
              p.agentId === agent.id && p.percentage === progress.percentage
          )
            ? prev
            : [...prev.filter((p) => p.agentId !== agent.id), progress]
        );
        if (progress.percentage !== 100) {
          continue;
        }
        const finishedStageIndex =
          agentStageIndexByIdRef.current.get(agent.id) ?? 0;
        recordAgentStageResult(
          agent,
          finishedStageIndex,
          stages[finishedStageIndex].movesRequired
        );
        if (finishedStageIndex >= stages.length - 1) {
          finishedAgentIdsRef.current.add(agent.id);
          continue;
        }
        advancingAgentIdsRef.current.add(agent.id);
        const config = agentConfigsRef.current.find(
          (c) => `agent-${c.name}` === agent.id
        );
        setTimeout(() => {
          advancingAgentIdsRef.current.delete(agent.id);
          if (!config) {
            return;
          }
          const nextStageIndex = finishedStageIndex + 1;
          agentStageIndexByIdRef.current.set(agent.id, nextStageIndex);
          agentStartTimeByIdRef.current.set(agent.id, Date.now());
          buildOneAgentForStage(config, nextStageIndex);
        }, AGENT_STAGE_GAP_MS);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [
    agents,
    raceStarted,
    stages,
    recordAgentStageResult,
    buildOneAgentForStage,
  ]);

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

  // Warm the solver so the first hint answers instantly; a load failure is
  // swallowed here — getHint degrades to 'unavailable' on its own retry.
  useEffect(() => {
    void loadSolver().catch(() => undefined);
  }, []);

  // A free user deep-linking into a locked collection puzzle (the latter half
  // of a difficulty band): seal the board behind a gate so no countdown ever
  // starts. Only collection runs carry an unblockCollectionPuzzleId, and an
  // already-completed puzzle stays playable (they earned it).
  //
  // Whether a given puzzle is locked can't be known until collectionData has
  // loaded (fetched async above), so isPendingLockCheck holds the puzzle in
  // the same disabled/timer-paused state as a confirmed lock for that
  // window — otherwise the board would be briefly playable and the timer
  // would briefly run before flipping to locked once the fetch resolves.
  const isPendingLockCheck =
    !isSubscribed &&
    !completed &&
    !alreadyCompleted &&
    !!metadata.unblockCollectionPuzzleId &&
    !collectionData;
  const isLockedCollectionPuzzle =
    !isSubscribed &&
    !completed &&
    !alreadyCompleted &&
    !!metadata.unblockCollectionPuzzleId &&
    isCollectionPuzzleIdLocked(
      metadata.unblockCollectionPuzzleId,
      collectionData?.puzzles || []
    );
  const isBoardGated = isPendingLockCheck || isLockedCollectionPuzzle;

  const handleBackToCollection = useCallback(() => {
    router.replace('/collection');
  }, [router]);

  // A locked deep-link never gets its own paywall copy: it opens the same
  // Plus modal the collection grid uses for a locked puzzle (SubscriptionContext
  // .COLLECTION_LOCKED already carries that messaging), so there's one place
  // that explains Plus instead of two. Backing out of the modal returns to
  // the collection rather than leaving the player stranded on a sealed board.
  //
  // hasOpenedLockModalRef guards against re-opening: subscribeModal is a new
  // object every RevenueCatProvider render (including the one its own
  // showModalIfRequired triggers), so depending on it directly would re-run
  // this effect and reopen the modal in an infinite loop.
  const hasOpenedLockModalRef = useRef(false);
  useEffect(() => {
    if (isLockedCollectionPuzzle && !hasOpenedLockModalRef.current) {
      hasOpenedLockModalRef.current = true;
      subscribeModal?.showModalIfRequired(
        () => {},
        handleBackToCollection,
        SubscriptionContext.COLLECTION_LOCKED
      );
    }
  }, [isLockedCollectionPuzzle, subscribeModal, handleBackToCollection]);

  const friendsOnClick = useCallback(() => {
    setShowLobby((prev) => !prev);
  }, [setShowLobby]);
  const raceTrackOnClick = useCallback(
    () => setShowLobby(true),
    [setShowLobby]
  );

  // A gated puzzle (see isBoardGated below) must never start a countdown:
  // shouldPause freezes it immediately via isBoardGated, so a countdown
  // started here would get stuck mid-count as a full-screen overlay,
  // permanently hiding the Plus modal underneath. Dismiss the lobby without
  // starting a session so the modal (triggered separately once the lock is
  // confirmed) is visible instead.
  const handleStartRace = useCallback(() => {
    if (isBoardGated) {
      setHasManuallySelectedMode(true);
      return;
    }
    if (!raceStarted) {
      setTimerNewSession();
      // Safety net: the roster is normally already built for the lobby
      // preview by mount time, but if any agent isn't yet (e.g. a
      // still-pending solve), make sure it exists before the clock below
      // starts ticking for it.
      const builtIds = new Set(agents.map((agent) => agent.id));
      for (const config of agentConfigsRef.current) {
        const agentId = `agent-${config.name}`;
        if (!builtIds.has(agentId)) {
          buildOneAgentForStage(
            config,
            agentStageIndexByIdRef.current.get(agentId) ?? 0
          );
        }
      }
    }
    setRaceStarted(true);
    setHasManuallySelectedMode(true);
  }, [
    setTimerNewSession,
    raceStarted,
    isBoardGated,
    agents,
    buildOneAgentForStage,
  ]);

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
      setStageClear(null);
      setTransition({
        fromBoardString: answerRef.current,
        fromInitialBoardString: stages[currentStageIndex].stageId,
        direction,
      });
      setCurrentStageIndex(index);
      setRaceStarted(true);
    },
    [currentStageIndex, transition, stages]
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
      moves += result.score.movesMade ?? 0;
    }
    return { seconds, moves };
  }, [completedStages]);

  // The end-of-puzzle points payoff shares the leaderboard's own scoring: a
  // completed stage is scored as a session the same way it will count once
  // saved (daily/book base + difficulty + speed + daily combo), so the
  // "+N pts" the player sees is the real number their total goes up by.
  // dayPuzzleIndex is how many other puzzles they'd already finished today —
  // the combo multiplier compounds through the day — read from the sessions
  // list already in scope. Every stage of this run is excluded, not just the
  // current one: scoreStage's own comboIndex argument already accounts for
  // this run's earlier stages (see runPoints/stageClearPoints below), so
  // counting them again here from a synced session would double them up.
  const runSessionIds = useMemo(
    () => new Set(runStageIds.map((stageId) => `${app}-${stageId}`)),
    [runStageIds, app]
  );
  const dayPuzzleIndex = useMemo(() => {
    if (!sessions) {
      return 0;
    }
    const todayKey = new Date().toISOString().slice(0, 10);
    return sessions.filter((session) => {
      if (runSessionIds.has(session.sessionId)) {
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
  }, [sessions, runSessionIds]);

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
        difficultyMultipliers: UNBLOCK_DIFFICULTY_MULTIPLIERS,
        speedThresholds: UNBLOCK_SPEED_THRESHOLDS,
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
    ? scoreStage(
        stageClear.seconds,
        stageClear.movesRequired,
        dayPuzzleIndex + stageClear.stage - 1
      )
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
      points += scoreStage(
        result.seconds,
        result.score.movesRequired,
        comboIndex
      );
      comboIndex += 1;
    }
    return points;
  }, [completedStages, dayPuzzleIndex, scoreStage]);

  const isCollectionPuzzle = !!metadata.unblockCollectionPuzzleId;
  const isDailyRun = runId.startsWith('oftheday-');

  // The continue-to-next-puzzle flow and the collection-puzzle lock gate
  // both need collectionData, but nothing else on this page fetches it —
  // only the collection list page does. Landing here directly (a daily-run
  // "continue" hop, a deep link, a fresh page load) would otherwise leave
  // collectionData null forever, silently breaking "continue" with no
  // navigation and no error.
  useEffect(() => {
    if (isCollectionPuzzle || isDailyRun) {
      fetchCollectionData();
    }
  }, [isCollectionPuzzle, isDailyRun, fetchCollectionData]);

  // The "X of Y <difficulty> complete" progress label also needs sessions,
  // but only the home/collection list pages fetch those. Landing here
  // directly leaves sessions null forever (fetchSessions is a no-op once
  // populated elsewhere), silently showing "0 of Y" even when puzzles are
  // already complete.
  useEffect(() => {
    if (isCollectionPuzzle || isDailyRun) {
      fetchSessions();
    }
  }, [isCollectionPuzzle, isDailyRun, fetchSessions]);

  // The result that stays put once the transient celebration fades — the
  // slam and the RaceCelebration both clear themselves, so without this a
  // finished puzzle (especially a single-stage collection puzzle) would leave
  // the player staring at a blank board. For a multi-stage run it summarises
  // the whole run once every stage is done; for a single puzzle it's that
  // puzzle's own stars/time/moves/points.
  const completionSummary = useMemo(() => {
    if (!completed) {
      return undefined;
    }
    if (stages.length > 1) {
      if (!isFinalStage || runStars === undefined) {
        return undefined;
      }
      return {
        stars: runStars,
        seconds: runTotals.seconds,
        movesMade: runTotals.moves,
        movesRequired: runTotalPar,
        points: runPoints,
        label: isDailyRun ? getDailyLabel() : undefined,
      };
    }
    const result = completedStages.get(currentStageIndex);
    if (!result) {
      return undefined;
    }
    // completedStages is populated by stageResults.ts's own extractScore,
    // which always returns a defined movesMade (defaults to 0) — the
    // fallback is type-narrowing only, never actually exercised here.
    const movesMade = result.score.movesMade ?? 0;
    return {
      stars: starRatingForMoves(movesMade, result.score.movesRequired),
      seconds: result.seconds,
      movesMade,
      movesRequired: result.score.movesRequired,
      points: scoreStage(
        result.seconds,
        result.score.movesRequired,
        dayPuzzleIndex
      ),
      label:
        isCollectionPuzzle && metadata.unblockCollectionPuzzleId
          ? getCollectionPuzzleLabel(metadata.unblockCollectionPuzzleId)
          : undefined,
    };
  }, [
    completed,
    stages.length,
    isFinalStage,
    runStars,
    runTotals,
    runTotalPar,
    runPoints,
    isDailyRun,
    completedStages,
    currentStageIndex,
    scoreStage,
    dayPuzzleIndex,
    isCollectionPuzzle,
    metadata.unblockCollectionPuzzleId,
  ]);

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
      isBoardGated;

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

  // difficultyForMoves always returns a current-vocabulary id, so this is
  // always defined; the undefined case only arises for stale ids from old
  // sessions (see getUnblockDifficultyDisplay).
  const puzzleDifficulty = useMemo(
    () => difficultyForMoves(stage.movesRequired),
    [stage.movesRequired]
  );
  const puzzleDifficultyDisplay = useMemo(
    () =>
      getUnblockDifficultyDisplay(puzzleDifficulty) || {
        name: unblockDifficultyDisplay(puzzleDifficulty).label,
        badgeColor: 'bg-stone-500 text-white',
      },
    [puzzleDifficulty]
  );

  const redirectUri = useMemo(
    () =>
      buildPuzzleUrl(
        stages.map((s) => s.stageId),
        stages.map((s) => s.movesRequired),
        { runId, unblockCollectionPuzzleId: metadata.unblockCollectionPuzzleId }
      ),
    [stages, runId, metadata.unblockCollectionPuzzleId]
  );

  // The current user's live state for the race track, with the live move
  // count in metadata — the same shape opponents' synced sessions have, so
  // one state-based calculation covers both.
  const rateApp = useMemo(
    () => ({ appName, appStoreUrl, googlePlayUrl }),
    [appName, appStoreUrl, googlePlayUrl]
  );

  const raceTrackSecondaryCta = useMemo(
    () => ({
      href: '/collection' as const,
      label: 'Collection',
      icon: 'collection' as const,
    }),
    []
  );

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

  // Scrolls down to the race track's full stats/leaderboard from the
  // stage-result panel's "View racing stats" button, which sits at the top
  // of the column, well above it.
  const scrollToRaceTrack = useCallback(() => {
    document
      .getElementById('race-track')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const stageDifficulty = useMemo(
    () => unblockDifficultyDisplay(difficultyForMoves(stage.movesRequired)),
    [stage.movesRequired]
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
            userId: user?.sub,
            ownResults: completedStages,
            agentResults: agentRunInputs,
          })
        : undefined,
    [stages, runStageParties, user?.sub, completedStages, agentRunInputs]
  );

  // Falls back to the configured (picked/default) names on the rare render
  // where the roster's mount-time solve hasn't resolved yet, so the lobby
  // sheet's pre-checked selection is never briefly empty.
  const currentAgentNames = useMemo(
    () =>
      agents.length > 0
        ? agents.map((agent) => agent.name)
        : agentConfigsRef.current.map((config) => config.name),
    [agents]
  );

  // Which stage each OTHER party member is present on right now — including
  // stages they haven't finished yet. calculateRunResults (below) only ever
  // records a stage once it's completed, so a friend actively playing a
  // stage the current user has already moved past (or not reached yet)
  // would otherwise have no data anywhere and show as offline in the Lobby.
  // Presence is purely a "where are they" signal, kept separate from
  // completedStageCount so it never inflates the whole-run percentage.
  const presenceStageByUserId = useMemo(
    () =>
      stages.length > 1
        ? genericCalculatePresenceStageByUserId<RunStage, ServerState>({
            stages,
            runStageParties,
            userId: user?.sub,
          })
        : new Map<string, number>(),
    [stages, runStageParties, user?.sub]
  );

  // Each OTHER party member's most recent session updatedAt across every
  // stage we have data for — the Lobby's online/away split needs this rather
  // than just the current stage's own session, since a friend can go stale
  // on OUR stage (moved on without us ever seeing them complete it) while
  // actively playing a later one right now.
  const mostRecentUpdatedAtByUserId = useMemo(
    () =>
      stages.length > 1
        ? genericCalculateMostRecentUpdatedAtByUserId<RunStage, ServerState>({
            stages,
            runStageParties,
            userId: user?.sub,
          })
        : new Map<string, Date>(),
    [stages, runStageParties, user?.sub]
  );

  // Multi-stage runs only: Lobby's opponent list (both human party members
  // and AI opponents) needs each opponent's completed-stage count and time
  // total so it can show "Stage N of M" instead of a per-stage percentage,
  // and surface human opponents who've moved past the stage sessionParties
  // covers. Agent rows are keyed by their agentId, matching
  // localAgentProgress, so the same map serves both lookups.
  const runProgressByUserId = useMemo(() => {
    if (!runResults) {
      return undefined;
    }
    const map: Record<
      string,
      { completedStageCount: number; totalSeconds: number }
    > = {};
    for (const result of runResults) {
      if (result.isCurrentUser) {
        continue;
      }
      map[result.userId] = {
        completedStageCount: result.completedStageCount,
        totalSeconds: result.totalSeconds,
      };
    }
    // Add opponents who are present (playing, not yet finished) on a stage
    // but have zero completed stages, so calculateRunResults omitted them
    // entirely (it filters out completedStageCount === 0 rows). They still
    // need a "Stage N of M" line so they don't fall through to offline.
    presenceStageByUserId.forEach((stageIndex, userId) => {
      if (!map[userId]) {
        map[userId] = { completedStageCount: stageIndex, totalSeconds: 0 };
      }
    });
    return map;
  }, [runResults, presenceStageByUserId]);

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
        getMovesDisplay={movesDisplayFromState}
        getStarRating={starRatingFromState}
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
        runProgressByUserId={runProgressByUserId}
        totalStages={stages.length > 1 ? stages.length : undefined}
        mostRecentUpdatedAtByUserId={mostRecentUpdatedAtByUserId}
        hasSessionPartiesFromServer={hasSessionPartiesFromServer}
      />

      {raceStarted &&
        !showLobby &&
        !transition &&
        timer?.countdown != null &&
        timer.countdown > 0 && <CountdownOverlay countdown={timer.countdown} />}

      {completed && (
        <RaceCelebration
          isVisible={showAnimation}
          statsLine={
            <>
              {formatSecondsShort(runTotals.seconds)}
              <span className="text-base font-semibold text-white/75">
                {' '}
                · {runTotals.moves} moves
              </span>
            </>
          }
          confettiColors={CONFETTI_COLORS}
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
              {/* Race progress (stage pips + per-stage stats) sits at the
                  top of the column, above the HUD and board, so it's the
                  first thing in view whether you're mid-run or just landed
                  on a finished stage. */}
              {stages.length > 1 && (
                <StageResultPanel<RunStage, StageScore>
                  results={completedStages}
                  stages={stages}
                  currentStageIndex={currentStageIndex}
                  goToStage={goToStage}
                  isTransitioning={!!transition}
                  onViewStats={scrollToRaceTrack}
                  runComplete={isFinalStage && !!completed}
                  dailyLabel={isDailyRun ? getDailyLabel() : undefined}
                  collectionPuzzleLabel={
                    metadata.unblockCollectionPuzzleId
                      ? getCollectionPuzzleLabel(
                          metadata.unblockCollectionPuzzleId
                        )
                      : undefined
                  }
                  onRetry={handleRetryClick}
                  isRetryDisabled={!!transition}
                  formatSeconds={formatSecondsShort}
                  renderThumbnail={(stage) => (
                    <SimpleBoard initial={stage.stageId} compact muteRivals />
                  )}
                  getDifficultyDisplay={getStageDifficultyDisplay}
                  renderResult={renderStageResult}
                  renderUpcoming={renderStageUpcoming}
                  renderTotal={renderStageResultTotal}
                />
              )}

              <StageTopBar
                showPrevious={currentStageIndex > 0}
                isDisabled={!!transition}
                onPrevious={handlePreviousStage}
              />

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

                <div className="flex w-full items-center gap-4 px-3 pb-2.5 pt-1">
                  {/* Rendered as Controls's sibling, not its prop, so the
                      1s tick that re-renders this clock never re-runs
                      Controls's own body (moves gauge, undo/redo, hint). */}
                  <RaceTimer
                    seconds={calculateSeconds(timer)}
                    countdown={timer?.countdown}
                    isComplete={!!completed}
                    formatSeconds={formatSecondsShort}
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
                    movesMade={movesMade}
                    movesRequired={stage.movesRequired}
                  />
                </div>
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
                    renderFrom={
                      <Board
                        boardString={transition.fromBoardString}
                        initialBoardString={transition.fromInitialBoardString}
                        onMove={noop}
                        isStatic
                      />
                    }
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
                  <Board
                    key={puzzleId}
                    boardString={answer}
                    initialBoardString={initial}
                    onMove={pushMove}
                    isDisabled={!!completed || showLobby || isBoardGated}
                    hint={hint}
                  />
                )}

                {/* Stage-clear slam: slams in over the solved board and
                    holds — the run only continues when the player taps the
                    Next-stage button, so every win gets its moment without
                    the next puzzle stealing it */}
                {stageClear && (
                  <div
                    data-testid="stage-clear-slam"
                    className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl backdrop-blur-md"
                    style={{
                      background:
                        'radial-gradient(120% 120% at 50% 40%, rgba(9,9,14,0.82) 0%, rgba(9,9,14,0.92) 55%, rgba(4,4,8,0.96) 100%)',
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

              {/* The finished result, kept visible under the board after the
                  transient celebration fades (fixes the collection puzzle's
                  result vanishing on completion). */}
              {completionSummary && (
                <CompletionSummary
                  stars={completionSummary.stars}
                  statCells={
                    <>
                      <div className="flex min-w-20 flex-col items-center gap-0.5 rounded-xl bg-stone-100/80 px-4 py-2 dark:bg-zinc-800/70">
                        <span className="text-[0.55rem] font-black uppercase tracking-widest text-stone-400 dark:text-zinc-500">
                          Time
                        </span>
                        <span className="font-mono text-lg font-bold tabular-nums leading-none text-stone-900 dark:text-white">
                          {formatSecondsShort(completionSummary.seconds)}
                        </span>
                      </div>
                      <div className="flex min-w-20 flex-col items-center gap-0.5 rounded-xl bg-stone-100/80 px-4 py-2 dark:bg-zinc-800/70">
                        <span className="text-[0.55rem] font-black uppercase tracking-widest text-stone-400 dark:text-zinc-500">
                          Moves
                        </span>
                        <span
                          className={`font-mono text-lg font-bold tabular-nums leading-none ${
                            completionSummary.movesMade >
                            completionSummary.movesRequired
                              ? 'text-amber-600 dark:text-amber-400'
                              : completionSummary.movesMade <
                                  completionSummary.movesRequired
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-stone-900 dark:text-white'
                          }`}
                        >
                          {completionSummary.movesMade}/
                          {completionSummary.movesRequired}
                        </span>
                      </div>
                    </>
                  }
                  points={completionSummary.points}
                  label={completionSummary.label}
                  // Multi-stage runs get retry from StageResultPanel's
                  // header instead — this covers single-stage puzzles,
                  // which have no stage panel to host it.
                  onRetry={stages.length <= 1 ? handleRetryClick : undefined}
                />
              )}

              {/* Continue-to-next-puzzle flow: once this puzzle is finished,
                  steer the player into the next collection puzzle. Shown for a
                  single-stage collection puzzle and after the final daily
                  stage; it sits under the board and persists after the finish
                  celebration fades so the momentum carries. */}
              {completed &&
                nextCollectionPuzzle &&
                (isCollectionPuzzle || (isDailyRun && isFinalStage)) && (
                  <NextPuzzlePanel
                    difficulty={unblockDifficultyDisplay(
                      nextCollectionPuzzle.puzzle.difficulty
                    )}
                    isLocked={nextCollectionPuzzle.isLocked}
                    progressLabel={nextPuzzleProgressLabel}
                    onContinue={handleContinueToNext}
                  />
                )}

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
                calculateStatsDisplayFromState={calculateStatsDisplayFromState}
                onInviteFriends={handleInviteFriends}
                runResults={runResults}
                totalStages={stages.length}
                renderStageScore={renderStageScore}
                renderTotalScore={renderTotalScore}
                presenceStageByUserId={presenceStageByUserId}
                localAgentProgress={localAgentProgress}
                rateApp={rateApp}
                secondaryCta={raceTrackSecondaryCta}
                formatFinishTime={formatSecondsShort}
              />
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
