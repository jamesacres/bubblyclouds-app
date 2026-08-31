import {
  lockedCollectionIndexes as genericLockedCollectionIndexes,
  isCollectionPuzzleIdLocked as genericIsCollectionPuzzleIdLocked,
} from '@bubblyclouds-app/games/helpers/collectionLocks';
import { UnblockCollectionPuzzle } from '../types/serverTypes';

// How many puzzles per difficulty band a free player can taste before the
// rest of the band becomes Plus. The two easiest bands give a generous run of
// free puzzles; the harder bands give a single taste each, so Plus reads as
// "unlock the bulk of the pack", not "we took half your puzzles away". A band
// with fewer puzzles than its allowance is entirely free.
export const FREE_PUZZLES_PER_DIFFICULTY: { [key: string]: number } = {
  beginner: 3,
  challenging: 3,
  hard: 1,
  expert: 1,
};

const DEFAULT_FREE_PER_DIFFICULTY = 1;

const getDifficulty = (puzzle: UnblockCollectionPuzzle) => puzzle.difficulty;

// The Plus-only puzzles: per difficulty band, the puzzles beyond that band's
// free allowance. The collection is ordered ascending by difficulty, so a
// band is a contiguous run of puzzles sharing a difficulty.
export const lockedCollectionIndexes = (
  puzzles: UnblockCollectionPuzzle[]
): Set<number> =>
  genericLockedCollectionIndexes(
    puzzles,
    getDifficulty,
    FREE_PUZZLES_PER_DIFFICULTY,
    DEFAULT_FREE_PER_DIFFICULTY
  );

// Whether a collection puzzle id (<unblockCollectionId>-puzzle-N) falls in
// the locked half of its difficulty band. Takes the already-fetched
// collection's puzzles (from CollectionProvider) rather than recomputing
// content, since puzzle content now comes from the server.
export const isCollectionPuzzleIdLocked = (
  id: string,
  puzzles: UnblockCollectionPuzzle[]
): boolean =>
  genericIsCollectionPuzzleIdLocked(
    id,
    puzzles,
    getDifficulty,
    FREE_PUZZLES_PER_DIFFICULTY,
    DEFAULT_FREE_PER_DIFFICULTY
  );
