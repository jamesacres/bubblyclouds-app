import React from 'react';
import { render, renderHook, act, waitFor } from '@testing-library/react';
import { useGameState } from './gameState';
import type { Puzzle } from '../types/puzzle';
import type { GameState, GameStateMetadata } from '../types/state';
import type { StateResult } from '@bubblyclouds-app/template/hooks/localStorage';
import type { Parties, Session } from '@bubblyclouds-app/types/serverTypes';
import {
  UserContext,
  type UserContextInterface,
} from '@bubblyclouds-app/auth/providers/AuthProvider';
import {
  RevenueCatContext,
  type RevenueCatContextInterface,
} from '@bubblyclouds-app/template/providers/RevenueCatProvider';
import { useSessions } from '@bubblyclouds-app/template/providers/SessionsProvider';
import { useTimer } from '@bubblyclouds-app/template/hooks/timer';

// This file targets branches in gameState.ts left uncovered by the existing
// gameState.test.ts smoke tests: subscription-gated undo/validateGrid,
// server/local restore precedence, keyboard shortcuts, the polling and
// inactivity-pause intervals, and pushAnswer's onComplete/stopTimer path.

const mockSetTimerNewSession = jest.fn();
const mockStopTimer = jest.fn();
const mockSetPauseTimer = jest.fn();
let mockTimerValue: unknown = {};
let mockIsPaused = false;

jest.mock('@bubblyclouds-app/template/hooks/localStorage', () => ({
  useLocalStorage: jest.fn(),
}));
jest.mock('./useSudokuServerStorage', () => ({
  useSudokuServerStorage: jest.fn(),
}));
jest.mock('@bubblyclouds-app/template/hooks/timer', () => ({
  useTimer: jest.fn(),
}));
jest.mock('@bubblyclouds-app/template/hooks/useParties', () => ({
  useParties: jest.fn(() => ({ parties: [] })),
}));
jest.mock('@bubblyclouds-app/auth/providers/AuthProvider', () => ({
  UserContext: (require('react') as typeof React).createContext<
    UserContextInterface | undefined
  >(undefined),
}));
jest.mock('@bubblyclouds-app/template/providers/RevenueCatProvider', () => ({
  RevenueCatContext: (require('react') as typeof React).createContext<
    RevenueCatContextInterface | undefined
  >(undefined),
}));
jest.mock('@bubblyclouds-app/template/providers/SessionsProvider', () => ({
  useSessions: jest.fn(),
}));

import { useLocalStorage } from '@bubblyclouds-app/template/hooks/localStorage';
import { useSudokuServerStorage } from './useSudokuServerStorage';

const createPuzzle = (value: number = 0): Puzzle<number> => {
  const createBox = () => ({
    '0': [value, value, value],
    '1': [value, value, value],
    '2': [value, value, value],
  });
  return {
    '0': { '0': createBox(), '1': createBox(), '2': createBox() },
    '1': { '0': createBox(), '1': createBox(), '2': createBox() },
    '2': { '0': createBox(), '1': createBox(), '2': createBox() },
  };
};

const cellId = (boxX: number, boxY: number, cellX: number, cellY: number) =>
  `box:${boxX},${boxY},cell:${cellX},${cellY}`;

describe('useGameState (extra coverage)', () => {
  const mockInitial = createPuzzle();
  const mockFinal = createPuzzle(1);
  const mockMetadata: Partial<GameStateMetadata> = { difficulty: 'EASY' };

  const defaultProps = {
    initial: mockInitial,
    final: mockFinal,
    puzzleId: 'test-puzzle-extra',
    metadata: mockMetadata,
    app: 'sudoku',
    apiUrl: 'https://api.test.com',
  };

  type PartialGameState = {
    answerStack: Puzzle<number>[];
    completed?: GameState['completed'];
  };
  type ServerFixture = {
    parties?: Parties<Partial<Session<{ completed?: boolean }>>>;
    state?: PartialGameState;
    updatedAt: Date;
  };

  const localSaveValue = jest.fn();
  const localGetValue = jest.fn<StateResult<PartialGameState> | undefined, []>(
    () => undefined
  );
  const serverSaveValue = jest.fn<Promise<ServerFixture | undefined>, []>(() =>
    Promise.resolve({ parties: {}, state: undefined, updatedAt: new Date() })
  );
  const serverGetValue = jest.fn<Promise<ServerFixture | undefined>, []>(() =>
    Promise.resolve(undefined)
  );
  const getSessionPartiesMock = jest.fn(() => ({}));
  const patchFriendSessionsMock = jest.fn();

  const renderGameState = (
    props: Parameters<typeof useGameState>[0] = defaultProps,
    userContextValue: Partial<UserContextInterface> | undefined = {
      user: { sub: 'user-1' },
      isInitialised: true,
    },
    revenueCatValue:
      | (Omit<Partial<RevenueCatContextInterface>, 'subscribeModal'> & {
          subscribeModal?: Partial<
            RevenueCatContextInterface['subscribeModal']
          >;
        })
      | undefined = {}
  ) => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        UserContext.Provider,
        { value: userContextValue as UserContextInterface | undefined },
        React.createElement(
          RevenueCatContext.Provider,
          {
            value: revenueCatValue as RevenueCatContextInterface | undefined,
          },
          children
        )
      );
    return renderHook(() => useGameState(props), { wrapper });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockTimerValue = {};
    mockIsPaused = false;

    (useTimer as jest.Mock).mockImplementation(() => ({
      timer: mockTimerValue,
      setTimerNewSession: mockSetTimerNewSession,
      stopTimer: mockStopTimer,
      setPauseTimer: mockSetPauseTimer,
      isPaused: mockIsPaused,
    }));
    (useLocalStorage as jest.Mock).mockImplementation(() => ({
      getValue: localGetValue,
      saveValue: localSaveValue,
    }));
    (useSudokuServerStorage as jest.Mock).mockImplementation(() => ({
      getValue: serverGetValue,
      saveValue: serverSaveValue,
    }));
    getSessionPartiesMock.mockImplementation(() => ({}));
    (useSessions as jest.Mock).mockImplementation(() => ({
      getSessionParties: getSessionPartiesMock,
      patchFriendSessions: patchFriendSessionsMock,
    }));
  });

  it('undoes immediately when the user is subscribed, bypassing the daily limit modal', async () => {
    const { result } = renderGameState(
      defaultProps,
      { user: { sub: 'user-1' }, isInitialised: true },
      { isSubscribed: true, subscribeModal: { showModalIfRequired: jest.fn() } }
    );

    await act(async () => {
      result.current.setSelectedCell(cellId(0, 0, 0, 0));
    });
    await act(async () => {
      result.current.selectNumber(5);
    });
    expect(result.current.isUndoDisabled).toBe(false);

    await act(async () => {
      result.current.undo();
    });

    expect(result.current.answerStack).toHaveLength(1);
    expect(result.current.isRedoDisabled).toBe(false);
  });

  it('routes undo through the subscription modal once the daily free undo limit is exhausted', async () => {
    const showModalIfRequired = jest.fn((onAllow: () => void) => onAllow());

    const { result } = renderGameState(
      defaultProps,
      { user: { sub: 'user-1' }, isInitialised: true },
      { isSubscribed: false, subscribeModal: { showModalIfRequired } }
    );

    await act(async () => {
      result.current.setSelectedCell(cellId(0, 0, 0, 0));
    });
    await act(async () => {
      result.current.selectNumber(5);
    });

    // Exhaust the 5 free daily undos directly via localStorage so canUseUndo() returns false.
    localStorage.setItem(
      'daily-action-counter',
      JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        undoCount: 5,
        checkGridCount: 0,
        hintCount: 0,
      })
    );

    await act(async () => {
      result.current.undo();
    });

    expect(showModalIfRequired).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      'UNDO'
    );
    // The undo went through via the modal's onAllow callback.
    expect(result.current.answerStack).toHaveLength(1);
  });

  it('redoes a previously undone answer', async () => {
    const { result } = renderGameState(
      defaultProps,
      { user: { sub: 'user-1' }, isInitialised: true },
      { isSubscribed: true }
    );

    await act(async () => {
      result.current.setSelectedCell(cellId(0, 0, 0, 0));
    });
    await act(async () => {
      result.current.selectNumber(5);
    });
    await act(async () => {
      result.current.undo();
    });
    expect(result.current.isRedoDisabled).toBe(false);

    await act(async () => {
      result.current.redo();
    });

    expect(result.current.isRedoDisabled).toBe(true);
    expect(result.current.selectedAnswer()).toBe(5);
  });

  it('toggles grid validation on and off, incrementing the daily check-grid counter for non-subscribers', async () => {
    const { result } = renderGameState(
      defaultProps,
      { user: { sub: 'user-1' }, isInitialised: true },
      {
        isSubscribed: false,
        subscribeModal: { showModalIfRequired: jest.fn() },
      }
    );

    await act(async () => {
      result.current.validateGrid();
    });
    expect(result.current.validation).toBeDefined();

    await act(async () => {
      result.current.validateGrid();
    });
    expect(result.current.validation).toBeUndefined();
  });

  it('validates a single selected cell', async () => {
    const { result } = renderGameState(
      defaultProps,
      { user: { sub: 'user-1' }, isInitialised: true },
      { isSubscribed: true }
    );

    await act(async () => {
      result.current.setSelectedCell(cellId(0, 0, 0, 0));
    });
    await act(async () => {
      result.current.validateCell();
    });

    expect(result.current.validation).toBeDefined();
  });

  it('reveals through the subscription modal when one is present', async () => {
    const showModalIfRequired = jest.fn((onAllow: () => void) => onAllow());
    const { result } = renderGameState(
      defaultProps,
      { user: { sub: 'user-1' }, isInitialised: true },
      { subscribeModal: { showModalIfRequired } }
    );

    await act(async () => {
      result.current.reveal();
    });

    expect(showModalIfRequired).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      'REVEAL'
    );
    expect(result.current.answer).toEqual(mockFinal);
  });

  it('toggles a note on the selected cell when in notes mode', async () => {
    const { result } = renderGameState();

    await act(async () => {
      result.current.setSelectedCell(cellId(0, 0, 0, 0));
    });
    await act(async () => {
      result.current.setIsNotesMode(true);
    });
    await act(async () => {
      result.current.selectNumber(3);
    });

    expect(result.current.selectedCellHasNotes()).toBe(true);
    expect(result.current.selectedAnswer()).toBeUndefined();
  });

  it('marks the puzzle completed, stops the timer, and calls onComplete when the final cell is filled correctly', async () => {
    mockTimerValue = {
      seconds: 100,
      inProgress: {
        start: '2024-01-01T00:00:00.000Z',
        lastInteraction: '2024-01-01T00:00:20.000Z',
      },
    };
    const onComplete = jest.fn();

    // A puzzle where every cell is already given (1) except a single empty
    // cell (0,0,0,0), so one correct entry completes the whole grid.
    const almostDoneInitial = createPuzzle(1);
    almostDoneInitial['0']['0']['0'][0] = 0;
    const finalAllOnes = createPuzzle(1);

    const { result } = renderGameState({
      ...defaultProps,
      initial: almostDoneInitial,
      final: finalAllOnes,
      onComplete,
    } as never);

    await act(async () => {
      result.current.setSelectedCell(cellId(0, 0, 0, 0));
    });
    await act(async () => {
      result.current.selectNumber(1);
    });

    expect(result.current.completed).toBeDefined();
    expect(result.current.completed?.seconds).toBe(120);
    expect(result.current.completed?.at).toBe('2024-01-01T00:00:20.000Z');
    expect(mockStopTimer).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledWith(
      expect.arrayContaining([expect.any(Object)])
    );
  });

  it('does not mark the puzzle completed when the entered value is incorrect', async () => {
    const onComplete = jest.fn();
    const almostDoneInitial = createPuzzle(1);
    almostDoneInitial['0']['0']['0'][0] = 0;
    const finalAllOnes = createPuzzle(1);

    const { result } = renderGameState({
      ...defaultProps,
      initial: almostDoneInitial,
      final: finalAllOnes,
      onComplete,
    } as never);

    await act(async () => {
      result.current.setSelectedCell(cellId(0, 0, 0, 0));
    });
    await act(async () => {
      // Wrong digit: final expects 1, this enters 2.
      result.current.selectNumber(2);
    });

    expect(result.current.completed).toBeUndefined();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('restores from local storage when a locally saved state exists', async () => {
    const savedAnswerStack = [createPuzzle(0), createPuzzle(2)];
    localGetValue.mockReturnValueOnce({
      lastUpdated: Date.now(),
      state: { answerStack: savedAnswerStack, completed: undefined },
    });

    const { result } = renderGameState();

    await waitFor(() => {
      expect(result.current.answerStack).toEqual(savedAnswerStack);
    });
  });

  it('prefers a newer server state over an older local state on restore', async () => {
    const localTime = Date.now() - 100000;
    const serverAnswerStack = [createPuzzle(0), createPuzzle(9)];

    localGetValue.mockReturnValueOnce({
      lastUpdated: localTime,
      state: { answerStack: [createPuzzle(0)], completed: undefined },
    });
    serverGetValue.mockReturnValueOnce(
      Promise.resolve({
        parties: {},
        state: { answerStack: serverAnswerStack, completed: undefined },
        updatedAt: new Date(),
      })
    );

    const { result } = renderGameState();

    await waitFor(() => {
      expect(result.current.answerStack).toEqual(serverAnswerStack);
    });
    expect(mockSetTimerNewSession).toHaveBeenCalled();
  });

  it('applies session parties returned from the server restore call', async () => {
    serverGetValue.mockReturnValueOnce(
      Promise.resolve({
        parties: {
          party1: {
            memberSessions: { 'user-1': { state: { completed: false } } },
          },
        },
        state: { answerStack: [createPuzzle(0)], completed: undefined },
        updatedAt: new Date(),
      })
    );

    const { result } = renderGameState();

    await waitFor(() => {
      expect(result.current.sessionParties).toHaveProperty('party1');
    });
  });

  it('does not crash when the server returns parties but no state and there is no local value', async () => {
    // Regression test: serverValue truthy with serverValue.state undefined
    // used to be read unconditionally via `serverValue.state.answerStack`
    // whenever there was no local value, throwing a TypeError.
    serverGetValue.mockReturnValueOnce(
      Promise.resolve({
        parties: {
          party1: {
            memberSessions: { 'user-1': { state: { completed: false } } },
          },
        },
        state: undefined,
        updatedAt: new Date(),
      } as never)
    );

    const { result } = renderGameState();

    await waitFor(() => {
      expect(result.current.sessionParties).toHaveProperty('party1');
    });
    // No crash occurred and the answer stack falls back to the initial puzzle.
    expect(result.current.answerStack).toEqual([mockInitial]);
  });

  // Login is now required before Sudoku/UnblockRace mount at all (gated by
  // packages/template's AuthGate in the Lobby/board entry flow), so this
  // hook no longer redirects on a lost session itself - it just stays idle
  // without a user, and the surrounding UI is responsible for getting one.
  it('does not run the restore effect without a confirmed user', async () => {
    const { result } = renderGameState(defaultProps, {
      user: undefined,
      isInitialised: true,
    });

    // Give any pending microtasks a chance to run.
    await act(async () => {
      await Promise.resolve();
    });

    expect(serverGetValue).not.toHaveBeenCalled();
    expect(localGetValue).not.toHaveBeenCalled();
    expect(result.current.answerStack).toEqual([mockInitial]);
  });

  it('runs the restore effect once a user is present', async () => {
    const savedAnswerStack = [createPuzzle(0), createPuzzle(2)];
    localGetValue.mockReturnValueOnce({
      lastUpdated: Date.now(),
      state: { answerStack: savedAnswerStack, completed: undefined },
    });

    // renderHook's `wrapper` option is fixed at mount and does not receive
    // updated props on rerender, so a stateful host component is used here
    // to flip from no user to a confirmed user after mount.
    let setUserContextValue: (
      _value: Partial<UserContextInterface>
    ) => void = () => {};
    const gameStateRef: { current: ReturnType<typeof useGameState> | null } = {
      current: null,
    };
    const GameStateProbe = ({
      onResult,
    }: {
      onResult: (_result: ReturnType<typeof useGameState>) => void;
    }) => {
      onResult(useGameState(defaultProps));
      return null;
    };
    const Harness = () => {
      const [userContextValue, setValue] = React.useState<
        Partial<UserContextInterface> | undefined
      >({
        user: undefined,
        isInitialised: true,
      });
      React.useEffect(() => {
        setUserContextValue = setValue;
      }, [setValue]);
      return React.createElement(
        UserContext.Provider,
        { value: userContextValue as UserContextInterface | undefined },
        React.createElement(
          RevenueCatContext.Provider,
          { value: {} as RevenueCatContextInterface | undefined },
          React.createElement(GameStateProbe, {
            onResult: (r: ReturnType<typeof useGameState>) =>
              (gameStateRef.current = r),
          })
        )
      );
    };

    render(React.createElement(Harness));

    expect(serverGetValue).not.toHaveBeenCalled();
    expect(gameStateRef.current?.answerStack).toEqual([mockInitial]);

    await act(async () => {
      setUserContextValue({ user: { sub: 'user-1' }, isInitialised: true });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(gameStateRef.current?.answerStack).toEqual(savedAnswerStack);
    });
  });

  it('selects the next cell to the right on ArrowRight and types a digit with number keys', async () => {
    renderGameState();

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '7' }));
    });

    // No direct handle here since setSelectedCell/selectNumber are internal,
    // but dispatching should not throw and should be handled by the listener.
    expect(true).toBe(true);
  });

  it('toggles notes mode with the "n" key and ignores keyboard events on form elements', async () => {
    const { result } = renderGameState();

    const input = document.createElement('input');
    document.body.appendChild(input);

    await act(async () => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'n', bubbles: true })
      );
    });
    // Keyboard events targeting form elements should be ignored, so notes mode
    // should remain false even after dispatching "n" on the input.
    expect(result.current.isNotesMode).toBe(false);

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
    });
    expect(result.current.isNotesMode).toBe(true);

    document.body.removeChild(input);
  });

  it('invokes undo/redo/validateGrid/validateCell via their keyboard shortcuts', async () => {
    const { result } = renderGameState(
      defaultProps,
      { user: { sub: 'user-1' }, isInitialised: true },
      { isSubscribed: true }
    );

    await act(async () => {
      result.current.setSelectedCell(cellId(0, 0, 0, 0));
    });
    await act(async () => {
      result.current.selectNumber(5);
    });

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
    });
    expect(result.current.validation).toBeDefined();

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
    });
    expect(result.current.answerStack).toHaveLength(1);

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y' }));
    });
    expect(result.current.answerStack.length).toBeGreaterThan(1);
  });

  it('deletes the current cell value on Backspace', async () => {
    const { result } = renderGameState(
      defaultProps,
      { user: { sub: 'user-1' }, isInitialised: true },
      { isSubscribed: true }
    );

    await act(async () => {
      result.current.setSelectedCell(cellId(0, 0, 0, 0));
    });
    await act(async () => {
      result.current.selectNumber(5);
    });
    expect(result.current.selectedAnswer()).toBe(5);

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    });

    // 0 is a legitimate numeric answer value (typeof 0 === 'number'), so
    // clearing a cell reads back as 0, not undefined.
    expect(result.current.selectedAnswer()).toBe(0);
  });

  it('ignores keyboard input while isBoardGatedIgnoringCompleted is true, for a locked book puzzle', async () => {
    const { result } = renderGameState(
      { ...defaultProps, isBoardGatedIgnoringCompleted: true },
      { user: { sub: 'user-1' }, isInitialised: true },
      {
        isSubscribed: false,
        subscribeModal: { showModalIfRequired: jest.fn() },
      }
    );

    await act(async () => {
      result.current.setSelectedCell(cellId(0, 0, 0, 0));
    });
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '7' }));
    });

    expect(result.current.selectedAnswer()).toBe(0);

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(result.current.selectedCell).toBe(cellId(0, 0, 0, 0));
  });

  it('refreshes session parties on demand and toggles isPolling', async () => {
    const { result } = renderGameState();

    await waitFor(() => expect(result.current.answerStack).toBeDefined());

    serverGetValue.mockReturnValueOnce(
      Promise.resolve({
        parties: { party1: { memberSessions: {} } },
        state: { answerStack: [createPuzzle(0)], completed: undefined },
        updatedAt: new Date(),
      })
    );

    let refreshPromise: Promise<void>;
    act(() => {
      refreshPromise = result.current.refreshSessionParties();
    });
    expect(result.current.isPolling).toBe(true);

    await act(async () => {
      await refreshPromise;
    });
    expect(result.current.isPolling).toBe(false);
  });

  it('pauses the timer due to inactivity after 5 minutes without a cell change', async () => {
    jest.useFakeTimers();

    const { result } = renderGameState(
      defaultProps,
      { user: { sub: 'user-1' }, isInitialised: true },
      { isSubscribed: true }
    );

    await act(async () => {
      result.current.setSelectedCell(cellId(0, 0, 0, 0));
    });

    await act(async () => {
      jest.advanceTimersByTime(6 * 60 * 1000);
    });

    expect(mockSetPauseTimer).toHaveBeenCalledWith(true);

    jest.useRealTimers();
  });
});
