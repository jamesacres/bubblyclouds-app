import {
  lockedCollectionIndexes,
  isCollectionPuzzleIdLocked,
} from './collectionLocks';

interface FakePuzzle {
  difficulty: string;
}

const puzzle = (difficulty: string): FakePuzzle => ({ difficulty });
const getDifficulty = (puzzle: FakePuzzle) => puzzle.difficulty;
const freePerDifficulty = { beginner: 3, expert: 1 };
const defaultFree = 1;

describe('lockedCollectionIndexes', () => {
  it('gives each band its configured free count and locks the rest', () => {
    const puzzles = [
      puzzle('beginner'),
      puzzle('beginner'),
      puzzle('beginner'),
      puzzle('beginner'),
      puzzle('beginner'),
      puzzle('expert'),
      puzzle('expert'),
    ];
    // beginner band [0..4] -> 3 free -> indexes 3,4 locked
    // expert band [5,6] -> 1 free -> index 6 locked
    expect(
      [
        ...lockedCollectionIndexes(
          puzzles,
          getDifficulty,
          freePerDifficulty,
          defaultFree
        ),
      ].sort((a, b) => a - b)
    ).toEqual([3, 4, 6]);
  });

  it('locks nothing when a band is within its free allowance', () => {
    const puzzles = [
      puzzle('beginner'),
      puzzle('beginner'),
      puzzle('beginner'),
    ];
    expect(
      lockedCollectionIndexes(
        puzzles,
        getDifficulty,
        freePerDifficulty,
        defaultFree
      ).size
    ).toBe(0);
  });

  it('gives an unconfigured difficulty the default free count', () => {
    const puzzles = [puzzle('mystery'), puzzle('mystery'), puzzle('mystery')];
    expect(
      [
        ...lockedCollectionIndexes(
          puzzles,
          getDifficulty,
          freePerDifficulty,
          defaultFree
        ),
      ].sort((a, b) => a - b)
    ).toEqual([1, 2]);
  });
});

describe('isCollectionPuzzleIdLocked', () => {
  const puzzles = [
    puzzle('beginner'),
    puzzle('beginner'),
    puzzle('beginner'),
    puzzle('beginner'),
    puzzle('expert'),
    puzzle('expert'),
  ];
  const locked = lockedCollectionIndexes(
    puzzles,
    getDifficulty,
    freePerDifficulty,
    defaultFree
  );

  it('returns false for an unparseable id', () => {
    expect(
      isCollectionPuzzleIdLocked(
        'not-a-real-id',
        puzzles,
        getDifficulty,
        freePerDifficulty,
        defaultFree
      )
    ).toBe(false);
  });

  it('matches lockedCollectionIndexes for a locked puzzle', () => {
    const lockedIndex = [...locked][0];
    expect(lockedIndex).toBeGreaterThanOrEqual(0);
    expect(
      isCollectionPuzzleIdLocked(
        `ofthemonth-202607-puzzle-${lockedIndex}`,
        puzzles,
        getDifficulty,
        freePerDifficulty,
        defaultFree
      )
    ).toBe(true);
  });

  it('matches lockedCollectionIndexes for an unlocked puzzle', () => {
    const unlockedIndex = puzzles.findIndex((_, i) => !locked.has(i));
    expect(unlockedIndex).toBeGreaterThanOrEqual(0);
    expect(
      isCollectionPuzzleIdLocked(
        `ofthemonth-202607-puzzle-${unlockedIndex}`,
        puzzles,
        getDifficulty,
        freePerDifficulty,
        defaultFree
      )
    ).toBe(false);
  });
});
