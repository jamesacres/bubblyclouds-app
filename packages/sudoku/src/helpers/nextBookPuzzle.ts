import {
  getNextCollectionPuzzle,
  NextCollectionPuzzle,
} from '@bubblyclouds-app/games/helpers/nextCollectionPuzzle';
import { SudokuBookOfTheMonth, SudokuBookPuzzle } from '../types/serverTypes';
import { lockedBookIndexes } from './bookLocks';

export type NextBookPuzzle = NextCollectionPuzzle<SudokuBookPuzzle>;

// Picks the puzzle to steer the player to after finishing one. Mirrors
// Unblock Race's getNextCollectionPuzzle via the shared @games
// getNextCollectionPuzzle helper. See that helper for the selection order.
export const getNextBookPuzzle = (args: {
  book: SudokuBookOfTheMonth;
  completedInitials: Set<string>;
  currentInitial?: string;
  isSubscribed: boolean;
}): NextBookPuzzle | undefined => {
  const { book, completedInitials, currentInitial, isSubscribed } = args;
  const puzzles = book.puzzles;

  return getNextCollectionPuzzle({
    puzzles,
    collectionId: book.sudokuBookId,
    completedInitials,
    currentInitial,
    isSubscribed,
    getDifficulty: (puzzle) => puzzle.difficulty.coach,
    getInitial: (puzzle) => puzzle.initial,
    lockedIndexes: lockedBookIndexes(puzzles),
  });
};
