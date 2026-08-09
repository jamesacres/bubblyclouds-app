import { renderHook, act } from '@testing-library/react';
import { useUnblockServerStorage } from './useUnblockServerStorage';
import {
  UnblockCollectionOfTheMonth,
  UnblockRaceOfTheDayRun,
} from '../types/serverTypes';
import puzzles from '../fixtures/puzzles.json';

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

jest.mock('@bubblyclouds-app/template/hooks/serverStorage');
jest.mock('@bubblyclouds-app/auth/hooks/useFetch');
jest.mock('@bubblyclouds-app/template/hooks/online');

describe('useUnblockServerStorage', () => {
  const board = puzzles[0].boardString;

  const mockUnblockRaceOfTheDayResponse = {
    unblockRaceId: 'oftheday-20260708',
    createdAt: '2026-07-08T00:00:00Z',
    updatedAt: '2026-07-08T00:00:00Z',
    puzzles: [{ board, moves: 3, difficulty: 'beginner' }],
  };

  const mockUnblockRaceCollectionOfTheMonthResponse = {
    unblockRaceCollectionId: 'ofthemonth-202607',
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
    puzzles: [{ board, moves: 12, difficulty: 'hard' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const {
      useServerStorage,
    } = require('@bubblyclouds-app/template/hooks/serverStorage');
    const { useFetch } = require('@bubblyclouds-app/auth/hooks/useFetch');
    const { useOnline } = require('@bubblyclouds-app/template/hooks/online');

    useServerStorage.mockReturnValue(createMockBaseStorage());
    useFetch.mockReturnValue({ fetch: jest.fn() });
    useOnline.mockReturnValue({ isOnline: true });
  });

  describe('initialization', () => {
    it('should initialize with default parameters', () => {
      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      expect(result.current).toBeDefined();
      expect(result.current.getUnblockRaceOfTheDay).toBeDefined();
      expect(result.current.getUnblockRaceCollectionOfTheMonth).toBeDefined();
    });

    it('should include all base storage methods', () => {
      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      expect(result.current.getValue).toBeDefined();
      expect(result.current.saveValue).toBeDefined();
      expect(result.current.listValues).toBeDefined();
      expect(result.current.isLoggedIn).toBeDefined();
      expect(result.current.apiUrl).toBe('https://api.bubblyclouds.com');
    });

    it('should pass app and apiUrl to base storage', () => {
      const {
        useServerStorage,
      } = require('@bubblyclouds-app/template/hooks/serverStorage');
      renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      expect(useServerStorage).toHaveBeenCalledWith({
        app: 'unblockrace',
        apiUrl: 'https://api.bubblyclouds.com',
        type: undefined,
        id: undefined,
      });
    });
  });

  describe('getUnblockRaceOfTheDay', () => {
    it('should fetch the daily run when online and logged in', async () => {
      const { useFetch } = require('@bubblyclouds-app/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockUnblockRaceOfTheDayResponse),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      let run: UnblockRaceOfTheDayRun | undefined;
      await act(async () => {
        run = await result.current.getUnblockRaceOfTheDay();
      });

      expect(mockFetch).toHaveBeenCalled();
      const requestUrl = mockFetch.mock.calls[0][0].url;
      expect(requestUrl).toBe(
        'https://api.bubblyclouds.com/unblockRace/ofTheDay'
      );
      expect(run?.runId).toBe('oftheday-20260708');
    });

    it('maps board/moves/difficulty into the app puzzle shape', async () => {
      const { useFetch } = require('@bubblyclouds-app/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockUnblockRaceOfTheDayResponse),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      let run: UnblockRaceOfTheDayRun | undefined;
      await act(async () => {
        run = await result.current.getUnblockRaceOfTheDay();
      });

      expect(run?.puzzles).toHaveLength(1);
      expect(run?.puzzles[0].initial).toBe(board);
      expect(run?.puzzles[0].movesRequired).toBe(3);
      expect(run?.puzzles[0].difficulty).toBe('beginner');
      expect(typeof run?.puzzles[0].final).toBe('string');
    });

    it('should convert date strings to Date objects', async () => {
      const { useFetch } = require('@bubblyclouds-app/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockUnblockRaceOfTheDayResponse),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      let run: UnblockRaceOfTheDayRun | undefined;
      await act(async () => {
        run = await result.current.getUnblockRaceOfTheDay();
      });

      expect(run?.createdAt).toBeInstanceOf(Date);
      expect(run?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return undefined when offline', async () => {
      const { useOnline } = require('@bubblyclouds-app/template/hooks/online');
      useOnline.mockReturnValue({ isOnline: false });

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      let run;
      await act(async () => {
        run = await result.current.getUnblockRaceOfTheDay();
      });

      expect(run).toBeUndefined();
    });

    it('should return undefined when not logged in', async () => {
      const {
        useServerStorage,
      } = require('@bubblyclouds-app/template/hooks/serverStorage');
      useServerStorage.mockReturnValue(
        createMockBaseStorage({
          isLoggedIn: jest.fn().mockResolvedValue(false),
        })
      );

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      let run;
      await act(async () => {
        run = await result.current.getUnblockRaceOfTheDay();
      });

      expect(run).toBeUndefined();
    });

    it('should return undefined when fetch fails', async () => {
      const { useFetch } = require('@bubblyclouds-app/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        json: jest.fn(),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      let run;
      await act(async () => {
        run = await result.current.getUnblockRaceOfTheDay();
      });

      expect(run).toBeUndefined();
    });

    it('should return undefined on network error', async () => {
      const { useFetch } = require('@bubblyclouds-app/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      let run;
      await act(async () => {
        run = await result.current.getUnblockRaceOfTheDay();
      });

      expect(run).toBeUndefined();
    });

    it('should log error on exception', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { useFetch } = require('@bubblyclouds-app/auth/hooks/useFetch');
      const testError = new Error('Test error');
      const mockFetch = jest.fn().mockRejectedValue(testError);
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      await act(async () => {
        await result.current.getUnblockRaceOfTheDay();
      });

      expect(consoleSpy).toHaveBeenCalledWith(testError);
      consoleSpy.mockRestore();
    });
  });

  describe('getUnblockRaceCollectionOfTheMonth', () => {
    it('should fetch the collection when online and logged in', async () => {
      const { useFetch } = require('@bubblyclouds-app/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue(mockUnblockRaceCollectionOfTheMonthResponse),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      let collection: UnblockCollectionOfTheMonth | undefined;
      await act(async () => {
        collection = await result.current.getUnblockRaceCollectionOfTheMonth();
      });

      expect(mockFetch).toHaveBeenCalled();
      const requestUrl = mockFetch.mock.calls[0][0].url;
      expect(requestUrl).toBe(
        'https://api.bubblyclouds.com/unblockRace/collectionOfTheMonth'
      );
      expect(collection?.unblockCollectionId).toBe('ofthemonth-202607');
    });

    it('maps board/moves/difficulty into the app puzzle shape', async () => {
      const { useFetch } = require('@bubblyclouds-app/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue(mockUnblockRaceCollectionOfTheMonthResponse),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      let collection: UnblockCollectionOfTheMonth | undefined;
      await act(async () => {
        collection = await result.current.getUnblockRaceCollectionOfTheMonth();
      });

      expect(collection?.puzzles).toHaveLength(1);
      expect(collection?.puzzles[0].initial).toBe(board);
      expect(collection?.puzzles[0].movesRequired).toBe(12);
      expect(collection?.puzzles[0].difficulty).toBe('hard');
    });

    it('should convert date strings to Date objects', async () => {
      const { useFetch } = require('@bubblyclouds-app/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue(mockUnblockRaceCollectionOfTheMonthResponse),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      let collection: UnblockCollectionOfTheMonth | undefined;
      await act(async () => {
        collection = await result.current.getUnblockRaceCollectionOfTheMonth();
      });

      expect(collection?.createdAt).toBeInstanceOf(Date);
      expect(collection?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return undefined when offline', async () => {
      const { useOnline } = require('@bubblyclouds-app/template/hooks/online');
      useOnline.mockReturnValue({ isOnline: false });

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      let collection;
      await act(async () => {
        collection = await result.current.getUnblockRaceCollectionOfTheMonth();
      });

      expect(collection).toBeUndefined();
    });

    it('should return undefined when not logged in', async () => {
      const {
        useServerStorage,
      } = require('@bubblyclouds-app/template/hooks/serverStorage');
      useServerStorage.mockReturnValue(
        createMockBaseStorage({
          isLoggedIn: jest.fn().mockResolvedValue(false),
        })
      );

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      let collection;
      await act(async () => {
        collection = await result.current.getUnblockRaceCollectionOfTheMonth();
      });

      expect(collection).toBeUndefined();
    });

    it('should return undefined when fetch fails', async () => {
      const { useFetch } = require('@bubblyclouds-app/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        json: jest.fn(),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      let collection;
      await act(async () => {
        collection = await result.current.getUnblockRaceCollectionOfTheMonth();
      });

      expect(collection).toBeUndefined();
    });

    it('should return undefined on network error', async () => {
      const { useFetch } = require('@bubblyclouds-app/auth/hooks/useFetch');
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      let collection;
      await act(async () => {
        collection = await result.current.getUnblockRaceCollectionOfTheMonth();
      });

      expect(collection).toBeUndefined();
    });

    it('should log error on exception', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { useFetch } = require('@bubblyclouds-app/auth/hooks/useFetch');
      const testError = new Error('Test error');
      const mockFetch = jest.fn().mockRejectedValue(testError);
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      await act(async () => {
        await result.current.getUnblockRaceCollectionOfTheMonth();
      });

      expect(consoleSpy).toHaveBeenCalledWith(testError);
      consoleSpy.mockRestore();
    });
  });

  describe('edge cases and integration', () => {
    it('should handle both functions being called in sequence', async () => {
      const { useFetch } = require('@bubblyclouds-app/auth/hooks/useFetch');
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockUnblockRaceOfTheDayResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest
            .fn()
            .mockResolvedValue(mockUnblockRaceCollectionOfTheMonthResponse),
        });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      let run, collection;
      await act(async () => {
        run = await result.current.getUnblockRaceOfTheDay();
        collection = await result.current.getUnblockRaceCollectionOfTheMonth();
      });

      expect(run).toBeDefined();
      expect(collection).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should use apiUrl from baseStorage', async () => {
      const { useFetch } = require('@bubblyclouds-app/auth/hooks/useFetch');
      const {
        useServerStorage,
      } = require('@bubblyclouds-app/template/hooks/serverStorage');

      const customApiUrl = 'https://custom-api.example.com';
      useServerStorage.mockReturnValue(
        createMockBaseStorage({ apiUrl: customApiUrl })
      );

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockUnblockRaceOfTheDayResponse),
      });
      useFetch.mockReturnValue({ fetch: mockFetch });

      const { result } = renderHook(() =>
        useUnblockServerStorage({
          app: 'unblockrace',
          apiUrl: 'https://api.bubblyclouds.com',
        })
      );

      await act(async () => {
        await result.current.getUnblockRaceOfTheDay();
      });

      expect(mockFetch).toHaveBeenCalled();
      const callArg = mockFetch.mock.calls[0][0];
      expect(callArg.url).toContain(customApiUrl);
    });
  });
});
