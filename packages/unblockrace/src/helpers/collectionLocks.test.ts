import {
  lockedCollectionIndexes,
  isCollectionPuzzleIdLocked,
} from './collectionLocks';
import { getCollectionOfTheMonth } from './mockData';
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
      puzzle('simple'),
      puzzle('simple'),
      puzzle('simple'),
      puzzle('simple'),
      puzzle('simple'),
      puzzle('expert'),
      puzzle('expert'),
    ];
    // simple band [0..4] → 3 free → indexes 3,4 locked
    // expert band [5,6] → 1 free → index 6 locked
    expect([...lockedCollectionIndexes(puzzles)].sort((a, b) => a - b)).toEqual(
      [3, 4, 6]
    );
  });

  it('locks nothing when a band is within its free allowance', () => {
    const puzzles = [puzzle('simple'), puzzle('simple'), puzzle('simple')];
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
  const date = new Date(Date.UTC(2026, 6, 1));
  const collection = getCollectionOfTheMonth(date);
  const locked = lockedCollectionIndexes(collection.puzzles);
  const monthKey = collection.unblockCollectionId.replace('ofthemonth-', '');

  it('returns false for an unparseable id', () => {
    expect(isCollectionPuzzleIdLocked('not-a-real-id')).toBe(false);
  });

  it('matches lockedCollectionIndexes for a locked puzzle', () => {
    const lockedIndex = [...locked][0];
    expect(lockedIndex).toBeGreaterThanOrEqual(0);
    expect(
      isCollectionPuzzleIdLocked(`ofthemonth-${monthKey}-puzzle-${lockedIndex}`)
    ).toBe(true);
  });

  it('matches lockedCollectionIndexes for an unlocked puzzle', () => {
    const unlockedIndex = collection.puzzles.findIndex(
      (_, i) => !locked.has(i)
    );
    expect(unlockedIndex).toBeGreaterThanOrEqual(0);
    expect(
      isCollectionPuzzleIdLocked(
        `ofthemonth-${monthKey}-puzzle-${unlockedIndex}`
      )
    ).toBe(false);
  });
});
