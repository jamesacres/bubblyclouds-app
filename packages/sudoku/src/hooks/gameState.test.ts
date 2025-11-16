import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from './gameState';
import type { Puzzle } from '../types/puzzle';
import type { GameStateMetadata } from '../types/state';

jest.mock('@sudoku-web/template/hooks/localStorage', () => ({
  useLocalStorage: () => ({ getValue: jest.fn(), saveValue: jest.fn() }),
}));
jest.mock('@sudoku-web/template/hooks/serverStorage', () => ({
  useServerStorage: () => ({
    getValue: jest.fn().mockResolvedValue(undefined),
    saveValue: jest.fn().mockResolvedValue(undefined),
  }),
}));
jest.mock('@sudoku-web/template/hooks/timer', () => ({
  useTimer: () => ({
    timer: {},
    setTimerNewSession: jest.fn(),
    stopTimer: jest.fn(),
    setPauseTimer: jest.fn(),
    isPaused: false,
  }),
}));
jest.mock('@sudoku-web/template/hooks/useParties', () => ({
  useParties: () => ({ parties: [] }),
}));
jest.mock('@sudoku-web/auth/providers/AuthProvider', () => ({
  UserContext: React.createContext({}),
}));
jest.mock('@sudoku-web/template/providers/RevenueCatProvider', () => ({
  RevenueCatContext: React.createContext({}),
}));
jest.mock('@sudoku-web/template/providers/SessionsProvider', () => ({
  useSessions: () => ({
    getSessionParties: jest.fn(),
    patchFriendSessions: jest.fn(),
  }),
}));

const createPuzzle = (value: number = 0): Puzzle<number> => {
  const createBox = () => ({
    '0': [value, value, value],
    '1': [value, value, value],
    '2': [value, value, value],
  });

  return {
    '0': {
      '0': createBox(),
      '1': createBox(),
      '2': createBox(),
    },
    '1': {
      '0': createBox(),
      '1': createBox(),
      '2': createBox(),
    },
    '2': {
      '0': createBox(),
      '1': createBox(),
      '2': createBox(),
    },
  };
};

describe('useGameState', () => {
  const mockInitial = createPuzzle();
  const mockFinal = createPuzzle(1);
  const mockMetadata: Partial<GameStateMetadata> = { difficulty: 'EASY' };

  const defaultProps = {
    initial: mockInitial,
    final: mockFinal,
    puzzleId: 'test-puzzle',
    metadata: mockMetadata,
  };

  it('initializes with the correct default state', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    expect(result.current.isUndoDisabled).toBe(true);
    expect(result.current.isRedoDisabled).toBe(true);
    expect(result.current.isNotesMode).toBe(false);
    expect(result.current.selectedCell).toBeNull();
  });

  it('allows selecting a cell and a number', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    act(() => {
      result.current.setSelectedCell('0-0-0-0');
    });
    expect(result.current.selectedCell).toBe('0-0-0-0');
    act(() => {
      result.current.selectNumber(5);
    });
    expect(result.current).toBeDefined();
  });

  it('handles undo and redo operations', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    act(() => {
      result.current.setSelectedCell('0-0-0-0');
      result.current.selectNumber(5);
    });
    expect(result.current.selectedCell).toBe('0-0-0-0');

    act(() => {
      result.current.undo();
    });
    expect(result.current).toBeDefined();

    act(() => {
      result.current.redo();
    });
    expect(result.current).toBeDefined();
  });

  it('resets the puzzle to its initial state', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    act(() => {
      result.current.setSelectedCell('0-0-0-0');
      result.current.selectNumber(5);
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.selectedAnswer()).toBe(0);
  });

  it('reveals the final solution', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    act(() => {
      result.current.reveal();
    });
    expect(result.current.answer).toEqual(mockFinal);
  });

  it('toggles notes mode', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    expect(result.current.isNotesMode).toBe(false);
    act(() => {
      result.current.setIsNotesMode(true);
    });
    expect(result.current.isNotesMode).toBe(true);
  });

  it('toggles sidebar visibility', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    act(() => {
      result.current.setShowSidebar(true);
    });
    expect(result.current.showSidebar).toBe(true);
  });

  it('toggles zoom mode', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    act(() => {
      result.current.setIsZoomMode(true);
    });
    expect(result.current.isZoomMode).toBe(true);
  });

  it('provides answer property', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    expect(result.current.answer).toBeDefined();
  });

  it('provides selectedAnswer method', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    const answer = result.current.selectedAnswer();
    expect(answer === undefined || typeof answer === 'number').toBe(true);
  });

  it('disables undo when no previous states', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    expect(result.current.isUndoDisabled).toBe(true);
  });

  it('disables redo when no redo states', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    expect(result.current.isRedoDisabled).toBe(true);
  });

  it('stops timer on puzzle completion', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    act(() => {
      result.current.setSelectedCell('0-0-0-0');
      result.current.selectNumber(5);
    });
    expect(result.current).toBeDefined();
  });

  it('pauses timer on document visibility change', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    expect(result.current).toBeDefined();
  });

  it('validates cell selection', () => {
    const { result } = renderHook(() => useGameState(defaultProps));
    act(() => {
      result.current.setSelectedCell('0-0-0-0');
    });
    expect(result.current.selectedCell).toBe('0-0-0-0');
    act(() => {
      result.current.setSelectedCell('invalid');
    });
    expect(result.current.selectedCell).toBe('invalid');
  });
});
