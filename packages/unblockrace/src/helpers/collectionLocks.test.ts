import {
  lockedCollectionIndexes,
  isCollectionPuzzleIdLocked,
} from './collectionLocks';
import { UnblockCollectionPuzzle } from '../types/serverTypes';

const puzzle = (difficulty: string): UnblockCollectionPuzzle => ({
  initial: 'x',
  final: 'x',
  movesRequired: 1,
  difficulty,
});

describe('lockedCollectionIndexes', () => {
  it('gives the easy bands 3 free and locks the rest', () => {
    const puzzles = [
      puzzle('beginner'),
      puzzle('beginner'),
      puzzle('beginner'),
      puzzle('beginner'),
      puzzle('beginner'),
      puzzle('expert'),
      puzzle('expert'),
    ];
    // beginner band [0..4] → 3 free → indexes 3,4 locked
    // expert band [5,6] → 1 free → index 6 locked
    expect([...lockedCollectionIndexes(puzzles)].sort((a, b) => a - b)).toEqual(
      [3, 4, 6]
    );
  });

  it('locks nothing when a band is within its free allowance', () => {
    const puzzles = [
      puzzle('beginner'),
      puzzle('beginner'),
      puzzle('beginner'),
    ];
    expect(lockedCollectionIndexes(puzzles).size).toBe(0);
  });

  it('gives an unknown difficulty a single free taste', () => {
    const puzzles = [puzzle('mystery'), puzzle('mystery'), puzzle('mystery')];
    expect([...lockedCollectionIndexes(puzzles)].sort((a, b) => a - b)).toEqual(
      [1, 2]
    );
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
  const locked = lockedCollectionIndexes(puzzles);

  it('returns false for an unparseable id', () => {
    expect(isCollectionPuzzleIdLocked('not-a-real-id', puzzles)).toBe(false);
  });

  it('matches lockedCollectionIndexes for a locked puzzle', () => {
    const lockedIndex = [...locked][0];
    expect(lockedIndex).toBeGreaterThanOrEqual(0);
    expect(
      isCollectionPuzzleIdLocked(
        `ofthemonth-202607-puzzle-${lockedIndex}`,
        puzzles
      )
    ).toBe(true);
  });

  it('matches lockedCollectionIndexes for an unlocked puzzle', () => {
    const unlockedIndex = puzzles.findIndex((_, i) => !locked.has(i));
    expect(unlockedIndex).toBeGreaterThanOrEqual(0);
    expect(
      isCollectionPuzzleIdLocked(
        `ofthemonth-202607-puzzle-${unlockedIndex}`,
        puzzles
      )
    ).toBe(false);
  });
});
