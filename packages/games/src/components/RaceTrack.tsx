'use client';
import { Parties, Session } from '@sudoku-web/types/serverTypes';
import { calculateCompletionPercentage } from '@sudoku-web/sudoku/helpers/calculateCompletionPercentage';
import { useParties } from '@sudoku-web/template/hooks/useParties';
import { memo, useMemo } from 'react';
import {
  getPlayerColor,
  getAllUserIds,
} from '@sudoku-web/template/utils/playerColors';
import { formatSeconds } from '@sudoku-web/template/helpers/formatSeconds';
import { Tab } from '@sudoku-web/types/tabs';
import TrafficLight from './TrafficLight';
import Link from 'next/link';
import { RefreshCw } from 'react-feather';
import { Puzzle } from '@sudoku-web/sudoku/types/puzzle';
import { isPuzzleCheated } from '@sudoku-web/sudoku/helpers/cheatDetection';
import {
  BaseGameState,
  BaseServerState,
} from '@sudoku-web/template/types/gameState';

interface Arguments {
  sessionParties: Parties<Session<BaseServerState>>;
  initial: any;
  final: any;
  answer: any;
  userId?: string;
  onClick?: () => void;
  countdown?: number;
  completed?: BaseGameState['completed'];
  refreshSessionParties: () => void;
  isPolling: boolean;
  answerStack: Puzzle[];
}

interface PlayerProgress {
  userId: string;
  nickname: string;
  percentage: number;
  isCurrentUser: boolean;
  finishTime?: number;
  isPuzzleCheated: boolean;
}

const RaceTrack = ({
  sessionParties,
  initial,
  final,
  answer,
  userId,
  onClick,
  countdown,
  completed,
  refreshSessionParties,
  isPolling,
  answerStack,
}: Arguments) => {
  const { getNicknameByUserId, parties, refreshParties } = useParties();

  // Get consistent ordering of all user IDs for color assignment
  const allUserIds = useMemo(() => getAllUserIds(parties), [parties]);

  // Calculate and collect progress for all unique users
  const allPlayerProgress = useMemo((): PlayerProgress[] => {
    const progressMap: Record<string, PlayerProgress> = {};

    // Add current user's progress
    if (userId) {
      const currentUserPercentage = calculateCompletionPercentage(
        initial,
        final,
        answer
      );

      const finishTime: number | undefined = completed?.seconds;

      progressMap[userId] = {
        userId,
        nickname: 'You',
        percentage: currentUserPercentage,
        isCurrentUser: true,
        finishTime,
        isPuzzleCheated:
          currentUserPercentage === 100 && isPuzzleCheated(answerStack),
      };
    }

    // Add all other users from all parties
    Object.values(sessionParties).forEach((party) => {
      if (party?.memberSessions) {
        Object.entries(party.memberSessions).forEach(([memberId, session]) => {
          // Skip if this is the current user (already added)
          if (memberId === userId) return;

          // Skip if we've already processed this user
          if (progressMap[memberId]) return;

          const percentage = session
            ? calculateCompletionPercentage(
                session.state.initial as any,
                session.state.final as any,
                session.state.answerStack[
                  session.state.answerStack.length - 1
                ] as any
              )
            : 0;

          let finishTime: number | undefined = undefined;
          if (session?.state.completed) {
            finishTime = session.state.completed.seconds;
          }

          // Get the user's nickname from parties data, fallback to a default
          const nickname = getNicknameByUserId(memberId) || ``;
          if (!nickname) {
            // We're missing a new member, refresh the members list
            refreshParties();
          } else {
            progressMap[memberId] = {
              userId: memberId,
              nickname,
              percentage,
              isCurrentUser: false,
              finishTime,
              isPuzzleCheated:
                percentage === 100 &&
                !!session &&
                isPuzzleCheated(session.state.answerStack as any),
            };
          }
        });
      }
    });

    // Convert to array and sort by percentage (highest first)
    return Object.values(progressMap).sort(
      (a, b) => b.percentage - a.percentage
    );
  }, [
    sessionParties,
    initial,
    final,
    answer,
    userId,
    getNicknameByUserId,
    refreshParties,
    completed,
    answerStack,
  ]);

  const finishedPlayers = useMemo(() => {
    return allPlayerProgress
      .filter((p) => !p.isPuzzleCheated && p.percentage === 100 && p.finishTime)
      .sort((a, b) => a.finishTime! - b.finishTime!);
  }, [allPlayerProgress]);

  const currentUserProgress = useMemo(() => {
    return allPlayerProgress.find((p) => p.isCurrentUser);
  }, [allPlayerProgress]);

  const isCompleted =
    currentUserProgress?.percentage === 100 && !isPuzzleCheated(answerStack);

  return (
    <div className="mx-auto mt-2 mb-2 w-full max-w-xl lg:mt-4 lg:mr-0">
      {/* Compact race track design */}
      <div
        className="relative cursor-pointer"
        onClick={() => onClick && onClick()}
        title="Click to view friends"
      >
        {/* Main track */}
        <div className="relative h-10 overflow-visible rounded-lg bg-stone-100 lg:h-14 dark:bg-gray-800">
          {/* Traffic Light */}
          <TrafficLight countdown={countdown} />
          {/* Track surface with center line */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Dashed center line */}
            <div
              className="absolute top-1/2 right-16 left-6 h-0.5 -translate-y-1/2 transform bg-white opacity-60"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to right, white 0px, white 6px, transparent 6px, transparent 12px)',
              }}
            ></div>
          </div>

          {/* START label inside track */}
          <div className="absolute top-1/2 left-1 -translate-y-1/2 transform">
            <span className="rounded bg-green-600 px-1.5 py-0.5 text-xs font-bold text-white">
              START
            </span>
          </div>

          {/* FINISH label and flag inside track */}
          <div className="absolute top-1/2 right-1 flex -translate-y-1/2 transform items-center">
            <span className="mr-1 rounded bg-red-600 px-1 py-0.5 text-xs font-bold text-white">
              FINISH
            </span>
            {/* Checkered flag */}
            <div
              className="h-3 w-4 border border-gray-800 bg-white"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, black 25%, transparent 25%),
                  linear-gradient(-45deg, black 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, black 75%),
                  linear-gradient(-45deg, transparent 75%, black 75%)
                `,
                backgroundSize: '2px 2px',
                backgroundPosition: '0 0, 0 1px, 1px -1px, -1px 0px',
              }}
            ></div>
          </div>

          {/* Progress tick marks */}
          {[25, 50, 75].map((tick) => (
            <div
              key={tick}
              className="absolute top-0 bottom-0 w-px bg-yellow-400 opacity-40"
              style={{ left: `${tick}%` }}
            ></div>
          ))}

          {/* Player karts */}
          {allPlayerProgress.map((player, index) => {
            const colorClass = getPlayerColor(
              player.userId,
              allUserIds,
              player.isCurrentUser
            );

            // Calculate vertical spacing within the track (responsive)
            const trackHeight = window.innerWidth >= 1024 ? 56 : 40; // h-14 = 56px, h-10 = 40px
            const totalPlayers = allPlayerProgress.length;
            const playerHeight = Math.min(8, trackHeight / totalPlayers);
            const verticalOffset = index * playerHeight + 2;

            return (
              <div
                key={player.userId}
                className="absolute transform transition-all duration-700 ease-out"
                style={{
                  left: `${Math.min(
                    Math.max(player.percentage * 0.83 + 12, 12),
                    95
                  )}%`, // Scale 0-100% to 12-95% of track
                  top: `${verticalOffset}px`,
                  transform: 'translateX(-50%)',
                }}
              >
                {/* Smaller kart */}
                <div
                  className={`h-3 w-5 ${colorClass} relative rounded border border-gray-800 shadow-sm dark:border-gray-200`}
                >
                  {/* Tiny wheels */}
                  <div className="absolute top-0 -left-0.5 h-0.5 w-0.5 rounded-full bg-gray-800 dark:bg-gray-200"></div>
                  <div className="absolute top-0 -right-0.5 h-0.5 w-0.5 rounded-full bg-gray-800 dark:bg-gray-200"></div>
                  <div className="absolute bottom-0 -left-0.5 h-0.5 w-0.5 rounded-full bg-gray-800 dark:bg-gray-200"></div>
                  <div className="absolute -right-0.5 bottom-0 h-0.5 w-0.5 rounded-full bg-gray-800 dark:bg-gray-200"></div>

                  {/* Driver dot */}
                  <div className="absolute top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 transform rounded-full bg-yellow-300"></div>

                  {/* Crown for current user */}
                  {player.isCurrentUser && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 transform text-xs">
                      👑
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Compact horizontal player legend - lowest to highest percentage */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {[...allPlayerProgress].reverse().map((player) => {
            const colorClass = getPlayerColor(
              player.userId,
              allUserIds,
              player.isCurrentUser
            );

            return (
              <div
                key={`${player.userId}-info`}
                className="flex items-center gap-1"
              >
                {/* Color indicator */}
                <div className={`h-2 w-2 rounded-full ${colorClass}`}></div>
                {/* Player name with percentage */}
                <span
                  className={`font-medium ${
                    player.isCurrentUser
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {player.nickname}
                  {player.isCurrentUser && ' 👑'}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  ({player.percentage}%)
                </span>
              </div>
            );
          })}
        </div>

        {/* Leaderboard for finished players */}
        {finishedPlayers.length > 0 && (
          <div className="mt-4">
            <div className="mt-2 rounded-lg bg-stone-100 p-2 dark:bg-gray-800">
              {finishedPlayers.map((player, index) => (
                <div
                  key={player.userId}
                  className="flex items-center justify-between p-1"
                >
                  <div className="flex items-center">
                    <span className="mr-2 w-6 text-center font-bold">
                      {index + 1}.
                    </span>
                    <span className={player.isCurrentUser ? 'font-bold' : ''}>
                      {player.nickname}
                    </span>
                  </div>
                  <span className="font-mono">
                    {formatSeconds(player.finishTime!)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isCompleted && (
        <div className="mt-4 mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/?tab=${Tab.FRIENDS}`}
              className="bg-theme-primary hover:bg-theme-primary-dark inline-flex items-center rounded-full px-6 py-3 text-base font-bold text-white shadow-md transition-transform hover:scale-105"
            >
              <span className="mr-2 text-xl" role="img" aria-label="trophy">
                🏆
              </span>
              View Monthly Leaderboard
            </Link>
            {finishedPlayers.length !== allPlayerProgress.length && (
              <button
                onClick={refreshSessionParties}
                disabled={isPolling}
                title="Refresh scores"
                className="inline-flex cursor-pointer items-center rounded-full bg-gray-200 p-3 font-bold text-gray-700 shadow-md transition-transform hover:scale-105 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-5 w-5 ${isPolling ? 'animate-spin' : ''}`}
                />
              </button>
            )}
          </div>

          {/* Challenge friends section */}
          {currentUserProgress?.finishTime && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
              <div className="text-center">
                <div className="mb-2 text-lg font-semibold text-purple-900 dark:text-purple-100">
                  🏁 Challenge friends to beat your time!
                </div>
                <div className="mb-3 text-sm text-purple-700 dark:text-purple-300">
                  Your time:{' '}
                  <span className="font-mono font-bold">
                    {formatSeconds(currentUserProgress.finishTime)}
                  </span>
                </div>
                <button
                  onClick={onClick}
                  className="inline-flex cursor-pointer items-center rounded-full bg-purple-600 px-6 py-3 text-base font-bold text-white shadow-md transition-transform hover:scale-105 hover:bg-purple-700"
                >
                  <span className="mr-2 text-xl" role="img" aria-label="racing">
                    🚀
                  </span>
                  Invite Friends to Race
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Prevent re-render on timer change
const MemoisedRaceTrack = memo(function MemoisedRaceTrack(args: Arguments) {
  return RaceTrack(args);
});

export default MemoisedRaceTrack;
