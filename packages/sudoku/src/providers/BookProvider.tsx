'use client';
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { SudokuBookOfTheMonth } from '../types/serverTypes';
import { useSudokuServerStorage } from '../hooks/useSudokuServerStorage';
import { useTranslation } from 'react-i18next';
import { useOnline } from '@bubblyclouds-app/template/hooks/online';

interface BookContextType {
  bookData: SudokuBookOfTheMonth | null;
  isLoading: boolean;
  error: string | null;
  fetchBookData: () => Promise<void>;
  clearBookData: () => void;
}

const BookContext = createContext<BookContextType | null>(null);

interface BookProviderProps {
  children: ReactNode;
  app: string;
  apiUrl: string;
}

const MONTH_KEYS = [
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

// Cache keys stay language-independent so switching language never orphans
// the cached book.
const getCurrentMonthKey = (): string => {
  const currentMonth = MONTH_KEYS[new Date().getUTCMonth()];
  const currentYear = new Date().getFullYear();
  return `sudoku_book_${currentYear}_${currentMonth}`;
};

// Helper to load book data from localStorage
const loadCachedBookData = (): SudokuBookOfTheMonth | null => {
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
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
      };
    }
  } catch (err) {
    console.warn('Failed to load cached book data:', err);
  }
  return null;
};

// Helper to save book data to localStorage
const saveCachedBookData = (data: SudokuBookOfTheMonth): void => {
  try {
    const monthKey = getCurrentMonthKey();
    localStorage.setItem(monthKey, JSON.stringify(data));

    // Clean up old cached data (keep only current month)
    const currentYear = new Date().getFullYear();
    MONTH_KEYS.forEach((month) => {
      const oldKey = `sudoku_book_${currentYear}_${month}`;
      if (oldKey !== monthKey && localStorage.getItem(oldKey)) {
        localStorage.removeItem(oldKey);
      }
    });

    // Also clean up previous year's data
    MONTH_KEYS.forEach((month) => {
      const oldYearKey = `sudoku_book_${currentYear - 1}_${month}`;
      if (localStorage.getItem(oldYearKey)) {
        localStorage.removeItem(oldYearKey);
      }
    });
  } catch (err) {
    console.warn('Failed to save cached book data:', err);
  }
};

export const BookProvider = ({ children, app, apiUrl }: BookProviderProps) => {
  const [bookData, setBookData] = useState<SudokuBookOfTheMonth | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<'offline' | 'loadFailed' | null>(
    null
  );
  const { t } = useTranslation('sudoku');
  const error = errorCode ? t(`bookProvider.errors.${errorCode}`) : null;
  const { getSudokuBookOfTheMonth } = useSudokuServerStorage({ app, apiUrl });
  const { isOnline } = useOnline();

  const fetchBookData = useCallback(async () => {
    // If data already exists or currently loading, don't fetch again
    if (bookData || isLoading) {
      return;
    }

    // First try to load from cache
    const cachedData = loadCachedBookData();
    if (cachedData) {
      setBookData(cachedData);
      return;
    }

    setIsLoading(true);
    setErrorCode(null);

    try {
      const result = await getSudokuBookOfTheMonth();
      if (result) {
        setBookData(result);
        // Cache the fetched data
        saveCachedBookData(result);
      } else {
        if (!isOnline) {
          setErrorCode('offline');
        } else {
          setErrorCode('loadFailed');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorCode('loadFailed');
    } finally {
      setIsLoading(false);
    }
  }, [bookData, isLoading, getSudokuBookOfTheMonth, isOnline]);

  const clearBookData = useCallback(() => {
    setBookData(null);
    setErrorCode(null);
    // Also clear the cache
    try {
      const monthKey = getCurrentMonthKey();
      localStorage.removeItem(monthKey);
    } catch (err) {
      console.warn('Failed to clear cached book data:', err);
    }
  }, []);

  // Initialize with cached data on mount
  useEffect(() => {
    const cachedData = loadCachedBookData();
    if (cachedData && !bookData) {
      setBookData(cachedData);
    }
  }, [bookData]);

  return (
    <BookContext.Provider
      value={{
        bookData,
        isLoading,
        error,
        fetchBookData,
        clearBookData,
      }}
    >
      {children}
    </BookContext.Provider>
  );
};

export const useBook = () => {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error('useBook must be used within a BookProvider');
  }
  return context;
};
