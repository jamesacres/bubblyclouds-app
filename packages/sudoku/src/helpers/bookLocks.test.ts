import { lockedBookIndexes, isBookPuzzleIdLocked } from './bookLocks';
import { SudokuBookPuzzle } from '../types/serverTypes';
import { BookPuzzleDifficulty } from '@bubblyclouds-app/games/types/difficulty';

const puzzle = (coach: BookPuzzleDifficulty): SudokuBookPuzzle => ({
  initial: 'x',
  final: 'x',
  difficulty: {
    coach,
    sudokuExplainer: 0,
    hoDoKu: 0,
    tediousPercent: 0,
    count: {
      givens: 0,
      basic: 0,
      simple: 0,
      advanced: 0,
      moreAdvanced: 0,
      hard: 0,
      brutal: 0,
    },
  },
  techniques: {},
});

describe('lockedBookIndexes', () => {
  it('gives the easiest bands 3 free and locks the rest', () => {
    const puzzles = [
      puzzle(BookPuzzleDifficulty.VERY_EASY),
      puzzle(BookPuzzleDifficulty.VERY_EASY),
      puzzle(BookPuzzleDifficulty.VERY_EASY),
      puzzle(BookPuzzleDifficulty.VERY_EASY),
      puzzle(BookPuzzleDifficulty.VERY_EASY),
    ];
    // [0..4] -> 3 free -> indexes 3,4 locked
    expect([...lockedBookIndexes(puzzles)].sort((a, b) => a - b)).toEqual([
      3, 4,
    ]);
  });

  it('gives moderate bands 2 free', () => {
    const puzzles = [
      puzzle(BookPuzzleDifficulty.MODERATE),
      puzzle(BookPuzzleDifficulty.MODERATE),
      puzzle(BookPuzzleDifficulty.MODERATE),
    ];
    expect([...lockedBookIndexes(puzzles)].sort((a, b) => a - b)).toEqual([2]);
  });

  it('gives hard-and-above bands a single free taste', () => {
    const puzzles = [
      puzzle(BookPuzzleDifficulty.BEYOND_HELL),
      puzzle(BookPuzzleDifficulty.BEYOND_HELL),
      puzzle(BookPuzzleDifficulty.BEYOND_HELL),
    ];
    expect([...lockedBookIndexes(puzzles)].sort((a, b) => a - b)).toEqual([
      1, 2,
    ]);
  });

  it('locks nothing when a band is within its free allowance', () => {
    const puzzles = [puzzle(BookPuzzleDifficulty.HARD)];
    expect(lockedBookIndexes(puzzles).size).toBe(0);
  });

  it('gives an unrecognized difficulty the default single free taste', () => {
    const mystery = 'mystery' as BookPuzzleDifficulty;
    const puzzles = [puzzle(mystery), puzzle(mystery), puzzle(mystery)];
    expect([...lockedBookIndexes(puzzles)].sort((a, b) => a - b)).toEqual([
      1, 2,
    ]);
  });
});

describe('isBookPuzzleIdLocked', () => {
  const puzzles = [
    puzzle(BookPuzzleDifficulty.VERY_EASY),
    puzzle(BookPuzzleDifficulty.VERY_EASY),
    puzzle(BookPuzzleDifficulty.VERY_EASY),
    puzzle(BookPuzzleDifficulty.VERY_EASY),
    puzzle(BookPuzzleDifficulty.BEYOND_HELL),
    puzzle(BookPuzzleDifficulty.BEYOND_HELL),
  ];
  const locked = lockedBookIndexes(puzzles);

  it('returns false for an unparseable id', () => {
    expect(isBookPuzzleIdLocked('not-a-real-id', puzzles)).toBe(false);
  });

  it('matches lockedBookIndexes for a locked puzzle', () => {
    const lockedIndex = [...locked][0];
    expect(lockedIndex).toBeGreaterThanOrEqual(0);
    expect(
      isBookPuzzleIdLocked(`ofthemonth-202607-puzzle-${lockedIndex}`, puzzles)
    ).toBe(true);
  });

  it('matches lockedBookIndexes for an unlocked puzzle', () => {
    const unlockedIndex = puzzles.findIndex((_, i) => !locked.has(i));
    expect(unlockedIndex).toBeGreaterThanOrEqual(0);
    expect(
      isBookPuzzleIdLocked(`ofthemonth-202607-puzzle-${unlockedIndex}`, puzzles)
    ).toBe(false);
  });
});
