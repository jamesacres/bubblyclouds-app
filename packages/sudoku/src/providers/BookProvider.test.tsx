import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BookProvider, useBook } from './BookProvider';
import { useSudokuServerStorage } from '../hooks/useSudokuServerStorage';
import { useOnline } from '@sudoku-web/template/hooks/online';
import { SudokuBookOfTheMonth } from '../types/serverTypes';

jest.mock('../hooks/useSudokuServerStorage');
jest.mock('@sudoku-web/template/hooks/online');

const mockUseSudokuServerStorage = useSudokuServerStorage as jest.Mock;
const mockUseOnline = useOnline as jest.Mock;

const TestComponent = () => {
  const { bookData, isLoading, error, fetchBookData } = useBook();
  return (
    <div>
      <button onClick={fetchBookData}>Fetch</button>
      {isLoading && <div>Loading...</div>}
      {error && <div>{error}</div>}
      {bookData && <div>{bookData.sudokuBookId}</div>}
    </div>
  );
};

describe('BookProvider', () => {
  const mockBook: SudokuBookOfTheMonth = {
    sudokuBookId: 'book-1',
    puzzles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let mockGetSudokuBookOfTheMonth: jest.Mock;

  beforeEach(() => {
    mockGetSudokuBookOfTheMonth = jest.fn();
    mockUseSudokuServerStorage.mockReturnValue({
      getSudokuBookOfTheMonth: mockGetSudokuBookOfTheMonth,
    });
    mockUseOnline.mockReturnValue({ isOnline: true });
    localStorage.clear();
  });

  it('fetches and displays book data', async () => {
    mockGetSudokuBookOfTheMonth.mockResolvedValue(mockBook);
    render(
      <BookProvider>
        <TestComponent />
      </BookProvider>
    );

    act(() => {
      screen.getByText('Fetch').click();
    });

    await waitFor(() => {
      expect(screen.getByText('book-1')).toBeInTheDocument();
    });
  });

  it('loads data from cache on initial render', async () => {
    const monthKey = `sudoku_book_${new Date().getFullYear()}_${new Date().toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })}`;
    localStorage.setItem(monthKey, JSON.stringify(mockBook));

    render(
      <BookProvider>
        <TestComponent />
      </BookProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('book-1')).toBeInTheDocument();
    });
    expect(mockGetSudokuBookOfTheMonth).not.toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    mockGetSudokuBookOfTheMonth.mockRejectedValue(new Error('Failed to fetch'));
    render(
      <BookProvider>
        <TestComponent />
      </BookProvider>
    );

    act(() => {
      screen.getByText('Fetch').click();
    });

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load puzzle book')
      ).toBeInTheDocument();
    });
  });

  it('shows an offline error message', async () => {
    mockUseOnline.mockReturnValue({ isOnline: false });
    render(
      <BookProvider>
        <TestComponent />
      </BookProvider>
    );

    act(() => {
      screen.getByText('Fetch').click();
    });

    await waitFor(() => {
      expect(
        screen.getByText('You are offline, please check your connection')
      ).toBeInTheDocument();
    });
  });
});
