import { nextPuzzleProgressLabel } from './nextPuzzleProgressLabel';
import { getDifficultyDisplay } from './getDifficultyDisplay';

interface FakePuzzle {
  initial: string;
  difficulty: string;
}

const puzzle = (initial: string, difficulty: string): FakePuzzle => ({
  initial,
  difficulty,
});

const label = (args: {
  isDailyPuzzle: boolean;
  isCollectionPuzzle: boolean;
  completedDifficulty?: string;
  collectionPuzzles: FakePuzzle[];
  isPuzzleCompleted: (_puzzle: FakePuzzle) => boolean;
}) =>
  nextPuzzleProgressLabel({
    ...args,
    streakMessage: 'Keep the streak going in the collection',
    getDifficulty: (puzzle) => puzzle.difficulty,
    getDifficultyDisplay: (difficulty) => {
      const { name, badgeColor } = getDifficultyDisplay(difficulty);
      return { label: name, chipClass: badgeColor };
    },
  });

describe('nextPuzzleProgressLabel', () => {
  it("describes the just-completed puzzle band, not the next puzzle's band", () => {
    const collectionPuzzles = [
      puzzle('a', '1-very-easy'),
      puzzle('b', '1-very-easy'),
      puzzle('c', '1-very-easy'),
      puzzle('d', '2-easy'),
    ];
    const completed = new Set(['a', 'b', 'c']);

    const result = label({
      isDailyPuzzle: false,
      isCollectionPuzzle: true,
      // The finished puzzle was very-easy, even though the next-puzzle
      // helper (not called here) would point at the easy band.
      completedDifficulty: '1-very-easy',
      collectionPuzzles,
      isPuzzleCompleted: (p) => completed.has(p.initial),
    });

    expect(result).toBe('3 of 3 🟢 Very Easy complete');
  });

  it('reports progress within the completed band before it is finished', () => {
    const collectionPuzzles = [
      puzzle('a', '2-easy'),
      puzzle('b', '2-easy'),
      puzzle('c', '2-easy'),
    ];
    const completed = new Set(['a']);

    const result = label({
      isDailyPuzzle: false,
      isCollectionPuzzle: true,
      completedDifficulty: '2-easy',
      collectionPuzzles,
      isPuzzleCompleted: (p) => completed.has(p.initial),
    });

    expect(result).toBe('1 of 3 🟢 Easy complete');
  });

  it('keeps the streak message for the daily puzzle outside the collection', () => {
    const result = label({
      isDailyPuzzle: true,
      isCollectionPuzzle: false,
      completedDifficulty: 'expert',
      collectionPuzzles: [],
      isPuzzleCompleted: () => false,
    });

    expect(result).toBe('Keep the streak going in the collection');
  });

  it('returns an empty label when the completed difficulty is unknown', () => {
    const result = label({
      isDailyPuzzle: false,
      isCollectionPuzzle: true,
      completedDifficulty: undefined,
      collectionPuzzles: [],
      isPuzzleCompleted: () => false,
    });

    expect(result).toBe('');
  });
});
