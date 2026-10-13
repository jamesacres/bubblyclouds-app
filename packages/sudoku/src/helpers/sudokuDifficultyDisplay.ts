import { DifficultyDisplay } from '@bubblyclouds-app/games/types/difficultyDisplay';
import { Translate } from '@bubblyclouds-app/games/types/i18n';
import { getDifficultyDisplay } from '@bubblyclouds-app/games/helpers/getDifficultyDisplay';

// Emoji-free difficulty presentation for the shared multi-stage components
// (NextPuzzlePanel, StageResultPanel, ...). Reuses the shared @games
// getDifficultyDisplay's {name, badgeColor} data (already covering both the
// daily Difficulty and book BookPuzzleDifficulty enums) and reshapes it into
// the {label, chipClass} shape those components expect, mirroring Unblock
// Race's own unblockDifficultyDisplay.
export const sudokuDifficultyDisplay = (
  difficulty: string,
  t: Translate
): DifficultyDisplay => {
  const { name, badgeColor } = getDifficultyDisplay(difficulty, t);
  return { label: name, chipClass: badgeColor };
};
