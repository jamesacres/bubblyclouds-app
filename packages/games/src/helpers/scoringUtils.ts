import { ServerStateResult, Party } from '@sudoku-web/types/serverTypes';
import { BaseServerState } from '@sudoku-web/template/types/gameState';
import { SCORING_CONFIG } from './scoringConfig';
import {
  PuzzleType,
  ScoringResult,
  AllFriendsSessionsMap,
} from '../types/scoringTypes';

export const getPuzzleType = (
  session: ServerStateResult<BaseServerState>
): PuzzleType => {
  if (session.state.metadata?.sudokuId?.includes('oftheday')) return 'daily';
  if (session.state.metadata?.sudokuBookPuzzleId) return 'book';
  if (session.state.metadata?.scannedAt) return 'scanned';
  return 'unknown';
};

export const getPuzzleIdentifier = (
  session: ServerStateResult<BaseServerState>
): string => {
  if (session.state.metadata?.sudokuId) return session.state.metadata.sudokuId;
  if (session.state.metadata?.sudokuBookPuzzleId)
    return session.state.metadata.sudokuBookPuzzleId;
  return session.sessionId;
};

export const calculateSpeedBonus = (completionTimeSeconds: number): number => {
  if (completionTimeSeconds <= SCORING_CONFIG.SPEED_THRESHOLDS.LIGHTNING) {
    return SCORING_CONFIG.SPEED_BONUSES.LIGHTNING;
  }
  if (completionTimeSeconds <= SCORING_CONFIG.SPEED_THRESHOLDS.FAST) {
    return SCORING_CONFIG.SPEED_BONUSES.FAST;
  }
  if (completionTimeSeconds <= SCORING_CONFIG.SPEED_THRESHOLDS.QUICK) {
    return SCORING_CONFIG.SPEED_BONUSES.QUICK;
  }
  if (completionTimeSeconds <= SCORING_CONFIG.SPEED_THRESHOLDS.STEADY) {
    return SCORING_CONFIG.SPEED_BONUSES.STEADY;
  }
  return 0;
};

export const calculateRacingBonus = (
  userSession: ServerStateResult<BaseServerState>,
  allFriendsSessions: AllFriendsSessionsMap,
  currentUserId: string
): { bonus: number; wins: number } => {
  const puzzleId = getPuzzleIdentifier(userSession);
  const userTime = userSession.state.completed?.seconds || Infinity;

  let friendsBeaten = 0;

  Object.entries(allFriendsSessions).forEach(([userId, friendSessions]) => {
    if (userId === currentUserId) return;

    const friendAttempt = friendSessions?.find(
      (session) =>
        getPuzzleIdentifier(session) === puzzleId && session.state.completed
    );

    if (
      friendAttempt &&
      friendAttempt.state.completed &&
      userSession.state.completed
    ) {
      const friendTime = friendAttempt.state.completed.seconds;
      if (userTime < friendTime) {
        friendsBeaten++;
      }
    }
  });

  return {
    bonus: friendsBeaten * SCORING_CONFIG.RACING_BONUS_PER_PERSON,
    wins: friendsBeaten,
  };
};

export const calculateUserScore = <
  TState extends BaseServerState = BaseServerState,
>(
  userSessions: ServerStateResult<TState>[],
  allFriendsSessions: AllFriendsSessionsMap,
  currentUserId: string,
  isPuzzleCheated: (state: TState) => boolean
): ScoringResult => {
  const recent30DaySessions = userSessions.filter(
    (session) => session.state.completed && !isPuzzleCheated(session.state)
  );

  let volumeScore = 0;
  let dailyPuzzleScore = 0;
  let bookPuzzleScore = 0;
  let scannedPuzzleScore = 0;
  let difficultyBonus = 0;
  let speedBonus = 0;
  let racingBonus = 0;

  const stats = {
    totalPuzzles: recent30DaySessions.length,
    dailyPuzzles: 0,
    bookPuzzles: 0,
    scannedPuzzles: 0,
    averageTime: 0,
    fastestTime: Infinity,
    racingWins: 0,
  };

  let totalTime = 0;

  for (const session of recent30DaySessions) {
    const completionTime = session.state.completed?.seconds || 0;
    totalTime += completionTime;
    stats.fastestTime = Math.min(stats.fastestTime, completionTime);

    volumeScore += SCORING_CONFIG.VOLUME_MULTIPLIER;

    const puzzleType = getPuzzleType(session);
    let baseScore = 0;
    let difficultyMultiplier = 1;

    switch (puzzleType) {
      case 'daily':
        baseScore = SCORING_CONFIG.DAILY_PUZZLE_BASE;
        stats.dailyPuzzles++;
        dailyPuzzleScore += baseScore;
        difficultyMultiplier =
          SCORING_CONFIG.DIFFICULTY_MULTIPLIERS[
            session.state.metadata?.difficulty || ''
          ] || 1;
        break;

      case 'book':
        baseScore = SCORING_CONFIG.BOOK_PUZZLE_BASE;
        stats.bookPuzzles++;
        bookPuzzleScore += baseScore;
        difficultyMultiplier =
          SCORING_CONFIG.DIFFICULTY_MULTIPLIERS[
            session.state.metadata?.difficulty || ''
          ] || 1;
        break;

      case 'scanned':
        baseScore = SCORING_CONFIG.SCANNED_PUZZLE_BASE;
        stats.scannedPuzzles++;
        scannedPuzzleScore += baseScore;
        break;
    }

    const difficultyBonusForPuzzle = baseScore * (difficultyMultiplier - 1);
    difficultyBonus += difficultyBonusForPuzzle;

    const speedBonusForPuzzle = calculateSpeedBonus(completionTime);
    speedBonus += speedBonusForPuzzle;

    const racingResult = calculateRacingBonus(
      session,
      allFriendsSessions,
      currentUserId
    );
    racingBonus += racingResult.bonus;
    stats.racingWins += racingResult.wins;
  }

  stats.averageTime =
    stats.totalPuzzles > 0 ? totalTime / stats.totalPuzzles : 0;
  stats.fastestTime = stats.fastestTime === Infinity ? 0 : stats.fastestTime;

  return {
    volumeScore,
    dailyPuzzleScore,
    bookPuzzleScore,
    scannedPuzzleScore,
    difficultyBonus,
    speedBonus,
    racingBonus,
    stats,
  };
};

export const formatTime = (seconds: number): string => {
  if (seconds === 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getUsernameFromParties = (
  userId: string,
  parties: Party[]
): string => {
  for (const party of parties) {
    const member = party.members.find((m) => m.userId === userId);
    if (member) return member.memberNickname;
  }
  return 'Unknown User';
};
