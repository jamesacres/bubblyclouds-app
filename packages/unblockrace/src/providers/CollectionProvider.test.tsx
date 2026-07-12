import { render, screen, waitFor, act } from '@testing-library/react';
import { CollectionProvider, useCollection } from './CollectionProvider';

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

const currentMonthKey = (): string => {
  const currentMonth = new Date(new Date().toISOString()).toLocaleString(
    'en-US',
    { month: 'long', timeZone: 'UTC' }
  );
  const currentYear = new Date().getFullYear();
  return `unblock_collection_${currentYear}_${currentMonth}`;
};

describe('CollectionProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('throws when useCollection is used outside a CollectionProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    expect(() => render(<TestConsumer />)).toThrow(
      'useCollection must be used within a CollectionProvider'
    );
    consoleError.mockRestore();
  });

  it('starts with no collection data and not loading', () => {
    render(
      <CollectionProvider>
        <TestConsumer />
      </CollectionProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('collection-id')).toHaveTextContent('');
  });

  it('fetches and populates collection data on demand', async () => {
    render(
      <CollectionProvider>
        <TestConsumer />
      </CollectionProvider>
    );

    await act(async () => {
      screen.getByText('fetch').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('collection-id').textContent).not.toBe('');
    });
    expect(
      Number(screen.getByTestId('puzzle-count').textContent)
    ).toBeGreaterThan(0);
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('');
  });

  it('caches fetched data in localStorage under the current month key', async () => {
    render(
      <CollectionProvider>
        <TestConsumer />
      </CollectionProvider>
    );

    await act(async () => {
      screen.getByText('fetch').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('collection-id').textContent).not.toBe('');
    });

    const cached = window.localStorage.getItem(currentMonthKey());
    expect(cached).not.toBeNull();
    expect(JSON.parse(cached as string).unblockCollectionId).toBe(
      screen.getByTestId('collection-id').textContent
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

    render(
      <CollectionProvider>
        <TestConsumer />
      </CollectionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('collection-id')).toHaveTextContent(
        'cached-collection'
      );
    });
  });

  it('does not refetch when data is already loaded', async () => {
    render(
      <CollectionProvider>
        <TestConsumer />
      </CollectionProvider>
    );

    await act(async () => {
      screen.getByText('fetch').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('collection-id').textContent).not.toBe('');
    });
    const firstId = screen.getByTestId('collection-id').textContent;

    await act(async () => {
      screen.getByText('fetch').click();
    });

    expect(screen.getByTestId('collection-id')).toHaveTextContent(
      firstId as string
    );
  });

  it('ignores corrupt cached JSON and falls back to a fresh fetch', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    window.localStorage.setItem(currentMonthKey(), 'not-json{{{');

    render(
      <CollectionProvider>
        <TestConsumer />
      </CollectionProvider>
    );

    await act(async () => {
      screen.getByText('fetch').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('collection-id').textContent).not.toBe('');
    });
    expect(consoleWarn).toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  it('clears collection data and its cache entry', async () => {
    render(
      <CollectionProvider>
        <TestConsumer />
      </CollectionProvider>
    );

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

  it('removes cached data for other months when saving the current month', async () => {
    const staleKey = currentMonthKey().replace(
      /_(January|February|March|April|May|June|July|August|September|October|November|December)$/,
      (match) => (match === '_July' ? '_June' : '_July')
    );
    window.localStorage.setItem(staleKey, JSON.stringify({ stale: true }));

    render(
      <CollectionProvider>
        <TestConsumer />
      </CollectionProvider>
    );

    await act(async () => {
      screen.getByText('fetch').click();
    });
    await waitFor(() => {
      expect(screen.getByTestId('collection-id').textContent).not.toBe('');
    });

    expect(window.localStorage.getItem(staleKey)).toBeNull();
  });
});
