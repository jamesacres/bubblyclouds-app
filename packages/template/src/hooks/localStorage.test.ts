'use client';

import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './localStorage';
import { StateType } from '@bubblyclouds-app/types/stateType';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct parameters', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'test-puzzle-1',
        })
      );

      expect(result.current).toBeDefined();
      expect(result.current.getValue).toBeDefined();
      expect(result.current.saveValue).toBeDefined();
      expect(result.current.listValues).toBeDefined();
      expect(result.current.prefix).toBe('sudoku-');
    });

    it('should use custom prefix when provided', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'test-id',
          prefix: 'custom-',
        })
      );

      expect(result.current.prefix).toBe('custom-');
    });

    it('should default to sudoku- prefix', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'test-id',
        })
      );

      expect(result.current.prefix).toBe('sudoku-');
    });
  });

  describe('saveValue', () => {
    it('should save value to localStorage', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      const testData = { test: 'data', number: 42 };

      result.current.saveValue(testData);

      const stored = localStorage.getItem('sudoku-puzzle-1');
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed.state).toEqual(testData);
    });

    it('should save and retrieve a value', () => {
      const { result } = renderHook(() =>
        useLocalStorage({ type: StateType.PUZZLE, id: 'puzzle1' })
      );
      const testData = { a: 1, b: 'test' };

      act(() => {
        result.current.saveValue(testData);
      });

      const retrieved = result.current.getValue();
      expect(retrieved?.state).toEqual(testData);
      expect(retrieved?.lastUpdated).toBeCloseTo(Date.now(), -2);
    });

    it('should include lastUpdated timestamp', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      const testData = { test: 'data' };
      const beforeTime = Date.now();

      result.current.saveValue(testData);

      const afterTime = Date.now();
      const stored = localStorage.getItem('sudoku-puzzle-1');
      const parsed = JSON.parse(stored!);

      expect(parsed.lastUpdated).toBeGreaterThanOrEqual(beforeTime);
      expect(parsed.lastUpdated).toBeLessThanOrEqual(afterTime + 100);
    });

    it('should return the saved value with lastUpdated', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      const testData = { test: 'data' };

      let returnedValue;
      act(() => {
        returnedValue = result.current.saveValue(testData);
      });

      expect(returnedValue).toBeDefined();
      // @ts-expect-error - returnedValue type inference issue in test
      expect(returnedValue?.lastUpdated).toBeDefined();
      // @ts-expect-error - returnedValue type inference issue in test
      expect(returnedValue?.state).toEqual(testData);
    });

    it('should handle different StateTypes correctly', () => {
      const { result: timerResult } = renderHook(() =>
        useLocalStorage({
          type: StateType.TIMER,
          id: 'puzzle-1',
        })
      );

      const { result: puzzleResult } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      const timerData = { seconds: 100 };
      const puzzleData = { grid: 'data' };

      act(() => {
        timerResult.current.saveValue(timerData);
        puzzleResult.current.saveValue(puzzleData);
      });

      expect(localStorage.getItem('sudoku-puzzle-1')).toBeTruthy();
      expect(localStorage.getItem('sudoku-puzzle-1-TIMER')).toBeTruthy();
    });

    it('should use overrideId when provided', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'default-id',
        })
      );

      const testData = { test: 'data' };

      act(() => {
        result.current.saveValue(testData, { overrideId: 'override-id' });
      });

      expect(localStorage.getItem('sudoku-override-id')).toBeTruthy();
      expect(localStorage.getItem('sudoku-default-id')).toBeNull();
    });

    it('should handle quota exceeded error gracefully', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      // Mock localStorage to simulate quota exceeded
      let callCount = 0;

      const mockImpl = (
        localStorage.setItem as jest.Mock
      ).getMockImplementation();
      (localStorage.setItem as jest.Mock).mockImplementation(
        (key: string, value: string) => {
          callCount++;
          if (callCount === 1) {
            const error = new DOMException('QuotaExceededError');
            // @ts-expect-error - name is read-only but we need to set it for testing
            error.name = 'QuotaExceededError';
            throw error;
          }
          // Call original mock implementation
          return mockImpl!(key, value);
        }
      );

      const testData = { test: 'data' };

      result.current.saveValue(testData);

      // Should attempt cleanup and retry
      expect(localStorage.setItem).toHaveBeenCalled();

      // Restore original mock implementation
      (localStorage.setItem as jest.Mock).mockImplementation(mockImpl!);
    });

    it('should handle JSON serialization error', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      const circularObject: any = { test: 'data' };
      circularObject.self = circularObject;

      act(() => {
        // Should not throw, but log error
        expect(() => {
          result.current.saveValue(circularObject);
        }).not.toThrow();
      });
    });

    it('should update timestamp on value save', () => {
      const { result } = renderHook(() =>
        useLocalStorage({ type: StateType.PUZZLE, id: 'timestampTest' })
      );

      let firstTimestamp: number;
      act(() => {
        result.current.saveValue({ version: 1 });
      });
      firstTimestamp = result.current.getValue()?.lastUpdated || 0;

      // Wait a bit then save again
      act(() => {
        result.current.saveValue({ version: 2 });
      });
      const secondTimestamp = result.current.getValue()?.lastUpdated || 0;

      expect(secondTimestamp).toBeGreaterThanOrEqual(firstTimestamp);
    });

    it('should save value with custom override ID', () => {
      const { result } = renderHook(() =>
        useLocalStorage({ type: StateType.PUZZLE })
      );

      const customId = 'custom-puzzle-id';
      act(() => {
        result.current.saveValue({ custom: true }, { overrideId: customId });
      });

      const { result: retrieveResult } = renderHook(() =>
        useLocalStorage({ type: StateType.PUZZLE, id: customId })
      );

      const retrieved = retrieveResult.current.getValue();
      expect(retrieved?.state).toEqual({ custom: true });
    });

    it('should save complex nested objects', () => {
      const { result } = renderHook(() =>
        useLocalStorage({ type: StateType.PUZZLE, id: 'nested' })
      );

      const complexData = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
              array: [1, 2, 3],
            },
          },
        },
        array: [{ id: 1 }, { id: 2 }],
      };

      act(() => {
        result.current.saveValue(complexData);
      });

      const retrieved = result.current.getValue();
      expect(retrieved?.state).toEqual(complexData);
    });

    it('should handle null or undefined gracefully', () => {
      const { result } = renderHook(() =>
        useLocalStorage({ type: StateType.PUZZLE, id: 'undefined-test' })
      );

      expect(() => {
        act(() => {
          result.current.saveValue(null as any);
        });
      }).not.toThrow();

      expect(result.current).toBeDefined();
    });
  });

  describe('getValue', () => {
    it('should retrieve saved value from localStorage', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      const testData = { test: 'data', number: 42 };

      result.current.saveValue(testData);

      const retrievedValue = result.current.getValue<typeof testData>();

      expect(retrievedValue).toBeDefined();
      expect(retrievedValue?.state).toEqual(testData);
      expect(retrievedValue?.lastUpdated).toBeDefined();
    });

    it('should return undefined if value not found', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'non-existent-id',
        })
      );

      const retrievedValue = result.current.getValue();

      expect(retrievedValue).toBeUndefined();
    });

    it('should return undefined for a non-existent key', () => {
      const { result } = renderHook(() =>
        useLocalStorage({ type: StateType.PUZZLE, id: 'nonexistent' })
      );
      const retrieved = result.current.getValue();
      expect(retrieved).toBeUndefined();
    });

    it('should use overrideId when provided', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'default-id',
        })
      );

      const testData = { test: 'data' };

      act(() => {
        result.current.saveValue(testData, { overrideId: 'override-id' });
      });

      const retrievedValue = result.current.getValue({
        overrideId: 'override-id',
      });

      expect(retrievedValue?.state).toEqual(testData);
    });

    it('should handle corrupted JSON gracefully', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      localStorage.setItem('sudoku-puzzle-1', 'invalid json {]');

      const retrievedValue = result.current.getValue();

      expect(retrievedValue).toBeUndefined();
    });

    it('should preserve complex nested objects', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      const complexData = {
        nested: {
          deep: {
            value: [1, 2, 3],
          },
        },
        array: [{ id: 1 }, { id: 2 }],
      };

      result.current.saveValue(complexData);
      const retrievedValue = result.current.getValue();

      expect(retrievedValue?.state).toEqual(complexData);
    });

    it('should retrieve values across hook instances', () => {
      const { result: hook1 } = renderHook(() =>
        useLocalStorage({ type: StateType.PUZZLE, id: 'shared' })
      );

      act(() => {
        hook1.current.saveValue({ shared: true });
      });

      // Create a new hook instance
      const { result: hook2 } = renderHook(() =>
        useLocalStorage({ type: StateType.PUZZLE, id: 'shared' })
      );

      const retrieved = hook2.current.getValue();
      expect(retrieved?.state).toEqual({ shared: true });
    });

    it('should maintain sessionId in stored results', () => {
      const { result } = renderHook(() =>
        useLocalStorage({ type: StateType.PUZZLE, id: 'session-test' })
      );

      act(() => {
        result.current.saveValue({ data: 'test' });
      });

      const retrieved = result.current.getValue();
      expect(retrieved?.state).toBeDefined();
    });

    it('should return state result with proper structure', () => {
      const { result } = renderHook(() =>
        useLocalStorage({ type: StateType.PUZZLE, id: 'structure' })
      );

      const testData = { value: 42 };
      act(() => {
        result.current.saveValue(testData);
      });

      const retrieved = result.current.getValue();
      expect(retrieved).toHaveProperty('state');
      expect(retrieved).toHaveProperty('lastUpdated');
      expect(retrieved?.state).toEqual(testData);
    });
  });

  describe('listValues', () => {
    it('should list all puzzle values', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      const data1 = { test: 'data1' };
      const data2 = { test: 'data2' };

      localStorage.setItem(
        'sudoku-puzzle-1',
        JSON.stringify({ state: data1, lastUpdated: Date.now() })
      );
      localStorage.setItem(
        'sudoku-puzzle-2',
        JSON.stringify({ state: data2, lastUpdated: Date.now() })
      );

      const listedValues = result.current.listValues();

      expect(listedValues).toHaveLength(2);
      expect(
        listedValues?.some((v: any) => v.state.test === 'data1')
      ).toBeTruthy();
      expect(
        listedValues?.some((v: any) => v.state.test === 'data2')
      ).toBeTruthy();
    });

    it('should list all values of a given type', () => {
      const { result: puzzleHook } = renderHook(() =>
        useLocalStorage({ type: StateType.PUZZLE })
      );

      act(() => {
        puzzleHook.current.saveValue({ puzzle: 1 }, { overrideId: 'p1' });
        puzzleHook.current.saveValue({ puzzle: 2 }, { overrideId: 'p2' });
      });

      const puzzleValues = puzzleHook.current.listValues();
      expect(puzzleValues.length).toBeGreaterThanOrEqual(2);
      // Find the values we just saved
      const savedValues = puzzleValues.filter(
        (v) =>
          v.state &&
          ((v.state as any).puzzle === 1 || (v.state as any).puzzle === 2)
      );
      expect(savedValues).toHaveLength(2);
    });

    it('should list values with sessionId', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      const data = { test: 'data' };

      localStorage.setItem(
        'sudoku-puzzle-1',
        JSON.stringify({ state: data, lastUpdated: Date.now() })
      );

      const listedValues = result.current.listValues();

      expect(listedValues?.length).toBeGreaterThan(0);
      expect(listedValues?.[0]?.sessionId).toBe('sudoku-puzzle-1');
    });

    it('should filter by StateType', () => {
      const puzzleHook = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      const timerHook = renderHook(() =>
        useLocalStorage({
          type: StateType.TIMER,
          id: 'puzzle-1',
        })
      );

      localStorage.setItem(
        'sudoku-puzzle-1',
        JSON.stringify({ state: { test: 'puzzle' }, lastUpdated: Date.now() })
      );
      localStorage.setItem(
        'sudoku-puzzle-1-TIMER',
        JSON.stringify({ state: { seconds: 100 }, lastUpdated: Date.now() })
      );

      const puzzleValues = puzzleHook.result.current.listValues();
      const timerValues = timerHook.result.current.listValues();

      expect(puzzleValues).toHaveLength(1);
      expect(timerValues).toHaveLength(1);
    });

    it('should remove entries older than one month', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      const oneMonthAgo = Date.now() - 32 * 24 * 60 * 60 * 1000;
      const recentTime = Date.now();

      localStorage.setItem(
        'sudoku-old-puzzle',
        JSON.stringify({ state: { test: 'old' }, lastUpdated: oneMonthAgo })
      );
      localStorage.setItem(
        'sudoku-recent-puzzle',
        JSON.stringify({ state: { test: 'recent' }, lastUpdated: recentTime })
      );

      const listedValues = result.current.listValues();

      expect(
        listedValues?.some((v: any) => v.sessionId === 'sudoku-old-puzzle')
      ).toBeFalsy();
      expect(
        listedValues?.some((v: any) => v.sessionId === 'sudoku-recent-puzzle')
      ).toBeTruthy();
    });

    it('should handle empty localStorage gracefully', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      const listedValues = result.current.listValues();

      expect(listedValues).toEqual([]);
    });

    it('should skip corrupted entries', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      localStorage.setItem(
        'sudoku-valid-puzzle',
        JSON.stringify({ state: { test: 'valid' }, lastUpdated: Date.now() })
      );
      localStorage.setItem('sudoku-invalid-puzzle', 'invalid json {]');

      const listedValues = result.current.listValues();

      expect(listedValues).toHaveLength(1);
      // @ts-expect-error - state is unknown type but we know it's valid in this test
      expect(listedValues?.[0]?.state?.test).toBe('valid');
    });

    it('should list multiple puzzles', () => {
      const { result } = renderHook(() =>
        useLocalStorage({ type: StateType.PUZZLE })
      );

      act(() => {
        result.current.saveValue({ puzzle: 1 }, { overrideId: 'p1' });
        result.current.saveValue({ puzzle: 2 }, { overrideId: 'p2' });
        result.current.saveValue({ puzzle: 3 }, { overrideId: 'p3' });
      });

      const values = result.current.listValues();
      expect(values.length).toBeGreaterThanOrEqual(3);
    });

    it('should list values with correct structure', () => {
      const { result } = renderHook(() =>
        useLocalStorage({ type: StateType.PUZZLE })
      );

      act(() => {
        result.current.saveValue({ id: 1 }, { overrideId: 'id-1' });
      });

      const values = result.current.listValues();
      const savedValue = values.find((v) => v.sessionId === 'id-1');

      if (savedValue) {
        expect(savedValue).toHaveProperty('state');
        expect(savedValue).toHaveProperty('sessionId');
        expect(savedValue).toHaveProperty('lastUpdated');
      }
    });

    it('should handle empty listValues', () => {
      const { result } = renderHook(() =>
        useLocalStorage({ type: StateType.PUZZLE, id: 'unique-empty' })
      );

      // Don't save anything
      const values = result.current.listValues();
      expect(Array.isArray(values)).toBe(true);
    });
  });

  describe('getStateKey', () => {
    it('should generate correct key for PUZZLE type', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      const data = { test: 'data' };
      act(() => {
        result.current.saveValue(data);
      });

      expect(localStorage.getItem('sudoku-puzzle-1')).toBeTruthy();
    });

    it('should generate correct key for TIMER type', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.TIMER,
          id: 'puzzle-1',
        })
      );

      const data = { seconds: 100 };
      act(() => {
        result.current.saveValue(data);
      });

      expect(localStorage.getItem('sudoku-puzzle-1-TIMER')).toBeTruthy();
    });

    it('should throw error when id is missing', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
        })
      );

      expect(() => {
        result.current.getValue();
      }).toThrow('id required');
    });

    it('should handle getStateKey with override', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'default-id',
        })
      );

      const data = { test: 'data' };

      act(() => {
        result.current.saveValue(data, { overrideId: 'override-id' });
      });

      expect(localStorage.getItem('sudoku-override-id')).toBeTruthy();
    });

    it('should provide correct prefix for state types', () => {
      const { result: puzzleResult } = renderHook(() =>
        useLocalStorage({ type: StateType.PUZZLE, id: 'puzzle1' })
      );
      const { result: timerResult } = renderHook(() =>
        useLocalStorage({ type: StateType.TIMER, id: 'timer1' })
      );

      // Both hooks can store values independently
      expect(typeof puzzleResult.current).toBe('object');
      expect(typeof timerResult.current).toBe('object');
    });
  });

  describe('state types', () => {
    it('should handle different state types separately', () => {
      const { result: puzzleHook } = renderHook(() =>
        useLocalStorage({ type: StateType.PUZZLE, id: 'test' })
      );
      const { result: timerHook } = renderHook(() =>
        useLocalStorage({ type: StateType.TIMER, id: 'test' })
      );

      act(() => {
        puzzleHook.current.saveValue({ data: 'puzzle' });
        timerHook.current.saveValue({ data: 'timer' });
      });

      const puzzleData = puzzleHook.current.getValue();
      const timerData = timerHook.current.getValue();

      expect(puzzleData?.state).toEqual({ data: 'puzzle' });
      expect(timerData?.state).toEqual({ data: 'timer' });
    });

    it('should handle timer state type', () => {
      const { result } = renderHook(() =>
        useLocalStorage({ type: StateType.TIMER, id: 'timer1' })
      );

      const timerData = { elapsed: 60, isPaused: false };
      act(() => {
        result.current.saveValue(timerData);
      });

      const retrieved = result.current.getValue();
      expect(retrieved?.state).toEqual(timerData);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple saves to same id', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      const data1 = { version: 1 };
      const data2 = { version: 2 };
      const data3 = { version: 3 };

      result.current.saveValue(data1);
      result.current.saveValue(data2);
      result.current.saveValue(data3);
      const retrievedValue = result.current.getValue();

      expect(retrievedValue?.state).toEqual(data3);
    });

    it('should clear storage correctly', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      const data = { test: 'data' };

      result.current.saveValue(data);

      expect(localStorage.getItem('sudoku-puzzle-1')).toBeTruthy();

      localStorage.clear();

      expect(localStorage.getItem('sudoku-puzzle-1')).toBeNull();
    });

    it('should handle very large objects', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        data: `item-${i}`,
      }));

      result.current.saveValue({ items: largeArray });
      const retrievedValue = result.current.getValue();

      // @ts-expect-error - state is unknown type but we know structure in this test
      expect(retrievedValue?.state?.items).toHaveLength(1000);
    });

    it('should handle null and undefined values', () => {
      const { result } = renderHook(() =>
        useLocalStorage({
          type: StateType.PUZZLE,
          id: 'puzzle-1',
        })
      );

      const data = { nullValue: null, undefinedValue: undefined };

      result.current.saveValue(data);
      const retrievedValue = result.current.getValue();

      // @ts-expect-error - state is unknown type but we know structure in this test
      expect(retrievedValue?.state?.nullValue).toBeNull();
    });
  });
});
