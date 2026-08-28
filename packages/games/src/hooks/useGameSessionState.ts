import { Dispatch, RefObject, SetStateAction, useEffect } from 'react';
import {
  Parties,
  ServerStateNotFoundResult,
  ServerStateResult,
  Session,
} from '@bubblyclouds-app/types/serverTypes';
import { Timer } from '@bubblyclouds-app/template/types/timer';

const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes in milliseconds, mirrors games/hooks/inactivityPause

interface RestorableState<StackItem> {
  answerStack: StackItem[];
  completed?: unknown;
}

interface RestorableServerState<StackItem> extends RestorableState<StackItem> {
  timer?: Timer;
}

interface AnswerStackState<StackItem, Completed> {
  answerStack: StackItem[];
  isRestored?: boolean;
  isDisabled?: boolean;
  completed?: Completed;
}

// Shared between unblockrace and sudoku's gameState hooks: restores local
// then server state on mount (pushing local back to the server if it turns
// out to be ahead), and periodically polls session parties every 30s while
// other in-progress sessions exist. The save effect stays in each caller —
// it differs meaningfully per game (unblockrace: primary-piece-moved +
// movesMade; sudoku: is-correct + selectedCell).
function useGameSessionState<
  StackItem,
  LocalState extends RestorableState<StackItem>,
  State extends RestorableServerState<StackItem>,
>({
  user,
  puzzleId,
  getValue,
  setAnswerStack,
  setTimerNewSession,
  saveValue,
  setSessionParties,
  handleServerResponse,
  lastSaveTimeRef,
  pollingIgnoreCounterRef,
  lastInteractionRef,
  sessionPartiesRef,
  isPaused,
  isDocumentVisible,
  hasSessionParties,
  completed,
  computeMovesOffset,
  setMovesOffset,
  onRestoreServerValue,
}: {
  user: unknown;
  puzzleId: string;
  getValue: () => {
    localValue: { lastUpdated: number; state: LocalState } | undefined;
    serverValuePromise: Promise<
      ServerStateResult<State> | ServerStateNotFoundResult<State> | undefined
    >;
  };
  setAnswerStack: Dispatch<
    SetStateAction<AnswerStackState<StackItem, LocalState['completed']>>
  >;
  setTimerNewSession: (timer?: Timer | null) => void;
  saveValue: (
    state: LocalState,
    isSaveServerValue?: boolean
  ) => {
    localValue: { lastUpdated: number; state: LocalState } | undefined;
    serverValuePromise?: Promise<ServerStateResult<State> | undefined>;
  };
  setSessionParties: (parties: Parties<Session<State>>) => void;
  handleServerResponse: (
    active: boolean,
    serverValue: ServerStateResult<State> | undefined
  ) => void;
  lastSaveTimeRef: RefObject<number>;
  pollingIgnoreCounterRef: RefObject<number>;
  // Last committed-move (unblockrace) or selected-cell-change (sudoku)
  // timestamp — read, never written, by the poll effect's inactivity gate.
  lastInteractionRef: RefObject<number>;
  // Read inside the poll effect without tearing down/recreating the interval
  // on every session-parties update.
  sessionPartiesRef: RefObject<Parties<Session<State>>>;
  isPaused: boolean;
  isDocumentVisible: boolean;
  hasSessionParties: number | boolean;
  completed: unknown;
  // Persisted answer stacks are truncated, so restoring one under-counts
  // moves; unblockrace supplies this to recover the true count from
  // metadata.movesMade. Sudoku has no such concept and omits it.
  computeMovesOffset?: (state: LocalState | State) => number;
  setMovesOffset?: (offset: number) => void;
  // Fired once the stage's own server GET resolves, whether or not that
  // response ends up updating local state — distinct from isRestored, which
  // can flip true from local storage alone. Only unblockrace's Lobby needs
  // this signal today.
  onRestoreServerValue?: (hasRestoredFromServer: true) => void;
}) {
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
      setMovesOffset?.(computeMovesOffset?.(localValue.state) ?? 0);
      setAnswerStack({
        answerStack: localValue.state.answerStack,
        isRestored: true,
        isDisabled: true, // disable until heard from server
        completed: localValue.state.completed,
      });
    }

    serverValuePromise.then((serverValue) => {
      if (active) {
        onRestoreServerValue?.(true);
        if (serverValue?.parties && Object.keys(serverValue?.parties).length) {
          setSessionParties(serverValue.parties);
        }
        if (
          serverValue &&
          'state' in serverValue &&
          serverValue?.state &&
          (!localValue?.lastUpdated ||
            (localValue?.lastUpdated &&
              serverValue?.updatedAt &&
              serverValue.updatedAt.getTime() > localValue?.lastUpdated))
        ) {
          // Update local state and timer if server state is newer
          setMovesOffset?.(computeMovesOffset?.(serverValue.state) ?? 0);
          setAnswerStack({
            answerStack: serverValue.state.answerStack,
            isRestored: true,
            completed: serverValue.state.completed,
          });
          if (!serverValue.state.completed) {
            setTimerNewSession(serverValue.state.timer);
          }
        } else {
          const serverUpdatedAt =
            (serverValue &&
              'state' in serverValue &&
              serverValue?.updatedAt?.getTime()) ||
            0;
          if (
            localValue?.state &&
            localValue?.lastUpdated &&
            serverUpdatedAt < Math.floor(localValue.lastUpdated / 1000) * 1000
          ) {
            // Server value is behind local (or has never seen this puzzle)!
            // Update the server!
            console.warn(
              'Server behind local, updating server',
              serverUpdatedAt,
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
    getValue,
    setAnswerStack,
    setTimerNewSession,
    saveValue,
    setSessionParties,
    handleServerResponse,
    computeMovesOffset,
    setMovesOffset,
    onRestoreServerValue,
    lastSaveTimeRef,
    pollingIgnoreCounterRef,
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
    lastSaveTimeRef,
    lastInteractionRef,
    sessionPartiesRef,
    pollingIgnoreCounterRef,
  ]);
}

export { useGameSessionState };
