'use client';

import { ReactNode, memo } from 'react';
import { Car, Check, Flag, RotateCcw, Target, Trophy } from 'lucide-react';
import { RunStage } from '../types/runTypes';
import { PlayerStageResult } from '../types/scoringTypes';
import { DifficultyDisplay } from '../types/difficultyDisplay';

interface StageResultPanelProps<Stage extends RunStage, Score> {
  // Per-stage results keyed by stage index — stats persist per stage even
  // if the run isn't finished. Drives the "all stages in one view" readout.
  results: Map<number, PlayerStageResult<Score>>;
  // The run's stages, so each row can render its own mini board thumbnail
  // that doubles as the click-to-navigate link into that stage.
  stages: Stage[];
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
  // summary (the run total alongside the per-stage lines).
  runComplete: boolean;
  // "Daily · Aug 8" label, only meaningful for a daily challenge.
  dailyLabel?: string;
  collectionPuzzleLabel?: string;
  // Retry the current stage — only shown once it has a result.
  onRetry: () => void;
  isRetryDisabled: boolean;
  formatSeconds: (seconds: number) => string;
  // The mini board preview for a stage's thumbnail/nav tile.
  renderThumbnail: (stage: Stage, index: number) => ReactNode;
  // A stage's difficulty, used both for its own chip and to decide which
  // adjacent upcoming stages fuse into one pill.
  getDifficultyDisplay: (stage: Stage) => DifficultyDisplay;
  // The score readout for a completed stage's result chip (e.g. "7/5 moves")
  // plus whether it renders in the over/under/met-par colour treatment.
  renderResult: (
    result: PlayerStageResult<Score>,
    stage: Stage
  ) => { content: ReactNode; parState: 'over' | 'under' | 'met' };
  // The caption for a stage with no result yet (e.g. "par 5").
  renderUpcoming: (stage: Stage) => ReactNode;
  // The score-specific part of the run-total row (e.g. "10 moves") — total
  // time is already summed and formatted generically.
  renderTotal: (results: PlayerStageResult<Score>[]) => ReactNode;
}

// Inline run panel, replacing an old modal: a stepper of every stage in the
// run — each mini-board thumbnail doubles as the click-to-navigate link into
// that stage — with its per-stage time/score, plus the run total once every
// stage is done.
// Memoized so the parent's 1s race timer tick doesn't re-render this panel —
// none of its props are timer-driven.
function StageResultPanelInner<Stage extends RunStage, Score>({
  results,
  stages,
  currentStageIndex,
  goToStage,
  isTransitioning,
  opponentDeltaSeconds,
  runComplete,
  dailyLabel,
  collectionPuzzleLabel,
  onRetry,
  isRetryDisabled,
  formatSeconds,
  renderThumbnail,
  getDifficultyDisplay,
  renderResult,
  renderUpcoming,
  renderTotal,
}: StageResultPanelProps<Stage, Score>) {
  const stageCount = stages.length;
  const canRetryCurrentStage = results.has(currentStageIndex);

  // The panel now carries the stage previews too, so it stays visible for the
  // whole run — the thumbnails show what's coming up before any stage is done.
  if (stageCount === 0) {
    return null;
  }

  const resultList = [...results.values()];
  const totalSeconds = resultList.reduce((sum, r) => sum + r.seconds, 0);

  // Adjacent upcoming stages (no result yet) sharing the same difficulty get
  // one merged chip spanning both columns instead of two touching pills of
  // the same colour, which otherwise read as a single overlapping shape.
  // A stage only merges with its immediate predecessor — a run of 3+ same
  // difficulty stages becomes one chip spanning all of them.
  const difficultyLabels = stages.map(
    (stage) => getDifficultyDisplay(stage).label
  );
  const mergesWithPrevious = stages.map(
    (_, i) =>
      i > 0 &&
      !results.has(i) &&
      !results.has(i - 1) &&
      difficultyLabels[i] === difficultyLabels[i - 1]
  );

  return (
    <div className="pb-3">
      <div
        data-testid="stage-result-panel"
        className="rounded-2xl border border-stone-200/70 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-zinc-900/60"
      >
        <div className="mb-1 flex items-baseline justify-between gap-2">
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
            {dailyLabel && ` · ${dailyLabel}`}
            {collectionPuzzleLabel && ` · ${collectionPuzzleLabel}`}
          </h2>
          {stageCount > 1 && (
            <span className="shrink-0 text-xs font-semibold text-stone-400 dark:text-zinc-500">
              {results.size}/{stageCount} stages
            </span>
          )}
        </div>

        {canRetryCurrentStage && (
          <div className="mb-1 flex justify-end">
            <button
              type="button"
              data-testid="retry-stage-button"
              onClick={onRetry}
              disabled={isRetryDisabled}
              className="flex cursor-pointer items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-semibold text-stone-500 transition-all duration-200 hover:bg-stone-500/10 hover:text-stone-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Retry stage
            </button>
          </div>
        )}

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
            and result beneath — instead of a row list */}
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
            const rendered = result ? renderResult(result, stage) : undefined;
            const isCurrent = i === currentStageIndex;
            const difficulty = getDifficultyDisplay(stage);
            // This stage's own pill is folded into the previous stage's
            // fused group (label suppressed); this stage instead starts a
            // fused group if the next stage folds into it, in which case its
            // label needs to centre across every column the group spans.
            const isMergedAway = mergesWithPrevious[i];
            const startsMergedGroup = mergesWithPrevious[i + 1];
            let mergedGroupSize = 1;
            while (mergesWithPrevious[i + mergedGroupSize]) {
              mergedGroupSize++;
            }
            return (
              <li
                key={stage.stageId}
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
                      ? `, completed in ${formatSeconds(result.seconds)}`
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
                    {renderThumbnail(stage, i)}
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
                {/* Two stacked lines per stage — a difficulty pill on top,
                    the result-dependent caption beneath it. Each pill stays
                    in normal flow (its own column's height/position never
                    moves), but adjacent same-difficulty pills fuse into one
                    shape: the label only renders on the first of the group,
                    the touching inner corners square off, and a negative
                    margin on the trailing pill bridges the strip's gap. */}
                <span
                  data-testid={`stage-difficulty-${i}`}
                  className={`relative flex h-[1.15rem] w-full items-center justify-center whitespace-nowrap px-1.5 text-center text-[0.55rem] font-bold uppercase tracking-wide ${difficulty.chipClass} ${
                    isMergedAway ? '-ml-1.5 rounded-l-none' : 'rounded-l-full'
                  } ${startsMergedGroup ? 'rounded-r-none' : 'rounded-r-full'}`}
                  style={
                    isMergedAway
                      ? { width: 'calc(100% + 0.375rem)' }
                      : undefined
                  }
                >
                  {/* The label centres across every column the fused group
                      spans, not just this first pill's own column, via an
                      overlay sized to the group's total width. */}
                  {!isMergedAway && (
                    <span
                      className="absolute left-0 top-0 flex h-full w-full items-center justify-center"
                      style={
                        mergedGroupSize > 1
                          ? {
                              width: `calc(${mergedGroupSize * 100}% + ${
                                (mergedGroupSize - 1) * 0.375
                              }rem)`,
                            }
                          : undefined
                      }
                    >
                      {difficulty.label}
                    </span>
                  )}
                </span>
                {result && rendered ? (
                  <span
                    data-testid={`stage-par-${i}`}
                    className={`whitespace-nowrap rounded-full px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold tabular-nums ${
                      rendered.parState === 'over'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : rendered.parState === 'under'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-stone-500/10 text-stone-500 dark:text-zinc-400'
                    }`}
                  >
                    {rendered.content}
                    <span className="sr-only"> ·</span>{' '}
                    {formatSeconds(result.seconds)}
                  </span>
                ) : (
                  <span className="whitespace-nowrap text-[0.6rem] font-semibold tabular-nums text-stone-400 dark:text-zinc-500">
                    {renderUpcoming(stage)}
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
              {renderTotal(resultList)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// memo() erases the generic type parameter, so this cast-free wrapper keeps
// StageResultPanel<Score> callable with its own Score per call site.
const StageResultPanel = memo(
  StageResultPanelInner
) as typeof StageResultPanelInner;

export default StageResultPanel;
