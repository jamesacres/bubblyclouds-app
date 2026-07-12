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
