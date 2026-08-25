import {
  lockedCollectionIndexes as genericLockedCollectionIndexes,
  isCollectionPuzzleIdLocked as genericIsCollectionPuzzleIdLocked,
} from '@bubblyclouds-app/games/helpers/collectionLocks';
import { SudokuBookPuzzle } from '../types/serverTypes';

// How many puzzles per difficulty band a free player can taste before the
// rest of the band becomes Plus. Tapers from a generous run on the easiest
// bands (mirroring Unblock Race's collection locks) down to a single taste
// from moderate difficulty onward, spread across the book's 11-level coach
// scale. A band with fewer puzzles than its allowance is entirely free.
export const FREE_PUZZLES_PER_DIFFICULTY: { [key: string]: number } = {
  '1-very-easy': 3,
  '2-easy': 3,
  '3-moderately-easy': 2,
  '4-moderate': 2,
  '5-moderately-hard': 1,
  '6-hard': 1,
  '7-vicious': 1,
  '8-fiendish': 1,
  '9-devilish': 1,
  '10-hell': 1,
  '11-beyond-hell': 1,
};

const DEFAULT_FREE_PER_DIFFICULTY = 1;

const getDifficulty = (puzzle: SudokuBookPuzzle) => puzzle.difficulty.coach;

// The Plus-only puzzles: per difficulty band, the puzzles beyond that band's
// free allowance. The book is ordered ascending by difficulty, so a band is
// a contiguous run of puzzles sharing a difficulty.
export const lockedBookIndexes = (puzzles: SudokuBookPuzzle[]): Set<number> =>
  genericLockedCollectionIndexes(
    puzzles,
    getDifficulty,
    FREE_PUZZLES_PER_DIFFICULTY,
    DEFAULT_FREE_PER_DIFFICULTY
  );

// Whether a book puzzle id (<sudokuBookId>-puzzle-N) falls in the locked
// half of its difficulty band. Takes the already-fetched book's puzzles
// (from BookProvider) rather than recomputing content.
export const isBookPuzzleIdLocked = (
  id: string,
  puzzles: SudokuBookPuzzle[]
): boolean =>
  genericIsCollectionPuzzleIdLocked(
    id,
    puzzles,
    getDifficulty,
    FREE_PUZZLES_PER_DIFFICULTY,
    DEFAULT_FREE_PER_DIFFICULTY
  );
