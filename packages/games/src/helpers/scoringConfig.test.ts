import { SCORING_CONFIG } from './scoringConfig';
import { Difficulty, BookPuzzleDifficulty } from '../types/difficulty';

describe('scoringConfig', () => {
  describe('Base Score Constants', () => {
    it('should define DAILY_PUZZLE_BASE score', () => {
      expect(SCORING_CONFIG.DAILY_PUZZLE_BASE).toBe(100);
      expect(typeof SCORING_CONFIG.DAILY_PUZZLE_BASE).toBe('number');
    });

    it('should define BOOK_PUZZLE_BASE score', () => {
      expect(SCORING_CONFIG.BOOK_PUZZLE_BASE).toBe(150);
      expect(typeof SCORING_CONFIG.BOOK_PUZZLE_BASE).toBe('number');
    });

    it('should define SCANNED_PUZZLE_BASE score', () => {
      expect(SCORING_CONFIG.SCANNED_PUZZLE_BASE).toBe(75);
      expect(typeof SCORING_CONFIG.SCANNED_PUZZLE_BASE).toBe('number');
    });

    it('should define VOLUME_MULTIPLIER', () => {
      expect(SCORING_CONFIG.VOLUME_MULTIPLIER).toBe(10);
      expect(typeof SCORING_CONFIG.VOLUME_MULTIPLIER).toBe('number');
    });

    it('should have book puzzles worth more than daily puzzles', () => {
      expect(SCORING_CONFIG.BOOK_PUZZLE_BASE).toBeGreaterThan(
        SCORING_CONFIG.DAILY_PUZZLE_BASE
      );
    });

    it('should have daily puzzles worth more than scanned puzzles', () => {
      expect(SCORING_CONFIG.DAILY_PUZZLE_BASE).toBeGreaterThan(
        SCORING_CONFIG.SCANNED_PUZZLE_BASE
      );
    });
  });

  describe('Difficulty Multipliers', () => {
    it('should define multipliers for all standard difficulties', () => {
      const multipliers = SCORING_CONFIG.DIFFICULTY_MULTIPLIERS;

      expect(multipliers[Difficulty.SIMPLE]).toBe(1.0);
      expect(multipliers[Difficulty.EASY]).toBe(1.2);
      expect(multipliers[Difficulty.INTERMEDIATE]).toBe(1.5);
      expect(multipliers[Difficulty.EXPERT]).toBe(2.0);
    });

    it('should define multipliers for all book difficulties', () => {
      const multipliers = SCORING_CONFIG.DIFFICULTY_MULTIPLIERS;

      expect(multipliers[BookPuzzleDifficulty.VERY_EASY]).toBe(1.0);
      expect(multipliers[BookPuzzleDifficulty.EASY]).toBe(1.2);
      expect(multipliers[BookPuzzleDifficulty.MODERATELY_EASY]).toBe(1.3);
      expect(multipliers[BookPuzzleDifficulty.MODERATE]).toBe(1.4);
      expect(multipliers[BookPuzzleDifficulty.MODERATELY_HARD]).toBe(1.6);
      expect(multipliers[BookPuzzleDifficulty.HARD]).toBe(1.8);
      expect(multipliers[BookPuzzleDifficulty.VICIOUS]).toBe(2.5);
      expect(multipliers[BookPuzzleDifficulty.FIENDISH]).toBe(2.8);
      expect(multipliers[BookPuzzleDifficulty.DEVILISH]).toBe(3.2);
      expect(multipliers[BookPuzzleDifficulty.HELL]).toBe(3.6);
      expect(multipliers[BookPuzzleDifficulty.BEYOND_HELL]).toBe(4.0);
    });

    it('should have increasing multipliers for increasing difficulty', () => {
      const multipliers = SCORING_CONFIG.DIFFICULTY_MULTIPLIERS;

      expect(multipliers[Difficulty.SIMPLE]).toBeLessThan(
        multipliers[Difficulty.EASY]
      );
      expect(multipliers[Difficulty.EASY]).toBeLessThan(
        multipliers[Difficulty.INTERMEDIATE]
      );
      expect(multipliers[Difficulty.INTERMEDIATE]).toBeLessThan(
        multipliers[Difficulty.EXPERT]
      );
    });

    it('should have book difficulty progression', () => {
      const multipliers = SCORING_CONFIG.DIFFICULTY_MULTIPLIERS;

      expect(multipliers[BookPuzzleDifficulty.VERY_EASY]).toBeLessThan(
        multipliers[BookPuzzleDifficulty.EASY]
      );
      expect(multipliers[BookPuzzleDifficulty.EASY]).toBeLessThan(
        multipliers[BookPuzzleDifficulty.MODERATELY_EASY]
      );
      expect(multipliers[BookPuzzleDifficulty.MODERATE]).toBeLessThan(
        multipliers[BookPuzzleDifficulty.MODERATELY_HARD]
      );
      expect(multipliers[BookPuzzleDifficulty.HARD]).toBeLessThan(
        multipliers[BookPuzzleDifficulty.VICIOUS]
      );
      expect(multipliers[BookPuzzleDifficulty.VICIOUS]).toBeLessThan(
        multipliers[BookPuzzleDifficulty.FIENDISH]
      );
      expect(multipliers[BookPuzzleDifficulty.FIENDISH]).toBeLessThan(
        multipliers[BookPuzzleDifficulty.DEVILISH]
      );
      expect(multipliers[BookPuzzleDifficulty.DEVILISH]).toBeLessThan(
        multipliers[BookPuzzleDifficulty.HELL]
      );
      expect(multipliers[BookPuzzleDifficulty.HELL]).toBeLessThan(
        multipliers[BookPuzzleDifficulty.BEYOND_HELL]
      );
    });

    it('should have all positive multipliers', () => {
      const multipliers = SCORING_CONFIG.DIFFICULTY_MULTIPLIERS;

      Object.values(multipliers).forEach((multiplier) => {
        expect(multiplier).toBeGreaterThan(0);
      });
    });

    it('should have minimum multiplier of 1.0', () => {
      const multipliers = SCORING_CONFIG.DIFFICULTY_MULTIPLIERS;

      Object.values(multipliers).forEach((multiplier) => {
        expect(multiplier).toBeGreaterThanOrEqual(1.0);
      });
    });

    it('should return difficulty multipliers as getter property', () => {
      const multipliers1 = SCORING_CONFIG.DIFFICULTY_MULTIPLIERS;
      const multipliers2 = SCORING_CONFIG.DIFFICULTY_MULTIPLIERS;

      expect(multipliers1).toEqual(multipliers2);
      expect(typeof multipliers1).toBe('object');
    });
  });

  describe('Speed Thresholds', () => {
    it('should define LIGHTNING threshold', () => {
      expect(SCORING_CONFIG.SPEED_THRESHOLDS.LIGHTNING).toBe(180);
    });

    it('should define FAST threshold', () => {
      expect(SCORING_CONFIG.SPEED_THRESHOLDS.FAST).toBe(300);
    });

    it('should define QUICK threshold', () => {
      expect(SCORING_CONFIG.SPEED_THRESHOLDS.QUICK).toBe(600);
    });

    it('should define STEADY threshold', () => {
      expect(SCORING_CONFIG.SPEED_THRESHOLDS.STEADY).toBe(1200);
    });

    it('should have thresholds in ascending order', () => {
      expect(SCORING_CONFIG.SPEED_THRESHOLDS.LIGHTNING).toBeLessThan(
        SCORING_CONFIG.SPEED_THRESHOLDS.FAST
      );
      expect(SCORING_CONFIG.SPEED_THRESHOLDS.FAST).toBeLessThan(
        SCORING_CONFIG.SPEED_THRESHOLDS.QUICK
      );
      expect(SCORING_CONFIG.SPEED_THRESHOLDS.QUICK).toBeLessThan(
        SCORING_CONFIG.SPEED_THRESHOLDS.STEADY
      );
    });

    it('should have all positive thresholds', () => {
      Object.values(SCORING_CONFIG.SPEED_THRESHOLDS).forEach((threshold) => {
        expect(threshold).toBeGreaterThan(0);
      });
    });

    it('should define thresholds in seconds', () => {
      expect(SCORING_CONFIG.SPEED_THRESHOLDS.LIGHTNING).toBe(180);
      expect(SCORING_CONFIG.SPEED_THRESHOLDS.FAST).toBe(300);
    });
  });

  describe('Speed Bonuses', () => {
    it('should define LIGHTNING bonus', () => {
      expect(SCORING_CONFIG.SPEED_BONUSES.LIGHTNING).toBe(500);
    });

    it('should define FAST bonus', () => {
      expect(SCORING_CONFIG.SPEED_BONUSES.FAST).toBe(300);
    });

    it('should define QUICK bonus', () => {
      expect(SCORING_CONFIG.SPEED_BONUSES.QUICK).toBe(150);
    });

    it('should define STEADY bonus', () => {
      expect(SCORING_CONFIG.SPEED_BONUSES.STEADY).toBe(50);
    });

    it('should have bonuses in descending order', () => {
      expect(SCORING_CONFIG.SPEED_BONUSES.LIGHTNING).toBeGreaterThan(
        SCORING_CONFIG.SPEED_BONUSES.FAST
      );
      expect(SCORING_CONFIG.SPEED_BONUSES.FAST).toBeGreaterThan(
        SCORING_CONFIG.SPEED_BONUSES.QUICK
      );
      expect(SCORING_CONFIG.SPEED_BONUSES.QUICK).toBeGreaterThan(
        SCORING_CONFIG.SPEED_BONUSES.STEADY
      );
    });

    it('should have all positive bonuses', () => {
      Object.values(SCORING_CONFIG.SPEED_BONUSES).forEach((bonus) => {
        expect(bonus).toBeGreaterThan(0);
      });
    });

    it('should reward faster times with higher bonuses', () => {
      const { LIGHTNING, FAST, QUICK, STEADY } = SCORING_CONFIG.SPEED_BONUSES;
      expect(LIGHTNING).toBeGreaterThan(FAST);
      expect(FAST).toBeGreaterThan(QUICK);
      expect(QUICK).toBeGreaterThan(STEADY);
    });
  });

  describe('Racing Bonus', () => {
    it('should define RACING_BONUS_PER_PERSON', () => {
      expect(SCORING_CONFIG.RACING_BONUS_PER_PERSON).toBe(100);
      expect(typeof SCORING_CONFIG.RACING_BONUS_PER_PERSON).toBe('number');
    });

    it('should have positive racing bonus', () => {
      expect(SCORING_CONFIG.RACING_BONUS_PER_PERSON).toBeGreaterThan(0);
    });
  });

  describe('Configuration Consistency', () => {
    it('should have matching keys between thresholds and bonuses', () => {
      const thresholdKeys = Object.keys(SCORING_CONFIG.SPEED_THRESHOLDS);
      const bonusKeys = Object.keys(SCORING_CONFIG.SPEED_BONUSES);

      expect(thresholdKeys.sort()).toEqual(bonusKeys.sort());
    });

    it('should have all required properties', () => {
      expect(SCORING_CONFIG).toHaveProperty('DAILY_PUZZLE_BASE');
      expect(SCORING_CONFIG).toHaveProperty('BOOK_PUZZLE_BASE');
      expect(SCORING_CONFIG).toHaveProperty('SCANNED_PUZZLE_BASE');
      expect(SCORING_CONFIG).toHaveProperty('VOLUME_MULTIPLIER');
      expect(SCORING_CONFIG).toHaveProperty('DIFFICULTY_MULTIPLIERS');
      expect(SCORING_CONFIG).toHaveProperty('SPEED_THRESHOLDS');
      expect(SCORING_CONFIG).toHaveProperty('SPEED_BONUSES');
      expect(SCORING_CONFIG).toHaveProperty('RACING_BONUS_PER_PERSON');
    });

    it('should be immutable at the top level', () => {
      expect(() => {
        (SCORING_CONFIG as any).NEW_PROPERTY = 123;
      }).not.toThrow();
    });

    it('should have consistent structure', () => {
      expect(typeof SCORING_CONFIG).toBe('object');
      expect(SCORING_CONFIG).not.toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle accessing undefined difficulty multiplier', () => {
      const multipliers = SCORING_CONFIG.DIFFICULTY_MULTIPLIERS;
      expect(multipliers['non-existent-difficulty']).toBeUndefined();
    });

    it('should handle numeric calculations with base scores', () => {
      const dailyWithEasy =
        SCORING_CONFIG.DAILY_PUZZLE_BASE *
        SCORING_CONFIG.DIFFICULTY_MULTIPLIERS[Difficulty.EASY];
      expect(dailyWithEasy).toBe(120);
    });

    it('should handle numeric calculations with book puzzles', () => {
      const bookWithModerate =
        SCORING_CONFIG.BOOK_PUZZLE_BASE *
        SCORING_CONFIG.DIFFICULTY_MULTIPLIERS[BookPuzzleDifficulty.MODERATE];
      expect(bookWithModerate).toBe(210);
    });
  });
});
