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

// Whether a collection puzzle id (<unblockCollectionId>-puzzle-N) falls in
// the locked half of its difficulty band. Takes the already-fetched
// collection's puzzles (from CollectionProvider) rather than recomputing
// content, since puzzle content now comes from the server.
export const isCollectionPuzzleIdLocked = (
  id: string,
  puzzles: UnblockCollectionPuzzle[]
): boolean => {
  const match = /-puzzle-(\d+)$/.exec(id);
  if (!match) {
    return false;
  }
  const puzzleIndex = Number(match[1]);
  return lockedCollectionIndexes(puzzles).has(puzzleIndex);
};
