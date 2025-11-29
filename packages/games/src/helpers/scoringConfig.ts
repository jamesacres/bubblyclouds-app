import { Difficulty, BookPuzzleDifficulty } from '../types/difficulty';

// Use a function to defer enum evaluation and avoid circular dependency issues in tests
const getDifficultyMultipliers = () =>
  ({
    // Daily puzzle difficulties
    [Difficulty.SIMPLE]: 1.0,
    [Difficulty.EASY]: 1.2,
    [Difficulty.INTERMEDIATE]: 1.5,
    [Difficulty.EXPERT]: 2.0,
    // Book puzzle difficulties
    [BookPuzzleDifficulty.VERY_EASY]: 1.0,
    [BookPuzzleDifficulty.EASY]: 1.2,
    [BookPuzzleDifficulty.MODERATELY_EASY]: 1.3,
    [BookPuzzleDifficulty.MODERATE]: 1.4,
    [BookPuzzleDifficulty.MODERATELY_HARD]: 1.6,
    [BookPuzzleDifficulty.HARD]: 1.8,
    [BookPuzzleDifficulty.VICIOUS]: 2.5,
    [BookPuzzleDifficulty.FIENDISH]: 2.8,
    [BookPuzzleDifficulty.DEVILISH]: 3.2,
    [BookPuzzleDifficulty.HELL]: 3.6,
    [BookPuzzleDifficulty.BEYOND_HELL]: 4.0,
  }) as Record<string, number>;

export const SCORING_CONFIG = {
  DAILY_PUZZLE_BASE: 100,
  BOOK_PUZZLE_BASE: 150,
  SCANNED_PUZZLE_BASE: 75,
  VOLUME_MULTIPLIER: 10,

  get DIFFICULTY_MULTIPLIERS() {
    return getDifficultyMultipliers();
  },

  SPEED_THRESHOLDS: {
    LIGHTNING: 180,
    FAST: 300,
    QUICK: 600,
    STEADY: 1200,
  },

  SPEED_BONUSES: {
    LIGHTNING: 500,
    FAST: 300,
    QUICK: 150,
    STEADY: 50,
  },

  RACING_BONUS_PER_PERSON: 100,
};
