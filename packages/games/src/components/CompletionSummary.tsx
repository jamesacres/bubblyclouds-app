'use client';

import { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { StarRating } from '@bubblyclouds-app/ui/components/StarRating';

interface CompletionSummaryProps {
  // Moves-vs-par grade (0–3) for the just-finished puzzle or whole run.
  stars: number;
  // The caller's own stat cells (e.g. Time, Moves) — scoring is game-
  // specific, so this component only owns the card chrome around them.
  statCells: ReactNode;
  points?: number;
  // "Daily · Aug 8" / "Collection puzzle 4" — what was just finished.
  label?: string;
  // Single-stage runs have no stage-result panel to host the retry option,
  // so this is the only place a finished single-stage puzzle can be
  // retried — a game's own Reset control is typically disabled once
  // completed.
  onRetry?: () => void;
}

// The result that stays put once the finish celebration has faded. The
// per-stage slam and a game's own celebration overlay are both transient
// (they own the screen for a beat, then clear); this quiet card keeps the
// payoff — stars, stat cells, points — visible underneath the board so a
// finished puzzle never leaves the player looking at a blank result.
const CompletionSummary = ({
  stars,
  statCells,
  points,
  label,
  onRetry,
}: CompletionSummaryProps) => {
  return (
    <div
      data-testid="completion-summary"
      className="mb-2 mt-2 flex flex-col items-center gap-2 rounded-2xl border border-stone-200/70 bg-white/60 px-4 py-4 text-center backdrop-blur dark:border-white/10 dark:bg-zinc-900/50"
    >
      {label && (
        <span className="text-[0.65rem] font-black uppercase tracking-widest text-stone-400 dark:text-zinc-500">
          {label} · complete
        </span>
      )}
      {onRetry && (
        <button
          type="button"
          data-testid="retry-stage-button"
          onClick={onRetry}
          className="flex cursor-pointer items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-semibold text-stone-500 transition-all duration-200 hover:bg-stone-500/10 hover:text-stone-800 active:scale-95 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Retry
        </button>
      )}
      <StarRating rating={stars} size="lg" />
      <div className="mt-1 flex items-stretch gap-2">{statCells}</div>
      {points !== undefined && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-mono text-xl font-black tabular-nums text-amber-600 dark:text-amber-400">
            +{points} pts
          </span>
          <span className="text-[0.55rem] font-black uppercase tracking-widest text-stone-400 dark:text-zinc-500">
            Leaderboard points
          </span>
        </div>
      )}
    </div>
  );
};

export default CompletionSummary;
