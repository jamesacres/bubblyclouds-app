'use client';

import { StarRating } from '@bubblyclouds-app/ui/components/StarRating';
import { formatSecondsShort } from '../helpers/formatSecondsShort';

interface CompletionSummaryProps {
  // Moves-vs-par grade (0–3), the finished time, and the moves made against
  // par for the just-finished puzzle or whole run.
  stars: number;
  seconds: number;
  movesMade: number;
  movesRequired: number;
  points?: number;
  // "Daily · Aug 8" / "Collection puzzle 4" — what was just finished.
  label?: string;
}

// The result that stays put once the finish celebration has faded. The
// per-stage slam and the RaceCelebration are both transient (they own the
// screen for a beat, then clear); this quiet card keeps the payoff — stars,
// time, moves vs par, points — visible underneath the board so a finished
// puzzle never leaves the player looking at a blank result.
const CompletionSummary = ({
  stars,
  seconds,
  movesMade,
  movesRequired,
  points,
  label,
}: CompletionSummaryProps) => {
  const delta = movesMade - movesRequired;

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
      <StarRating rating={stars} size="lg" />
      <div className="mt-1 flex items-stretch gap-2">
        <div className="flex min-w-20 flex-col items-center gap-0.5 rounded-xl bg-stone-100/80 px-4 py-2 dark:bg-zinc-800/70">
          <span className="text-[0.55rem] font-black uppercase tracking-widest text-stone-400 dark:text-zinc-500">
            Time
          </span>
          <span className="font-mono text-lg font-bold tabular-nums leading-none text-stone-900 dark:text-white">
            {formatSecondsShort(seconds)}
          </span>
        </div>
        <div className="flex min-w-20 flex-col items-center gap-0.5 rounded-xl bg-stone-100/80 px-4 py-2 dark:bg-zinc-800/70">
          <span className="text-[0.55rem] font-black uppercase tracking-widest text-stone-400 dark:text-zinc-500">
            Moves
          </span>
          <span
            className={`font-mono text-lg font-bold tabular-nums leading-none ${
              delta > 0
                ? 'text-amber-600 dark:text-amber-400'
                : delta < 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-stone-900 dark:text-white'
            }`}
          >
            {movesMade}/{movesRequired}
          </span>
        </div>
      </div>
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
