import {
  UnblockCollectionOfTheMonth,
  UnblockCollectionPuzzle,
} from '../types/serverTypes';
import { lockedCollectionIndexes } from './collectionLocks';

export interface NextCollectionPuzzle {
  puzzle: UnblockCollectionPuzzle;
  index: number;
  unblockCollectionPuzzleId: string;
  isLocked: boolean;
}

// Picks the puzzle to steer the player to after finishing one, driving the
// continue-to-next flow. Order of preference:
//   1. an incomplete puzzle in the same difficulty band, after the current
//      index (continue where they are),
//   2. the next harder band,
//   3. anything else still incomplete.
// For free users, unlocked puzzles are preferred within each tier so they
// aren't immediately walled off.
export const getNextCollectionPuzzle = (args: {
  collection: UnblockCollectionOfTheMonth;
  completedInitials: Set<string>;
  currentInitial?: string;
  isSubscribed: boolean;
}): NextCollectionPuzzle | undefined => {
  const { collection, completedInitials, currentInitial, isSubscribed } = args;
  const puzzles = collection.puzzles;
  const locked = lockedCollectionIndexes(puzzles);

  // Distinct difficulty bands in the order they first appear (ascending).
  const bandOrder: string[] = [];
  puzzles.forEach((puzzle) => {
    if (!bandOrder.includes(puzzle.difficulty)) {
      bandOrder.push(puzzle.difficulty);
    }
  });

  const currentIndex = currentInitial
    ? puzzles.findIndex((puzzle) => puzzle.initial === currentInitial)
    : -1;
  const currentBandRank =
    currentIndex >= 0
      ? bandOrder.indexOf(puzzles[currentIndex].difficulty)
      : -1;

  const toEntry = (index: number): NextCollectionPuzzle => ({
    puzzle: puzzles[index],
    index,
    unblockCollectionPuzzleId: `${collection.unblockCollectionId}-puzzle-${index}`,
    isLocked: locked.has(index),
  });

  const tierRank = (index: number): number => {
    const bandRank = bandOrder.indexOf(puzzles[index].difficulty);
    if (bandRank === currentBandRank && index > currentIndex) {
      return 0;
    }
    if (bandRank > currentBandRank) {
      return 1;
    }
    return 2;
  };

  const candidates = puzzles
    .map((puzzle, index) => ({ puzzle, index }))
    .filter(
      ({ puzzle, index }) =>
        index !== currentIndex && !completedInitials.has(puzzle.initial)
    );

  if (candidates.length === 0) {
    return undefined;
  }

  const lockedPenalty = (index: number): number =>
    !isSubscribed && locked.has(index) ? 1 : 0;

  candidates.sort((a, b) => {
    const tierDiff = tierRank(a.index) - tierRank(b.index);
    if (tierDiff !== 0) {
      return tierDiff;
    }
    const lockDiff = lockedPenalty(a.index) - lockedPenalty(b.index);
    if (lockDiff !== 0) {
      return lockDiff;
    }
    return a.index - b.index;
  });

  return toEntry(candidates[0].index);
};
