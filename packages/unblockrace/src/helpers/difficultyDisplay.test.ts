import { UNBLOCK_DIFFICULTY_MULTIPLIERS } from './difficultyDisplay';
import { SCORING_CONFIG } from '@bubblyclouds-app/games/helpers/scoringConfig';
import { BookPuzzleDifficulty } from '@bubblyclouds-app/games/types/difficulty';

describe('UNBLOCK_DIFFICULTY_MULTIPLIERS', () => {
  it('defines a clean 1x/2x/3x/4x scale for all four tiers', () => {
    expect(UNBLOCK_DIFFICULTY_MULTIPLIERS.beginner).toBe(1.0);
    expect(UNBLOCK_DIFFICULTY_MULTIPLIERS.challenging).toBe(2.0);
    expect(UNBLOCK_DIFFICULTY_MULTIPLIERS.hard).toBe(3.0);
    expect(UNBLOCK_DIFFICULTY_MULTIPLIERS.expert).toBe(4.0);
  });

  it("tops out at the same max as sudoku's own highest multiplier", () => {
    const sudokuMax = Math.max(
      ...Object.values(BookPuzzleDifficulty).map(
        (key) => SCORING_CONFIG.DIFFICULTY_MULTIPLIERS[key]
      )
    );

    expect(UNBLOCK_DIFFICULTY_MULTIPLIERS.expert).toBe(sudokuMax);
  });
});
