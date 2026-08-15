// Emoji-free difficulty presentation for Unblock Race's own chrome. The
// shared @games getDifficultyDisplay keeps its emoji styling for the sudoku
// app and for shared surfaces like the Lobby; this maps the same difficulty
// ids (see difficultyForMoves) to a clean label plus a chip class that
// matches the neon aesthetic.
export interface UnblockDifficultyDisplay {
  label: string;
  chipClass: string;
}

const DIFFICULTY_DISPLAYS: { [key: string]: UnblockDifficultyDisplay } = {
  beginner: {
    label: 'Beginner',
    chipClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  challenging: {
    label: 'Challenging',
    chipClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  hard: {
    label: 'Hard',
    chipClass: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  },
  expert: {
    label: 'Expert',
    chipClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  },
};

export const unblockDifficultyDisplay = (
  difficulty: string
): UnblockDifficultyDisplay =>
  DIFFICULTY_DISPLAYS[difficulty] || {
    label: difficulty,
    chipClass: 'bg-stone-500/10 text-stone-500 dark:text-zinc-400',
  };

// Solid-fill badge variants for surfaces that render difficulty as a filled
// pill (the collection tiles, My Puzzles, Friends), matching the shared
// getDifficultyDisplay `{ name, badgeColor }` shape so Unblock can pass this
// in place of the emoji-y sudoku version without touching sudoku. Keeps the
// Unblock labels (e.g. "Beginner", not "Tricky") consistent everywhere.
const BADGE_COLORS: { [key: string]: string } = {
  beginner: 'bg-emerald-500 text-white',
  challenging: 'bg-amber-500 text-white',
  hard: 'bg-orange-500 text-white',
  expert: 'bg-rose-500 text-white',
};

// Returns undefined for ids outside the current vocabulary (e.g. 'simple'
// from before the beginner/challenging/hard/expert rename, still present in
// old sessions) so stale data doesn't surface as a raw-id badge.
export const getUnblockDifficultyDisplay = (
  difficulty: string
): { name: string; badgeColor: string } | undefined => {
  const badgeColor = BADGE_COLORS[difficulty];
  if (!badgeColor) {
    return undefined;
  }
  return { name: unblockDifficultyDisplay(difficulty).label, badgeColor };
};

// Unblock Race's own scoring difficulty multipliers — a clean 1x/2x/3x/4x
// scale topping out at the same max as sudoku's book puzzles
// (BookPuzzleDifficulty.BEYOND_HELL, also 4.0). Kept out of the shared
// @games SCORING_CONFIG.DIFFICULTY_MULTIPLIERS map since 'expert' there
// already means sudoku's daily-puzzle expert (2.0) — pass this as
// ScoringOptions.difficultyMultipliers wherever Unblock Race calls
// calculateSessionScore/calculateUserScore instead, so the leaderboard and
// the in-game "+N pts" popup agree.
export const UNBLOCK_DIFFICULTY_MULTIPLIERS: { [key: string]: number } = {
  beginner: 1.0,
  challenging: 2.0,
  hard: 3.0,
  expert: 4.0,
};
