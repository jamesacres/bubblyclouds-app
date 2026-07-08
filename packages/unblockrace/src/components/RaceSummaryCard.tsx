'use client';

import { formatSeconds } from '@bubblyclouds-app/ui/helpers/formatSeconds';

interface RaceSummaryCardProps {
  // Only meaningful for the daily challenge (SPEC.md §7)
  dailyNumber?: number;
  // Collection puzzle label for collection completions
  collectionPuzzleLabel?: string;
  seconds: number;
  movesMade: number;
  movesRequired: number;
  // Positive = beat the fastest completed friend by this many seconds,
  // negative = behind them. Omitted when no friend has completed the stage.
  opponentDeltaSeconds?: number;
  stageIndex: number;
  stageCount: number;
  // Present only when the whole run just finished
  runTotals?: { seconds: number; moves: number };
  onNextStage?: () => void;
  onClose?: () => void;
}

// Pure presentational end-of-stage summary (SPEC.md §7) — everything shown
// here is already produced by useGameState/RaceTrack by the time a stage
// completes.
const RaceSummaryCard = ({
  dailyNumber,
  collectionPuzzleLabel,
  seconds,
  movesMade,
  movesRequired,
  opponentDeltaSeconds,
  stageIndex,
  stageCount,
  runTotals,
  onNextStage,
  onClose,
}: RaceSummaryCardProps) => {
  const isOverPar = movesRequired > 0 && movesMade > movesRequired;
  const isUnderPar = movesRequired > 0 && movesMade < movesRequired;
  const isFinalStage = stageIndex === stageCount - 1;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-6 text-stone-900 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-stone-400 dark:text-zinc-500">
          {stageCount > 1
            ? `Stage ${stageIndex + 1} of ${stageCount}`
            : 'Puzzle complete'}
        </p>
        <h2 className="mb-4 text-2xl font-black tracking-tight">
          🚗 Unblock Race
          {dailyNumber !== undefined && ` - Daily #${dailyNumber}`}
          {collectionPuzzleLabel && ` - ${collectionPuzzleLabel}`}
        </h2>
        <ul className="space-y-2 text-base">
          <li data-testid="summary-time">
            🏁 Escaped in {formatSeconds(seconds)}
          </li>
          {opponentDeltaSeconds !== undefined && (
            <li data-testid="summary-opponent">
              🎯{' '}
              {opponentDeltaSeconds >= 0
                ? `Beat opponent by ${formatSeconds(opponentDeltaSeconds)}`
                : `${formatSeconds(-opponentDeltaSeconds)} behind opponent`}
            </li>
          )}
          <li data-testid="summary-moves">
            {isUnderPar ? '🌟' : isOverPar ? '⚠️' : '⚡'} {movesMade} moves
            {movesRequired > 0 && ` (optimal: ${movesRequired})`}
          </li>
          {runTotals && (
            <li data-testid="summary-run-totals">
              🏆 Run complete: {formatSeconds(runTotals.seconds)},{' '}
              {runTotals.moves} moves total
            </li>
          )}
        </ul>
        <div className="mt-6 flex gap-2">
          {!isFinalStage && onNextStage && (
            <button
              type="button"
              onClick={onNextStage}
              className="bg-theme-primary hover:bg-theme-primary-dark grow cursor-pointer rounded-xl px-4 py-3 text-sm font-bold text-white transition-all duration-200 active:scale-95"
            >
              Next puzzle →
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="grow cursor-pointer rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700 transition-all duration-200 hover:bg-stone-50 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {isFinalStage ? 'Done' : 'Stay here'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RaceSummaryCard;
