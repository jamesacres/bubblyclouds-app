import { getNextCollectionPuzzle } from './nextCollectionPuzzle';
import {
  UnblockCollectionOfTheMonth,
  UnblockCollectionPuzzle,
} from '../types/serverTypes';

// Selection-order coverage (band preference, lock tiebreaking, daily-run
// handoff) lives in the shared @games getNextCollectionPuzzle helper's own
// tests. These just cover this package's wiring into that helper: field
// mapping (difficulty, unblockCollectionId → puzzleId) and its own lock
// config (collectionLocks' FREE_PUZZLES_PER_DIFFICULTY).
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
  it('prefers the next incomplete puzzle in the same band and ids it by unblockCollectionId', () => {
    const collection = makeCollection([
      puzzle('a', 'beginner'),
      puzzle('b', 'beginner'),
      puzzle('c', 'challenging'),
    ]);
    const next = getNextCollectionPuzzle({
      collection,
      completedInitials: new Set(['a']),
      currentInitial: 'a',
      isSubscribed: true,
    });
    expect(next?.puzzle.initial).toBe('b');
    expect(next?.index).toBe(1);
    expect(next?.puzzleId).toBe('ofthemonth-202607-puzzle-1');
  });

  it("uses this collection's own free-per-difficulty allowance to flag locked puzzles", () => {
    // beginner band [0..4]: collectionLocks gives 3 free → indexes 3,4 locked.
    const collection = makeCollection([
      puzzle('a', 'beginner'),
      puzzle('b', 'beginner'),
      puzzle('c', 'beginner'),
      puzzle('d', 'beginner'),
      puzzle('e', 'beginner'),
    ]);
    const next = getNextCollectionPuzzle({
      collection,
      completedInitials: new Set(['d']),
      currentInitial: 'd',
      isSubscribed: false,
    });
    expect(next?.puzzle.initial).toBe('e');
    expect(next?.isLocked).toBe(true);
  });
});
