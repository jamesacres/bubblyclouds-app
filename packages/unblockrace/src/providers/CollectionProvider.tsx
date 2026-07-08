'use client';
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { UnblockCollectionOfTheMonth } from '../types/serverTypes';
import { getCollectionOfTheMonth } from '../helpers/mockData';

interface CollectionContextType {
  collectionData: UnblockCollectionOfTheMonth | null;
  isLoading: boolean;
  error: string | null;
  fetchCollectionData: () => Promise<void>;
  clearCollectionData: () => void;
}

const CollectionContext = createContext<CollectionContextType | null>(null);

interface CollectionProviderProps {
  children: ReactNode;
}

// Helper to get current month key for caching
const getCurrentMonthKey = (): string => {
  const currentMonth = new Date(new Date().toISOString()).toLocaleString(
    'en-US',
    {
      month: 'long',
      timeZone: 'UTC',
    }
  );
  const currentYear = new Date().getFullYear();
  return `unblock_collection_${currentYear}_${currentMonth}`;
};

// Helper to load collection data from localStorage
const loadCachedCollectionData = (): UnblockCollectionOfTheMonth | null => {
  try {
    const monthKey = getCurrentMonthKey();
    const cachedData = localStorage.getItem(monthKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      // Convert date strings back to Date objects
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
      };
    }
  } catch (err) {
    console.warn('Failed to load cached collection data:', err);
  }
  return null;
};

// Helper to save collection data to localStorage
const saveCachedCollectionData = (data: UnblockCollectionOfTheMonth): void => {
  try {
    const monthKey = getCurrentMonthKey();
    localStorage.setItem(monthKey, JSON.stringify(data));

    // Clean up old cached data (keep only current month)
    const currentYear = new Date().getFullYear();
    const allMonths = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    allMonths.forEach((month) => {
      const oldKey = `unblock_collection_${currentYear}_${month}`;
      if (oldKey !== monthKey && localStorage.getItem(oldKey)) {
        localStorage.removeItem(oldKey);
      }
    });

    // Also clean up previous year's data
    allMonths.forEach((month) => {
      const oldYearKey = `unblock_collection_${currentYear - 1}_${month}`;
      if (localStorage.getItem(oldYearKey)) {
        localStorage.removeItem(oldYearKey);
      }
    });
  } catch (err) {
    console.warn('Failed to save cached collection data:', err);
  }
};

export const CollectionProvider = ({ children }: CollectionProviderProps) => {
  const [collectionData, setCollectionData] =
    useState<UnblockCollectionOfTheMonth | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollectionData = useCallback(async () => {
    // If data already exists or currently loading, don't fetch again
    if (collectionData || isLoading) {
      return;
    }

    // First try to load from cache
    const cachedData = loadCachedCollectionData();
    if (cachedData) {
      setCollectionData(cachedData);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Mock puzzle-content source (SPEC.md §8): deterministic monthly pick
      // from the seed fixture until the real collections API exists.
      const result = getCollectionOfTheMonth();
      setCollectionData(result);
      saveCachedCollectionData(result);
    } catch (err) {
      console.error(err);
      setError('Failed to load puzzle collection');
    } finally {
      setIsLoading(false);
    }
  }, [collectionData, isLoading]);

  const clearCollectionData = useCallback(() => {
    setCollectionData(null);
    setError(null);
    // Also clear the cache
    try {
      const monthKey = getCurrentMonthKey();
      localStorage.removeItem(monthKey);
    } catch (err) {
      console.warn('Failed to clear cached collection data:', err);
    }
  }, []);

  // Initialize with cached data on mount
  useEffect(() => {
    const cachedData = loadCachedCollectionData();
    if (cachedData && !collectionData) {
      setCollectionData(cachedData);
    }
  }, [collectionData]);

  return (
    <CollectionContext.Provider
      value={{
        collectionData,
        isLoading,
        error,
        fetchCollectionData,
        clearCollectionData,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
};

export const useCollection = () => {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error('useCollection must be used within a CollectionProvider');
  }
  return context;
};
