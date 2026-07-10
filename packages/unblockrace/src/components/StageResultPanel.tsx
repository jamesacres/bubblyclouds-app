'use client';

import { Car, Check, Flag, Target, Trophy } from 'lucide-react';
import { formatSeconds } from '@bubblyclouds-app/ui/helpers/formatSeconds';
import { RunStage, StageResult } from '../helpers/stageResults';
import { difficultyForMoves } from '../helpers/difficulty';
import { unblockDifficultyDisplay } from '../helpers/difficultyDisplay';
import { formatSecondsShort } from '../helpers/formatSecondsShort';
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

// Inline run panel (SPEC.md §7), replacing the old modal: a stepper of every
// stage in the run — each mini-board thumbnail doubles as the
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
        className="rounded-2xl border border-stone-200/70 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-zinc-900/60"
      >
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-black tracking-tight text-stone-900 dark:text-white">
            {runComplete ? (
              <Trophy
                className="h-4 w-4 text-amber-500 dark:text-amber-400"
                aria-hidden="true"
              />
            ) : (
              <Flag
                className="h-4 w-4 text-stone-400 dark:text-zinc-500"
                aria-hidden="true"
              />
            )}
            {runComplete ? 'Run complete' : 'Race progress'}
            {dailyNumber !== undefined && ` · Daily #${dailyNumber}`}
            {collectionPuzzleLabel && ` · ${collectionPuzzleLabel}`}
          </h2>
          {stageCount > 1 && (
            <span className="text-xs font-semibold text-stone-400 dark:text-zinc-500">
              {results.size}/{stageCount} stages
            </span>
          )}
        </div>

        {/* Run progress bar */}
        {stageCount > 1 && (
          <div className="mb-3 h-1 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800">
            <div
              className="bg-theme-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${(results.size / stageCount) * 100}%` }}
            />
          </div>
        )}

        {/* Horizontal filmstrip: the run reads as a left-to-right route, one
            column per stage — thumbnail on top (the tap target), difficulty
            and result beneath — instead of the old five-row list */}
        <ul className="relative flex items-start gap-1.5 text-sm">
          {/* Road linking the stage thumbnails into one route: an asphalt
              strip with a dashed centre line, so the run itself reads as
              the racecourse */}
          {stageCount > 1 && (
            <div
              aria-hidden="true"
              className="absolute left-6 right-6 top-5 h-2 rounded-full bg-stone-300/80 dark:bg-zinc-800"
            >
              <div
                className="absolute inset-x-1 top-1/2 h-px -translate-y-1/2 text-white opacity-60 dark:opacity-30"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to right, currentColor 0 5px, transparent 5px 11px)',
                }}
              />
            </div>
          )}
          {stages.map((stage, i) => {
            const result = results.get(i);
            const isOverPar =
              !!result && result.movesMade > result.movesRequired;
            const isUnderPar =
              !!result && result.movesMade < result.movesRequired;
            const isCurrent = i === currentStageIndex;
            const difficulty = unblockDifficultyDisplay(
              difficultyForMoves(stage.movesRequired)
            );
            return (
              <li
                key={stage.boardString}
                data-testid={`stage-result-${i}`}
                className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 text-center ${
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
                    className={`relative block h-12 w-12 rounded-lg bg-white dark:bg-zinc-900 ${
                      isCurrent
                        ? 'ring-theme-primary shadow-[0_0_14px_-4px_var(--theme-primary)] ring-2'
                        : result
                          ? 'opacity-60'
                          : 'opacity-80'
                    }`}
                  >
                    {/* muteRivals: at 48px only the hero car should carry
                        colour — the full palette reads as static */}
                    <SimpleBoard
                      initial={stage.boardString}
                      compact
                      muteRivals
                    />
                    {isCurrent ? (
                      // The car marker sits on the current stage: this is
                      // where you are on the route
                      <span
                        aria-hidden="true"
                        className="bg-theme-primary absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-white shadow"
                      >
                        <Car className="h-2.5 w-2.5" />
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-stone-200 text-[0.6rem] font-bold text-stone-600 shadow dark:bg-zinc-700 dark:text-zinc-200"
                      >
                        {i + 1}
                      </span>
                    )}
                    {result && (
                      <span
                        data-testid={`stage-preview-${i}-complete`}
                        className="bg-theme-primary absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-white shadow"
                      >
                        <Check className="h-2.5 w-2.5" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                </button>
                {/* One line per stage: a finished stage shows its time and
                    moves-vs-par; an upcoming one shows what's ahead —
                    difficulty and par — instead of a broken-looking dash */}
                {result ? (
                  <span
                    data-testid={`stage-par-${i}`}
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold tabular-nums ${
                      isOverPar
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : isUnderPar
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-stone-500/10 text-stone-500 dark:text-zinc-400'
                    }`}
                  >
                    {formatSecondsShort(result.seconds)} · {result.movesMade}/
                    {result.movesRequired}
                    <span className="sr-only"> moves</span>
                  </span>
                ) : (
                  <span
                    data-testid={`stage-difficulty-${i}`}
                    className={`max-w-full rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide ${difficulty.chipClass}`}
                  >
                    {difficulty.shortLabel} · par {stage.movesRequired}
                    <span className="sr-only">{` (${difficulty.label})`}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {opponentDeltaSeconds !== undefined && (
          <p
            data-testid="stage-result-opponent"
            className={`mt-3 flex items-center gap-1.5 text-sm font-medium ${
              opponentDeltaSeconds >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            <Target className="h-4 w-4" aria-hidden="true" />
            {opponentDeltaSeconds >= 0
              ? `Beat opponent by ${formatSeconds(opponentDeltaSeconds)}`
              : `${formatSeconds(-opponentDeltaSeconds)} behind opponent`}
          </p>
        )}

        {runComplete && stageCount > 1 && (
          <div
            data-testid="stage-result-total"
            className="mt-3 flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold text-stone-900 dark:text-white"
            style={{
              background:
                'linear-gradient(90deg, color-mix(in srgb, var(--theme-primary) 14%, transparent), color-mix(in srgb, var(--theme-primary) 5%, transparent))',
              boxShadow:
                'inset 0 0 0 1px color-mix(in srgb, var(--theme-primary) 30%, transparent)',
            }}
          >
            <span className="flex items-center gap-1.5">
              <Trophy
                className="h-4 w-4 text-amber-500 dark:text-amber-400"
                aria-hidden="true"
              />
              Total
            </span>
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
