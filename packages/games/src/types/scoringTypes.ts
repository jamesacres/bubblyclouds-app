import { ServerStateResult } from '@bubblyclouds-app/types/serverTypes';
import { BaseServerState } from '@bubblyclouds-app/template/types/state';

export interface FriendsLeaderboardScore {
  userId: string;
  username: string;
  totalScore: number;
  breakdown: {
    volumeScore: number;
    dailyPuzzleScore: number;
    collectionPuzzleScore: number;
    scannedPuzzleScore: number;
    difficultyBonus: number;
    speedBonus: number;
    racingBonus: number;
    comboBonus: number;
  };
  stats: {
    totalPuzzles: number;
    dailyPuzzles: number;
    collectionPuzzles: number;
    scannedPuzzles: number;
    averageTime: number;
    fastestTime: number;
    racingWins: number;
  };
}

export type PuzzleType = 'daily' | 'collection' | 'scanned' | 'unknown';

export interface DailyComboConfig {
  increment: number;
  max: number;
}

export interface SpeedThresholds {
  LIGHTNING: number;
  FAST: number;
  QUICK: number;
  STEADY: number;
}

export interface ScoringOptions {
  dailyCombo?: DailyComboConfig;
  // Overrides/extends SCORING_CONFIG.DIFFICULTY_MULTIPLIERS for this call —
  // lets a game supply its own difficulty tiers (keyed by the same
  // metadata.difficulty strings it writes) without colliding with another
  // game's multiplier for a same-named tier (e.g. both games having an
  // "expert" difficulty at different multipliers).
  difficultyMultipliers?: Record<string, number>;
  // Overrides SCORING_CONFIG.SPEED_THRESHOLDS for this call — a game whose
  // puzzles are typically solved much faster or slower than sudoku's (e.g.
  // Unblock Race) can supply its own second-based cutoffs while keeping the
  // shared SPEED_BONUSES point values.
  speedThresholds?: SpeedThresholds;
}

export interface SessionScore {
  volumeScore: number;
  baseScore: number;
  difficultyBonus: number;
  speedBonus: number;
  comboMultiplier: number;
  comboBonus: number;
  total: number;
}

export interface ScoringResult {
  volumeScore: number;
  dailyPuzzleScore: number;
  collectionPuzzleScore: number;
  scannedPuzzleScore: number;
  difficultyBonus: number;
  speedBonus: number;
  racingBonus: number;
  comboBonus: number;
  stats: FriendsLeaderboardScore['stats'];
}

export type AllFriendsSessionsMap = Record<
  string,
  ServerStateResult<BaseServerState>[]
>;

// One completed stage on a player's leaderboard line: their time and their
// game-specific score for that stage (e.g. unblockrace's moves-vs-par).
export interface PlayerStageResult<Score> {
  seconds: number;
  score: Score;
}

// One player's line on the end-of-stage leaderboard: their result for each
// stage of the run (undefined until they complete that stage fairly) plus
// the running totals across the stages they have finished — the final
// stage's totals are the whole run added together. Score-specific totals
// (e.g. total moves) are the caller's own concern, layered on top of this.
export interface PlayerRunResult<Score> {
  userId: string;
  isCurrentUser: boolean;
  stageResults: (PlayerStageResult<Score> | undefined)[];
  totalSeconds: number;
  completedStageCount: number;
  // AI agents carry their display name (humans are resolved from party
  // nicknames) and their kart emoji for the leaderboard row.
  nickname?: string;
  isAgent?: boolean;
  emoji?: string;
}
