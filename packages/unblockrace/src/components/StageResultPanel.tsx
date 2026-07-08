'use client';

import { formatSeconds } from '@bubblyclouds-app/ui/helpers/formatSeconds';
import { getDifficultyDisplay } from '@bubblyclouds-app/games/helpers/getDifficultyDisplay';
import { RunStage, StageResult } from '../helpers/stageResults';
import { difficultyForMoves } from '../helpers/difficulty';
import SimpleBoard from './SimpleBoard';

interface StageResultPanelProps {
  // Per-stage results keyed by stage index (SPEC.md §6: stats persist per
  // stage even if the run isn't finished). Drives the "all stages in one
  // view" readout the summary popup used to hide.
  results: Map<number, StageResult>;
  // The run's stages, so each row can render its own mini board thumbnail
  // that doubles as the click-to-navigate link into that stage.
  stages: RunStage[];
  currentStageIndex: number;
  // Slide to a stage; direction lets the carousel animate the right way.
  goToStage: (index: number, direction: 'forward' | 'back') => void;
  // Truthy while a slide is mid-flight — disables the thumbnails so a stage
  // change can't be kicked off on top of another.
  isTransitioning: boolean;
  // Positive = beat the fastest friend who finished the current stage,
  // negative = behind them; omitted when no friend has finished it yet.
  opponentDeltaSeconds?: number;
  // True once the final stage is solved — promotes the panel to a run-level
  // summary (SPEC.md §7's run total alongside the per-stage lines).
  runComplete: boolean;
  // Daily #N label, only meaningful for the daily challenge (SPEC.md §7).
  dailyNumber?: number;
  collectionPuzzleLabel?: string;
}

// Inline run panel (SPEC.md §7), replacing the old modal: one always-visible
// view combining each stage's mini-board thumbnail — which doubles as the
// click-to-navigate link into that stage (SPEC.md §1) — with its per-stage
// time/moves, plus the run total once every stage is done. Everything here is
// already produced by useGameState by the time a stage completes.
const StageResultPanel = ({
  results,
  stages,
  currentStageIndex,
  goToStage,
  isTransitioning,
  opponentDeltaSeconds,
  runComplete,
  dailyNumber,
  collectionPuzzleLabel,
}: StageResultPanelProps) => {
  const stageCount = stages.length;

  // The panel now carries the stage previews too, so it stays visible for the
  // whole run — the thumbnails show what's coming up before any stage is done.
  if (stageCount === 0) {
    return null;
  }

  const totalSeconds = [...results.values()].reduce(
    (sum, r) => sum + r.seconds,
    0
  );
  const totalMoves = [...results.values()].reduce(
    (sum, r) => sum + r.movesMade,
    0
  );

  return (
    <div className="ml-auto mr-auto max-w-xl px-4 pb-3 lg:mr-0">
      <div
        data-testid="stage-result-panel"
        className="rounded-2xl border border-stone-200 bg-white/70 p-4 dark:border-zinc-700 dark:bg-zinc-900/70"
      >
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-black tracking-tight text-stone-900 dark:text-white">
            {runComplete ? '🏆 Run complete' : '🚗 Race progress'}
            {dailyNumber !== undefined && ` · Daily #${dailyNumber}`}
            {collectionPuzzleLabel && ` · ${collectionPuzzleLabel}`}
          </h2>
          {stageCount > 1 && (
            <span className="text-xs font-semibold text-stone-400 dark:text-zinc-500">
              {results.size}/{stageCount} stages
            </span>
          )}
        </div>

        <ul className="space-y-2 text-sm">
          {stages.map((stage, i) => {
            const result = results.get(i);
            const isOverPar =
              !!result && result.movesMade > result.movesRequired;
            const isUnderPar =
              !!result && result.movesMade < result.movesRequired;
            const isCurrent = i === currentStageIndex;
            const difficulty = getDifficultyDisplay(
              difficultyForMoves(stage.movesRequired)
            ).name;
            return (
              <li
                key={stage.boardString}
                data-testid={`stage-result-${i}`}
                className={`flex items-center gap-3 ${
                  isCurrent
                    ? 'font-semibold text-stone-900 dark:text-white'
                    : 'text-stone-600 dark:text-zinc-300'
                }`}
              >
                <button
                  type="button"
                  data-testid={`stage-preview-${i}`}
                  onClick={() =>
                    goToStage(i, i > currentStageIndex ? 'forward' : 'back')
                  }
                  disabled={isTransitioning}
                  aria-current={isCurrent}
                  aria-label={`Stage ${i + 1}${
                    result
                      ? `, completed in ${formatSeconds(result.seconds)}, ${result.movesMade} moves`
                      : ''
                  }`}
                  className="shrink-0"
                >
                  <span
                    className={`relative block h-12 w-12 ${
                      isCurrent
                        ? 'ring-theme-primary rounded-lg ring-2'
                        : result
                          ? 'opacity-50'
                          : 'opacity-70'
                    }`}
                  >
                    <SimpleBoard initial={stage.boardString} compact />
                    {result && (
                      <span
                        data-testid={`stage-preview-${i}-complete`}
                        className="bg-theme-primary absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[0.625rem] text-white shadow"
                      >
                        ✓
                      </span>
                    )}
                  </span>
                </button>
                <span className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2">
                    <span>Stage {i + 1}</span>
                    <span
                      data-testid={`stage-difficulty-${i}`}
                      className="text-xs font-semibold text-stone-400 dark:text-zinc-500"
                    >
                      {difficulty}
                    </span>
                  </span>
                  {result ? (
                    <span className="flex items-center gap-2 tabular-nums">
                      <span className="font-mono">
                        {formatSeconds(result.seconds)}
                      </span>
                      <span
                        className={
                          isOverPar
                            ? 'text-amber-500'
                            : isUnderPar
                              ? 'text-emerald-500'
                              : 'text-stone-400 dark:text-zinc-500'
                        }
                      >
                        {isUnderPar ? '🌟' : isOverPar ? '⚠️' : '⚡'}{' '}
                        {result.movesMade}/{result.movesRequired}
                      </span>
                    </span>
                  ) : (
                    <span className="text-stone-300 dark:text-zinc-600">—</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        {opponentDeltaSeconds !== undefined && (
          <p
            data-testid="stage-result-opponent"
            className="mt-2 text-sm text-stone-600 dark:text-zinc-300"
          >
            🎯{' '}
            {opponentDeltaSeconds >= 0
              ? `Beat opponent by ${formatSeconds(opponentDeltaSeconds)}`
              : `${formatSeconds(-opponentDeltaSeconds)} behind opponent`}
          </p>
        )}

        {runComplete && stageCount > 1 && (
          <div
            data-testid="stage-result-total"
            className="mt-3 flex items-center justify-between border-t border-stone-200 pt-2 text-sm font-bold text-stone-900 dark:border-zinc-700 dark:text-white"
          >
            <span>Total</span>
            <span className="tabular-nums">
              <span className="font-mono">{formatSeconds(totalSeconds)}</span>
              {' · '}
              {totalMoves} moves
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StageResultPanel;
