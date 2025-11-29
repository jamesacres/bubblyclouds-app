import { renderHook, act } from '@testing-library/react';
import { useSudokuServerStorage } from './useSudokuServerStorage';
import { StateType } from '@sudoku-web/types/stateType';
import { SudokuBookOfTheMonth, SudokuOfTheDay } from '../types/serverTypes';
import { Difficulty } from '@sudoku-web/games/types/difficulty';

const createMockBaseStorage = (overrides = {}) => ({
  getValue: jest.fn().mockResolvedValue(undefined),
  saveValue: jest.fn().mockResolvedValue(undefined),
  listValues: jest.fn().mockResolvedValue([]),
  setIdAndType: jest.fn(),
  listParties: jest.fn(),
  createParty: jest.fn(),
  updateParty: jest.fn(),
  createInvite: jest.fn(),
  getPublicInvite: jest.fn(),
  createMember: jest.fn(),
  leaveParty: jest.fn(),
  removeMember: jest.fn(),
  deleteParty: jest.fn(),
  deleteAccount: jest.fn(),
  isLoggedIn: jest.fn().mockResolvedValue(true),
  apiUrl: 'https://api.bubblyclouds.com',
  ...overrides,
});

jest.mock('@sudoku-web/template/hooks/serverStorage');
jest.mock('@sudoku-web/auth/hooks/useFetch');
jest.mock('@sudoku-web/template/hooks/online');

describe('useSudokuServerStorage', () => {
  const mockSudokuOfTheDayResponse = {
    sudokuId: 'daily-puzzle-123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
    difficulty: Difficulty.EXPERT,
    puzzle: 'mock-puzzle-data',
  };

  const mockSudokuBookOfTheMonthResponse = {
    sudokuBookId: 'book-puzzle-456',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
    difficulty: 'MEDIUM',
    puzzle: 'mock-book-puzzle-data',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const {
      useServerStorage,
    } = require('@sudoku-web/template/hooks/serverStorage');
    const { useFetch } = require('@sudoku-web/auth/hooks/useFetch');
    const { useOnline } = require('@sudoku-web/template/hooks/online');

    useServerStorage.mockReturnValue(createMockBaseStorage());
    useFetch.mockReturnValue({ fetch: jest.fn() });
    useOnline.mockReturnValue({ isOnline: true });
  });

  describe('initialization', () => {
    it('should initialize with default parameters', () => {
      const { result } = renderHook(() => useSudokuServerStorage());

      expect(result.current).toBeDefined();
      expect(result.current.getSudokuOfTheDay).toBeDefined();
      expect(result.current.getSudokuBookOfTheMonth).toBeDefined();
    });

    it('should initialize with custom type and id', () => {
      const { result } = renderHook(() =>
        useSudokuServerStorage({
          type: StateType.PUZZLE,
          id: 'test-puzzle-123',
        })
      );

      expect(result.current).toBeDefined();
    });

    it('should include all base storage methods', () => {
      const { result } = renderHook(() => useSudokuServerStorage());

      expect(result.current.getValue).toBeDefined();
      expect(result.current.saveValue).toBeDefined();
      expect(result.current.listValues).toBeDefined();
      expect(result.current.listParties).toBeDefined();
      expect(result.current.isLoggedIn).toBeDefined();
      expect(result.current.apiUrl).toBe('https://api.bubblyclouds.com');
    });

    it('should pass app as sudoku to base storage', () => {
      const {
        useServerStorage,
      } = require('@sudoku-web/template/hooks/serverStorage');
      renderHook(() => useSudokuServerStorage());

      expect(useServerStorage).toHaveBeenCalledWith({
        app: 'sudoku',
        type: undefined,
        id: undefined,
      });
    });
  });

  describe('getSudokuOfTheDay', () => {
    it('should fetch sudoku of the day when online and logged in', async () => {
      const { useFetch } = require('@sudoku-web/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSudokuOfTheDayResponse),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() => useSudokuServerStorage());

      let sudokuOfTheDay: SudokuOfTheDay | undefined;
      await act(async () => {
        sudokuOfTheDay = await result.current.getSudokuOfTheDay(
          Difficulty.EXPERT
        );
      });

      expect(mockFetch).toHaveBeenCalled();
      expect(sudokuOfTheDay?.sudokuId).toBe('daily-puzzle-123');
    });

    it('should convert date strings to Date objects', async () => {
      const { useFetch } = require('@sudoku-web/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSudokuOfTheDayResponse),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() => useSudokuServerStorage());

      let sudokuOfTheDay: SudokuOfTheDay | undefined;
      await act(async () => {
        sudokuOfTheDay = await result.current.getSudokuOfTheDay(
          Difficulty.EXPERT
        );
      });

      expect(sudokuOfTheDay?.createdAt).toBeInstanceOf(Date);
      expect(sudokuOfTheDay?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return undefined when offline', async () => {
      const { useOnline } = require('@sudoku-web/template/hooks/online');
      useOnline.mockReturnValue({ isOnline: false });

      const { result } = renderHook(() => useSudokuServerStorage());

      let sudokuOfTheDay;
      await act(async () => {
        sudokuOfTheDay = await result.current.getSudokuOfTheDay(
          Difficulty.EXPERT
        );
      });

      expect(sudokuOfTheDay).toBeUndefined();
    });

    it('should return undefined when not logged in', async () => {
      const {
        useServerStorage,
      } = require('@sudoku-web/template/hooks/serverStorage');
      useServerStorage.mockReturnValue(
        createMockBaseStorage({
          isLoggedIn: jest.fn().mockResolvedValue(false),
        })
      );

      const { result } = renderHook(() => useSudokuServerStorage());

      let sudokuOfTheDay;
      await act(async () => {
        sudokuOfTheDay = await result.current.getSudokuOfTheDay(
          Difficulty.EXPERT
        );
      });

      expect(sudokuOfTheDay).toBeUndefined();
    });

    it('should return undefined when fetch fails', async () => {
      const { useFetch } = require('@sudoku-web/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        json: jest.fn(),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() => useSudokuServerStorage());

      let sudokuOfTheDay;
      await act(async () => {
        sudokuOfTheDay = await result.current.getSudokuOfTheDay(
          Difficulty.EXPERT
        );
      });

      expect(sudokuOfTheDay).toBeUndefined();
    });

    it('should return undefined on network error', async () => {
      const { useFetch } = require('@sudoku-web/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() => useSudokuServerStorage());

      let sudokuOfTheDay;
      await act(async () => {
        sudokuOfTheDay = await result.current.getSudokuOfTheDay(
          Difficulty.EXPERT
        );
      });

      expect(sudokuOfTheDay).toBeUndefined();
    });

    it('should log info message when fetching', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      const { useFetch } = require('@sudoku-web/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSudokuOfTheDayResponse),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() => useSudokuServerStorage());

      await act(async () => {
        await result.current.getSudokuOfTheDay(Difficulty.EXPERT);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'fetching sudoku of the day',
        Difficulty.EXPERT
      );

      consoleSpy.mockRestore();
    });

    it('should log error on exception', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { useFetch } = require('@sudoku-web/auth/hooks/useFetch');
      const testError = new Error('Test error');
      const mockFetch = jest.fn().mockRejectedValue(testError);
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() => useSudokuServerStorage());

      await act(async () => {
        await result.current.getSudokuOfTheDay(Difficulty.EXPERT);
      });

      expect(consoleSpy).toHaveBeenCalledWith(testError);

      consoleSpy.mockRestore();
    });
  });

  describe('getSudokuBookOfTheMonth', () => {
    it('should fetch sudoku book of the month when online and logged in', async () => {
      const { useFetch } = require('@sudoku-web/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSudokuBookOfTheMonthResponse),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() => useSudokuServerStorage());

      let sudokuBook: SudokuBookOfTheMonth | undefined;
      await act(async () => {
        sudokuBook = await result.current.getSudokuBookOfTheMonth();
      });

      expect(mockFetch).toHaveBeenCalled();
      expect(sudokuBook?.sudokuBookId).toBe('book-puzzle-456');
    });

    it('should convert date strings to Date objects for book of the month', async () => {
      const { useFetch } = require('@sudoku-web/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSudokuBookOfTheMonthResponse),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() => useSudokuServerStorage());

      let sudokuBook: SudokuBookOfTheMonth | undefined;
      await act(async () => {
        sudokuBook = await result.current.getSudokuBookOfTheMonth();
      });

      expect(sudokuBook?.createdAt).toBeInstanceOf(Date);
      expect(sudokuBook?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return undefined when offline', async () => {
      const { useOnline } = require('@sudoku-web/template/hooks/online');
      useOnline.mockReturnValue({ isOnline: false });

      const { result } = renderHook(() => useSudokuServerStorage());

      let sudokuBook;
      await act(async () => {
        sudokuBook = await result.current.getSudokuBookOfTheMonth();
      });

      expect(sudokuBook).toBeUndefined();
    });

    it('should return undefined when not logged in', async () => {
      const {
        useServerStorage,
      } = require('@sudoku-web/template/hooks/serverStorage');
      useServerStorage.mockReturnValue(
        createMockBaseStorage({
          isLoggedIn: jest.fn().mockResolvedValue(false),
        })
      );

      const { result } = renderHook(() => useSudokuServerStorage());

      let sudokuBook;
      await act(async () => {
        sudokuBook = await result.current.getSudokuBookOfTheMonth();
      });

      expect(sudokuBook).toBeUndefined();
    });

    it('should return undefined when fetch fails', async () => {
      const { useFetch } = require('@sudoku-web/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        json: jest.fn(),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() => useSudokuServerStorage());

      let sudokuBook;
      await act(async () => {
        sudokuBook = await result.current.getSudokuBookOfTheMonth();
      });

      expect(sudokuBook).toBeUndefined();
    });

    it('should return undefined on network error', async () => {
      const { useFetch } = require('@sudoku-web/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() => useSudokuServerStorage());

      let sudokuBook;
      await act(async () => {
        sudokuBook = await result.current.getSudokuBookOfTheMonth();
      });

      expect(sudokuBook).toBeUndefined();
    });

    it('should log info message when fetching', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      const { useFetch } = require('@sudoku-web/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSudokuBookOfTheMonthResponse),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() => useSudokuServerStorage());

      await act(async () => {
        await result.current.getSudokuBookOfTheMonth();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'fetching sudoku book of the month'
      );

      consoleSpy.mockRestore();
    });

    it('should log error on exception', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { useFetch } = require('@sudoku-web/auth/hooks/useFetch');
      const testError = new Error('Test error');
      const mockFetch = jest.fn().mockRejectedValue(testError);
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() => useSudokuServerStorage());

      await act(async () => {
        await result.current.getSudokuBookOfTheMonth();
      });

      expect(consoleSpy).toHaveBeenCalledWith(testError);

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases and integration', () => {
    it('should handle both functions being called in sequence', async () => {
      const { useFetch } = require('@sudoku-web/auth/hooks/useFetch');
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockSudokuOfTheDayResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockSudokuBookOfTheMonthResponse),
        });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() => useSudokuServerStorage());

      let sudokuOfTheDay, sudokuBook;
      await act(async () => {
        sudokuOfTheDay = await result.current.getSudokuOfTheDay(
          Difficulty.EXPERT
        );
        sudokuBook = await result.current.getSudokuBookOfTheMonth();
      });

      expect(sudokuOfTheDay).toBeDefined();
      expect(sudokuBook).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should properly handle API response with all fields', async () => {
      const { useFetch } = require('@sudoku-web/auth/hooks/useFetch');
      const complexResponse = {
        ...mockSudokuOfTheDayResponse,
        extraField: 'should be preserved',
      };
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(complexResponse),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() => useSudokuServerStorage());

      let sudokuOfTheDay: SudokuOfTheDay | undefined;
      await act(async () => {
        sudokuOfTheDay = await result.current.getSudokuOfTheDay(
          Difficulty.EXPERT
        );
      });

      expect(sudokuOfTheDay?.sudokuId).toBe('daily-puzzle-123');
      expect((sudokuOfTheDay as any)?.extraField).toBe('should be preserved');
    });

    it('should use apiUrl from baseStorage', async () => {
      const { useFetch } = require('@sudoku-web/auth/hooks/useFetch');
      const {
        useServerStorage,
      } = require('@sudoku-web/template/hooks/serverStorage');

      const customApiUrl = 'https://custom-api.example.com';
      useServerStorage.mockReturnValue(
        createMockBaseStorage({ apiUrl: customApiUrl })
      );

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSudokuOfTheDayResponse),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() => useSudokuServerStorage());

      await act(async () => {
        await result.current.getSudokuOfTheDay(Difficulty.EXPERT);
      });

      expect(mockFetch).toHaveBeenCalled();
      const callArg = mockFetch.mock.calls[0][0];
      expect(callArg.url).toContain(customApiUrl);
    });
  });
});
