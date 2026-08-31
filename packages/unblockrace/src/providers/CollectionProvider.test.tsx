import { render, screen, waitFor, act } from '@testing-library/react';
import { CollectionProvider, useCollection } from './CollectionProvider';
import { useUnblockServerStorage } from '../hooks/useUnblockServerStorage';
import { useOnline } from '@bubblyclouds-app/template/hooks/online';
import { UnblockCollectionOfTheMonth } from '../types/serverTypes';

jest.mock('../hooks/useUnblockServerStorage');
jest.mock('@bubblyclouds-app/template/hooks/online');

const mockUseUnblockServerStorage = useUnblockServerStorage as jest.Mock;
const mockUseOnline = useOnline as jest.Mock;

const TestConsumer = () => {
  const {
    collectionData,
    isLoading,
    error,
    fetchCollectionData,
    clearCollectionData,
  } = useCollection();

  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="error">{error ?? ''}</span>
      <span data-testid="collection-id">
        {collectionData?.unblockCollectionId ?? ''}
      </span>
      <span data-testid="puzzle-count">
        {collectionData?.puzzles.length ?? 0}
      </span>
      <button onClick={() => fetchCollectionData()}>fetch</button>
      <button onClick={() => clearCollectionData()}>clear</button>
    </div>
  );
};

const CACHE_VERSION = 2;

const currentMonthKey = (): string => {
  const currentMonth = new Date(new Date().toISOString()).toLocaleString(
    'en-US',
    { month: 'long', timeZone: 'UTC' }
  );
  const currentYear = new Date().getFullYear();
  return `unblock_collection_v${CACHE_VERSION}_${currentYear}_${currentMonth}`;
};

const legacyUnversionedMonthKey = (): string => {
  const currentMonth = new Date(new Date().toISOString()).toLocaleString(
    'en-US',
    { month: 'long', timeZone: 'UTC' }
  );
  const currentYear = new Date().getFullYear();
  return `unblock_collection_${currentYear}_${currentMonth}`;
};

const mockCollection: UnblockCollectionOfTheMonth = {
  unblockCollectionId: 'ofthemonth-202607',
  puzzles: [
    { initial: 'a', final: 'a', movesRequired: 5, difficulty: 'beginner' },
  ],
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
};

describe('CollectionProvider', () => {
  let mockGetUnblockRaceCollectionOfTheMonth: jest.Mock;

  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
    mockGetUnblockRaceCollectionOfTheMonth = jest
      .fn()
      .mockResolvedValue(mockCollection);
    mockUseUnblockServerStorage.mockReturnValue({
      getUnblockRaceCollectionOfTheMonth:
        mockGetUnblockRaceCollectionOfTheMonth,
    });
    mockUseOnline.mockReturnValue({ isOnline: true });
  });

  const renderProvider = () =>
    render(
      <CollectionProvider app="unblockrace" apiUrl="https://api.test.com">
        <TestConsumer />
      </CollectionProvider>
    );

  it('throws when useCollection is used outside a CollectionProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    expect(() => render(<TestConsumer />)).toThrow(
      'useCollection must be used within a CollectionProvider'
    );
    consoleError.mockRestore();
  });

  it('starts with no collection data and not loading', () => {
    renderProvider();

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('collection-id')).toHaveTextContent('');
  });

  it('passes app and apiUrl through to the server storage hook', () => {
    renderProvider();

    expect(mockUseUnblockServerStorage).toHaveBeenCalledWith({
      app: 'unblockrace',
      apiUrl: 'https://api.test.com',
    });
  });

  it('fetches and populates collection data on demand', async () => {
    renderProvider();

    await act(async () => {
      screen.getByText('fetch').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('collection-id')).toHaveTextContent(
        'ofthemonth-202607'
      );
    });
    expect(screen.getByTestId('puzzle-count')).toHaveTextContent('1');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('');
    expect(mockGetUnblockRaceCollectionOfTheMonth).toHaveBeenCalled();
  });

  it('caches fetched data in localStorage under the current month key', async () => {
    renderProvider();

    await act(async () => {
      screen.getByText('fetch').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('collection-id').textContent).not.toBe('');
    });

    const cached = window.localStorage.getItem(currentMonthKey());
    expect(cached).not.toBeNull();
    expect(JSON.parse(cached as string).unblockCollectionId).toBe(
      'ofthemonth-202607'
    );
  });

  it('loads from cache on mount instead of refetching', async () => {
    const cachedPayload = {
      unblockCollectionId: 'cached-collection',
      puzzles: [],
      createdAt: new Date('2026-07-01T00:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-07-01T00:00:00.000Z').toISOString(),
    };
    window.localStorage.setItem(
      currentMonthKey(),
      JSON.stringify(cachedPayload)
    );

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('collection-id')).toHaveTextContent(
        'cached-collection'
      );
    });
    expect(mockGetUnblockRaceCollectionOfTheMonth).not.toHaveBeenCalled();
  });

  it('does not refetch when data is already loaded', async () => {
    renderProvider();

    await act(async () => {
      screen.getByText('fetch').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('collection-id').textContent).not.toBe('');
    });

    await act(async () => {
      screen.getByText('fetch').click();
    });

    expect(mockGetUnblockRaceCollectionOfTheMonth).toHaveBeenCalledTimes(1);
  });

  it('ignores corrupt cached JSON and falls back to a fresh fetch', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    window.localStorage.setItem(currentMonthKey(), 'not-json{{{');

    renderProvider();

    await act(async () => {
      screen.getByText('fetch').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('collection-id')).toHaveTextContent(
        'ofthemonth-202607'
      );
    });
    expect(consoleWarn).toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  it('sets an error when the fetch resolves with no data while online', async () => {
    mockGetUnblockRaceCollectionOfTheMonth.mockResolvedValue(undefined);
    renderProvider();

    await act(async () => {
      screen.getByText('fetch').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Failed to load puzzle collection'
      );
    });
  });

  it('shows an offline error when the fetch resolves with no data while offline', async () => {
    mockUseOnline.mockReturnValue({ isOnline: false });
    mockGetUnblockRaceCollectionOfTheMonth.mockResolvedValue(undefined);
    renderProvider();

    await act(async () => {
      screen.getByText('fetch').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(
        'You are offline, please check your connection'
      );
    });
  });

  it('sets an error when the fetch rejects', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockGetUnblockRaceCollectionOfTheMonth.mockRejectedValue(
      new Error('network down')
    );
    renderProvider();

    await act(async () => {
      screen.getByText('fetch').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Failed to load puzzle collection'
      );
    });
    consoleError.mockRestore();
  });

  it('clears collection data and its cache entry', async () => {
    renderProvider();

    await act(async () => {
      screen.getByText('fetch').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('collection-id').textContent).not.toBe('');
    });
    expect(window.localStorage.getItem(currentMonthKey())).not.toBeNull();

    act(() => {
      screen.getByText('clear').click();
    });

    expect(screen.getByTestId('collection-id')).toHaveTextContent('');
    expect(screen.getByTestId('error')).toHaveTextContent('');
    expect(window.localStorage.getItem(currentMonthKey())).toBeNull();
  });

  it('ignores a stale unversioned cache entry and fetches fresh data', async () => {
    const legacyPayload = {
      unblockCollectionId: 'legacy-collection',
      puzzles: [
        { initial: 'a', final: 'a', movesRequired: 5, difficulty: 'simple' },
      ],
      createdAt: new Date('2026-07-01T00:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-07-01T00:00:00.000Z').toISOString(),
    };
    window.localStorage.setItem(
      legacyUnversionedMonthKey(),
      JSON.stringify(legacyPayload)
    );

    renderProvider();

    await act(async () => {
      screen.getByText('fetch').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('collection-id')).toHaveTextContent(
        'ofthemonth-202607'
      );
    });
    expect(mockGetUnblockRaceCollectionOfTheMonth).toHaveBeenCalled();
  });

  it('cleans up the legacy unversioned cache key when saving', async () => {
    window.localStorage.setItem(
      legacyUnversionedMonthKey(),
      JSON.stringify({ stale: true })
    );

    renderProvider();

    await act(async () => {
      screen.getByText('fetch').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('collection-id').textContent).not.toBe('');
    });

    expect(window.localStorage.getItem(legacyUnversionedMonthKey())).toBeNull();
  });

  it('removes cached data for other months when saving the current month', async () => {
    const staleKey = currentMonthKey().replace(
      /_(January|February|March|April|May|June|July|August|September|October|November|December)$/,
      (match) => (match === '_July' ? '_June' : '_July')
    );
    window.localStorage.setItem(staleKey, JSON.stringify({ stale: true }));

    renderProvider();

    await act(async () => {
      screen.getByText('fetch').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('collection-id').textContent).not.toBe('');
    });

    expect(window.localStorage.getItem(staleKey)).toBeNull();
  });
});
