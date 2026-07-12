import { UnblockCollectionPuzzle } from '../types/serverTypes';
import { getCollectionOfTheMonth } from './mockData';

// Per difficulty band, the first half is free and the latter floor(len/2)
// puzzles are locked for free users. The collection is ordered ascending by
// difficulty, so a band is a contiguous run of puzzles sharing a difficulty.
export const lockedCollectionIndexes = (
  puzzles: UnblockCollectionPuzzle[]
): Set<number> => {
  const locked = new Set<number>();
  const bandIndexes = new Map<string, number[]>();

  puzzles.forEach((puzzle, index) => {
    const band = bandIndexes.get(puzzle.difficulty) ?? [];
    band.push(index);
    bandIndexes.set(puzzle.difficulty, band);
  });

  bandIndexes.forEach((indexes) => {
    const lockedCount = Math.floor(indexes.length / 2);
    indexes.slice(indexes.length - lockedCount).forEach((index) => {
      locked.add(index);
    });
  });

  return locked;
};

// Whether a collection puzzle id (ofthemonth-YYYYMM-puzzle-N) falls in the
// locked half of its difficulty band. Provider-free: it recomputes the
// month's deterministic collection so it can be called anywhere (e.g. the
// deep-link gate) without the CollectionProvider.
export const isCollectionPuzzleIdLocked = (id: string): boolean => {
  const match = /^ofthemonth-(\d{4})(\d{2})-puzzle-(\d+)$/.exec(id);
  if (!match) {
    return false;
  }
  const [, year, month, index] = match;
  const puzzleIndex = Number(index);
  const collection = getCollectionOfTheMonth(
    new Date(Date.UTC(Number(year), Number(month) - 1, 1))
  );
  return lockedCollectionIndexes(collection.puzzles).has(puzzleIndex);
};
