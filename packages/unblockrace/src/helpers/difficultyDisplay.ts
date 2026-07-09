// Emoji-free difficulty presentation for Unblock Race's own chrome. The
// shared @games getDifficultyDisplay keeps its emoji styling for the sudoku
// app and for shared surfaces like the Lobby; this maps the same difficulty
// ids (see difficultyForMoves) to a clean label plus chip/dot classes that
// match the neon aesthetic.
export interface UnblockDifficultyDisplay {
  label: string;
  chipClass: string;
  dotClass: string;
}

const DIFFICULTY_DISPLAYS: { [key: string]: UnblockDifficultyDisplay } = {
  simple: {
    label: 'Tricky',
    chipClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    dotClass: 'bg-emerald-500',
  },
  easy: {
    label: 'Challenging',
    chipClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    dotClass: 'bg-amber-500',
  },
  intermediate: {
    label: 'Hard',
    chipClass: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
    dotClass: 'bg-orange-500',
  },
  expert: {
    label: 'Expert',
    chipClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    dotClass: 'bg-rose-500',
  },
};

export const unblockDifficultyDisplay = (
  difficulty: string
): UnblockDifficultyDisplay =>
  DIFFICULTY_DISPLAYS[difficulty] || {
    label: difficulty,
    chipClass: 'bg-stone-500/10 text-stone-500 dark:text-zinc-400',
    dotClass: 'bg-stone-400',
  };
