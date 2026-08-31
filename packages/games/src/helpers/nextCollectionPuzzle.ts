// Picks the puzzle to steer the player to after finishing one, driving the
// continue-to-next flow, for a monthly puzzle collection/book generic over
// its own Puzzle shape. Order of preference:
//   1. an incomplete puzzle in the same difficulty band, after the current
//      index (continue where they are),
//   2. the next harder band,
//   3. anything else still incomplete.
// For free users, unlocked puzzles are preferred within each tier so they
// aren't immediately walled off. When currentInitial isn't in the
// collection (e.g. finishing the daily puzzle, or a stale/non-canonicalized
// initial), there is no "current position" to continue from, so every
// incomplete puzzle is treated as being in a later band.
export interface NextCollectionPuzzle<Puzzle> {
  puzzle: Puzzle;
  index: number;
  puzzleId: string;
  isLocked: boolean;
}

export const getNextCollectionPuzzle = <Puzzle>(args: {
  puzzles: Puzzle[];
  collectionId: string;
  completedInitials: Set<string>;
  currentInitial?: string;
  isSubscribed: boolean;
  getDifficulty: (puzzle: Puzzle) => string;
  getInitial: (puzzle: Puzzle) => string;
  lockedIndexes: Set<number>;
}): NextCollectionPuzzle<Puzzle> | undefined => {
  const {
    puzzles,
    collectionId,
    completedInitials,
    currentInitial,
    isSubscribed,
    getDifficulty,
    getInitial,
    lockedIndexes,
  } = args;

  // Distinct difficulty bands in the order they first appear (ascending).
  const bandOrder: string[] = [];
  puzzles.forEach((puzzle) => {
    const band = getDifficulty(puzzle);
    if (!bandOrder.includes(band)) {
      bandOrder.push(band);
    }
  });

  const currentIndex = currentInitial
    ? puzzles.findIndex((puzzle) => getInitial(puzzle) === currentInitial)
    : -1;
  const currentBandRank =
    currentIndex >= 0
      ? bandOrder.indexOf(getDifficulty(puzzles[currentIndex]))
      : -1;

  const toEntry = (index: number): NextCollectionPuzzle<Puzzle> => ({
    puzzle: puzzles[index],
    index,
    puzzleId: `${collectionId}-puzzle-${index}`,
    isLocked: lockedIndexes.has(index),
  });

  const tierRank = (index: number): number => {
    const bandRank = bandOrder.indexOf(getDifficulty(puzzles[index]));
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
        index !== currentIndex && !completedInitials.has(getInitial(puzzle))
    );

  if (candidates.length === 0) {
    return undefined;
  }

  const lockedPenalty = (index: number): number =>
    !isSubscribed && lockedIndexes.has(index) ? 1 : 0;

  const bandRankOf = (index: number): number =>
    bandOrder.indexOf(getDifficulty(puzzles[index]));

  candidates.sort((a, b) => {
    const tierDiff = tierRank(a.index) - tierRank(b.index);
    if (tierDiff !== 0) {
      return tierDiff;
    }
    // Within a tier, stay in band order first — "prefer unlocked" is a
    // same-band tiebreaker, not a license to skip a nearer locked puzzle
    // for a farther unlocked one in a later band.
    const bandDiff = bandRankOf(a.index) - bandRankOf(b.index);
    if (bandDiff !== 0) {
      return bandDiff;
    }
    const lockDiff = lockedPenalty(a.index) - lockedPenalty(b.index);
    if (lockDiff !== 0) {
      return lockDiff;
    }
    return a.index - b.index;
  });

  return toEntry(candidates[0].index);
};
