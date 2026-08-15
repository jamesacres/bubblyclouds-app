import { ServerStateResult, Party } from '@bubblyclouds-app/types/serverTypes';
import { BaseServerState } from '@bubblyclouds-app/template/types/state';
import { SCORING_CONFIG } from './scoringConfig';
import {
  PuzzleType,
  ScoringResult,
  ScoringOptions,
  SessionScore,
  DailyComboConfig,
  AllFriendsSessionsMap,
} from '../types/scoringTypes';

export const getPuzzleType = <
  TMetadata extends Record<string, string> = Record<string, string>,
>(
  session: ServerStateResult<BaseServerState<unknown, unknown, TMetadata>>
): PuzzleType => {
  if (session.state.metadata?.sudokuId?.includes('oftheday')) return 'daily';
  if (session.state.metadata?.sudokuBookPuzzleId) return 'collection';
  if (session.state.metadata?.scannedAt) return 'scanned';
  if (session.state.metadata?.runId?.startsWith('oftheday')) return 'daily';
  if (session.state.metadata?.unblockCollectionPuzzleId) return 'collection';
  return 'unknown';
};

export const getPuzzleIdentifier = <
  TMetadata extends Record<string, string> = Record<string, string>,
>(
  session: ServerStateResult<BaseServerState<unknown, unknown, TMetadata>>
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

export const calculateRacingBonus = <
  TMetadata extends Record<string, string> = Record<string, string>,
>(
  userSession: ServerStateResult<BaseServerState<unknown, unknown, TMetadata>>,
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

export const calculateSessionScore = <
  TMetadata extends Record<string, string> = Record<string, string>,
  TState extends BaseServerState<unknown, unknown, TMetadata> = BaseServerState<
    unknown,
    unknown,
    TMetadata
  >,
>(
  session: ServerStateResult<TState>,
  options?: {
    dailyCombo?: DailyComboConfig;
    dayPuzzleIndex?: number;
    difficultyMultipliers?: Record<string, number>;
  }
): SessionScore => {
  const completionTime = session.state.completed?.seconds || 0;

  const volumeScore = SCORING_CONFIG.VOLUME_MULTIPLIER;

  const puzzleType = getPuzzleType(session);
  let baseScore = 0;
  let difficultyMultiplier = 1;
  const difficultyMultipliers = {
    ...SCORING_CONFIG.DIFFICULTY_MULTIPLIERS,
    ...options?.difficultyMultipliers,
  };

  switch (puzzleType) {
    case 'daily':
      baseScore = SCORING_CONFIG.DAILY_PUZZLE_BASE;
      difficultyMultiplier =
        difficultyMultipliers[session.state.metadata?.difficulty || ''] || 1;
      break;

    case 'collection':
      baseScore = SCORING_CONFIG.COLLECTION_PUZZLE_BASE;
      difficultyMultiplier =
        difficultyMultipliers[session.state.metadata?.difficulty || ''] || 1;
      break;

    case 'scanned':
      baseScore = SCORING_CONFIG.SCANNED_PUZZLE_BASE;
      break;
  }

  const difficultyBonus = baseScore * (difficultyMultiplier - 1);
  const speedBonus = calculateSpeedBonus(completionTime);

  let comboMultiplier = 1;
  if (options?.dailyCombo && options.dayPuzzleIndex !== undefined) {
    comboMultiplier = Math.min(
      1 + options.dayPuzzleIndex * options.dailyCombo.increment,
      options.dailyCombo.max
    );
  }

  const comboBase = volumeScore + baseScore * difficultyMultiplier + speedBonus;
  const comboBonus = (comboMultiplier - 1) * comboBase;

  const total =
    volumeScore + baseScore + difficultyBonus + speedBonus + comboBonus;

  return {
    volumeScore,
    baseScore,
    difficultyBonus,
    speedBonus,
    comboMultiplier,
    comboBonus,
    total,
  };
};

export const calculateUserScore = <
  TMetadata extends Record<string, string> = Record<string, string>,
  TState extends BaseServerState<unknown, unknown, TMetadata> = BaseServerState<
    unknown,
    unknown,
    TMetadata
  >,
>(
  userSessions: ServerStateResult<TState>[],
  allFriendsSessions: AllFriendsSessionsMap,
  currentUserId: string,
  isPuzzleCheated: (state: TState) => boolean,
  options?: ScoringOptions
): ScoringResult => {
  const recent30DaySessions = userSessions.filter(
    (session) => session.state.completed && !isPuzzleCheated(session.state)
  );

  const dayPuzzleIndexBySession = new Map<ServerStateResult<TState>, number>();
  if (options?.dailyCombo) {
    const sessionsByDay = new Map<string, ServerStateResult<TState>[]>();
    for (const session of recent30DaySessions) {
      const completedAt = session.state.completed?.at;
      if (!completedAt) continue;
      const dayKey = new Date(completedAt).toISOString().slice(0, 10);
      const day = sessionsByDay.get(dayKey);
      if (day) {
        day.push(session);
      } else {
        sessionsByDay.set(dayKey, [session]);
      }
    }
    for (const daySessions of sessionsByDay.values()) {
      daySessions
        .sort(
          (a, b) =>
            new Date(a.state.completed?.at || 0).getTime() -
            new Date(b.state.completed?.at || 0).getTime()
        )
        .forEach((session, index) => {
          dayPuzzleIndexBySession.set(session, index);
        });
    }
  }

  let volumeScore = 0;
  let dailyPuzzleScore = 0;
  let collectionPuzzleScore = 0;
  let scannedPuzzleScore = 0;
  let difficultyBonus = 0;
  let speedBonus = 0;
  let racingBonus = 0;
  let comboBonus = 0;

  const stats = {
    totalPuzzles: recent30DaySessions.length,
    dailyPuzzles: 0,
    collectionPuzzles: 0,
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

    const puzzleType = getPuzzleType(session);
    switch (puzzleType) {
      case 'daily':
        stats.dailyPuzzles++;
        dailyPuzzleScore += SCORING_CONFIG.DAILY_PUZZLE_BASE;
        break;
      case 'collection':
        stats.collectionPuzzles++;
        collectionPuzzleScore += SCORING_CONFIG.COLLECTION_PUZZLE_BASE;
        break;
      case 'scanned':
        stats.scannedPuzzles++;
        scannedPuzzleScore += SCORING_CONFIG.SCANNED_PUZZLE_BASE;
        break;
    }

    const sessionScore = calculateSessionScore(session, {
      dailyCombo: options?.dailyCombo,
      dayPuzzleIndex: dayPuzzleIndexBySession.get(session),
      difficultyMultipliers: options?.difficultyMultipliers,
    });

    volumeScore += sessionScore.volumeScore;
    difficultyBonus += sessionScore.difficultyBonus;
    speedBonus += sessionScore.speedBonus;
    comboBonus += sessionScore.comboBonus;

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
    collectionPuzzleScore,
    scannedPuzzleScore,
    difficultyBonus,
    speedBonus,
    racingBonus,
    comboBonus,
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
