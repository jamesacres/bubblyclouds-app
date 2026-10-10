'use client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Zap, Calendar, Library, Camera, Flame } from 'lucide-react';
import { FriendsLeaderboardScore } from '../types/scoringTypes';
import { formatTime } from '../helpers/scoringUtils';

interface ScoreBreakdownProps {
  breakdown: FriendsLeaderboardScore['breakdown'];
  stats: FriendsLeaderboardScore['stats'];
  // What this game calls its collection-type puzzles: sudoku's monthly
  // puzzle book stays "Book puzzles" / "puzzle books", Unblock Race's puzzle
  // collections say "Collection puzzles" / "collections" — same underlying
  // collectionPuzzleScore/stats either way.
  collectionLabel?: string;
  collectionDetailNoun?: string;
}

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  breakdown,
  stats,
  collectionLabel,
  collectionDetailNoun,
}) => {
  const { t, i18n } = useTranslation('games');
  const label = collectionLabel ?? t('collection.defaultLabel');
  const detailNoun = collectionDetailNoun ?? t('collection.defaultDetailNoun');
  const breakdownItems = [
    {
      label: t('scoreBreakdown.volumeBonus.label'),
      value: breakdown.volumeScore,
      detail: t('scoreBreakdown.volumeBonus.detail', {
        count: stats.totalPuzzles,
      }),
      icon: <Award size={16} className="text-green-600" />,
      color: 'border-l-green-500',
    },
    {
      label: t('scoreBreakdown.dailyPuzzles.label'),
      value: breakdown.dailyPuzzleScore,
      detail: t('scoreBreakdown.dailyPuzzles.detail', {
        count: stats.dailyPuzzles,
      }),
      icon: <Calendar size={16} className="text-blue-600" />,
      color: 'border-l-blue-500',
    },
    {
      label: t('scoreBreakdown.collectionPuzzles.label', {
        collection: label,
      }),
      value: breakdown.collectionPuzzleScore,
      detail: t('scoreBreakdown.collectionPuzzles.detail', {
        count: stats.collectionPuzzles,
        collection: detailNoun,
      }),
      icon: <Library size={16} className="text-purple-600" />,
      color: 'border-l-purple-500',
    },
    {
      label: t('scoreBreakdown.scannedPuzzles.label'),
      value: breakdown.scannedPuzzleScore,
      detail: t('scoreBreakdown.scannedPuzzles.detail', {
        count: stats.scannedPuzzles,
      }),
      icon: <Camera size={16} className="text-orange-600" />,
      color: 'border-l-orange-500',
    },
    {
      label: t('scoreBreakdown.difficultyBonus.label'),
      value: breakdown.difficultyBonus,
      detail: t('scoreBreakdown.difficultyBonus.detail'),
      icon: <Award size={16} className="text-red-600" />,
      color: 'border-l-red-500',
    },
    {
      label: t('scoreBreakdown.speedBonus.label'),
      value: breakdown.speedBonus,
      detail: t('scoreBreakdown.speedBonus.detail', {
        time: formatTime(stats.fastestTime),
      }),
      icon: <Zap size={16} className="text-yellow-600" />,
      color: 'border-l-yellow-500',
    },
    {
      label: t('scoreBreakdown.racingBonus.label'),
      value: breakdown.racingBonus,
      detail: t('scoreBreakdown.racingBonus.detail'),
      icon: <Award size={16} className="text-indigo-600" />,
      color: 'border-l-indigo-500',
    },
    {
      label: t('scoreBreakdown.dailyCombo.label'),
      value: breakdown.comboBonus,
      detail: t('scoreBreakdown.dailyCombo.detail'),
      icon: <Flame size={16} className="text-pink-600" />,
      color: 'border-l-pink-500',
    },
  ];

  return (
    <div className="border-t border-gray-200 bg-gray-50/50 px-4 pb-4 dark:border-gray-600 dark:bg-zinc-700/30">
      <div className="mb-3 pt-4 font-semibold text-gray-700 dark:text-gray-300">
        {t('scoreBreakdown.title')}
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
                  +{item.value.toLocaleString(i18n.language)}
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
