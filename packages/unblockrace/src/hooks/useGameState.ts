'use client';

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Move } from '../types/board';
import { GameState, GameStateMetadata, ServerState } from '../types/state';
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
  ServerStateResult,
  Session,
} from '@bubblyclouds-app/types/serverTypes';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { useDocumentVisibility } from '@bubblyclouds-app/template/hooks/documentVisibility';
import { useSessions } from '@bubblyclouds-app/template/providers/SessionsProvider';
import { useParties } from '@bubblyclouds-app/template/hooks/useParties';

const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

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
  initialShowLobby,
  onComplete,
}: {
  final: string;
  initial: string;
  puzzleId: string;
  metadata: Partial<GameStateMetadata>;
  app: string;
  apiUrl: string;
  initialShowLobby?: boolean;
  onComplete?: (
    answerStack: string[],
    movesMade: number,
    seconds: number
  ) => void;
}) {
  const context = useContext(UserContext);
  const { user } = context || {};
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
  const { getSessionParties, patchFriendSessions } = useSessions<ServerState>();

  const [showLobby, setShowLobby] = useState(initialShowLobby ?? false);
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
  const setSessionParties = useCallback(
    (sessionParties: Parties<Session<ServerState>>) => {
      setSessionPartiesLocal(sessionParties);
      const partySessions = Object.values(sessionParties || {});
      const userSessions: { [userId: string]: Session<ServerState> } = {};
      for (const partySession of partySessions) {
        if (partySession?.memberSessions) {
          Object.assign(userSessions, partySession.memberSessions);
        }
      }
      patchFriendSessions(`${app}-${puzzleId}`, userSessions);
    },
    [patchFriendSessions, app, puzzleId]
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
    serverValuePromise: Promise<ServerStateResult<ServerState> | undefined>;
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
      registerInteraction();
      const lastAnswer = answerStack[answerStack.length - 1];
      setRedoAnswerStack([...redoAnswerStack, lastAnswer]);
      setAnswerStack({
        answerStack: answerStack.slice(0, answerStack.length - 1),
      });
    }
  }, [
    isUndoDisabled,
    completed,
    answerStack,
    redoAnswerStack,
    registerInteraction,
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
    setRedoAnswerStack([]);
    setMovesOffset(0);
    setSessionPartiesLocal({});
    setAnswerStack({ answerStack: [initial], isDisabled: true });
  }

  // Restore and save state
  useEffect(() => {
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
        if (serverValue?.parties && Object.keys(serverValue?.parties).length) {
          setSessionParties(serverValue.parties);
        }
        if (
          serverValue &&
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
            (serverValue?.updatedAt?.getTime() || 0) <
              Math.floor(localValue.lastUpdated / 1000) * 1000
          ) {
            // Server value is behind local! Update the server!
            console.warn(
              'Server behind local, updating server',
              serverValue?.updatedAt?.getTime() || 0,
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
        Object.values(sessionParties).find(
          (party) =>
            party &&
            Object.values(party.memberSessions).find(
              (session) => !session?.state.completed
            )
        )
      ) {
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
    sessionParties,
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
          metadata: { ...metadata, movesMade: String(movesMade) },
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
      const serverValue = await serverValuePromise;
      if (serverValue?.parties && Object.keys(serverValue?.parties).length) {
        setSessionParties(serverValue.parties);
      }
    } finally {
      setIsPolling(false);
    }
  }, [getValue, setSessionParties]);

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
    showLobby,
    setShowLobby,
    isPaused,
    registerInteraction,
  };
}

export { useGameState };
