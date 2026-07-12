import { UnblockCollectionPuzzle } from '../types/serverTypes';
import { getCollectionOfTheMonth } from './mockData';

// How many puzzles per difficulty band a free player can taste before the
// rest of the band becomes Plus. The two easiest bands give a generous run of
// free puzzles; the harder bands give a single taste each, so Plus reads as
// "unlock the bulk of the pack", not "we took half your puzzles away". A band
// with fewer puzzles than its allowance is entirely free.
export const FREE_PUZZLES_PER_DIFFICULTY: { [key: string]: number } = {
  simple: 3,
  easy: 3,
  intermediate: 1,
  expert: 1,
};

const DEFAULT_FREE_PER_DIFFICULTY = 1;

// The Plus-only puzzles: per difficulty band, the puzzles beyond that band's
// free allowance. The collection is ordered ascending by difficulty, so a
// band is a contiguous run of puzzles sharing a difficulty.
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

  bandIndexes.forEach((indexes, difficulty) => {
    const freeCount =
      FREE_PUZZLES_PER_DIFFICULTY[difficulty] ?? DEFAULT_FREE_PER_DIFFICULTY;
    indexes.slice(freeCount).forEach((index) => {
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
