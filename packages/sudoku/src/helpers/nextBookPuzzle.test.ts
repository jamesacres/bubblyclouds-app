import { getNextBookPuzzle } from './nextBookPuzzle';
import { SudokuBookOfTheMonth, SudokuBookPuzzle } from '../types/serverTypes';
import { BookPuzzleDifficulty } from '@bubblyclouds-app/games/types/difficulty';

// Selection-order coverage (band preference, lock tiebreaking, daily-puzzle
// handoff) lives in the shared @games getNextCollectionPuzzle helper's own
// tests. These just cover this package's wiring into that helper: field
// mapping (difficulty.coach, sudokuBookId → puzzleId) and its own lock
// config (bookLocks' FREE_PUZZLES_PER_DIFFICULTY).
const puzzle = (
  initial: string,
  difficulty: BookPuzzleDifficulty
): SudokuBookPuzzle =>
  ({
    initial,
    final: `${initial}-final`,
    difficulty: { coach: difficulty },
  }) as SudokuBookPuzzle;

const makeBook = (puzzles: SudokuBookPuzzle[]): SudokuBookOfTheMonth => ({
  sudokuBookId: 'ofthemonth-202607',
  puzzles,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('getNextBookPuzzle', () => {
  it('prefers the next incomplete puzzle in the same band and ids it by sudokuBookId', () => {
    const book = makeBook([
      puzzle('a', BookPuzzleDifficulty.VERY_EASY),
      puzzle('b', BookPuzzleDifficulty.VERY_EASY),
      puzzle('c', BookPuzzleDifficulty.EASY),
    ]);
    const next = getNextBookPuzzle({
      book,
      completedInitials: new Set(['a']),
      currentInitial: 'a',
      isSubscribed: true,
    });
    expect(next?.puzzle.initial).toBe('b');
    expect(next?.index).toBe(1);
    expect(next?.puzzleId).toBe('ofthemonth-202607-puzzle-1');
  });

  it("uses this book's own free-per-difficulty allowance to flag locked puzzles", () => {
    // very-easy band [0..4]: bookLocks gives 3 free → indexes 3,4 locked.
    const book = makeBook([
      puzzle('a', BookPuzzleDifficulty.VERY_EASY),
      puzzle('b', BookPuzzleDifficulty.VERY_EASY),
      puzzle('c', BookPuzzleDifficulty.VERY_EASY),
      puzzle('d', BookPuzzleDifficulty.VERY_EASY),
      puzzle('e', BookPuzzleDifficulty.VERY_EASY),
    ]);
    const next = getNextBookPuzzle({
      book,
      completedInitials: new Set(['d']),
      currentInitial: 'd',
      isSubscribed: false,
    });
    expect(next?.puzzle.initial).toBe('e');
    expect(next?.isLocked).toBe(true);
  });
});
