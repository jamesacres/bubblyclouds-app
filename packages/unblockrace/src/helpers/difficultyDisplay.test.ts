import { getI18n } from 'react-i18next';
import {
  UNBLOCK_DIFFICULTY_MULTIPLIERS,
  getUnblockDifficultyDisplay,
  unblockDifficultyDisplay,
} from './difficultyDisplay';
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

describe('difficulty labels', () => {
  const t = getI18n().getFixedT('en', 'unblockrace');

  it('localises the label for each known difficulty id', () => {
    expect(unblockDifficultyDisplay('beginner', t).label).toBe('Beginner');
    expect(unblockDifficultyDisplay('expert', t).label).toBe('Expert');
    expect(getUnblockDifficultyDisplay('challenging', t)?.name).toBe(
      'Challenging'
    );
  });

  it('falls back to the raw id and no badge for unknown ids', () => {
    expect(unblockDifficultyDisplay('simple', t).label).toBe('simple');
    expect(getUnblockDifficultyDisplay('simple', t)).toBeUndefined();
  });
});
