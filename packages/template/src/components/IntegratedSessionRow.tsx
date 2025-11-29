'use client';
import { ComponentType, useContext } from 'react';
import { Party, ServerStateResult } from '@sudoku-web/types/serverTypes';
import { useParties } from '../hooks/useParties';
import {
  UserContext,
  UserContextInterface,
} from '@sudoku-web/auth/providers/AuthProvider';
import { calculateSeconds } from '../helpers/calculateSeconds';
import { useSessions } from '../providers/SessionsProvider';
import { Award, Loader } from 'react-feather';
import Link from 'next/link';
import { UserSessions } from '@sudoku-web/types/userSessions';
import { BaseServerState } from '../types/gameState';

// Function to get game status text
const getGameStatusText = <TState extends BaseServerState = BaseServerState>(
  session: ServerStateResult<TState>,
  isPuzzleCheated: (state: TState) => boolean,
  calculateCompletionPercentageFromState: (state: TState) => number,
  _userSessions?: ServerStateResult<TState>[]
): string => {
  const { state } = session;

  if (state.completed) {
    if (isPuzzleCheated(state)) {
      return 'Cheated';
    }
    const seconds = state.completed.seconds;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `Completed in ${minutes}m ${remainingSeconds}s`;
  }

  // Calculate completion percentage for incomplete puzzles
  const percentage = calculateCompletionPercentageFromState(state);
  return `${percentage}% complete`;
};

// Helper function to format date from YYYYMMDD to "Mon DD"
const formatDateString = (dateString: string) => {
  // dateString is in format YYYYMMDD
  if (dateString.length !== 8) return dateString;

  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);

  // Create a date object and format it
  const date = new Date(`${year}-${month}-${day}`);

  // Format as "Aug 17th"
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthName = monthNames[date.getMonth()];
  const dayNum = date.getDate();

  // Add ordinal suffix (st, nd, rd, th)
  const getOrdinalSuffix = (day: number) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  return `${monthName} ${dayNum}${getOrdinalSuffix(dayNum)}`;
};

// Helper function to extract metadata information
const extractMetadataInfo = (
  metadata?: Partial<{
    difficulty: string;
    sudokuId: string;
    sudokuBookPuzzleId: string;
    scannedAt: string;
  }>
) => {
  if (!metadata) return null;

  const info: {
    type: 'daily' | 'book' | 'scanned' | 'other';
    difficulty?: string;
    date?: string;
    bookInfo?: { year: string; month: string; number: number };
  } = { type: 'other' };

  // Extract from sudokuId (format: oftheday-${date}-${difficulty})
  if (metadata.sudokuId?.startsWith('oftheday-')) {
    const parts = metadata.sudokuId.split('-');
    if (parts.length >= 3) {
      info.type = 'daily';
      info.date = parts[1];
      info.difficulty = parts.slice(2).join('-');
    }
  }

  // Extract from sudokuBookPuzzleId (format: ofthemonth-${YYYYMM}-puzzle-${index})
  if (metadata.sudokuBookPuzzleId?.startsWith('ofthemonth-')) {
    const parts = metadata.sudokuBookPuzzleId.split('-');
    if (parts.length >= 4) {
      info.type = 'book';
      const yearMonth = parts[1];
      const number = parseInt(parts[3]);
      if (yearMonth.length === 6) {
        info.bookInfo = {
          year: yearMonth.substring(0, 4),
          month: yearMonth.substring(4, 6),
          number: number + 1, // Convert 0-based index to 1-based
        };
      }
    }
  }

  // Check for scanned puzzles
  if (metadata.scannedAt && metadata.scannedAt !== 'undefined') {
    info.type = 'scanned';
  }

  // Use difficulty from metadata if available
  if (metadata.difficulty) {
    info.difficulty = metadata.difficulty;
  }

  return info;
};

interface IntegratedSessionRowProps<
  TState extends BaseServerState = BaseServerState,
  TBookPuzzle extends { initial: string; final: string } = {
    initial: string;
    final: string;
  },
> {
  session: ServerStateResult<TState>;
  userSessions?: ServerStateResult<TState>[]; // Optional: user's sessions for cross-referencing
  // Book-specific props
  bookPuzzle?: {
    puzzle: TBookPuzzle;
    index: number;
    sudokuBookId: string;
  };
  // Helper functions for displaying difficulty and techniques (required when bookPuzzle is provided)
  getDifficultyDisplay?: (difficulty: string) => {
    name: string;
    badgeColor: string;
  };
  getTechniquesDisplay?: (techniques?: any) => Array<{
    name: string;
    count: number;
    color: string;
    category: string;
    categoryOrder: number;
  }>;
  SimpleState: ComponentType<{ state: TState }>;
  calculateCompletionPercentageFromState: (state: TState) => number;
  isPuzzleCheated: (state: TState) => boolean;
  buildPuzzleUrlFromState: (state: TState, isCompleted?: boolean) => string;
}

// Helper to get user's session data for display
const useUserSessionData = <TState extends BaseServerState = BaseServerState>(
  session: ServerStateResult<TState>,
  userSessions?: ServerStateResult<TState>[],
  calculateCompletionPercentageFromState?: (state: TState) => number
) => {
  const userSession = userSessions?.find(
    (s) => s.sessionId === session.sessionId
  );
  const actualSession = userSessions ? userSession : session;

  const latest = actualSession
    ? actualSession.state.answerStack[
        actualSession.state.answerStack.length - 1
      ]
    : session.state.initial;

  const percentage =
    actualSession && calculateCompletionPercentageFromState
      ? calculateCompletionPercentageFromState(actualSession.state)
      : 0;

  return {
    actualSession,
    latest,
    percentage,
    isCompleted: !!actualSession?.state.completed,
  };
};

// Helper to process friend sessions
const getFriendSessions = <TState extends BaseServerState = BaseServerState>(
  friendSessions: UserSessions<TState>,
  session: ServerStateResult<TState>,
  currentUserId: string | undefined,
  parties: Party[],
  isPuzzleCheated: (state: TState) => boolean,
  calculateCompletionPercentageFromState: (state: TState) => number
) => {
  const friendSessionData: Array<{
    nickname: string;
    userId: string;
    completionPercentage: number;
    completionTime: number | null;
    isCompleted: boolean;
    isCheated: boolean;
  }> = [];

  Object.entries(friendSessions).forEach(([userId, userSessionData]) => {
    if (userId === currentUserId || !userSessionData?.sessions) return;

    const matchingSession = userSessionData.sessions.find(
      (friendSession: ServerStateResult<BaseServerState>) =>
        friendSession.sessionId === session.sessionId
    );

    if (matchingSession) {
      const friendNickname =
        parties
          ?.flatMap((party) => party.members || [])
          .find((member) => member?.userId === userId)?.memberNickname ||
        'Unknown';

      const completionPercentage = calculateCompletionPercentageFromState(
        matchingSession.state
      );

      friendSessionData.push({
        nickname: friendNickname,
        userId,
        completionPercentage,
        completionTime: matchingSession.state.completed?.seconds || null,
        isCompleted: !!matchingSession.state.completed,
        isCheated: isPuzzleCheated(matchingSession.state),
      });
    }
  });

  return friendSessionData;
};

export const IntegratedSessionRow = <
  TState extends BaseServerState = BaseServerState,
  TBookPuzzle extends { initial: string; final: string } = {
    initial: string;
    final: string;
  },
>({
  session,
  userSessions,
  bookPuzzle,
  SimpleState,
  calculateCompletionPercentageFromState,
  isPuzzleCheated,
  buildPuzzleUrlFromState,
  getDifficultyDisplay,
  getTechniquesDisplay,
}: IntegratedSessionRowProps<TState, TBookPuzzle>) => {
  const context = useContext(UserContext) as UserContextInterface | undefined;
  const { user } = context || {};
  const { friendSessions, isFriendSessionsLoading } = useSessions<TState>();
  const { parties } = useParties();

  const metadata = session.state.metadata;

  // Extract metadata information
  const metadataInfo = extractMetadataInfo(metadata);

  // Get difficulty information
  const difficultyInfo = (() => {
    // Use metadata difficulty
    if (metadataInfo?.difficulty && getDifficultyDisplay) {
      return getDifficultyDisplay(metadataInfo.difficulty);
    }
    return null;
  })();

  // Get techniques if from book puzzle
  const techniques =
    bookPuzzle && getTechniquesDisplay
      ? getTechniquesDisplay((bookPuzzle.puzzle as any)?.techniques)
      : [];

  // Get puzzle title
  const puzzleTitle = (() => {
    if (bookPuzzle) {
      return `Puzzle #${bookPuzzle.index + 1}`;
    }
    if (metadataInfo?.type === 'daily' && metadataInfo.date) {
      return `Daily ${formatDateString(metadataInfo.date)}`;
    }
    if (metadataInfo?.type === 'book' && metadataInfo.bookInfo) {
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const monthName = monthNames[parseInt(metadataInfo.bookInfo.month) - 1];
      return `Book ${monthName} #${metadataInfo.bookInfo.number}`;
    }
    if (metadataInfo?.type === 'scanned') {
      return 'Scanned Puzzle';
    }
    return '';
  })();

  const {
    actualSession,
    percentage: myPercentage,
    isCompleted,
  } = useUserSessionData<TState>(
    session,
    userSessions,
    calculateCompletionPercentageFromState
  );

  // Helper function to get all player sessions for this puzzle, sorted by performance
  const getAllPlayerSessionsForPuzzle = () => {
    if (!friendSessions) return [];

    const allPlayerSessions: Array<{
      nickname: string;
      userId: string | null;
      completionPercentage: number;
      completionTime: number | null;
      isCompleted: boolean;
      isCheated: boolean;
      isCurrentUser: boolean;
      isWinner: boolean;
    }> = [];

    // Add user's session if they have actually played this puzzle, or if we're in MyPuzzlesTab
    if (actualSession || !userSessions) {
      allPlayerSessions.push({
        nickname: 'You',
        userId: null,
        completionPercentage: myPercentage,
        completionTime: actualSession?.state.completed?.seconds || null,
        isCompleted,
        isCheated: actualSession ? isPuzzleCheated(actualSession.state) : false,
        isCurrentUser: true,
        isWinner: false, // Will be determined later
      });
    }

    // Add friends' sessions
    const friendData = getFriendSessions<TState>(
      friendSessions,
      session,
      user?.sub,
      parties || [],
      isPuzzleCheated,
      calculateCompletionPercentageFromState
    );

    friendData.forEach((friend) => {
      allPlayerSessions.push({
        ...friend,
        isCurrentUser: false,
        isWinner: false, // Will be determined later
      });
    });

    // Don't show list if only the current user is playing
    if (friendData.length === 0) return [];

    // Determine the winner among completed puzzles
    const completedSessions = allPlayerSessions.filter(
      (session) => session.isCompleted && session.completionTime !== null
    );
    if (completedSessions.length > 0) {
      // Find the fastest completion time
      const fastestTime = Math.min(
        ...completedSessions.map((session) => session.completionTime!)
      );
      // Mark all sessions with the fastest time as winners (handles ties)
      completedSessions.forEach((session) => {
        if (session.completionTime === fastestTime) {
          session.isWinner = true;
        }
      });
    }

    // Sort by completion status first (completed first), then by completion percentage (highest first), then by completion time (fastest first)
    return allPlayerSessions.sort((a, b) => {
      // Completed puzzles first
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? -1 : 1;
      }

      // If both completed, sort by time (fastest first)
      if (
        a.isCompleted &&
        b.isCompleted &&
        a.completionTime &&
        b.completionTime
      ) {
        return a.completionTime - b.completionTime;
      }

      // If both incomplete, sort by completion percentage (highest first)
      if (!a.isCompleted && !b.isCompleted) {
        return b.completionPercentage - a.completionPercentage;
      }

      return 0;
    });
  };

  const playerSessions = getAllPlayerSessionsForPuzzle();

  // Helper to get timer display
  const getTimerDisplay = () => {
    if (actualSession?.state.timer !== undefined) {
      const seconds = calculateSeconds(actualSession.state.timer);
      return (
        <span className="text-xs opacity-75">
          {Math.floor(seconds / 60)}m {seconds % 60}s
        </span>
      );
    }
    return null;
  };

  return (
    <li
      key={session.sessionId}
      className="rounded-lg border-2 border-stone-200 bg-stone-50/80 hover:bg-stone-100 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
    >
      <Link href={buildPuzzleUrlFromState(session.state, isCompleted)}>
        <div>
          <SimpleState state={session.state} />
          <div className="space-y-2 px-4 py-2">
            <div className="text-center text-gray-900 dark:text-white">
              <h3 className="text-sm font-semibold">{puzzleTitle}</h3>
              <p className="text-xs opacity-75">
                {getGameStatusText<TState>(
                  session,
                  isPuzzleCheated,
                  calculateCompletionPercentageFromState,
                  userSessions
                )}
              </p>
            </div>

            {/* Difficulty Badge */}
            {difficultyInfo && (
              <div className="flex justify-center">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${difficultyInfo.badgeColor}`}
                >
                  {difficultyInfo.name}
                </span>
              </div>
            )}

            {/* Techniques (show only if from book) */}
            {techniques.length > 0 && (
              <div
                className={`space-y-2 rounded-lg p-3 text-white ${difficultyInfo?.badgeColor.replace('text-white', '') || 'bg-red-500'}`}
              >
                <h4 className="text-center text-sm font-semibold">
                  Recommended Techniques:
                </h4>
                <div className="flex flex-wrap justify-start gap-1">
                  {techniques.map((technique, i) => (
                    <span
                      key={i}
                      className={`rounded px-1.5 py-0.5 text-xs font-medium ${technique.color}`}
                      title={`${technique.name} (${technique.count})`}
                    >
                      {technique.name} ({technique.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Progress Section - Always show */}
      <div className="border-t border-stone-200 bg-stone-100/50 dark:border-zinc-600 dark:bg-zinc-700/50">
        <div className="p-2">
          <div className="space-y-1">
            {/* Show all players in sorted order, including user */}
            {playerSessions.length > 0 ? (
              playerSessions.map(
                ({
                  nickname,
                  userId,
                  completionPercentage,
                  completionTime,
                  isCompleted,
                  isCheated,
                  isCurrentUser,
                  isWinner,
                }) => (
                  <div
                    key={`${session.sessionId}-${userId || 'user'}`}
                    className={`flex items-center justify-between rounded px-2 py-1 text-xs ${
                      isWinner
                        ? 'bg-yellow-100/70 text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-100'
                        : isCurrentUser
                          ? 'bg-green-100/50 text-green-900 dark:bg-green-950/30 dark:text-green-100'
                          : 'bg-blue-100/50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-100'
                    }`}
                  >
                    <span className="flex items-center gap-1 font-medium">
                      {isWinner && (
                        <Award className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                      )}
                      {nickname}
                    </span>
                    <div className="flex items-center gap-1">
                      {isCompleted ? (
                        <>
                          <span
                            className={
                              isCheated
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-green-600 dark:text-green-400'
                            }
                          >
                            {isCheated ? '❌' : '✅'}
                          </span>
                          {completionTime && (
                            <span className="text-xs opacity-75">
                              {Math.floor(completionTime / 60)}m{' '}
                              {completionTime % 60}s
                            </span>
                          )}
                        </>
                      ) : isCurrentUser ? (
                        <>
                          {getTimerDisplay()}
                          <span className="ml-1 opacity-75">
                            {myPercentage}%
                          </span>
                        </>
                      ) : (
                        <span className="opacity-75">
                          {completionPercentage}%
                        </span>
                      )}
                    </div>
                  </div>
                )
              )
            ) : (
              /* Show only user when no friends or still loading */
              <div className="flex items-center justify-between rounded bg-green-100/50 px-2 py-1 text-xs text-green-900 dark:bg-green-950/30 dark:text-green-100">
                <span className="flex items-center gap-1 font-medium">You</span>
                <div className="flex items-center gap-1">
                  {isCompleted ? (
                    <>
                      <span
                        className={
                          actualSession && isPuzzleCheated(actualSession.state)
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-green-600 dark:text-green-400'
                        }
                      >
                        {actualSession && isPuzzleCheated(actualSession.state)
                          ? '❌'
                          : '✅'}
                      </span>
                      {session.state.completed && (
                        <span className="text-xs opacity-75">
                          {Math.floor(session.state.completed.seconds / 60)}m{' '}
                          {session.state.completed.seconds % 60}s
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      {getTimerDisplay()}
                      <span className="ml-1 opacity-75">{myPercentage}%</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Show subtle loading indicator for friends only */}
            {parties &&
              parties.length > 0 &&
              isFriendSessionsLoading &&
              playerSessions.length === 0 && (
                <div className="flex items-center justify-center p-1 text-xs opacity-50">
                  <Loader className="mr-1 h-2 w-2 animate-spin text-gray-400" />
                  <span className="text-[10px] text-gray-500 dark:text-gray-500">
                    Loading friends...
                  </span>
                </div>
              )}
          </div>
        </div>
      </div>
    </li>
  );
};

export default IntegratedSessionRow;
