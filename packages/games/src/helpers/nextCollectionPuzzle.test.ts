import { getNextCollectionPuzzle } from './nextCollectionPuzzle';

interface FakePuzzle {
  initial: string;
  difficulty: string;
}

const puzzle = (initial: string, difficulty: string): FakePuzzle => ({
  initial,
  difficulty,
});

const getDifficulty = (puzzle: FakePuzzle) => puzzle.difficulty;
const getInitial = (puzzle: FakePuzzle) => puzzle.initial;

// beginner free = 3, everything else free = 1.
const lockedIndexesFor = (puzzles: FakePuzzle[]): Set<number> => {
  const freePerDifficulty: { [key: string]: number } = { beginner: 3 };
  const locked = new Set<number>();
  const bandIndexes = new Map<string, number[]>();
  puzzles.forEach((puzzle, index) => {
    const band = bandIndexes.get(puzzle.difficulty) ?? [];
    band.push(index);
    bandIndexes.set(puzzle.difficulty, band);
  });
  bandIndexes.forEach((indexes, difficulty) => {
    const freeCount = freePerDifficulty[difficulty] ?? 1;
    indexes.slice(freeCount).forEach((index) => locked.add(index));
  });
  return locked;
};

const callNext = (args: {
  puzzles: FakePuzzle[];
  completedInitials: Set<string>;
  currentInitial?: string;
  isSubscribed: boolean;
}) =>
  getNextCollectionPuzzle({
    puzzles: args.puzzles,
    collectionId: 'ofthemonth-202607',
    completedInitials: args.completedInitials,
    currentInitial: args.currentInitial,
    isSubscribed: args.isSubscribed,
    getDifficulty,
    getInitial,
    lockedIndexes: lockedIndexesFor(args.puzzles),
  });

describe('getNextCollectionPuzzle', () => {
  it('returns undefined when everything is complete', () => {
    const puzzles = [puzzle('a', 'beginner')];
    expect(
      callNext({
        puzzles,
        completedInitials: new Set(['a']),
        currentInitial: 'a',
        isSubscribed: true,
      })
    ).toBeUndefined();
  });

  it('prefers the next incomplete puzzle in the same band', () => {
    const puzzles = [
      puzzle('a', 'beginner'),
      puzzle('b', 'beginner'),
      puzzle('c', 'challenging'),
    ];
    const next = callNext({
      puzzles,
      completedInitials: new Set(['a']),
      currentInitial: 'a',
      isSubscribed: true,
    });
    expect(next?.puzzle.initial).toBe('b');
    expect(next?.index).toBe(1);
    expect(next?.puzzleId).toBe('ofthemonth-202607-puzzle-1');
  });

  it('moves to the next harder band when the current band is done', () => {
    const puzzles = [puzzle('a', 'beginner'), puzzle('b', 'challenging')];
    const next = callNext({
      puzzles,
      completedInitials: new Set(['a']),
      currentInitial: 'a',
      isSubscribed: true,
    });
    expect(next?.puzzle.initial).toBe('b');
  });

  it('prefers unlocked puzzles for free users within a tier', () => {
    // beginner band [0..4]: 3 free → indexes 3,4 are locked.
    const puzzles = [
      puzzle('a', 'beginner'),
      puzzle('b', 'beginner'),
      puzzle('c', 'beginner'),
      puzzle('d', 'beginner'),
      puzzle('e', 'beginner'),
    ];
    // current is index 3; the only same-band-after candidate is 4 (locked),
    // so a free user falls through to it and sees it flagged locked.
    const next = callNext({
      puzzles,
      completedInitials: new Set(['d']),
      currentInitial: 'd',
      isSubscribed: false,
    });
    expect(next?.isLocked).toBe(true);
  });

  it('picks unlocked over locked in the same tier for free users', () => {
    const puzzles = [
      puzzle('a', 'beginner'),
      puzzle('b', 'beginner'),
      puzzle('c', 'beginner'),
      puzzle('d', 'beginner'),
      puzzle('e', 'beginner'),
    ];
    // current index -1 (no current): all in tier 2. Free user prefers
    // unlocked (0,1,2) over locked (3,4), then lowest index → index 0.
    const next = callNext({
      puzzles,
      completedInitials: new Set(),
      isSubscribed: false,
    });
    expect(next?.index).toBe(0);
    expect(next?.isLocked).toBe(false);
  });

  it('lets subscribers ignore locks', () => {
    const puzzles = [
      puzzle('a', 'beginner'),
      puzzle('b', 'beginner'),
      puzzle('c', 'beginner'),
      puzzle('d', 'beginner'),
      puzzle('e', 'beginner'),
    ];
    const next = callNext({
      puzzles,
      completedInitials: new Set(['a', 'b', 'c', 'd']),
      currentInitial: 'd',
      isSubscribed: true,
    });
    // same band after index 3: index 4 (locked flag true but subscriber
    // ignores it for ordering) → picks index 4.
    expect(next?.index).toBe(4);
    expect(next?.isLocked).toBe(true);
  });

  it('prefers the nearest locked puzzle over an unlocked one in a later band when there is no current puzzle (daily-run handoff)', () => {
    // Regression: finishing a daily puzzle hands off with no
    // currentInitial, so every incomplete puzzle in every band got
    // tierRank 1 — "prefer unlocked" then applied globally across the whole
    // collection instead of within each band, so it skipped past the locked
    // puzzle right next to the player's completed free run and jumped to a
    // distant unlocked one in a harder band instead.
    const puzzles = [
      puzzle('a', 'beginner'),
      puzzle('b', 'beginner'),
      puzzle('c', 'beginner'),
      puzzle('d', 'beginner'), // locked (beginner free = 3)
      puzzle('e', 'beginner'), // locked
      puzzle('f', 'challenging'),
      puzzle('g', 'challenging'),
      puzzle('h', 'challenging'),
    ];
    const next = callNext({
      puzzles,
      completedInitials: new Set(['a', 'b', 'c']),
      currentInitial: undefined,
      isSubscribed: false,
    });
    expect(next?.puzzle.initial).toBe('d');
    expect(next?.isLocked).toBe(true);
  });

  it('regression: a currentInitial that matches no puzzle can point back at the very puzzle just finished', () => {
    // This is the failure mode when currentInitial doesn't string-equal any
    // collection puzzle's initial (e.g. a stale/non-canonicalized id) and
    // the session sync for the just-finished puzzle hasn't landed yet, so
    // completedInitials doesn't exclude it either. getNextCollectionPuzzle
    // can't tell "no current puzzle" apart from "current puzzle isn't in
    // this list", so it treats every puzzle — including the one the player
    // is actually standing on — as a valid, unranked candidate, and can
    // resolve right back to it.
    const puzzles = [puzzle('a', 'beginner'), puzzle('b', 'beginner')];
    const next = callNext({
      puzzles,
      completedInitials: new Set(),
      currentInitial: 'a-not-canonicalized',
      isSubscribed: true,
    });
    expect(next?.puzzle.initial).toBe('a');
  });
});
