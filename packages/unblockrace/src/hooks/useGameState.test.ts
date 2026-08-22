import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { useGameState } from './useGameState';
import { solvedBoardString } from '../helpers/boardToString';
import { GameStateMetadata } from '../types/state';

// The mocked hook callbacks must be stable across renders (as the real
// hooks' are): the restore effect depends on them, and a new identity per
// render would re-run it forever once a local value is restored.
const stopTimer = jest.fn();
let mockTimer: object = {};
const localGetValue = jest.fn();
const localSaveValue = jest.fn();
const serverGetValue = jest.fn();
const serverSaveValue = jest.fn();
const setTimerNewSession = jest.fn();
const setPauseTimer = jest.fn();
const getSessionParties = jest.fn();
const patchFriendSessions = jest.fn();
const fetchFriendSessions = jest.fn();
const lazyLoadFriendSessions = jest.fn();

jest.mock('@bubblyclouds-app/template/hooks/localStorage', () => ({
  useLocalStorage: () => ({
    getValue: localGetValue,
    saveValue: localSaveValue,
  }),
}));
jest.mock('@bubblyclouds-app/template/hooks/serverStorage', () => ({
  useServerStorage: () => ({
    getValue: serverGetValue,
    saveValue: serverSaveValue,
  }),
}));
jest.mock('@bubblyclouds-app/template/hooks/timer', () => ({
  useTimer: () => ({
    timer: mockTimer,
    setTimerNewSession,
    stopTimer,
    setPauseTimer,
    isPaused: false,
  }),
}));
// A stable array reference: fetchOtherStageParties depends on `parties`, and
// a fresh [] literal every render (as useParties would return if not
// memoised here) would give it a new identity every render, retriggering
// the effect that calls it in a loop. Mutated in place (not reassigned) by
// tests that need a real party, so the reference itself never changes.
const emptyParties: unknown[] = [];
jest.mock('@bubblyclouds-app/template/hooks/useParties', () => ({
  useParties: () => ({ parties: emptyParties }),
}));
jest.mock('@bubblyclouds-app/auth/providers/AuthProvider', () => ({
  UserContext: React.createContext({
    user: { sub: 'user-1' },
    isInitialised: true,
  }),
}));
// getSessionParties/fetchFriendSessions get a NEW function identity on every
// call, mirroring the real SessionsProvider (their useCallback deps include
// friendSessions/isFriendSessionsLoading, which patchFriendSessions itself
// changes on every write) — a regression here previously fed straight back
// into fetchOtherStageParties's own dependency array via useEffect and
// looped forever, making hundreds of requests. Wrapping the shared jest.fn()
// in a fresh arrow function each render reproduces that churn while still
// routing through one spy the tests can assert call counts on.
jest.mock('@bubblyclouds-app/template/providers/SessionsProvider', () => ({
  useSessions: () => ({
    getSessionParties: (...args: Parameters<typeof getSessionParties>) =>
      getSessionParties(...args),
    patchFriendSessions,
    fetchFriendSessions: (...args: Parameters<typeof fetchFriendSessions>) =>
      fetchFriendSessions(...args),
    lazyLoadFriendSessions,
  }),
}));

const INITIAL = [
  'oooooo',
  'oooooo',
  'AAoBoo',
  'oooBoo',
  'oooooo',
  'oooooo',
].join('');

// A one step right of INITIAL
const A_MOVED = [
  'oooooo',
  'oooooo',
  'oAABoo',
  'oooBoo',
  'oooooo',
  'oooooo',
].join('');

describe('useGameState', () => {
  const metadata: Partial<GameStateMetadata> = { difficulty: 'beginner' };

  const defaultProps = {
    initial: INITIAL,
    final: solvedBoardString(INITIAL),
    puzzleId: INITIAL,
    metadata,
    app: 'unblockrace',
    apiUrl: 'https://api.test.com',
  };

  beforeEach(() => {
    mockTimer = {};
    stopTimer.mockClear();
    localGetValue.mockReset();
    localSaveValue.mockReset();
    serverGetValue.mockReset().mockResolvedValue(undefined);
    serverSaveValue.mockReset().mockResolvedValue(undefined);
    getSessionParties.mockReset().mockReturnValue({});
    patchFriendSessions.mockReset();
    fetchFriendSessions.mockReset().mockResolvedValue({});
    lazyLoadFriendSessions.mockReset().mockResolvedValue(undefined);
    emptyParties.length = 0;
  });

  it('initializes with the initial board as the answer', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    expect(result.current.answer).toBe(INITIAL);
    expect(result.current.isUndoDisabled).toBe(true);
    expect(result.current.isRedoDisabled).toBe(true);
  });

  // Login is required before UnblockRace mounts at all (gated by
  // packages/template's AuthGate in the Lobby/board entry flow), so this
  // hook no longer needs to defend against a signed-out session itself -
  // this only guards the hook being reused somewhere that skips the gate.
  it('does not run the restore effect without a confirmed user', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        UserContext.Provider,
        { value: { user: undefined, isInitialised: true } as any },
        children
      );

    renderHook(() => useGameState(defaultProps), { wrapper });
    await act(async () => {});

    expect(serverGetValue).not.toHaveBeenCalled();
    expect(localGetValue).not.toHaveBeenCalled();
  });

  it('applies a move via pushMove', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    act(() => {
      result.current.pushMove({ piece: 0, steps: 1 });
    });
    expect(result.current.answer).toBe(A_MOVED);
    expect(result.current.answerStack).toHaveLength(2);
  });

  it('handles undo and redo of moves', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    act(() => {
      result.current.pushMove({ piece: 0, steps: 1 });
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.answer).toBe(INITIAL);
    expect(result.current.isRedoDisabled).toBe(false);
    act(() => {
      result.current.redo();
    });
    expect(result.current.answer).toBe(A_MOVED);
  });

  it('resets to the initial board', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    act(() => {
      result.current.pushMove({ piece: 0, steps: 1 });
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.answer).toBe(INITIAL);
    expect(result.current.isUndoDisabled).toBe(true);
  });

  it('completes when the primary piece reaches the exit', () => {
    mockTimer = {
      seconds: 0,
      inProgress: {
        start: new Date().toISOString(),
        lastInteraction: new Date().toISOString(),
      },
    };
    const onComplete = jest.fn();
    const { result } = renderHook(() =>
      useGameState({ ...defaultProps, onComplete })
    );
    act(() => {
      result.current.pushMove({ piece: 1, steps: 2 });
    });
    expect(result.current.completed).toBeUndefined();
    act(() => {
      result.current.pushMove({ piece: 0, steps: 4 });
    });
    expect(result.current.completed).toBeDefined();
    expect(stopTimer).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledWith(
      expect.any(Array),
      2,
      expect.any(Number)
    );
  });

  it('ignores moves after completion', () => {
    mockTimer = {
      inProgress: {
        start: new Date().toISOString(),
        lastInteraction: new Date().toISOString(),
      },
    };
    const { result } = renderHook(() => useGameState(defaultProps));
    act(() => {
      result.current.pushMove({ piece: 1, steps: 2 });
    });
    act(() => {
      result.current.pushMove({ piece: 0, steps: 4 });
    });
    const stackLength = result.current.answerStack.length;
    act(() => {
      result.current.pushMove({ piece: 1, steps: -1 });
    });
    expect(result.current.answerStack).toHaveLength(stackLength);
  });

  it('resets the stack when the stage (puzzleId) changes', () => {
    const nextInitial = [
      'oooooo',
      'oooooo',
      'ooAAoo',
      'oooooo',
      'oooooo',
      'oooooo',
    ].join('');
    const { result, rerender } = renderHook(
      (props: Parameters<typeof useGameState>[0]) => useGameState(props),
      { initialProps: defaultProps }
    );
    act(() => {
      result.current.pushMove({ piece: 0, steps: 1 });
    });
    expect(result.current.answerStack).toHaveLength(2);
    rerender({
      ...defaultProps,
      initial: nextInitial,
      final: solvedBoardString(nextInitial),
      puzzleId: nextInitial,
    });
    expect(result.current.answer).toBe(nextInitial);
    expect(result.current.answerStack).toHaveLength(1);
    expect(result.current.isUndoDisabled).toBe(true);
  });

  it('tracks movesMade through moves, undo, redo and reset', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    expect(result.current.movesMade).toBe(0);
    act(() => {
      result.current.pushMove({ piece: 0, steps: 1 });
    });
    expect(result.current.movesMade).toBe(1);
    act(() => {
      result.current.undo();
    });
    expect(result.current.movesMade).toBe(0);
    act(() => {
      result.current.redo();
    });
    expect(result.current.movesMade).toBe(1);
    act(() => {
      result.current.reset();
    });
    expect(result.current.movesMade).toBe(0);
  });

  it('restores the true move count from persisted metadata', async () => {
    // Persisted answer stacks are truncated, so the stack alone would
    // under-count the 7 moves this session already made
    localGetValue.mockReturnValue({
      lastUpdated: Date.now(),
      state: {
        initial: INITIAL,
        final: solvedBoardString(INITIAL),
        answerStack: [INITIAL, A_MOVED],
        metadata: { movesMade: '7' },
      },
    });
    const { result } = renderHook(() => useGameState(defaultProps));
    await act(async () => {});
    expect(result.current.answerStack).toHaveLength(2);
    expect(result.current.movesMade).toBe(7);
    act(() => {
      result.current.pushMove({ piece: 0, steps: -1 });
    });
    expect(result.current.movesMade).toBe(8);
  });

  it('persists movesMade in the saved metadata', async () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    await act(async () => {});
    act(() => {
      result.current.pushMove({ piece: 0, steps: 1 });
    });
    expect(localSaveValue).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ movesMade: '1' }),
      })
    );
  });

  it('toggles lobby visibility', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    act(() => {
      result.current.setShowLobby(true);
    });
    expect(result.current.showLobby).toBe(true);
  });

  it('persists the initial mode and agent names into saved metadata', async () => {
    const { result } = renderHook(() =>
      useGameState({
        ...defaultProps,
        initialMode: 'ai',
        initialAgentNames: 'Bumblebee,Sage',
      })
    );
    await act(async () => {});
    expect(result.current.mode).toBe('ai');
    expect(result.current.agentNames).toBe('Bumblebee,Sage');
    act(() => {
      result.current.pushMove({ piece: 0, steps: 1 });
    });
    expect(localSaveValue).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          mode: 'ai',
          agentNames: 'Bumblebee,Sage',
        }),
      })
    );
  });

  it('persists mode and agent names set through the exposed setters', async () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    await act(async () => {});
    act(() => {
      result.current.setMode('ai');
      result.current.setAgentNames('Puddle');
    });
    act(() => {
      result.current.pushMove({ piece: 0, steps: 1 });
    });
    expect(localSaveValue).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          mode: 'ai',
          agentNames: 'Puddle',
        }),
      })
    );
  });

  describe('chained-run stage sessions', () => {
    // An earlier stage in the run (already played by us) and a later one
    // (never started by us), each identified by their board string.
    const STAGE_0 = [
      'oooooo',
      'oooooo',
      'ooBBoo',
      'oooooo',
      'oooooo',
      'oooooo',
    ].join('');
    const STAGE_2 = [
      'oooooo',
      'oooooo',
      'ooAAoo',
      'oooooo',
      'oooooo',
      'oooooo',
    ].join('');

    const friendSessionFor = (stageId: string, seconds?: number) => ({
      sessionId: `unblockrace-${stageId}`,
      state: {
        initial: stageId,
        final: solvedBoardString(stageId),
        answerStack: [stageId],
        completed:
          seconds === undefined
            ? undefined
            : { at: new Date().toISOString(), seconds },
      },
      updatedAt: new Date(),
    });
    const friendSession = (seconds?: number) =>
      friendSessionFor(STAGE_2, seconds);

    // Current stage's own session, from the restore/save/poll path
    // (unaffected by the fetchFriendSessions change) — a friend has NOT
    // completed the current stage by default. Also answers earlier-stage
    // GETs (options.id === STAGE_0) when earlierFriendCompletedSeconds is
    // given, since a stage we've already played is fetched via a direct
    // per-stage GET, not fetchFriendSessions.
    const mockCurrentStageResponse = (
      friendCompletedSeconds?: number,
      earlierFriendCompletedSeconds?: number
    ) => {
      serverGetValue.mockImplementation(async (options?: { id?: string }) => {
        if (options?.id === STAGE_0) {
          return {
            sessionId: `unblockrace-${STAGE_0}`,
            state: {
              initial: STAGE_0,
              final: solvedBoardString(STAGE_0),
              answerStack: [STAGE_0],
            },
            parties: {
              party1: {
                memberSessions: {
                  friend: friendSessionFor(
                    STAGE_0,
                    earlierFriendCompletedSeconds
                  ),
                },
              },
            },
            updatedAt: new Date(),
          };
        }
        if (options?.id) {
          return undefined;
        }
        return {
          sessionId: `unblockrace-${INITIAL}`,
          state: {
            initial: INITIAL,
            final: solvedBoardString(INITIAL),
            answerStack: [INITIAL],
          },
          parties: {
            party1: {
              memberSessions: {
                friend: friendSession(friendCompletedSeconds),
              },
            },
          },
          updatedAt: new Date(),
        };
      });
    };

    // Other-stage data now comes directly from fetchFriendSessions's
    // RETURNED snapshot (built into runStageParties via
    // sessionPartiesFromSnapshot in useGameState.ts) — not from reading
    // getSessionParties/the SessionsProvider context afterwards, which
    // wouldn't reflect a just-completed fetch until the provider's next
    // render. useParties()'s `parties` needs a real party too, since
    // sessionPartiesFromSnapshot keys its result by party.partyId.
    const mockOtherStageParties = () => {
      emptyParties.push({
        partyId: 'party1',
        partyName: 'Party 1',
        members: [{ userId: 'friend', memberNickname: 'Player 2' }],
      });
      fetchFriendSessions.mockResolvedValue({
        friend: {
          isLoading: false,
          sessions: [friendSession(30)],
        },
      });
    };

    // The end-of-stage fetch is gated on a logged-in user. A stable object,
    // not a fresh literal per render: the real AuthProvider keeps `user`'s
    // identity stable across unrelated re-renders (React useState), and
    // fetchOtherStageParties's triggering effect depends on `user` — a new
    // identity on every render here would retrigger it regardless of the
    // fetchOtherStageParties/getSessionParties/fetchFriendSessions stability
    // this describe block is otherwise testing.
    const wrapperUserContextValue = { user: { sub: 'me' } } as any;
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        UserContext.Provider,
        { value: wrapperUserContextValue },
        children
      );

    // puzzleId (INITIAL) sits in the middle: STAGE_0 is an earlier stage
    // we've already played, STAGE_2 a later one we've never started.
    const runProps = {
      ...defaultProps,
      runStageIds: [STAGE_0, INITIAL, STAGE_2],
    };

    it('does NOT fetch a later stage via fetchFriendSessions until a friend has completed the current stage', async () => {
      // A direct GET on STAGE_2 would 404 (we've never played it), so the
      // only way to learn about it is fetchFriendSessions — and the only
      // signal we have that a friend might be there is them finishing the
      // stage we're currently sharing a live session with them on.
      mockCurrentStageResponse(undefined);
      mockOtherStageParties();
      const { result } = renderHook(() => useGameState(runProps), { wrapper });
      await act(async () => {});

      expect(fetchFriendSessions).not.toHaveBeenCalled();
      expect(result.current.runStageParties[STAGE_2]).toBeUndefined();
    });

    it('fetches later stages via fetchFriendSessions once a friend completes the current stage', async () => {
      mockCurrentStageResponse(45);
      mockOtherStageParties();
      const { result } = renderHook(() => useGameState(runProps), { wrapper });
      await act(async () => {});

      expect(fetchFriendSessions).toHaveBeenCalledWith(emptyParties, true);
      expect(
        result.current.runStageParties[STAGE_2]?.party1?.memberSessions.friend
          ?.state.completed?.seconds
      ).toBe(30);
      expect(patchFriendSessions).toHaveBeenCalledWith(
        `unblockrace-${STAGE_2}`,
        expect.objectContaining({ friend: expect.anything() })
      );
    });

    it('stops calling fetchFriendSessions once the only later stage is confirmed complete for every known friend', async () => {
      jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
      try {
        // Friend completed the current stage (triggers the check) AND has
        // already completed STAGE_2 (the only later stage) — once we've
        // confirmed that, there is nothing left to learn from them.
        mockCurrentStageResponse(45);
        mockOtherStageParties();
        const { result } = renderHook(() => useGameState(runProps), {
          wrapper,
        });
        await act(async () => {});

        const callsAfterMount = fetchFriendSessions.mock.calls.length;
        expect(callsAfterMount).toBeGreaterThan(0);
        expect(
          result.current.runStageParties[STAGE_2]?.party1?.memberSessions.friend
            ?.state.completed?.seconds
        ).toBe(30);

        await act(async () => {
          jest.advanceTimersByTime(30000);
        });

        expect(fetchFriendSessions.mock.calls.length).toBe(callsAfterMount);
      } finally {
        jest.useRealTimers();
      }
    });

    it('fetches an earlier (already-played) stage via a direct GET, not fetchFriendSessions', async () => {
      // We have our own session on STAGE_0 already, so a per-stage GET
      // works there (unlike a stage we've never started) and is cheaper
      // than the bulk friend-sessions fetch.
      mockCurrentStageResponse(undefined, undefined);
      emptyParties.push({
        partyId: 'party1',
        partyName: 'Party 1',
        members: [{ userId: 'friend', memberNickname: 'Player 2' }],
      });
      const { result } = renderHook(() => useGameState(runProps), { wrapper });
      await act(async () => {});

      expect(serverGetValue).toHaveBeenCalledWith({ id: STAGE_0 });
      expect(fetchFriendSessions).not.toHaveBeenCalled();
      expect(
        result.current.runStageParties[STAGE_0]?.party1?.memberSessions.friend
          ?.state.completed
      ).toBeUndefined();
    });

    it('stops GETting an earlier stage once every known friend has completed it there', async () => {
      jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
      try {
        mockCurrentStageResponse(undefined, 20);
        emptyParties.push({
          partyId: 'party1',
          partyName: 'Party 1',
          members: [{ userId: 'friend', memberNickname: 'Player 2' }],
        });
        const { result } = renderHook(() => useGameState(runProps), {
          wrapper,
        });
        await act(async () => {});

        expect(
          result.current.runStageParties[STAGE_0]?.party1?.memberSessions.friend
            ?.state.completed?.seconds
        ).toBe(20);
        const callsAfterMount = serverGetValue.mock.calls.filter(
          (call) => call[0]?.id === STAGE_0
        ).length;
        expect(callsAfterMount).toBeGreaterThan(0);

        await act(async () => {
          jest.advanceTimersByTime(30000);
        });

        const callsAfterInterval = serverGetValue.mock.calls.filter(
          (call) => call[0]?.id === STAGE_0
        ).length;
        expect(callsAfterInterval).toBe(callsAfterMount);
      } finally {
        jest.useRealTimers();
      }
    });

    it('keeps GETting an earlier stage on a 30s interval while a friend there is still in progress', async () => {
      jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
      try {
        mockCurrentStageResponse(undefined, undefined);
        emptyParties.push({
          partyId: 'party1',
          partyName: 'Party 1',
          members: [{ userId: 'friend', memberNickname: 'Player 2' }],
        });
        const { result } = renderHook(() => useGameState(runProps), {
          wrapper,
        });
        await act(async () => {});

        const callsAfterMount = serverGetValue.mock.calls.filter(
          (call) => call[0]?.id === STAGE_0
        ).length;
        expect(callsAfterMount).toBeGreaterThan(0);

        await act(async () => {
          jest.advanceTimersByTime(30000);
        });

        const callsAfterInterval = serverGetValue.mock.calls.filter(
          (call) => call[0]?.id === STAGE_0
        ).length;
        expect(callsAfterInterval).toBeGreaterThan(callsAfterMount);
        expect(
          result.current.runStageParties[STAGE_0]?.party1?.memberSessions.friend
            ?.state.completed
        ).toBeUndefined();
      } finally {
        jest.useRealTimers();
      }
    });

    it('does not loop-fetch when getSessionParties/fetchFriendSessions change identity on every render (regression: this previously made hundreds of requests)', async () => {
      // getSessionParties and fetchFriendSessions are wrapped with a fresh
      // arrow function on every useSessions() call in this test file's mock
      // (see the jest.mock above), matching how the real SessionsProvider
      // re-creates them whenever patchFriendSessions writes to
      // friendSessions. If fetchOtherStageParties or its triggering effect
      // ever depend on those identities directly again instead of via a ref,
      // this test hangs/times out exactly like the real bug did.
      mockCurrentStageResponse(45);
      mockOtherStageParties();
      const { result, rerender } = renderHook(() => useGameState(runProps), {
        wrapper,
      });
      await act(async () => {});

      const callsAfterMount = fetchFriendSessions.mock.calls.length;
      expect(callsAfterMount).toBeGreaterThan(0);

      // Force several more renders with the same opponent-ahead condition
      // still true — a real infinite loop would keep calling
      // fetchFriendSessions on every one of these.
      rerender();
      rerender();
      rerender();
      await act(async () => {});

      expect(fetchFriendSessions.mock.calls.length).toBe(callsAfterMount);
      expect(
        result.current.runStageParties[STAGE_2]?.party1?.memberSessions.friend
          ?.state.completed?.seconds
      ).toBe(30);
    });

    it('accumulates the current stage parties under its stage id', async () => {
      mockCurrentStageResponse();
      mockOtherStageParties();
      const { result } = renderHook(() => useGameState(runProps), { wrapper });
      await act(async () => {});

      expect(
        result.current.runStageParties[INITIAL]?.party1?.memberSessions.friend
      ).toBeDefined();
    });

    it('refreshes every stage session from the manual refresh', async () => {
      mockCurrentStageResponse(45, undefined);
      mockOtherStageParties();
      emptyParties.push({
        partyId: 'party1',
        partyName: 'Party 1',
        members: [{ userId: 'friend', memberNickname: 'Player 2' }],
      });
      const { result } = renderHook(() => useGameState(runProps), { wrapper });
      await act(async () => {});

      await act(async () => {
        await result.current.refreshSessionParties();
      });

      expect(fetchFriendSessions).toHaveBeenCalledWith(emptyParties, true);
      expect(serverGetValue).toHaveBeenCalledWith({ id: STAGE_0 });
      expect(
        result.current.runStageParties[STAGE_2]?.party1?.memberSessions.friend
          ?.state.completed?.seconds
      ).toBe(30);
    });

    it('does not poll other-stage sessions while the Lobby is open — Lobby has its own poll for that', async () => {
      mockCurrentStageResponse(45, undefined);
      mockOtherStageParties();
      emptyParties.push({
        partyId: 'party1',
        partyName: 'Party 1',
        members: [{ userId: 'friend', memberNickname: 'Player 2' }],
      });
      const { result } = renderHook(
        () => useGameState({ ...runProps, initialShowLobby: true }),
        { wrapper }
      );
      await act(async () => {});

      expect(result.current.showLobby).toBe(true);
      expect(fetchFriendSessions).not.toHaveBeenCalled();
      expect(
        serverGetValue.mock.calls.some((call) => call[0]?.id === STAGE_0)
      ).toBe(false);
    });
  });
});
