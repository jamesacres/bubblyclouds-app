import { getNextCollectionPuzzle } from './nextCollectionPuzzle';
import {
  UnblockCollectionOfTheMonth,
  UnblockCollectionPuzzle,
} from '../types/serverTypes';

const puzzle = (
  initial: string,
  difficulty: string
): UnblockCollectionPuzzle => ({
  initial,
  final: `${initial}-final`,
  movesRequired: 1,
  difficulty,
});

const makeCollection = (
  puzzles: UnblockCollectionPuzzle[]
): UnblockCollectionOfTheMonth => ({
  unblockCollectionId: 'ofthemonth-202607',
  puzzles,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('getNextCollectionPuzzle', () => {
  it('returns undefined when everything is complete', () => {
    const collection = makeCollection([puzzle('a', 'simple')]);
    expect(
      getNextCollectionPuzzle({
        collection,
        completedInitials: new Set(['a']),
        currentInitial: 'a',
        isSubscribed: true,
      })
    ).toBeUndefined();
  });

  it('prefers the next incomplete puzzle in the same band', () => {
    const collection = makeCollection([
      puzzle('a', 'simple'),
      puzzle('b', 'simple'),
      puzzle('c', 'easy'),
    ]);
    const next = getNextCollectionPuzzle({
      collection,
      completedInitials: new Set(['a']),
      currentInitial: 'a',
      isSubscribed: true,
    });
    expect(next?.puzzle.initial).toBe('b');
    expect(next?.index).toBe(1);
    expect(next?.unblockCollectionPuzzleId).toBe('ofthemonth-202607-puzzle-1');
  });

  it('moves to the next harder band when the current band is done', () => {
    const collection = makeCollection([
      puzzle('a', 'simple'),
      puzzle('b', 'easy'),
    ]);
    const next = getNextCollectionPuzzle({
      collection,
      completedInitials: new Set(['a']),
      currentInitial: 'a',
      isSubscribed: true,
    });
    expect(next?.puzzle.initial).toBe('b');
  });

  it('prefers unlocked puzzles for free users within a tier', () => {
    // simple band [0..3]: floor(4/2)=2 locked → indexes 2,3 locked.
    const collection = makeCollection([
      puzzle('a', 'simple'),
      puzzle('b', 'simple'),
      puzzle('c', 'simple'),
      puzzle('d', 'simple'),
    ]);
    // current is index 1; same-band-after candidates: 2 (locked), 3 (locked).
    // With b complete, candidates after: 2,3 both locked → falls through.
    const next = getNextCollectionPuzzle({
      collection,
      completedInitials: new Set(['b']),
      currentInitial: 'b',
      isSubscribed: false,
    });
    expect(next?.isLocked).toBe(true);
  });

  it('picks unlocked over locked in the same tier for free users', () => {
    const collection = makeCollection([
      puzzle('a', 'simple'),
      puzzle('b', 'simple'),
      puzzle('c', 'simple'),
      puzzle('d', 'simple'),
    ]);
    // current index -1 (no current): all in tier 2. Free user prefers
    // unlocked (0 or 1) over locked (2,3), then lowest index → index 0.
    const next = getNextCollectionPuzzle({
      collection,
      completedInitials: new Set(),
      isSubscribed: false,
    });
    expect(next?.index).toBe(0);
    expect(next?.isLocked).toBe(false);
  });

  it('lets subscribers ignore locks', () => {
    const collection = makeCollection([
      puzzle('a', 'simple'),
      puzzle('b', 'simple'),
      puzzle('c', 'simple'),
      puzzle('d', 'simple'),
    ]);
    const next = getNextCollectionPuzzle({
      collection,
      completedInitials: new Set(['a', 'b']),
      currentInitial: 'b',
      isSubscribed: true,
    });
    // same band after index 1: index 2 (locked flag true but subscriber
    // ignores it for ordering) → picks index 2.
    expect(next?.index).toBe(2);
    expect(next?.isLocked).toBe(true);
  });
});
