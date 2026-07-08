import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from './useGameState';
import { solvedBoardString } from '../helpers/boardToString';
import { GameStateMetadata } from '../types/state';

const stopTimer = jest.fn();
let mockTimer: object = {};

jest.mock('@bubblyclouds-app/template/hooks/localStorage', () => ({
  useLocalStorage: () => ({ getValue: jest.fn(), saveValue: jest.fn() }),
}));
jest.mock('@bubblyclouds-app/template/hooks/serverStorage', () => ({
  useServerStorage: () => ({
    getValue: jest.fn().mockResolvedValue(undefined),
    saveValue: jest.fn().mockResolvedValue(undefined),
  }),
}));
jest.mock('@bubblyclouds-app/template/hooks/timer', () => ({
  useTimer: () => ({
    timer: mockTimer,
    setTimerNewSession: jest.fn(),
    stopTimer,
    setPauseTimer: jest.fn(),
    isPaused: false,
  }),
}));
jest.mock('@bubblyclouds-app/template/hooks/useParties', () => ({
  useParties: () => ({ parties: [] }),
}));
jest.mock('@bubblyclouds-app/auth/providers/AuthProvider', () => ({
  UserContext: React.createContext({}),
}));
jest.mock('@bubblyclouds-app/template/providers/SessionsProvider', () => ({
  useSessions: () => ({
    getSessionParties: jest.fn(),
    patchFriendSessions: jest.fn(),
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
  const metadata: Partial<GameStateMetadata> = { difficulty: 'simple' };

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
  });

  it('initializes with the initial board as the answer', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    expect(result.current.answer).toBe(INITIAL);
    expect(result.current.isUndoDisabled).toBe(true);
    expect(result.current.isRedoDisabled).toBe(true);
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
    expect(onComplete).toHaveBeenCalled();
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

  it('toggles lobby visibility', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    act(() => {
      result.current.setShowLobby(true);
    });
    expect(result.current.showLobby).toBe(true);
  });
});
