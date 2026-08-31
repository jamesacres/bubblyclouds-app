import { DifficultyDisplay } from '../types/difficultyDisplay';

// Describes the band of the puzzle just finished — e.g. "3 of 3 Beginner
// complete" — not the destination the Continue button is about to take the
// player to. Finishing the last puzzle in a band advances to the next
// (harder) band, so the label must be driven by the completed puzzle's own
// difficulty rather than the next-puzzle helper's, or it ends up describing
// a puzzle the player hasn't played yet.
export const nextPuzzleProgressLabel = <Puzzle>(args: {
  isDailyPuzzle: boolean;
  isCollectionPuzzle: boolean;
  streakMessage: string;
  completedDifficulty?: string;
  collectionPuzzles: Puzzle[];
  getDifficulty: (puzzle: Puzzle) => string;
  isPuzzleCompleted: (puzzle: Puzzle) => boolean;
  getDifficultyDisplay: (difficulty: string) => DifficultyDisplay;
}): string => {
  const {
    isDailyPuzzle,
    isCollectionPuzzle,
    streakMessage,
    completedDifficulty,
    collectionPuzzles,
    getDifficulty,
    isPuzzleCompleted,
    getDifficultyDisplay,
  } = args;

  if (isDailyPuzzle && !isCollectionPuzzle) {
    return streakMessage;
  }
  if (!completedDifficulty) {
    return '';
  }

  const bandPuzzles = collectionPuzzles.filter(
    (puzzle) => getDifficulty(puzzle) === completedDifficulty
  );
  const completedInBand = bandPuzzles.filter(isPuzzleCompleted).length;
  const bandLabel = getDifficultyDisplay(completedDifficulty).label;
  return `${completedInBand} of ${bandPuzzles.length} ${bandLabel} complete`;
};
