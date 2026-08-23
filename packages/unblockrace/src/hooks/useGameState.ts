'use client';

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Move } from '../types/board';
import {
  GameState,
  GameStateMetadata,
  ServerState,
  UnblockMode,
} from '../types/state';
import { parseBoardString } from '../helpers/parseBoardString';
import { boardToString } from '../helpers/boardToString';
import { doMove } from '../helpers/doMove';
import { isSolved } from '../helpers/isSolved';
import { useLocalStorage } from '@bubblyclouds-app/template/hooks/localStorage';
import { useServerStorage } from '@bubblyclouds-app/template/hooks/serverStorage';
import { StateType } from '@bubblyclouds-app/types/stateType';
import { useTimer } from '@bubblyclouds-app/template/hooks/timer';
import { calculateSeconds } from '@bubblyclouds-app/template/helpers/calculateSeconds';
import {
  Parties,
  Party,
  ServerStateNotFoundResult,
  ServerStateResult,
  Session,
} from '@bubblyclouds-app/types/serverTypes';
import { UserSessions } from '@bubblyclouds-app/types/userSessions';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { RevenueCatContext } from '@bubblyclouds-app/template/providers/RevenueCatProvider';
import {
  canUseUndo,
  incrementUndoCount,
} from '@bubblyclouds-app/template/utils/dailyActionCounter';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';
import { useDocumentVisibility } from '@bubblyclouds-app/template/hooks/documentVisibility';
import { useSessions } from '@bubblyclouds-app/template/providers/SessionsProvider';
import { useParties } from '@bubblyclouds-app/template/hooks/useParties';

const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

// Mirrors SessionsProvider's getSessionParties, but reads from an explicit
// UserSessions snapshot rather than the provider's own friendSessions state.
// fetchFriendSessions's setFriendSessions call only takes effect on the
// provider's NEXT render — a caller that awaits fetchFriendSessions and then
// immediately calls getSessionParties would still read the PREVIOUS render's
// friendSessions, missing whatever was just fetched. Building the party
// shape from the snapshot fetchFriendSessions returns directly sidesteps
// that render-timing gap entirely.
const sessionPartiesFromSnapshot = <State>(
  parties: Party[],
  friendSessions: UserSessions<State>,
  sessionId: string
): Parties<Session<State>> =>
  parties.reduce((result: Parties<Session<State>>, party) => {
    const memberSessions = Object.entries(friendSessions || {}).reduce(
      (acc: { [userId: string]: Session<State> }, [userId, userSessions]) => {
        const session = userSessions?.sessions?.find(
          (s) => s.sessionId === sessionId
        );
        return session ? { ...acc, [userId]: session } : acc;
      },
      {}
    );
    return { ...result, [party.partyId]: { memberSessions } };
  }, {});

// Persisted answer stacks are truncated (last 3 snapshots on the server,
// last 10 locally), so stack length under-counts moves after a restore. The
// true count is persisted in metadata.movesMade; the offset is what the
// truncation removed.
const movesOffsetFromRestoredState = (state: {
  answerStack: string[];
  metadata?: Partial<GameStateMetadata>;
}): number => {
  const persistedMoves = Number(state.metadata?.movesMade);
  const stackMoves = Math.max(state.answerStack.length - 1, 0);
  return Number.isFinite(persistedMoves) && persistedMoves > stackMoves
    ? persistedMoves - stackMoves
    : 0;
};

function useGameState({
  final,
  initial,
  puzzleId,
  metadata,
  app,
  apiUrl,
  initialMode,
  initialAgentNames,
  initialShowLobby,
  onComplete,
  runStageIds,
}: {
  final: string;
  initial: string;
  puzzleId: string;
  metadata: Partial<GameStateMetadata>;
  app: string;
  apiUrl: string;
  initialMode?: UnblockMode;
  initialAgentNames?: string;
  initialShowLobby?: boolean;
  onComplete?: (
    answerStack: string[],
    movesMade: number,
    seconds: number
  ) => void;
  // Every stage's puzzle id in the chained run (SPEC.md §6), current stage
  // included. When provided, polling keeps every stage's opponent sessions
  // fresh — not just the current stage's — so the end-of-stage leaderboard
  // can show each player's time per stage and their run total.
  runStageIds?: string[];
}) {
  const context = useContext(UserContext);
  const { user } = context || {};
  const { subscribeModal, isSubscribed } = useContext(RevenueCatContext) || {};
  const isDocumentVisible = useDocumentVisibility();

  const { timer, setTimerNewSession, stopTimer, setPauseTimer, isPaused } =
    useTimer({
      app,
      id: puzzleId,
    });

  // Reference to timer value to use without triggering re-renders
  const timerRef = useRef(timer);

  // Track last saveValue call to prevent race conditions and unnecessary polling
  const lastSaveTimeRef = useRef<number>(0);
  const pollingIgnoreCounterRef = useRef<number>(0);

  // Track last saved answer to prevent unnecessary saves
  const lastSavedAnswerRef = useRef<string | null>(null);

  // Track if timer is paused due to inactivity
  const [isPausedDueToInactivity, setIsPausedDueToInactivity] = useState(false);
  const isPausedDueToInactivityRef = useRef(isPausedDueToInactivity);

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  useEffect(() => {
    isPausedDueToInactivityRef.current = isPausedDueToInactivity;
  }, [isPausedDueToInactivity]);

  const { getValue: getLocalValue, saveValue: saveLocalValue } =
    useLocalStorage({
      prefix: `${app}-`,
      id: puzzleId,
      type: StateType.PUZZLE,
    });
  const { getValue: getServerValue, saveValue: saveServerValue } =
    useServerStorage({
      app,
      apiUrl,
      id: puzzleId,
      type: StateType.PUZZLE,
    });
  const { parties } = useParties();
  const {
    getSessionParties,
    patchFriendSessions,
    fetchFriendSessions,
    lazyLoadFriendSessions,
  } = useSessions<ServerState>();

  // fetchFriendSessions and patchFriendSessions are re-created by
  // SessionsProvider whenever friendSessions/isFriendSessionsLoading change
  // (i.e. every time WE write to them via patchFriendSessions below) — using
  // them directly as useCallback/useEffect dependencies would retrigger
  // fetchOtherStageParties every time it writes its own result, looping
  // forever. Refs always read the latest function without being a dependency
  // that changes identity.
  const fetchFriendSessionsRef = useRef(fetchFriendSessions);
  fetchFriendSessionsRef.current = fetchFriendSessions;
  const patchFriendSessionsRef = useRef(patchFriendSessions);
  patchFriendSessionsRef.current = patchFriendSessions;

  // Warms up SessionsProvider's friendSessions cache on mount — the
  // homepage does this eagerly too (its own lazyLoadFriendSessions call), so
  // landing here via a client-side navigation from the homepage already has
  // it. Landing directly on a stage/run URL via a hard reload starts with an
  // empty cache and nothing else in this hook calls this unconditionally
  // (fetchOtherStageParties's own triggers are event-gated, meant to notice
  // CHANGES after the fact, not to do the initial load) — without this, the
  // Lobby would show no online opponents at all until the periodic poll or a
  // manual refresh eventually ran. lazyLoadFriendSessions no-ops once
  // already loaded, so this is safe to call unconditionally every mount.
  useEffect(() => {
    if (parties.length > 0) {
      lazyLoadFriendSessions(parties);
    }
  }, [parties, lazyLoadFriendSessions]);

  const [showLobby, setShowLobby] = useState(initialShowLobby ?? false);
  const [mode, setMode] = useState<UnblockMode | undefined>(initialMode);
  const [agentNames, setAgentNames] = useState<string | undefined>(
    initialAgentNames
  );
  const [{ answerStack, isRestored, isDisabled, completed }, setAnswerStack] =
    useState<{
      answerStack: string[];
      isRestored?: boolean;
      isDisabled?: boolean; // disable until heard from server
      completed?: GameState['completed'];
    }>({ answerStack: [initial], isDisabled: true });
  const [redoAnswerStack, setRedoAnswerStack] = useState<string[]>([]);
  const [movesOffset, setMovesOffset] = useState(0);
  const [sessionParties, setSessionPartiesLocal] = useState<
    Parties<Session<ServerState>>
  >(() => {
    const initialSessionParties = getSessionParties(
      parties,
      `${app}-${puzzleId}`
    );
    return initialSessionParties || {};
  });

  // Reference to sessionParties to read inside the polling effect without
  // tearing down and recreating the interval on every successful poll
  const sessionPartiesRef = useRef(sessionParties);
  sessionPartiesRef.current = sessionParties;

  // True once the current stage's own server GET has resolved at least once
  // (distinct from `isRestored`, which flips true from LOCAL storage alone,
  // possibly before the server response — that response is specifically
  // what carries the current stage's friend session data, which
  // fetchLaterStageParties's "did a friend complete our current stage"
  // check depends on). The Lobby's one-shot immediate-on-open other-stage
  // fetch waits on this so it doesn't race ahead of that data and
  // permanently miss a friend who's already ahead of us.
  const [hasSessionPartiesFromServer, setHasSessionPartiesFromServer] =
    useState(false);

  // Parties per stage of the whole run, keyed by stage puzzle id. Unlike
  // sessionParties this accumulates across stage changes, so the run
  // leaderboard can show every player's time on every stage.
  const [runStageParties, setRunStagePartiesLocal] = useState<{
    [stageId: string]: Parties<Session<ServerState>>;
  }>({});
  const setStageParties = useCallback(
    (stageId: string, stageParties: Parties<Session<ServerState>>) => {
      setRunStagePartiesLocal((prev) => ({ ...prev, [stageId]: stageParties }));
      const partySessions = Object.values(stageParties || {});
      const userSessions: { [userId: string]: Session<ServerState> } = {};
      for (const partySession of partySessions) {
        if (partySession?.memberSessions) {
          Object.assign(userSessions, partySession.memberSessions);
        }
      }
      // patchFriendSessions is read via a ref, not as a dependency: its
      // identity changes with SessionsProvider's isFriendSessionsLoading
      // flag, which this very call can flip — depending on it directly would
      // make setStageParties (and everything downstream, including
      // fetchOtherStageParties) unstable across its own writes.
      patchFriendSessionsRef.current(`${app}-${stageId}`, userSessions);
    },
    [app]
  );
  const setSessionParties = useCallback(
    (sessionParties: Parties<Session<ServerState>>) => {
      setSessionPartiesLocal(sessionParties);
      setStageParties(puzzleId, sessionParties);
    },
    [setStageParties, puzzleId]
  );
  const hasSessionParties = sessionParties
    ? Object.keys(sessionParties).length
    : 0;

  // Interaction tracking replaces sudoku's selected-cell tracking: every
  // committed move counts as an interaction for the inactivity pause.
  const lastInteractionRef = useRef<number>(Date.now());
  const registerInteraction = useCallback(() => {
    if (!completed) {
      lastInteractionRef.current = Date.now();
      // Resume timer if it was paused due to inactivity
      if (isPausedDueToInactivityRef.current) {
        setIsPausedDueToInactivity(false);
        setPauseTimer(false);
      }
    }
  }, [completed, setPauseTimer]);

  const getValue = useCallback((): {
    localValue: { lastUpdated: number; state: GameState } | undefined;
    serverValuePromise: Promise<
      | ServerStateResult<ServerState>
      | ServerStateNotFoundResult<ServerState>
      | undefined
    >;
  } => {
    const localValue = getLocalValue<GameState>();
    const serverValuePromise = getServerValue<ServerState>();
    return { localValue, serverValuePromise };
  }, [getLocalValue, getServerValue]);

  const shrinkAnswerStack = useCallback((answerStack: string[]): string[] => {
    // Only store the last 3 board snapshots on the server
    return answerStack.slice(-3);
  }, []);

  const shrinkAnswerStackLocal = useCallback(
    (answerStack: string[], completed?: GameState['completed']): string[] => {
      // For completed puzzles, only store the last 2 states (needed for cheat detection)
      if (completed) {
        return answerStack.slice(-2);
      }
      // For in-progress puzzles, store last 10 moves to support undo/redo
      // while preventing excessive storage usage
      return answerStack.slice(-10);
    },
    []
  );

  const saveValue = useCallback(
    (
      state: GameState,
      isSaveServerValue: boolean = true
    ): {
      localValue: { lastUpdated: number; state: GameState } | undefined;
      serverValuePromise?: Promise<ServerStateResult<ServerState> | undefined>;
    } => {
      if (state.answerStack.length > 0) {
        // Get current answer (last item in answerStack)
        const currentAnswer = state.answerStack[state.answerStack.length - 1];

        // If nothing has changed, skip saving
        if (currentAnswer === lastSavedAnswerRef.current) {
          return { localValue: undefined, serverValuePromise: undefined };
        }

        // Update the last saved answer reference
        lastSavedAnswerRef.current = currentAnswer;
      }

      const localValue = saveLocalValue<GameState>({
        ...state,
        answerStack: shrinkAnswerStackLocal(state.answerStack, state.completed),
      });
      const serverValuePromise = isSaveServerValue
        ? saveServerValue<ServerState>({
            ...state,
            answerStack: shrinkAnswerStack(state.answerStack),
            timer: timerRef.current || undefined,
          })
        : undefined;
      return { localValue, serverValuePromise };
    },
    [
      saveLocalValue,
      saveServerValue,
      timerRef,
      shrinkAnswerStack,
      shrinkAnswerStackLocal,
    ]
  );
  const handleServerResponse = useCallback(
    (
      active: boolean,
      serverValue: ServerStateResult<ServerState> | undefined
    ) => {
      if (
        active &&
        serverValue?.parties &&
        Object.keys(serverValue.parties).length
      ) {
        setSessionParties(serverValue.parties);
      }
    },
    [setSessionParties]
  );

  // Stable key for the run's stage ids so callers passing a fresh array each
  // render don't re-trigger the end-of-stage fetch.
  const runStageIdsKey = (runStageIds || []).join(',');

  // Reference to runStageParties to read inside fetchOtherStageParties
  // without that callback's identity changing every time a fetch writes its
  // own result back via setStageParties.
  const runStagePartiesRef = useRef(runStageParties);
  runStagePartiesRef.current = runStageParties;

  const knownFriendIds = useCallback(
    (): Set<string> =>
      new Set(
        parties.flatMap((party) =>
          party.members.filter((m) => !m.isUser).map((m) => m.userId)
        )
      ),
    [parties]
  );

  // A stage still needs (re)fetching if any party member we know of either
  // has no session there yet, or has one that isn't completed — a friend
  // still in progress on it might finish at any time, so it stays a
  // candidate until every known member's session on it reads as completed.
  // A stage with no data at all is always unresolved.
  const unresolvedStageIds = useCallback(
    (stageIds: string[]): string[] => {
      const friendIds = knownFriendIds();
      if (!friendIds.size) {
        return [];
      }
      return stageIds.filter((stageId) => {
        const stageParties = runStagePartiesRef.current[stageId];
        if (!stageParties) {
          return true;
        }
        const knownSessions = new Map(
          Object.values(stageParties).flatMap((party) =>
            Object.entries(party?.memberSessions || {})
          )
        );
        return [...friendIds].some((memberId) => {
          const session = knownSessions.get(memberId);
          return !session || !session.state.completed;
        });
      });
    },
    [knownFriendIds]
  );

  // Every stage id split into earlier (already played by us, in
  // runStageParties from when we did) and later (never started — a GET
  // there would 404, since we have no session row on the server for it).
  const earlierAndLaterStageIds = useCallback((): {
    earlierStageIds: string[];
    laterStageIds: string[];
  } => {
    const stageIds = runStageIdsKey ? runStageIdsKey.split(',') : [];
    const currentIndex = stageIds.indexOf(puzzleId);
    if (currentIndex === -1) {
      return { earlierStageIds: [], laterStageIds: [] };
    }
    return {
      earlierStageIds: stageIds.slice(0, currentIndex),
      laterStageIds: stageIds.slice(currentIndex + 1),
    };
  }, [runStageIdsKey, puzzleId]);

  // Earlier-stage refresh: for a stage we've already completed, our own
  // session row exists there, so a direct per-stage GET works (unlike a
  // stage we've never started, which 404s) and — being a single request
  // scoped to that stage's own party data — is cheaper than the bulk
  // fetchFriendSessions call. Only re-fetches stages still unresolved (some
  // known friend hasn't completed it there yet); once every known friend has
  // finished a stage, it drops out and is never GET again.
  const fetchEarlierStageParties = useCallback(async () => {
    const { earlierStageIds } = earlierAndLaterStageIds();
    const stageIds = unresolvedStageIds(earlierStageIds);
    await Promise.all(
      stageIds.map(async (stageId) => {
        const serverValue = await getServerValue<ServerState>({ id: stageId });
        if (serverValue?.parties && Object.keys(serverValue.parties).length) {
          setStageParties(stageId, serverValue.parties);
        }
      })
    );
  }, [
    earlierAndLaterStageIds,
    unresolvedStageIds,
    getServerValue,
    setStageParties,
  ]);

  // Whether any known friend has completed the CURRENT stage, per the live
  // sessionParties state (not a ref) — this must be a reactive dependency of
  // fetchLaterStageParties, not read out of a ref inside it, so the effect
  // below re-runs (and re-checks) the moment sessionParties itself updates
  // with a friend's completion, rather than racing the restore/poll effect
  // that sets it (both fire independently on mount; a ref read synchronously
  // inside an unrelated mount effect can't be relied on to see it yet).
  const aFriendCompletedCurrentStage = useMemo(
    () =>
      Object.values(sessionParties || {}).some((party) =>
        Object.entries(party?.memberSessions || {}).some(
          ([memberId, session]) =>
            knownFriendIds().has(memberId) && !!session?.state.completed
        )
      ),
    [sessionParties, knownFriendIds]
  );

  // Later-stage refresh: gated on a friend having completed OUR current
  // stage — the one signal we have that they've moved on to a stage we
  // haven't started ourselves (a direct GET there would 404 for us, so this
  // has to go through fetchFriendSessions, a party-scoped bulk list per
  // friend, not a per-user-per-stage GET). Once triggered, applies to every
  // later stage still unresolved in one call, not just the very next one —
  // a friend could already be more than one stage ahead by the time we
  // notice they've left ours.
  const fetchLaterStageParties = useCallback(async () => {
    if (!aFriendCompletedCurrentStage) {
      return;
    }
    const { laterStageIds } = earlierAndLaterStageIds();
    const stageIds = unresolvedStageIds(laterStageIds);
    if (!stageIds.length) {
      return;
    }
    // Built from the snapshot fetchFriendSessions returns directly (see
    // sessionPartiesFromSnapshot above), not getSessionPartiesRef — the
    // provider's friendSessions state wouldn't reflect what was just fetched
    // until its next render, which may not have happened yet here.
    const freshFriendSessions = await fetchFriendSessionsRef.current(
      parties,
      true
    );
    stageIds.forEach((stageId) => {
      const stageParties = sessionPartiesFromSnapshot(
        parties,
        freshFriendSessions,
        `${app}-${stageId}`
      );
      if (Object.keys(stageParties).length) {
        setStageParties(stageId, stageParties);
      }
    });
  }, [
    aFriendCompletedCurrentStage,
    earlierAndLaterStageIds,
    unresolvedStageIds,
    parties,
    app,
    setStageParties,
  ]);

  const fetchOtherStageParties = useCallback(async () => {
    await Promise.all([fetchEarlierStageParties(), fetchLaterStageParties()]);
  }, [fetchEarlierStageParties, fetchLaterStageParties]);

  // Backfill every unresolved other stage once on mount/stage-change (covers
  // a friend who was already ahead of or behind us before we ever opened
  // this run) and then keep it periodically fresh for as long as the
  // RaceTrack itself is the visible screen (showLobby false) — while the
  // Lobby is open instead, its own poll covers the same ground, so this
  // would otherwise be a redundant second poll running at the same time.
  useEffect(() => {
    if (
      !user ||
      !runStageIdsKey ||
      !isDocumentVisible ||
      isPaused ||
      showLobby
    ) {
      return;
    }
    let active = true;
    fetchOtherStageParties();
    const intervalId = setInterval(() => {
      if (active) {
        fetchOtherStageParties();
      }
    }, 30000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [
    user,
    runStageIdsKey,
    isDocumentVisible,
    isPaused,
    showLobby,
    fetchOtherStageParties,
  ]);

  // Answers
  const answer = answerStack[answerStack.length - 1];
  const movesMade = movesOffset + Math.max(answerStack.length - 1, 0);
  const pushAnswer = useCallback(
    (nextAnswer: string) => {
      let completed: GameState['completed'] = undefined;
      if (
        timerRef.current?.inProgress?.lastInteraction &&
        isSolved(parseBoardString(nextAnswer))
      ) {
        stopTimer();
        completed = {
          at: timerRef.current.inProgress.lastInteraction,
          seconds: calculateSeconds(timerRef.current),
        };
        onComplete?.(
          [...answerStack, nextAnswer],
          movesOffset + answerStack.length,
          completed.seconds
        );
      }
      setAnswerStack({
        answerStack: [...answerStack, nextAnswer],
        completed,
      });
      setRedoAnswerStack([]);
    },
    [answerStack, movesOffset, stopTimer, onComplete]
  );

  const pushMove = useCallback(
    (move: Move) => {
      if (completed) {
        return;
      }
      registerInteraction();
      const board = parseBoardString(answer);
      pushAnswer(boardToString(doMove(board, move)));
    },
    [answer, completed, pushAnswer, registerInteraction]
  );

  const reset = useCallback(() => {
    setRedoAnswerStack([]);
    setMovesOffset(0);
    setAnswerStack({ answerStack: [initial] });
    setTimerNewSession(null);
  }, [initial, setTimerNewSession]);

  // Undo and Redo
  // Don't undo initial state
  const isUndoDisabled = answerStack.length < 2;
  const undo = useCallback(() => {
    if (!isUndoDisabled && !completed) {
      const performUndo = () => {
        registerInteraction();
        const lastAnswer = answerStack[answerStack.length - 1];
        setRedoAnswerStack([...redoAnswerStack, lastAnswer]);
        setAnswerStack({
          answerStack: answerStack.slice(0, answerStack.length - 1),
        });
        // Increment the daily counter only for non-subscribers
        if (!isSubscribed) {
          incrementUndoCount();
        }
      };

      if (isSubscribed || canUseUndo()) {
        performUndo();
      } else if (subscribeModal) {
        subscribeModal.showModalIfRequired(
          performUndo,
          () => {},
          SubscriptionContext.UNDO
        );
      }
    }
  }, [
    isUndoDisabled,
    completed,
    answerStack,
    redoAnswerStack,
    registerInteraction,
    isSubscribed,
    subscribeModal,
  ]);
  const isRedoDisabled = !redoAnswerStack.length;
  const redo = useCallback(() => {
    if (!isRedoDisabled && !completed) {
      registerInteraction();
      const lastUndo = redoAnswerStack[redoAnswerStack.length - 1];
      setAnswerStack({ answerStack: [...answerStack, lastUndo] });
      setRedoAnswerStack(redoAnswerStack.slice(0, redoAnswerStack.length - 1));
    }
  }, [
    isRedoDisabled,
    completed,
    answerStack,
    redoAnswerStack,
    registerInteraction,
  ]);

  // Re-key when the stage changes (chain mechanic, SPEC.md §6): the racing
  // chrome stays mounted while this hook swaps to the next stage's board,
  // so the stack must be reset before the new stage's first paint — done as
  // a render-phase state adjustment rather than an effect to avoid a
  // one-frame flash of the previous stage's solved board.
  const [prevPuzzleId, setPrevPuzzleId] = useState(puzzleId);
  if (prevPuzzleId !== puzzleId) {
    setPrevPuzzleId(puzzleId);
    lastSavedAnswerRef.current = null;
    lastInteractionRef.current = Date.now();
    setRedoAnswerStack([]);
    setMovesOffset(0);
    setSessionPartiesLocal({});
    setHasSessionPartiesFromServer(false);
    setAnswerStack({ answerStack: [initial], isDisabled: true });
  }

  // Restore and save state
  useEffect(() => {
    // The Lobby/board entry gate (packages/template AuthGate) keeps this
    // component unmounted until a user is confirmed, so this only guards
    // against the hook being reused somewhere that skips the gate.
    if (!user) {
      return;
    }

    let active = true;

    const { localValue, serverValuePromise } = getValue() || {};
    if (localValue) {
      setMovesOffset(movesOffsetFromRestoredState(localValue.state));
      setAnswerStack({
        answerStack: localValue.state.answerStack,
        isRestored: true,
        isDisabled: true, // disable until heard from server
        completed: localValue.state.completed,
      });
    }

    serverValuePromise.then((serverValue) => {
      if (active) {
        setHasSessionPartiesFromServer(true);
        if (serverValue?.parties && Object.keys(serverValue?.parties).length) {
          setSessionParties(serverValue.parties);
        }
        if (
          serverValue &&
          'state' in serverValue &&
          (!localValue?.lastUpdated ||
            (localValue?.lastUpdated &&
              serverValue?.state &&
              serverValue?.updatedAt &&
              serverValue.updatedAt.getTime() > localValue?.lastUpdated))
        ) {
          // Update local state and timer if server state is newer
          setMovesOffset(movesOffsetFromRestoredState(serverValue.state));
          setAnswerStack({
            answerStack: serverValue.state.answerStack,
            isRestored: true,
            completed: serverValue.state.completed,
          });
          if (!serverValue.state.completed) {
            setTimerNewSession(serverValue.state.timer);
          }
        } else {
          if (
            localValue?.state &&
            localValue?.lastUpdated &&
            ((serverValue &&
              'state' in serverValue &&
              serverValue?.updatedAt?.getTime()) ||
              0) <
              Math.floor(localValue.lastUpdated / 1000) * 1000
          ) {
            // Server value is behind local! Update the server!
            console.warn(
              'Server behind local, updating server',
              (serverValue &&
                'state' in serverValue &&
                serverValue?.updatedAt?.getTime()) ||
                0,
              Math.floor(localValue.lastUpdated / 1000) * 1000
            );
            // Track saveValue call timestamp and increment ignore counter
            lastSaveTimeRef.current = Date.now();
            pollingIgnoreCounterRef.current += 1;
            saveValue(localValue.state).serverValuePromise?.then((result) =>
              handleServerResponse(active, result)
            );
          }
          // Remove disabled flag, heard from server but ignored it
          setAnswerStack((current) => {
            return { ...current, isDisabled: undefined };
          });
        }
      }
    });

    return () => {
      active = false;
    };
  }, [
    user,
    puzzleId,
    initial,
    getValue,
    setTimerNewSession,
    saveValue,
    setSessionParties,
    handleServerResponse,
  ]);

  useEffect(() => {
    let active = true;
    let intervalId: ReturnType<typeof setInterval>;

    const pollGetValue = () => {
      if (!hasSessionParties || !user) {
        return;
      }

      const now = Date.now();
      const timeSinceLastSave = now - lastSaveTimeRef.current;
      const timeSinceLastInteraction = now - lastInteractionRef.current;

      // Only poll if more than 30 seconds has passed since last saveValue call
      // And less than 30 minutes
      // And there are sessions still in progress
      // And the user interacted within the last 5 minutes
      if (
        !isPaused &&
        isDocumentVisible &&
        active &&
        timeSinceLastSave >= 30000 &&
        timeSinceLastSave < 60000 * 30 &&
        (completed || timeSinceLastInteraction < INACTIVITY_MS) &&
        Object.values(sessionPartiesRef.current).find(
          (party) =>
            party &&
            Object.values(party.memberSessions).find(
              (session) => !session?.state.completed
            )
        )
      ) {
        pollingIgnoreCounterRef.current += 1;
        const currentIgnoreCounter = pollingIgnoreCounterRef.current;
        const { serverValuePromise } = getValue() || {};

        serverValuePromise?.then((serverValue) => {
          // Ignore response if a saveValue call happened after this polling request
          if (
            !isPaused &&
            active &&
            pollingIgnoreCounterRef.current === currentIgnoreCounter
          ) {
            if (
              serverValue?.parties &&
              Object.keys(serverValue.parties).length
            ) {
              setSessionParties(serverValue.parties);
            }
          }
        });
      }
    };

    if (active && !isPaused && isDocumentVisible && hasSessionParties && user) {
      intervalId = setInterval(pollGetValue, 30000);
    }

    return () => {
      active = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [
    getValue,
    setSessionParties,
    isPaused,
    isDocumentVisible,
    hasSessionParties,
    user,
    completed,
  ]);

  useEffect(() => {
    let active = true;
    if (!isDisabled && !isRestored && answerStack.length > 0) {
      // Save to the server when the primary piece moved (the racing signal
      // opponents can see), on completion, and on first load — mirrors
      // sudoku's is-correct/completed/first-load policy.
      let isPrimaryMoved = false;
      if (!completed && answerStack.length > 1) {
        const currentAnswer = answerStack[answerStack.length - 1];
        const previousAnswer = answerStack[answerStack.length - 2];
        try {
          isPrimaryMoved =
            parseBoardString(currentAnswer).pieces[0].position !==
            parseBoardString(previousAnswer).pieces[0].position;
        } catch {
          isPrimaryMoved = false;
        }
      }
      const isFirstLoad = answerStack.length === 1;
      const isSaveServerValue: boolean = !!(
        isPrimaryMoved ||
        completed ||
        isFirstLoad
      );
      if (isSaveServerValue) {
        // Track saveValue call timestamp and increment ignore counter
        lastSaveTimeRef.current = Date.now();
        pollingIgnoreCounterRef.current += 1;
      }
      const { serverValuePromise } = saveValue(
        {
          answerStack,
          initial,
          final,
          completed,
          metadata: {
            ...metadata,
            movesMade: String(movesMade),
            mode,
            agentNames,
          },
        },
        isSaveServerValue
      );
      serverValuePromise?.then((result) =>
        handleServerResponse(active, result)
      );
    }
    return () => {
      active = false;
    };
  }, [
    puzzleId,
    answerStack,
    movesMade,
    saveValue,
    isRestored,
    initial,
    final,
    isDisabled,
    completed,
    metadata,
    mode,
    agentNames,
    handleServerResponse,
  ]);

  // Handle keyboard
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      const insideForm = /^(?:input|textarea|select|button)$/i.test(
        (<HTMLElement>e.target)?.tagName
      );
      if (completed || showLobby || insideForm) {
        return;
      }
      if (e.key === 'z') {
        undo();
        e.preventDefault();
      } else if (e.key === 'y') {
        redo();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', keydownHandler);
    return () => {
      window.removeEventListener('keydown', keydownHandler);
    };
  }, [redo, undo, completed, showLobby]);

  const [isPolling, setIsPolling] = useState(false);
  const refreshSessionParties = useCallback(async () => {
    setIsPolling(true);
    try {
      const { serverValuePromise } = getValue() || {};
      // Refreshes the whole run's stages alongside the current one: called
      // both by the manual refresh button (shown once the stage is
      // finished) and by PartiesProvider's refreshParties, which the Lobby
      // polls every 30s while open — this is what keeps other-stage
      // opponent presence fresh while the Lobby is the visible screen,
      // taking over from the RaceTrack-only interval above (which stops
      // polling once showLobby is true, to avoid the two overlapping).
      const [serverValue] = await Promise.all([
        serverValuePromise,
        fetchOtherStageParties(),
      ]);
      if (serverValue?.parties && Object.keys(serverValue?.parties).length) {
        setSessionParties(serverValue.parties);
      }
    } finally {
      setIsPolling(false);
    }
  }, [getValue, setSessionParties, fetchOtherStageParties]);

  // Check for inactivity and pause timer/polling if no interaction in 5 minutes
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (!completed) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const timeSinceLastInteraction = now - lastInteractionRef.current;

        if (timeSinceLastInteraction >= INACTIVITY_MS) {
          if (!isPaused && !isPausedDueToInactivity) {
            setIsPausedDueToInactivity(true);
            setPauseTimer(true);
          }
        } else {
          if (isPausedDueToInactivity) {
            setIsPausedDueToInactivity(false);
            setPauseTimer(false);
          }
        }
      }, 60000); // Check every minute
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [completed, isPaused, isPausedDueToInactivity, setPauseTimer]);

  return {
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
    isPaused,
    registerInteraction,
    mode,
    setMode,
    agentNames,
    setAgentNames,
  };
}

export { useGameState };
