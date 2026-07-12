import { ServerStateResult } from '@bubblyclouds-app/types/serverTypes';
import { BaseServerState } from '@bubblyclouds-app/template/types/state';

export interface FriendsLeaderboardScore {
  userId: string;
  username: string;
  totalScore: number;
  breakdown: {
    volumeScore: number;
    dailyPuzzleScore: number;
    bookPuzzleScore: number;
    scannedPuzzleScore: number;
    difficultyBonus: number;
    speedBonus: number;
    racingBonus: number;
    comboBonus: number;
  };
  stats: {
    totalPuzzles: number;
    dailyPuzzles: number;
    bookPuzzles: number;
    scannedPuzzles: number;
    averageTime: number;
    fastestTime: number;
    racingWins: number;
  };
}

export type PuzzleType = 'daily' | 'book' | 'scanned' | 'unknown';

export interface DailyComboConfig {
  increment: number;
  max: number;
}

export interface ScoringOptions {
  dailyCombo?: DailyComboConfig;
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
  bookPuzzleScore: number;
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
// move count graded against the stage's par (movesRequired). movesMade is
// undefined when the synced session predates move-count metadata.
export interface PlayerStageResult {
  seconds: number;
  movesMade?: number;
  movesRequired: number;
}

// One player's line on the end-of-stage leaderboard: their result for each
// stage of the run (undefined until they complete that stage fairly) plus
// the running totals across the stages they have finished — the final
// stage's totals are the whole run added together.
export interface PlayerRunResult {
  userId: string;
  isCurrentUser: boolean;
  stageResults: (PlayerStageResult | undefined)[];
  totalSeconds: number;
  totalMoves: number;
  // Moves over (+) or under (−) par, summed across the completed stages with
  // a known move count — the "how far off par" verdict for the run so far.
  totalMovesDelta: number;
  completedStageCount: number;
  // AI agents carry their display name (humans are resolved from party
  // nicknames) and their kart emoji for the leaderboard row.
  nickname?: string;
  isAgent?: boolean;
  emoji?: string;
}
