'use client';
import React from 'react';
import { X, Zap, BookOpen, Trophy, Timer, ScanLine, Flame } from 'lucide-react';
import { Difficulty, BookPuzzleDifficulty } from '../types/difficulty';
import { DailyComboConfig } from '../types/scoringTypes';
import { SCORING_CONFIG } from '../helpers/scoringConfig';

interface ScoringLegendProps {
  isOpen: boolean;
  onClose: () => void;
  gameName: string;
  dailyCombo?: DailyComboConfig;
}

const DAILY_DIFFICULTIES = [
  { key: Difficulty.SIMPLE, label: 'Tricky', stars: 1 },
  { key: Difficulty.EASY, label: 'Challenging', stars: 2 },
  { key: Difficulty.INTERMEDIATE, label: 'Hard', stars: 3 },
] as const;

const SPEED_TIERS = [
  { key: 'LIGHTNING', label: 'Lightning', threshold: '3 min' },
  { key: 'FAST', label: 'Fast', threshold: '5 min' },
  { key: 'QUICK', label: 'Quick', threshold: '10 min' },
  { key: 'STEADY', label: 'Steady', threshold: '20 min' },
] as const;

const multiplierBar = (mult: number, max: number) => {
  const pct = Math.round((mult / max) * 100);
  return pct;
};

const comboTiers = (dailyCombo: DailyComboConfig) => {
  const tiers: { puzzle: number; mult: number }[] = [];
  for (let index = 0; index < 6; index++) {
    const mult = Math.min(1 + index * dailyCombo.increment, dailyCombo.max);
    tiers.push({ puzzle: index + 1, mult });
    if (mult >= dailyCombo.max) break;
  }
  return tiers;
};

const ScoringLegend: React.FC<ScoringLegendProps> = ({
  isOpen,
  onClose,
  gameName,
  dailyCombo,
}) => {
  if (!isOpen) return null;

  const bookDifficulties = Object.values(BookPuzzleDifficulty).sort(
    (a, b) =>
      SCORING_CONFIG.DIFFICULTY_MULTIPLIERS[a] -
      SCORING_CONFIG.DIFFICULTY_MULTIPLIERS[b]
  );

  const maxBookMult = Math.max(
    ...bookDifficulties.map((d) => SCORING_CONFIG.DIFFICULTY_MULTIPLIERS[d])
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
              How scoring works
            </h3>
            <p className="text-xs text-zinc-500">{gameName} · Last 30 days</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 active:scale-95 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="pb-safe space-y-6 px-6 py-6">
          {/* Racing wins */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Racing wins
              </h4>
            </div>
            <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Earn{' '}
                <span className="font-semibold tabular-nums text-amber-500">
                  +{SCORING_CONFIG.RACING_BONUS_PER_PERSON} pts
                </span>{' '}
                for each friend you beat on the same completed puzzle. Finish
                first across 5 friends and collect{' '}
                <span className="font-semibold tabular-nums text-amber-500">
                  +{SCORING_CONFIG.RACING_BONUS_PER_PERSON * 5} pts
                </span>
                .
              </p>
            </div>
          </section>

          {/* Base points */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Base points
              </h4>
            </div>
            <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl bg-zinc-100 dark:divide-zinc-800 dark:bg-zinc-900">
              {[
                {
                  icon: Zap,
                  label: 'Any puzzle',
                  value: SCORING_CONFIG.VOLUME_MULTIPLIER,
                },
                {
                  icon: Zap,
                  label: 'Daily puzzle',
                  value: SCORING_CONFIG.DAILY_PUZZLE_BASE,
                },
                {
                  icon: BookOpen,
                  label: 'Book puzzle',
                  value: SCORING_CONFIG.BOOK_PUZZLE_BASE,
                },
                {
                  icon: ScanLine,
                  label: 'Scanned puzzle',
                  value: SCORING_CONFIG.SCANNED_PUZZLE_BASE,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {label}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-white">
                    +{value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Difficulty multipliers */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Difficulty multipliers
              </h4>
            </div>

            {/* Daily */}
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {gameName} of the Day
            </p>
            <div className="mb-4 divide-y divide-zinc-200 overflow-hidden rounded-2xl bg-zinc-100 dark:divide-zinc-800 dark:bg-zinc-900">
              {DAILY_DIFFICULTIES.map(({ key, label, stars }) => {
                const mult = SCORING_CONFIG.DIFFICULTY_MULTIPLIERS[key];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {label}
                      </span>
                      <span className="text-[10px] text-amber-500">
                        {'★'.repeat(stars)}
                        {'☆'.repeat(3 - stars)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-white">
                      {mult}×
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Book */}
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Book puzzles
            </p>
            <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl bg-zinc-100 dark:divide-zinc-800 dark:bg-zinc-900">
              {bookDifficulties.map((difficulty) => {
                const mult = SCORING_CONFIG.DIFFICULTY_MULTIPLIERS[difficulty];
                const displayName = difficulty
                  .replace(/^\d+-/, '')
                  .split('-')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ');
                const barPct = multiplierBar(mult, maxBookMult);

                return (
                  <div
                    key={difficulty}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <span className="w-36 shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                      {displayName}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-zinc-900 dark:text-white">
                      {mult}×
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Speed bonuses */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Timer className="h-4 w-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Speed bonuses
              </h4>
            </div>
            <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl bg-zinc-100 dark:divide-zinc-800 dark:bg-zinc-900">
              {SPEED_TIERS.map(({ key, label, threshold }) => {
                const bonus = SCORING_CONFIG.SPEED_BONUSES[key];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {label}
                      </span>
                      <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">
                        under {threshold}
                      </span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-amber-500">
                      +{bonus}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Daily combo */}
          {dailyCombo && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500" />
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Daily combo
                </h4>
              </div>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
                Solve more puzzles on the same day to multiply each
                puzzle&apos;s points, up to{' '}
                <span className="font-semibold tabular-nums text-amber-500">
                  {dailyCombo.max}×
                </span>
                .
              </p>
              <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl bg-zinc-100 dark:divide-zinc-800 dark:bg-zinc-900">
                {comboTiers(dailyCombo).map(({ puzzle, mult }) => (
                  <div
                    key={puzzle}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Puzzle {puzzle}
                      {mult >= dailyCombo.max ? '+' : ''} of the day
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-amber-500">
                      {mult.toFixed(1)}×
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoringLegend;
