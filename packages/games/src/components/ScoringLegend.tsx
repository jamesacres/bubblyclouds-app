'use client';
import React from 'react';
import { X, Zap, BookOpen, Trophy, Timer, ScanLine, Flame } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { Translate } from '../types/i18n';
import { Difficulty, BookPuzzleDifficulty } from '../types/difficulty';
import { DailyComboConfig, SpeedThresholds } from '../types/scoringTypes';
import { SCORING_CONFIG } from '../helpers/scoringConfig';
import { formatLatinNumber } from '@bubblyclouds-app/ui/helpers/latinNumber';

// One difficulty tier for the legend's multiplier tables (daily and
// collection): `key` is the metadata.difficulty string scoring keys off,
// `label` is what's shown for it, `multiplier` is its own display value
// (not looked up from SCORING_CONFIG — a game's tiers may live outside that
// shared map entirely, see ScoringOptions.difficultyMultipliers).
export interface CollectionDifficultyTier {
  key: string;
  label: string;
  multiplier: number;
}

const defaultCollectionDifficulties = (
  t: Translate
): CollectionDifficultyTier[] => {
  const labels: Record<BookPuzzleDifficulty, string> = {
    [BookPuzzleDifficulty.VERY_EASY]: t('difficulty.book.veryEasy'),
    [BookPuzzleDifficulty.EASY]: t('difficulty.book.easy'),
    [BookPuzzleDifficulty.MODERATELY_EASY]: t('difficulty.book.moderatelyEasy'),
    [BookPuzzleDifficulty.MODERATE]: t('difficulty.book.moderate'),
    [BookPuzzleDifficulty.MODERATELY_HARD]: t('difficulty.book.moderatelyHard'),
    [BookPuzzleDifficulty.HARD]: t('difficulty.book.hard'),
    [BookPuzzleDifficulty.VICIOUS]: t('difficulty.book.vicious'),
    [BookPuzzleDifficulty.FIENDISH]: t('difficulty.book.fiendish'),
    [BookPuzzleDifficulty.DEVILISH]: t('difficulty.book.devilish'),
    [BookPuzzleDifficulty.HELL]: t('difficulty.book.hell'),
    [BookPuzzleDifficulty.BEYOND_HELL]: t('difficulty.book.beyondHell'),
  };
  return Object.values(BookPuzzleDifficulty).map((key) => ({
    key,
    label: labels[key],
    multiplier: SCORING_CONFIG.DIFFICULTY_MULTIPLIERS[key],
  }));
};

const defaultDailyDifficulties = (t: Translate): CollectionDifficultyTier[] =>
  [
    { key: Difficulty.SIMPLE, label: t('difficulty.daily.simple') },
    { key: Difficulty.EASY, label: t('difficulty.daily.easy') },
    { key: Difficulty.INTERMEDIATE, label: t('difficulty.daily.intermediate') },
  ].map(({ key, label }) => ({
    key,
    label,
    multiplier: SCORING_CONFIG.DIFFICULTY_MULTIPLIERS[key],
  }));

interface ScoringLegendProps {
  isOpen: boolean;
  onClose: () => void;
  gameName: string;
  dailyCombo?: DailyComboConfig;
  // The difficulty tiers for this game's daily puzzles — defaults to
  // sudoku's Tricky/Challenging/Hard.
  dailyDifficulties?: CollectionDifficultyTier[];
  // What this game calls its collection-type puzzles and the difficulty
  // tiers that apply to them — defaults to sudoku's monthly puzzle book.
  collectionLabel?: string;
  collectionDifficulties?: CollectionDifficultyTier[];
  // Scanning a physical puzzle is sudoku-only (Unblock Race sessions never
  // set scannedAt, so its players can never earn this base score) — default
  // true keeps sudoku's legend unchanged.
  showScannedPuzzles?: boolean;
  // Overrides SCORING_CONFIG.SPEED_THRESHOLDS for the speed bonuses section —
  // defaults to sudoku's 3/5/10/20 min cutoffs.
  speedThresholds?: SpeedThresholds;
}

const speedTierLabels = (t: Translate) =>
  [
    { key: 'LIGHTNING', label: t('scoringLegend.speedBonuses.lightning') },
    { key: 'FAST', label: t('scoringLegend.speedBonuses.fast') },
    { key: 'QUICK', label: t('scoringLegend.speedBonuses.quick') },
    { key: 'STEADY', label: t('scoringLegend.speedBonuses.steady') },
  ] as const;

const formatThreshold = (seconds: number, t: Translate): string =>
  seconds < 60
    ? t('scoringLegend.speedBonuses.seconds', { value: seconds })
    : t('scoringLegend.speedBonuses.minutes', {
        value: parseFloat((seconds / 60).toFixed(1)),
      });

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
  dailyDifficulties,
  collectionLabel: collectionLabelProp,
  collectionDifficulties,
  showScannedPuzzles = true,
  speedThresholds = SCORING_CONFIG.SPEED_THRESHOLDS,
}) => {
  const { t, i18n } = useTranslation('games');

  if (!isOpen) return null;

  const collectionLabel = collectionLabelProp ?? t('collection.defaultLabel');

  const sortedDailyDifficulties = [
    ...(dailyDifficulties ?? defaultDailyDifficulties(t)),
  ].sort((a, b) => a.multiplier - b.multiplier);

  const sortedCollectionDifficulties = [
    ...(collectionDifficulties ?? defaultCollectionDifficulties(t)),
  ].sort((a, b) => a.multiplier - b.multiplier);

  const maxCollectionMult = Math.max(
    ...sortedCollectionDifficulties.map((d) => d.multiplier)
  );

  // Unblock Race scores daily and collection puzzles off the identical
  // tier list — showing "of the Day" and "puzzles" as two duplicate blocks
  // is just noise, so collapse them into one shared section when the tiers
  // match. Sudoku's tiers differ (Tricky/Challenging/Hard vs its book's
  // eleven-tier scale), so it keeps the two separate sections.
  const dailyAndCollectionMatch =
    sortedDailyDifficulties.length === sortedCollectionDifficulties.length &&
    sortedDailyDifficulties.every(
      (tier, index) =>
        tier.key === sortedCollectionDifficulties[index].key &&
        tier.multiplier === sortedCollectionDifficulties[index].multiplier
    );

  const maxDailyMult = Math.max(
    ...sortedDailyDifficulties.map((d) => d.multiplier)
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
              {t('scoringLegend.title')}
            </h3>
            <p className="text-xs text-zinc-500">
              {t('scoringLegend.subtitle', { gameName })}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('scoringLegend.close')}
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
                {t('scoringLegend.racingWins.title')}
              </h4>
            </div>
            <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                <Trans
                  t={t}
                  i18nKey="scoringLegend.racingWins.body"
                  values={{
                    points: SCORING_CONFIG.RACING_BONUS_PER_PERSON,
                    friends: 5,
                    total: SCORING_CONFIG.RACING_BONUS_PER_PERSON * 5,
                  }}
                  components={{
                    points: (
                      <span className="font-semibold tabular-nums text-amber-500" />
                    ),
                  }}
                />
              </p>
            </div>
          </section>

          {/* Base points */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                {t('scoringLegend.basePoints.title')}
              </h4>
            </div>
            <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl bg-zinc-100 dark:divide-zinc-800 dark:bg-zinc-900">
              {[
                {
                  icon: Zap,
                  label: t('scoringLegend.basePoints.anyPuzzle'),
                  value: SCORING_CONFIG.VOLUME_MULTIPLIER,
                },
                {
                  icon: Zap,
                  label: t('scoringLegend.basePoints.dailyPuzzle'),
                  value: SCORING_CONFIG.DAILY_PUZZLE_BASE,
                },
                {
                  icon: BookOpen,
                  label: t('scoringLegend.basePoints.collectionPuzzle', {
                    collection: collectionLabel,
                  }),
                  value: SCORING_CONFIG.COLLECTION_PUZZLE_BASE,
                },
                ...(showScannedPuzzles
                  ? [
                      {
                        icon: ScanLine,
                        label: t('scoringLegend.basePoints.scannedPuzzle'),
                        value: SCORING_CONFIG.SCANNED_PUZZLE_BASE,
                      },
                    ]
                  : []),
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
                {t('scoringLegend.difficultyMultipliers.title')}
              </h4>
            </div>

            {dailyAndCollectionMatch ? (
              <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl bg-zinc-100 dark:divide-zinc-800 dark:bg-zinc-900">
                {sortedCollectionDifficulties.map(
                  ({ key, label, multiplier }) => {
                    const barPct = multiplierBar(multiplier, maxCollectionMult);
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <span className="w-36 shrink-0 break-words text-xs text-zinc-500 dark:text-zinc-400">
                          {label}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                        <span className="min-w-8 shrink-0 text-end text-xs font-semibold tabular-nums text-zinc-900 dark:text-white">
                          {formatLatinNumber(multiplier, i18n.language)}×
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <>
                {/* Daily */}
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {t('scoringLegend.difficultyMultipliers.daily', { gameName })}
                </p>
                <div className="mb-4 divide-y divide-zinc-200 overflow-hidden rounded-2xl bg-zinc-100 dark:divide-zinc-800 dark:bg-zinc-900">
                  {sortedDailyDifficulties.map(({ key, label, multiplier }) => {
                    const barPct = multiplierBar(multiplier, maxDailyMult);
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <span className="w-36 shrink-0 break-words text-xs text-zinc-500 dark:text-zinc-400">
                          {label}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                        <span className="min-w-8 shrink-0 text-end text-xs font-semibold tabular-nums text-zinc-900 dark:text-white">
                          {formatLatinNumber(multiplier, i18n.language)}×
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Collection */}
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {t('scoringLegend.difficultyMultipliers.collection', {
                    collection: collectionLabel,
                  })}
                </p>
                <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl bg-zinc-100 dark:divide-zinc-800 dark:bg-zinc-900">
                  {sortedCollectionDifficulties.map(
                    ({ key, label, multiplier }) => {
                      const barPct = multiplierBar(
                        multiplier,
                        maxCollectionMult
                      );

                      return (
                        <div
                          key={key}
                          className="flex items-center gap-3 px-4 py-2.5"
                        >
                          <span className="w-36 shrink-0 break-words text-xs text-zinc-500 dark:text-zinc-400">
                            {label}
                          </span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-amber-500"
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                          <span className="min-w-8 shrink-0 text-end text-xs font-semibold tabular-nums text-zinc-900 dark:text-white">
                            {formatLatinNumber(multiplier, i18n.language)}×
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </>
            )}
          </section>

          {/* Speed bonuses */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Timer className="h-4 w-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                {t('scoringLegend.speedBonuses.title')}
              </h4>
            </div>
            <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl bg-zinc-100 dark:divide-zinc-800 dark:bg-zinc-900">
              {speedTierLabels(t).map(({ key, label }) => {
                const bonus = SCORING_CONFIG.SPEED_BONUSES[key];
                const threshold = formatThreshold(speedThresholds[key], t);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {label}
                      </span>
                      <span className="ms-2 text-xs text-zinc-400 dark:text-zinc-500">
                        {t('scoringLegend.speedBonuses.under', { threshold })}
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
                  {t('scoringLegend.dailyCombo.title')}
                </h4>
              </div>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
                <Trans
                  t={t}
                  i18nKey="scoringLegend.dailyCombo.body"
                  values={{ max: dailyCombo.max }}
                  components={{
                    max: (
                      <span className="font-semibold tabular-nums text-amber-500" />
                    ),
                  }}
                />
              </p>
              <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl bg-zinc-100 dark:divide-zinc-800 dark:bg-zinc-900">
                {comboTiers(dailyCombo).map(({ puzzle, mult }) => (
                  <div
                    key={puzzle}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {mult >= dailyCombo.max
                        ? t('scoringLegend.dailyCombo.puzzleOrMore', { puzzle })
                        : t('scoringLegend.dailyCombo.puzzle', { puzzle })}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-amber-500">
                      {formatLatinNumber(mult, i18n.language, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                      ×
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
