import { renderHook, act } from '@testing-library/react';
import { useRef } from 'react';
import {
  Parties,
  ServerStateNotFoundResult,
  ServerStateResult,
  Session,
} from '@bubblyclouds-app/types/serverTypes';
import { Timer } from '@bubblyclouds-app/template/types/timer';
import { useGameSessionState } from './useGameSessionState';

interface TestState {
  answerStack: string[];
  completed?: { at: string; seconds: number };
  timer?: Timer;
}

const puzzleId = 'puzzle-1';
const testUser = { sub: 'user-1' };

const setAnswerStack = jest.fn();
const setTimerNewSession = jest.fn();
const saveValue = jest.fn();
const setSessionParties = jest.fn();
const handleServerResponse = jest.fn();
const getValue = jest.fn();
const setMovesOffset = jest.fn();
const onRestoreServerValue = jest.fn();

const friendSession = (completed?: {
  at: string;
  seconds: number;
}): Session<TestState> => ({
  sessionId: `app-${puzzleId}`,
  state: { answerStack: ['x'], completed },
  updatedAt: new Date(),
});

const partiesWithFriend = (completed?: {
  at: string;
  seconds: number;
}): Parties<Session<TestState>> => ({
  party1: { memberSessions: { friend: friendSession(completed) } },
});

type SessionStateProps = Partial<
  Parameters<typeof useGameSessionState<string, TestState, TestState>>[0]
>;

function renderSessionState(overrides: SessionStateProps = {}) {
  return renderHook(
    (props: SessionStateProps) => {
      const lastSaveTimeRef = useRef(Date.now());
      const pollingIgnoreCounterRef = useRef(0);
      const lastInteractionRef = useRef(Date.now());
      const sessionPartiesRef =
        useRef<Parties<Session<TestState>>>(partiesWithFriend());
      return useGameSessionState<string, TestState, TestState>({
        user: testUser,
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
        isPaused: false,
        isDocumentVisible: true,
        hasSessionParties: 0,
        completed: undefined,
        ...props,
      });
    },
    { initialProps: overrides }
  );
}

describe('useGameSessionState', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setAnswerStack.mockReset();
    setTimerNewSession.mockReset();
    saveValue.mockReset().mockReturnValue({ localValue: undefined });
    setSessionParties.mockReset();
    handleServerResponse.mockReset();
    getValue.mockReset();
    setMovesOffset.mockReset();
    onRestoreServerValue.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('restore effect', () => {
    it('restores local state immediately, disabled until the server responds', async () => {
      let resolveServer: (
        _value:
          | ServerStateResult<TestState>
          | ServerStateNotFoundResult<TestState>
          | undefined
      ) => void;
      const serverValuePromise = new Promise<
        | ServerStateResult<TestState>
        | ServerStateNotFoundResult<TestState>
        | undefined
      >((resolve) => {
        resolveServer = resolve;
      });
      getValue.mockReturnValue({
        localValue: { lastUpdated: 1000, state: { answerStack: ['a', 'b'] } },
        serverValuePromise,
      });

      renderSessionState();

      expect(setAnswerStack).toHaveBeenCalledWith({
        answerStack: ['a', 'b'],
        isRestored: true,
        isDisabled: true,
        completed: undefined,
      });

      await act(async () => {
        resolveServer!(undefined);
      });
    });

    it('applies server state when newer than local and starts the timer', async () => {
      const serverValue: ServerStateResult<TestState> = {
        sessionId: `app-${puzzleId}`,
        state: { answerStack: ['a', 'b', 'c'] },
        updatedAt: new Date(5000),
      };
      getValue.mockReturnValue({
        localValue: { lastUpdated: 1000, state: { answerStack: ['a'] } },
        serverValuePromise: Promise.resolve(serverValue),
      });

      renderSessionState();
      await act(async () => {});

      expect(setAnswerStack).toHaveBeenCalledWith({
        answerStack: ['a', 'b', 'c'],
        isRestored: true,
        completed: undefined,
      });
      expect(setTimerNewSession).toHaveBeenCalled();
    });

    it('does not start the timer when the newer server state is completed', async () => {
      const completed = { at: '2024-01-01', seconds: 30 };
      const serverValue: ServerStateResult<TestState> = {
        sessionId: `app-${puzzleId}`,
        state: { answerStack: ['a', 'b'], completed },
        updatedAt: new Date(5000),
      };
      getValue.mockReturnValue({
        localValue: { lastUpdated: 1000, state: { answerStack: ['a'] } },
        serverValuePromise: Promise.resolve(serverValue),
      });

      renderSessionState();
      await act(async () => {});

      expect(setTimerNewSession).not.toHaveBeenCalled();
    });

    it('pushes local state back to the server when local is newer, and clears isDisabled', async () => {
      const serverValue: ServerStateResult<TestState> = {
        sessionId: `app-${puzzleId}`,
        state: { answerStack: ['a'] },
        updatedAt: new Date(1000),
      };
      const localState = { answerStack: ['a', 'b'] };
      getValue.mockReturnValue({
        localValue: { lastUpdated: 60000, state: localState },
        serverValuePromise: Promise.resolve(serverValue),
      });
      saveValue.mockReturnValue({
        localValue: undefined,
        serverValuePromise: Promise.resolve(undefined),
      });

      renderSessionState();
      await act(async () => {});

      expect(saveValue).toHaveBeenCalledWith(localState);
      const updater = setAnswerStack.mock.calls.at(-1)?.[0];
      expect(typeof updater).toBe('function');
      expect(updater({ answerStack: ['a', 'b'], isDisabled: true })).toEqual({
        answerStack: ['a', 'b'],
        isDisabled: undefined,
      });
    });

    it('reports session parties from the server response', async () => {
      const serverValue: ServerStateResult<TestState> = {
        sessionId: `app-${puzzleId}`,
        state: { answerStack: ['a'] },
        updatedAt: new Date(1000),
        parties: partiesWithFriend(),
      };
      getValue.mockReturnValue({
        localValue: undefined,
        serverValuePromise: Promise.resolve(serverValue),
      });

      renderSessionState();
      await act(async () => {});

      expect(setSessionParties).toHaveBeenCalledWith(partiesWithFriend());
    });

    it('computes moves offset from restored state when supplied', async () => {
      getValue.mockReturnValue({
        localValue: { lastUpdated: 1000, state: { answerStack: ['a', 'b'] } },
        serverValuePromise: Promise.resolve(undefined),
      });

      renderSessionState({
        computeMovesOffset: () => 5,
        setMovesOffset,
      });

      expect(setMovesOffset).toHaveBeenCalledWith(5);
    });

    it('notifies onRestoreServerValue once the server GET resolves', async () => {
      getValue.mockReturnValue({
        localValue: undefined,
        serverValuePromise: Promise.resolve(undefined),
      });

      renderSessionState({ onRestoreServerValue });
      await act(async () => {});

      expect(onRestoreServerValue).toHaveBeenCalledWith(true);
    });

    it('does not run when there is no confirmed user', () => {
      renderSessionState({ user: undefined });
      expect(getValue).not.toHaveBeenCalled();
    });
  });

  describe('30s poll effect', () => {
    const eligibleOverrides = () => ({
      hasSessionParties: 1,
    });

    it('polls after 30s when eligible and applies session parties', async () => {
      getValue.mockReturnValue({
        localValue: undefined,
        serverValuePromise: Promise.resolve(undefined),
      });
      const { rerender } = renderSessionState(eligibleOverrides());
      await act(async () => {});
      getValue.mockClear();

      const parties = partiesWithFriend();
      const pollServerValue: ServerStateResult<TestState> = {
        sessionId: `app-${puzzleId}`,
        state: { answerStack: ['a'] },
        updatedAt: new Date(),
        parties,
      };
      getValue.mockReturnValue({
        localValue: undefined,
        serverValuePromise: Promise.resolve(pollServerValue),
      });

      rerender(eligibleOverrides());

      await act(async () => {
        jest.advanceTimersByTime(30000);
        await Promise.resolve();
      });

      expect(getValue).toHaveBeenCalled();
      expect(setSessionParties).toHaveBeenCalledWith(parties);
    });

    it('does not poll while paused', async () => {
      getValue.mockReturnValue({
        localValue: undefined,
        serverValuePromise: Promise.resolve(undefined),
      });
      renderSessionState({ ...eligibleOverrides(), isPaused: true });
      await act(async () => {});
      getValue.mockClear();

      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      expect(getValue).not.toHaveBeenCalled();
    });

    it('does not poll while the document is hidden', async () => {
      getValue.mockReturnValue({
        localValue: undefined,
        serverValuePromise: Promise.resolve(undefined),
      });
      renderSessionState({ ...eligibleOverrides(), isDocumentVisible: false });
      await act(async () => {});
      getValue.mockClear();

      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      expect(getValue).not.toHaveBeenCalled();
    });

    it('does not poll when there are no session parties', async () => {
      getValue.mockReturnValue({
        localValue: undefined,
        serverValuePromise: Promise.resolve(undefined),
      });
      renderSessionState({ hasSessionParties: 0 });
      await act(async () => {});
      getValue.mockClear();

      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      expect(getValue).not.toHaveBeenCalled();
    });

    it('does not poll once inactive beyond the inactivity window unless completed', async () => {
      getValue.mockReturnValue({
        localValue: undefined,
        serverValuePromise: Promise.resolve(undefined),
      });
      const staleInteractionRef = { current: Date.now() };
      const { rerender } = renderHook(
        (props: SessionStateProps) => {
          const lastSaveTimeRef = useRef(0);
          const pollingIgnoreCounterRef = useRef(0);
          const sessionPartiesRef =
            useRef<Parties<Session<TestState>>>(partiesWithFriend());
          return useGameSessionState<string, TestState, TestState>({
            user: testUser,
            puzzleId,
            getValue,
            setAnswerStack,
            setTimerNewSession,
            saveValue,
            setSessionParties,
            handleServerResponse,
            lastSaveTimeRef,
            pollingIgnoreCounterRef,
            lastInteractionRef: staleInteractionRef,
            sessionPartiesRef,
            isPaused: false,
            isDocumentVisible: true,
            hasSessionParties: 1,
            completed: undefined,
            ...props,
          });
        },
        { initialProps: {} }
      );
      await act(async () => {});
      getValue.mockClear();

      staleInteractionRef.current = Date.now() - 6 * 60 * 1000;
      rerender({});

      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      expect(getValue).not.toHaveBeenCalled();
    });

    it('ignores a poll response superseded by a later saveValue call', async () => {
      getValue.mockReturnValue({
        localValue: undefined,
        serverValuePromise: Promise.resolve(undefined),
      });
      let resolvePoll: (
        _value: ServerStateResult<TestState> | undefined
      ) => void;
      const pollingIgnoreCounterRef = { current: 0 };
      const { rerender } = renderHook(
        (props: SessionStateProps) => {
          const lastSaveTimeRef = useRef(Date.now());
          const lastInteractionRef = useRef(Date.now());
          const sessionPartiesRef =
            useRef<Parties<Session<TestState>>>(partiesWithFriend());
          return useGameSessionState<string, TestState, TestState>({
            user: testUser,
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
            isPaused: false,
            isDocumentVisible: true,
            hasSessionParties: 1,
            completed: undefined,
            ...props,
          });
        },
        { initialProps: {} }
      );
      await act(async () => {});

      getValue.mockReturnValue({
        localValue: undefined,
        serverValuePromise: new Promise((resolve) => {
          resolvePoll = resolve;
        }),
      });
      rerender({});

      act(() => {
        jest.advanceTimersByTime(30000);
      });
      expect(resolvePoll!).toBeDefined();

      // A save happens after the poll request goes out but before it resolves
      pollingIgnoreCounterRef.current += 1;
      setSessionParties.mockClear();

      await act(async () => {
        resolvePoll!({
          sessionId: `app-${puzzleId}`,
          state: { answerStack: ['a'] },
          updatedAt: new Date(),
          parties: partiesWithFriend(),
        });
      });

      expect(setSessionParties).not.toHaveBeenCalled();
    });
  });
});
