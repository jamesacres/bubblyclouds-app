'use client';
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'react-feather';
import { FriendsLeaderboardScore } from '../types/scoringTypes';
import { formatTime } from '../helpers/scoringUtils';
import ScoreBreakdown from './ScoreBreakdown';

interface FriendLeaderboardEntryProps {
  entry: FriendsLeaderboardScore;
  rank: number;
  isCurrentUser: boolean;
}

const FriendLeaderboardEntry: React.FC<FriendLeaderboardEntryProps> = ({
  entry,
  rank,
  isCurrentUser,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        isCurrentUser
          ? 'border-blue-300 bg-blue-50/80 shadow-lg'
          : 'border-stone-200 bg-stone-50/80 shadow-sm'
      } backdrop-blur-sm dark:border-gray-700 dark:bg-zinc-800/80`}
    >
      <div
        className="hover:bg-opacity-90 flex cursor-pointer items-center p-4 transition-all"
        onClick={() => setShowBreakdown(!showBreakdown)}
      >
        <div className="w-16 text-center">
          <span className="text-2xl font-bold">{getRankIcon(rank)}</span>
        </div>

        <div className="ml-4 flex-1">
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {entry.username}
            {isCurrentUser && (
              <span className="ml-2 text-sm text-blue-600">(You)</span>
            )}
          </div>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {entry.stats.totalPuzzles} puzzles • Avg:{' '}
            {formatTime(entry.stats.averageTime)}
            {entry.stats.fastestTime > 0 && (
              <> • Best: {formatTime(entry.stats.fastestTime)}</>
            )}
            {entry.stats.racingWins > 0 && (
              <> • 🏁 {entry.stats.racingWins} wins</>
            )}
          </div>
        </div>

        <div className="mr-4 text-right">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {entry.totalScore.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">points</div>
        </div>

        <div className="text-gray-400">
          {showBreakdown ? (
            <ChevronDown size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
        </div>
      </div>

      {showBreakdown && (
        <ScoreBreakdown breakdown={entry.breakdown} stats={entry.stats} />
      )}
    </div>
  );
};

export default FriendLeaderboardEntry;
