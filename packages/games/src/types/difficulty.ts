export enum Difficulty {
  SIMPLE = 'simple',
  EASY = 'easy',
  INTERMEDIATE = 'intermediate',
  EXPERT = 'expert',
}

export enum BookPuzzleDifficulty {
  VERY_EASY = '1-very-easy',
  EASY = '2-easy',
  MODERATELY_EASY = '3-moderately-easy',
  MODERATE = '4-moderate',
  MODERATELY_HARD = '5-moderately-hard',
  HARD = '6-hard',
  VICIOUS = '7-vicious',
  FIENDISH = '8-fiendish',
  DEVILISH = '9-devilish',
  HELL = '10-hell',
  BEYOND_HELL = '11-beyond-hell',
}

// Unblock Race's own difficulty vocabulary (see unblockrace's
// difficultyForMoves, banded by known-optimal move count), used for both its
// daily and collection puzzles. Values match the literal strings
// difficultyForMoves already writes into session metadata. Its EXPERT value
// collides in string value (not enum identity) with Difficulty.EXPERT, so its
// multiplier is NOT in SCORING_CONFIG.DIFFICULTY_MULTIPLIERS (that map is
// flat and string-keyed) — Unblock Race supplies its own multiplier map via
// ScoringOptions.difficultyMultipliers instead (see
// apps/unblockrace/src/components/UnblockLeaderboard.tsx).
export enum UnblockRaceDifficulty {
  BEGINNER = 'beginner',
  CHALLENGING = 'challenging',
  HARD = 'hard',
  EXPERT = 'expert',
}
