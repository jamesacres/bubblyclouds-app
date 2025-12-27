'use client';
import React from 'react';
import { Award, Zap, Calendar, Book, Camera } from 'react-feather';
import { FriendsLeaderboardScore } from '../types/scoringTypes';
import { formatTime } from '../helpers/scoringUtils';

interface ScoreBreakdownProps {
  breakdown: FriendsLeaderboardScore['breakdown'];
  stats: FriendsLeaderboardScore['stats'];
}

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  breakdown,
  stats,
}) => {
  const breakdownItems = [
    {
      label: 'Volume Bonus',
      value: breakdown.volumeScore,
      detail: `${stats.totalPuzzles} puzzles completed`,
      icon: <Award size={16} className="text-green-600" />,
      color: 'border-l-green-500',
    },
    {
      label: 'Daily Puzzles',
      value: breakdown.dailyPuzzleScore,
      detail: `${stats.dailyPuzzles} daily challenges`,
      icon: <Calendar size={16} className="text-blue-600" />,
      color: 'border-l-blue-500',
    },
    {
      label: 'Book Puzzles',
      value: breakdown.bookPuzzleScore,
      detail: `${stats.bookPuzzles} from puzzle books`,
      icon: <Book size={16} className="text-purple-600" />,
      color: 'border-l-purple-500',
    },
    {
      label: 'Scanned Puzzles',
      value: breakdown.scannedPuzzleScore,
      detail: `${stats.scannedPuzzles} imported puzzles`,
      icon: <Camera size={16} className="text-orange-600" />,
      color: 'border-l-orange-500',
    },
    {
      label: 'Difficulty Bonus',
      value: breakdown.difficultyBonus,
      detail: 'Harder puzzles = more points',
      icon: <Award size={16} className="text-red-600" />,
      color: 'border-l-red-500',
    },
    {
      label: 'Speed Bonus',
      value: breakdown.speedBonus,
      detail: `Fastest: ${formatTime(stats.fastestTime)}`,
      icon: <Zap size={16} className="text-yellow-600" />,
      color: 'border-l-yellow-500',
    },
    {
      label: 'Racing Bonus',
      value: breakdown.racingBonus,
      detail: 'Beat friends who also completed',
      icon: <Award size={16} className="text-indigo-600" />,
      color: 'border-l-indigo-500',
    },
  ];

  return (
    <div className="border-t border-gray-200 bg-gray-50/50 px-4 pb-4 dark:border-gray-600 dark:bg-zinc-700/30">
      <div className="mb-3 pt-4 font-semibold text-gray-700 dark:text-gray-300">
        Score Breakdown
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {breakdownItems.map(
          (item) =>
            item.value > 0 && (
              <div
                key={item.label}
                className={`rounded-lg border-l-4 bg-white p-3 dark:bg-zinc-800 ${item.color} shadow-sm`}
              >
                <div className="mb-2 flex items-center">
                  {item.icon}
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                </div>
                <div className="mb-1 text-lg font-bold text-green-600 dark:text-green-400">
                  +{item.value.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {item.detail}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
};

export default ScoreBreakdown;
