// Emoji-free difficulty presentation for Unblock Race's own chrome. The
// shared @games getDifficultyDisplay keeps its emoji styling for the sudoku
// app and for shared surfaces like the Lobby; this maps the same difficulty
// ids (see difficultyForMoves) to a clean label plus a chip class that
// matches the neon aesthetic.
export interface UnblockDifficultyDisplay {
  label: string;
  // Fits the filmstrip's narrow chips without truncating ("Challenging"
  // used to render as "CHALLE…" at five stages on a phone).
  shortLabel: string;
  chipClass: string;
}

const DIFFICULTY_DISPLAYS: { [key: string]: UnblockDifficultyDisplay } = {
  simple: {
    label: 'Beginner',
    shortLabel: 'Beginner',
    chipClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  easy: {
    label: 'Challenging',
    shortLabel: 'Tough',
    chipClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  intermediate: {
    label: 'Hard',
    shortLabel: 'Hard',
    chipClass: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  },
  expert: {
    label: 'Expert',
    shortLabel: 'Expert',
    chipClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  },
};

export const unblockDifficultyDisplay = (
  difficulty: string
): UnblockDifficultyDisplay =>
  DIFFICULTY_DISPLAYS[difficulty] || {
    label: difficulty,
    shortLabel: difficulty,
    chipClass: 'bg-stone-500/10 text-stone-500 dark:text-zinc-400',
  };
