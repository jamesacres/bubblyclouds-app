import {
  getNextCollectionPuzzle as getNextCollectionPuzzleShared,
  NextCollectionPuzzle as SharedNextCollectionPuzzle,
} from '@bubblyclouds-app/games/helpers/nextCollectionPuzzle';
import {
  UnblockCollectionOfTheMonth,
  UnblockCollectionPuzzle,
} from '../types/serverTypes';
import { lockedCollectionIndexes } from './collectionLocks';

export type NextCollectionPuzzle =
  SharedNextCollectionPuzzle<UnblockCollectionPuzzle>;

// Picks the puzzle to steer the player to after finishing one, via the
// shared @games getNextCollectionPuzzle helper. See that helper for the
// selection order.
export const getNextCollectionPuzzle = (args: {
  collection: UnblockCollectionOfTheMonth;
  completedInitials: Set<string>;
  currentInitial?: string;
  isSubscribed: boolean;
}): NextCollectionPuzzle | undefined => {
  const { collection, completedInitials, currentInitial, isSubscribed } = args;
  const puzzles = collection.puzzles;

  return getNextCollectionPuzzleShared({
    puzzles,
    collectionId: collection.unblockCollectionId,
    completedInitials,
    currentInitial,
    isSubscribed,
    getDifficulty: (puzzle) => puzzle.difficulty,
    getInitial: (puzzle) => puzzle.initial,
    lockedIndexes: lockedCollectionIndexes(puzzles),
  });
};
