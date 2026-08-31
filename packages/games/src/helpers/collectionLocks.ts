// Generic free-count-per-difficulty locking for a monthly puzzle
// collection/book. A collection is grouped into contiguous same-difficulty
// "bands" (the collection is expected pre-sorted ascending by difficulty);
// within each band, the first N puzzles are free and the rest require Plus.
// A band smaller than its free allowance is entirely free.
export const lockedCollectionIndexes = <Puzzle>(
  puzzles: Puzzle[],
  getDifficulty: (puzzle: Puzzle) => string,
  freePerDifficulty: { [key: string]: number },
  defaultFreePerDifficulty: number
): Set<number> => {
  const locked = new Set<number>();
  const bandIndexes = new Map<string, number[]>();

  puzzles.forEach((puzzle, index) => {
    const difficulty = getDifficulty(puzzle);
    const band = bandIndexes.get(difficulty) ?? [];
    band.push(index);
    bandIndexes.set(difficulty, band);
  });

  bandIndexes.forEach((indexes, difficulty) => {
    const freeCount = freePerDifficulty[difficulty] ?? defaultFreePerDifficulty;
    indexes.slice(freeCount).forEach((index) => {
      locked.add(index);
    });
  });

  return locked;
};

// Whether a collection/book puzzle id (<collectionId>-puzzle-N) falls in the
// locked half of its difficulty band.
export const isCollectionPuzzleIdLocked = <Puzzle>(
  id: string,
  puzzles: Puzzle[],
  getDifficulty: (puzzle: Puzzle) => string,
  freePerDifficulty: { [key: string]: number },
  defaultFreePerDifficulty: number
): boolean => {
  const match = /-puzzle-(\d+)$/.exec(id);
  if (!match) {
    return false;
  }
  const puzzleIndex = Number(match[1]);
  return lockedCollectionIndexes(
    puzzles,
    getDifficulty,
    freePerDifficulty,
    defaultFreePerDifficulty
  ).has(puzzleIndex);
};
