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
  it('locks the latter half of each difficulty band', () => {
    const puzzles = [
      puzzle('simple'),
      puzzle('simple'),
      puzzle('simple'),
      puzzle('simple'),
      puzzle('hard'),
      puzzle('hard'),
    ];
    // simple band [0,1,2,3] → floor(4/2)=2 locked → indexes 2,3
    // hard band [4,5] → floor(2/2)=1 locked → index 5
    expect([...lockedCollectionIndexes(puzzles)].sort((a, b) => a - b)).toEqual(
      [2, 3, 5]
    );
  });

  it('locks nothing in a band of one', () => {
    expect(lockedCollectionIndexes([puzzle('simple')]).size).toBe(0);
  });

  it('locks the second of a band of three (floor)', () => {
    const puzzles = [puzzle('a'), puzzle('a'), puzzle('a')];
    expect([...lockedCollectionIndexes(puzzles)]).toEqual([2]);
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
