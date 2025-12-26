'use client';
import React from 'react';
import { Award } from 'react-feather';
import {
  Difficulty,
  BookPuzzleDifficulty,
} from '@sudoku-web/types/serverTypes';
import { SCORING_CONFIG } from '@sudoku-web/sudoku/helpers/scoringConfig';

interface ScoringLegendProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScoringLegend: React.FC<ScoringLegendProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="bg-opacity-50 pb-safe fixed inset-0 z-[60] flex items-center justify-center bg-black p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[calc(90vh-var(--ion-safe-area-bottom))] w-full max-w-2xl overflow-y-auto rounded-2xl bg-gradient-to-br from-purple-50 via-white to-blue-50 shadow-2xl dark:from-purple-950 dark:via-zinc-800 dark:to-blue-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-blue-600 p-6 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center text-2xl font-bold text-white">
              <Award className="mr-3 text-yellow-300" size={28} />
              🏆 Scoring System
            </h3>
            <button
              onClick={onClose}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="pb-safe px-6 pb-6">
          <div className="space-y-6">
            <div className="rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 p-4 dark:from-yellow-900/20 dark:to-orange-900/20">
              <h4 className="mb-3 text-lg font-bold text-yellow-800 dark:text-yellow-200">
                🏁 Racing Wins
              </h4>
              <p className="mb-3 text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                +{SCORING_CONFIG.RACING_BONUS_PER_PERSON} points for each friend
                you beat on the same completed puzzle!
              </p>
              <p className="mb-2 text-sm text-yellow-600 dark:text-yellow-400">
                Complete puzzles faster than your friends to earn big racing
                bonuses. Beat 5 friends = +500 points!
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:border-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30">
              <h4 className="mb-3 flex items-center text-lg font-bold text-blue-800 dark:text-blue-200">
                📊 Base Points
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-green-500 px-3 py-2 text-white">
                  <div className="text-sm font-semibold">Any puzzle</div>
                  <div className="text-lg font-bold">
                    +{SCORING_CONFIG.VOLUME_MULTIPLIER}
                  </div>
                </div>
                <div className="rounded-lg bg-blue-500 px-3 py-2 text-white">
                  <div className="text-sm font-semibold">Daily puzzle</div>
                  <div className="text-lg font-bold">
                    +{SCORING_CONFIG.DAILY_PUZZLE_BASE}
                  </div>
                </div>
                <div className="rounded-lg bg-purple-500 px-3 py-2 text-white">
                  <div className="text-sm font-semibold">Book puzzle</div>
                  <div className="text-lg font-bold">
                    +{SCORING_CONFIG.BOOK_PUZZLE_BASE}
                  </div>
                </div>
                <div className="rounded-lg bg-orange-500 px-3 py-2 text-white">
                  <div className="text-sm font-semibold">Scanned puzzle</div>
                  <div className="text-lg font-bold">
                    +{SCORING_CONFIG.SCANNED_PUZZLE_BASE}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4 dark:border-red-700 dark:from-red-900/30 dark:to-pink-900/30">
              <h4 className="mb-4 text-lg font-bold text-red-800 dark:text-red-200">
                🔥 Difficulty Multipliers
              </h4>

              <div className="space-y-4">
                {/* Daily Puzzle Difficulties */}
                <div>
                  <h5 className="mb-3 text-sm font-semibold text-red-700 dark:text-red-300">
                    ⭐ Sudoku of the Day
                  </h5>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      {
                        key: Difficulty.SIMPLE,
                        name: '⚡ Tricky',
                        emoji: '⭐',
                      },
                      {
                        key: Difficulty.EASY,
                        name: '🔥 Challenging',
                        emoji: '⭐⭐',
                      },
                      {
                        key: Difficulty.INTERMEDIATE,
                        name: '🚀 Hard',
                        emoji: '⭐⭐⭐',
                      },
                    ].map(({ key, name, emoji }) => {
                      const multiplier =
                        SCORING_CONFIG.DIFFICULTY_MULTIPLIERS[key];

                      const getBadgeColor = (mult: number) => {
                        if (mult >= 2.0) return 'bg-red-600 text-white';
                        if (mult >= 1.5) return 'bg-orange-500 text-white';
                        if (mult >= 1.2) return 'bg-yellow-500 text-white';
                        return 'bg-green-500 text-white';
                      };

                      return (
                        <div
                          key={key}
                          className={`rounded-lg px-3 py-2 text-sm font-medium ${getBadgeColor(multiplier)}`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-yellow-300">
                                {emoji}
                              </span>
                              <span className="font-bold">{multiplier}x</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Book Puzzle Difficulties */}
                <div>
                  <h5 className="mb-3 text-sm font-semibold text-red-700 dark:text-red-300">
                    📖 Book Puzzles
                  </h5>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {Object.values(BookPuzzleDifficulty)
                      .sort(
                        (a, b) =>
                          SCORING_CONFIG.DIFFICULTY_MULTIPLIERS[a] -
                          SCORING_CONFIG.DIFFICULTY_MULTIPLIERS[b]
                      )
                      .map((difficulty) => {
                        const multiplier =
                          SCORING_CONFIG.DIFFICULTY_MULTIPLIERS[difficulty];
                        const displayName = difficulty
                          .replace(/^\d+-/, '') // Remove number prefix
                          .split('-')
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(' ');

                        const getBadgeColor = (mult: number) => {
                          if (mult >= 4.0) return 'bg-black text-white';
                          if (mult >= 3.0) return 'bg-red-900 text-white';
                          if (mult >= 2.0) return 'bg-red-600 text-white';
                          if (mult >= 1.5) return 'bg-orange-500 text-white';
                          if (mult >= 1.2) return 'bg-yellow-500 text-white';
                          return 'bg-green-500 text-white';
                        };

                        return (
                          <div
                            key={difficulty}
                            className={`rounded-lg px-2 py-1 text-xs font-medium ${getBadgeColor(multiplier)}`}
                          >
                            {displayName}: {multiplier}x
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 dark:border-purple-700 dark:from-purple-900/30 dark:to-indigo-900/30">
              <h4 className="mb-4 text-lg font-bold text-purple-800 dark:text-purple-200">
                ⚡ Speed Bonuses
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(SCORING_CONFIG.SPEED_THRESHOLDS)
                  .sort(([, a], [, b]) => b - a) // Sort by time descending so fastest is first
                  .map(([speedTier, threshold]) => {
                    const bonus =
                      SCORING_CONFIG.SPEED_BONUSES[
                        speedTier as keyof typeof SCORING_CONFIG.SPEED_BONUSES
                      ];
                    const minutes = Math.floor(threshold / 60);
                    const seconds = threshold % 60;
                    const timeDisplay =
                      seconds > 0
                        ? `${minutes}:${seconds.toString().padStart(2, '0')}`
                        : `${minutes} min`;

                    const getBadgeColor = (speedTier: string) => {
                      switch (speedTier) {
                        case 'LIGHTNING':
                          return 'bg-yellow-400 text-black';
                        case 'FAST':
                          return 'bg-orange-500 text-white';
                        case 'QUICK':
                          return 'bg-blue-500 text-white';
                        case 'STEADY':
                          return 'bg-green-500 text-white';
                        default:
                          return 'bg-gray-500 text-white';
                      }
                    };

                    const getSpeedEmoji = (speedTier: string) => {
                      switch (speedTier) {
                        case 'LIGHTNING':
                          return '⚡';
                        case 'FAST':
                          return '🔥';
                        case 'QUICK':
                          return '💨';
                        case 'STEADY':
                          return '🎯';
                        default:
                          return '⏱️';
                      }
                    };

                    return (
                      <div
                        key={speedTier}
                        className={`rounded-lg px-3 py-2 ${getBadgeColor(speedTier)}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold">
                            {getSpeedEmoji(speedTier)} Under {timeDisplay}
                          </div>
                          <div className="text-lg font-bold">+{bonus}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoringLegend;
