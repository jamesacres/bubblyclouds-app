'use client';
import { ComponentType, useContext } from 'react';
import { Party, ServerStateResult } from '@bubblyclouds-app/types/serverTypes';
import { useParties } from '../hooks/useParties';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { calculateSeconds } from '../helpers/calculateSeconds';
import { useSessions } from '../providers/SessionsProvider';
import { Award, Loader, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { StarRating } from '@bubblyclouds-app/ui/components/StarRating';
import { UserSessions } from '@bubblyclouds-app/types/userSessions';
import { BaseServerState } from '../types/state';
import { MovesDisplay } from './MovesDisplay';

// Function to get game status text
const getGameStatusText = <State extends BaseServerState = BaseServerState>(
  session: ServerStateResult<State>,
  isPuzzleCheated: (state: State) => boolean,
  calculateCompletionPercentageFromState: (state: State) => number,
  _userSessions?: ServerStateResult<State>[]
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

const MONTH_NAMES = [
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
  const monthName = MONTH_NAMES[date.getMonth()];
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
    runId: string;
    unblockCollectionPuzzleId: string;
  }>
) => {
  if (!metadata) return null;

  const info: {
    type: 'daily' | 'book' | 'scanned' | 'collection' | 'other';
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

  // Unblock Race daily run (format: oftheday-${YYYYMMDD})
  if (metadata.runId?.startsWith('oftheday-')) {
    const parts = metadata.runId.split('-');
    if (parts.length >= 2) {
      info.type = 'daily';
      info.date = parts[1];
    }
  }

  // Unblock Race collection puzzle
  // (format: ofthemonth-${YYYYMM}-puzzle-${index})
  if (metadata.unblockCollectionPuzzleId?.startsWith('ofthemonth-')) {
    const parts = metadata.unblockCollectionPuzzleId.split('-');
    if (parts.length >= 4) {
      info.type = 'collection';
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

  // Use difficulty from metadata if available
  if (metadata.difficulty) {
    info.difficulty = metadata.difficulty;
  }

  return info;
};

interface IntegratedSessionRowProps<
  State extends BaseServerState = BaseServerState,
  BookPuzzle extends { initial: string; final: string } = {
    initial: string;
    final: string;
  },
  Techniques = unknown,
> {
  session: ServerStateResult<State>;
  userSessions?: ServerStateResult<State>[]; // Optional: user's sessions for cross-referencing
  // Book-specific props
  bookPuzzle?: {
    puzzle: BookPuzzle;
    index: number;
    sudokuBookId: string;
  };
  // Helper functions for displaying difficulty and techniques (required when bookPuzzle is provided)
  getDifficultyDisplay?: (difficulty: string) =>
    | {
        name: string;
        badgeColor: string;
      }
    | undefined;
  getTechniquesDisplay?: (techniques?: Techniques) => Array<{
    name: string;
    count: number;
    color: string;
    category: string;
    categoryOrder: number;
  }>;
  SimpleState: ComponentType<{ state: State }>;
  calculateCompletionPercentageFromState: (state: State) => number;
  isPuzzleCheated: (state: State) => boolean;
  buildPuzzleUrlFromState: (state: State, isCompleted?: boolean) => string;
  // Game-specific move count vs par for a session (e.g. unblockrace's
  // movesMade/movesRequired metadata); when provided, completed rows show
  // the moves graded against par alongside the time.
  getMovesDisplay?: (
    state: State
  ) => { movesMade: number; movesRequired: number } | undefined;
  // Game-specific star rating for a completed session (e.g. unblockrace's
  // moves-vs-par grade); when provided, completed rows show the stars
  // alongside the moves chip.
  getStarRating?: (state: State) => number | undefined;
  // When locked (e.g. the paywalled part of a collection), the tile is not a
  // navigation link but a button that surfaces the paywall via onLockedClick,
  // with a lightly dimmed preview and a premium "Plus" badge overlay — framed
  // as an unlock, not a restriction.
  isLocked?: boolean;
  onLockedClick?: () => void;
  // Overrides the premium overlay's pill label (default "Plus").
  lockedLabel?: string;
}

// Helper to get user's session data for display
const useUserSessionData = <State extends BaseServerState = BaseServerState>(
  session: ServerStateResult<State>,
  userSessions?: ServerStateResult<State>[],
  calculateCompletionPercentageFromState?: (state: State) => number
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
const getFriendSessions = <State extends BaseServerState = BaseServerState>(
  friendSessions: UserSessions<State>,
  session: ServerStateResult<State>,
  currentUserId: string | undefined,
  parties: Party[],
  isPuzzleCheated: (state: State) => boolean,
  calculateCompletionPercentageFromState: (state: State) => number,
  getMovesDisplay?: (
    state: State
  ) => { movesMade: number; movesRequired: number } | undefined,
  getStarRating?: (state: State) => number | undefined
) => {
  const friendSessionData: Array<{
    nickname: string;
    userId: string;
    completionPercentage: number;
    completionTime: number | null;
    inProgressSeconds: number | null;
    isCompleted: boolean;
    isCheated: boolean;
    moves?: { movesMade: number; movesRequired: number };
    stars?: number;
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
        inProgressSeconds:
          matchingSession.state.timer !== undefined
            ? calculateSeconds(matchingSession.state.timer)
            : null,
        isCompleted: !!matchingSession.state.completed,
        isCheated: isPuzzleCheated(matchingSession.state),
        moves: getMovesDisplay?.(matchingSession.state),
        stars: getStarRating?.(matchingSession.state),
      });
    }
  });

  return friendSessionData;
};

export const IntegratedSessionRow = <
  State extends BaseServerState = BaseServerState,
  BookPuzzle extends { initial: string; final: string } = {
    initial: string;
    final: string;
  },
  Techniques = unknown,
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
  getMovesDisplay,
  getStarRating,
  isLocked,
  onLockedClick,
  lockedLabel = 'Plus',
}: IntegratedSessionRowProps<State, BookPuzzle, Techniques>) => {
  const context = useContext(UserContext);
  const { user } = context || {};
  const { friendSessions, isFriendSessionsLoading } = useSessions<State>();
  const { parties } = useParties();

  const metadata = session.state.metadata;

  // Extract metadata information
  const metadataInfo = extractMetadataInfo(metadata);

  // Get difficulty information. getDifficultyDisplay returns undefined for
  // ids outside its current vocabulary (e.g. a pre-rename difficulty id
  // still on an old session), so stale data doesn't surface as a raw-id badge.
  const difficultyInfo = (() => {
    if (metadataInfo?.difficulty && getDifficultyDisplay) {
      return getDifficultyDisplay(metadataInfo.difficulty) || null;
    }
    return null;
  })();

  // Get techniques if from book puzzle
  const techniques =
    bookPuzzle && getTechniquesDisplay
      ? getTechniquesDisplay(
          (bookPuzzle.puzzle as { techniques?: Techniques })?.techniques
        )
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
      const monthName = MONTH_NAMES[parseInt(metadataInfo.bookInfo.month) - 1];
      return `Book ${monthName} #${metadataInfo.bookInfo.number}`;
    }
    if (metadataInfo?.type === 'scanned') {
      return 'Scanned Puzzle';
    }
    if (metadataInfo?.type === 'collection' && metadataInfo.bookInfo) {
      const monthName = MONTH_NAMES[parseInt(metadataInfo.bookInfo.month) - 1];
      return `Collection ${monthName} #${metadataInfo.bookInfo.number}`;
    }
    return '';
  })();

  const {
    actualSession,
    percentage: myPercentage,
    isCompleted,
  } = useUserSessionData<State>(
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
      inProgressSeconds: number | null;
      isCompleted: boolean;
      isCheated: boolean;
      isCurrentUser: boolean;
      isWinner: boolean;
      moves?: { movesMade: number; movesRequired: number };
      stars?: number;
    }> = [];

    // Add user's session if they have actually played this puzzle, or if we're in MyPuzzlesTab
    if (actualSession || !userSessions) {
      allPlayerSessions.push({
        nickname: 'You',
        userId: null,
        completionPercentage: myPercentage,
        completionTime: actualSession?.state.completed?.seconds || null,
        inProgressSeconds:
          actualSession?.state.timer !== undefined
            ? calculateSeconds(actualSession.state.timer)
            : null,
        isCompleted,
        isCheated: actualSession ? isPuzzleCheated(actualSession.state) : false,
        isCurrentUser: true,
        isWinner: false, // Will be determined later
        moves: actualSession
          ? getMovesDisplay?.(actualSession.state)
          : undefined,
        stars: actualSession ? getStarRating?.(actualSession.state) : undefined,
      });
    }

    // Add friends' sessions
    const friendData = getFriendSessions<State>(
      friendSessions,
      session,
      user?.sub,
      parties || [],
      isPuzzleCheated,
      calculateCompletionPercentageFromState,
      getMovesDisplay,
      getStarRating
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

  const ownMoves =
    actualSession && !isPuzzleCheated(actualSession.state)
      ? getMovesDisplay?.(actualSession.state)
      : undefined;

  const ownStars =
    actualSession && !isPuzzleCheated(actualSession.state)
      ? getStarRating?.(actualSession.state)
      : undefined;

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

  const rowInner = (
    <div className="relative">
      {isLocked && (
        <>
          {/* Premium veil: a gold-tinted wash over the board preview and a
              "Plus" pill, so a paywalled puzzle reads as a reward waiting to
              be unlocked rather than a door slammed shut. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-amber-950/50 via-amber-900/10 to-transparent"
          />
          <span className="absolute right-2 top-2 z-20 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wide text-amber-950 shadow-md">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {lockedLabel}
          </span>
        </>
      )}
      <div className={isLocked ? 'opacity-80' : ''}>
        <SimpleState state={session.state} />
      </div>
      <div className="space-y-2 px-4 py-2">
        <div className="text-center text-gray-900 dark:text-white">
          <h3 className="text-sm font-semibold">{puzzleTitle}</h3>
          {isLocked ? (
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              Unlock with {lockedLabel}
            </p>
          ) : (
            <p className="text-xs opacity-75">
              {getGameStatusText<State>(
                session,
                isPuzzleCheated,
                calculateCompletionPercentageFromState,
                userSessions
              )}
            </p>
          )}
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
  );

  return (
    <li
      key={session.sessionId}
      className="rounded-lg border-2 border-stone-200 bg-stone-50/80 hover:bg-stone-100 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
    >
      {isLocked ? (
        <button
          type="button"
          onClick={onLockedClick}
          aria-label="Locked puzzle"
          className="relative block w-full cursor-pointer text-left"
        >
          {rowInner}
        </button>
      ) : (
        <Link href={buildPuzzleUrlFromState(session.state, isCompleted)}>
          {rowInner}
        </Link>
      )}

      {/* Progress Section — for a Plus-locked tile this becomes an unlock
          prompt instead of a meaningless "You 0%" row */}
      {isLocked ? (
        <button
          type="button"
          onClick={onLockedClick}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-amber-200/60 bg-amber-100/50 px-2 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Unlock with {lockedLabel}
        </button>
      ) : (
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
                    inProgressSeconds,
                    isCompleted,
                    isCheated,
                    isCurrentUser,
                    isWinner,
                    moves,
                    stars,
                  }) => (
                    <div
                      key={`${session.sessionId}-${userId || 'user'}`}
                      className={`flex w-full flex-col gap-0.5 rounded px-2 py-1 text-xs ${
                        isWinner
                          ? 'bg-yellow-100/70 text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-100'
                          : isCurrentUser
                            ? 'bg-green-100/50 text-green-900 dark:bg-green-950/30 dark:text-green-100'
                            : 'bg-blue-100/50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-100'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-1 truncate font-medium">
                        {isWinner && (
                          <Award className="h-3 w-3 shrink-0 text-yellow-600 dark:text-yellow-400" />
                        )}
                        <span className="truncate">{nickname}</span>
                      </span>
                      <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
                        {isCompleted ? (
                          <>
                            <span
                              className={`shrink-0 ${
                                isCheated
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : 'text-green-600 dark:text-green-400'
                              }`}
                            >
                              {isCheated ? '❌' : '✅'}
                            </span>
                            {completionTime && (
                              <span className="shrink-0 text-xs opacity-75">
                                {Math.floor(completionTime / 60)}m{' '}
                                {completionTime % 60}s
                              </span>
                            )}
                            {moves && !isCheated && (
                              <span className="shrink-0">
                                <MovesDisplay moves={moves} />
                              </span>
                            )}
                          </>
                        ) : isCurrentUser ? (
                          <>
                            {inProgressSeconds !== null && (
                              <span className="text-xs opacity-75">
                                {Math.floor(inProgressSeconds / 60)}m{' '}
                                {inProgressSeconds % 60}s
                              </span>
                            )}
                            <span className="ml-1 shrink-0 opacity-75">
                              {myPercentage}%
                            </span>
                            {moves && (
                              <span className="shrink-0">
                                <MovesDisplay moves={moves} />
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {inProgressSeconds !== null && (
                              <span className="text-xs opacity-75">
                                {Math.floor(inProgressSeconds / 60)}m{' '}
                                {inProgressSeconds % 60}s
                              </span>
                            )}
                            <span className="ml-1 shrink-0 opacity-75">
                              {completionPercentage}%
                            </span>
                            {moves && (
                              <span className="shrink-0">
                                <MovesDisplay moves={moves} />
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {isCompleted && !isCheated && stars !== undefined && (
                        <div className="flex min-w-0 items-center">
                          <StarRating rating={stars} size="sm" />
                        </div>
                      )}
                    </div>
                  )
                )
              ) : (
                /* Show only user when no friends or still loading */
                <div className="flex w-full flex-col gap-0.5 rounded bg-green-100/50 px-2 py-1 text-xs text-green-900 dark:bg-green-950/30 dark:text-green-100">
                  <span className="flex min-w-0 items-center gap-1 truncate font-medium">
                    You
                  </span>
                  <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
                    {isCompleted ? (
                      <>
                        <span
                          className={`shrink-0 ${
                            actualSession &&
                            isPuzzleCheated(actualSession.state)
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {actualSession && isPuzzleCheated(actualSession.state)
                            ? '❌'
                            : '✅'}
                        </span>
                        {session.state.completed && (
                          <span className="shrink-0 text-xs opacity-75">
                            {Math.floor(session.state.completed.seconds / 60)}m{' '}
                            {session.state.completed.seconds % 60}s
                          </span>
                        )}
                        {ownMoves && (
                          <span className="shrink-0">
                            <MovesDisplay moves={ownMoves} />
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {getTimerDisplay()}
                        <span className="ml-1 shrink-0 opacity-75">
                          {myPercentage}%
                        </span>
                        {ownMoves && (
                          <span className="shrink-0">
                            <MovesDisplay moves={ownMoves} />
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {isCompleted &&
                    !(actualSession && isPuzzleCheated(actualSession.state)) &&
                    ownStars !== undefined && (
                      <div className="flex min-w-0 items-center">
                        <StarRating rating={ownStars} size="sm" />
                      </div>
                    )}
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
      )}
    </li>
  );
};

export default IntegratedSessionRow;
