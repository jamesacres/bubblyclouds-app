'use client';

import { ChevronRight, Lock } from 'lucide-react';
import { NextCollectionPuzzle } from '../helpers/nextCollectionPuzzle';
import { unblockDifficultyDisplay } from '../helpers/difficultyDisplay';

interface NextPuzzlePanelProps {
  next: NextCollectionPuzzle;
  progressLabel: string;
  onContinue: () => void;
}

// The continue-to-next-puzzle flow: after a puzzle is finished this panel
// steers the player straight into the next one so the session keeps rolling.
// A big pulsing CTA reuses the stage-clear button's pill language so the two
// "keep going" moments feel like the same button. When the next puzzle sits
// in the locked half of the pack the CTA still navigates — Task 6's deep-link
// gate catches it on arrival — but wears a Lock and "(Plus)" label so the
// wall isn't a surprise.
const NextPuzzlePanel = ({
  next,
  progressLabel,
  onContinue,
}: NextPuzzlePanelProps) => {
  const difficulty = unblockDifficultyDisplay(next.puzzle.difficulty);

  return (
    <div
      data-testid="next-puzzle-panel"
      className="mb-2 mt-2 flex flex-col items-center gap-3 rounded-2xl border border-stone-200/70 bg-white/60 px-4 py-4 text-center backdrop-blur dark:border-white/10 dark:bg-zinc-900/50"
    >
      <style>{`
        @keyframes next-puzzle-pulse {
          0%, 100% { box-shadow: 0 0 22px color-mix(in srgb, var(--theme-primary) 50%, transparent), 0 2px 8px rgba(0,0,0,0.25); }
          50% { box-shadow: 0 0 34px color-mix(in srgb, var(--theme-primary) 75%, transparent), 0 2px 8px rgba(0,0,0,0.25); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-testid="next-puzzle-continue"] { animation: none !important; }
        }
      `}</style>
      <div className="flex items-center gap-2">
        <span
          data-testid="next-puzzle-difficulty"
          className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest ${difficulty.chipClass}`}
        >
          {difficulty.label}
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-stone-400 dark:text-zinc-500">
          {progressLabel}
        </span>
      </div>
      <button
        type="button"
        data-testid="next-puzzle-continue"
        onClick={onContinue}
        className="bg-theme-primary hover:bg-theme-primary-dark flex cursor-pointer items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-black uppercase tracking-widest text-white transition-all duration-200 hover:scale-[1.03] active:scale-95"
        style={{ animation: 'next-puzzle-pulse 2s ease-in-out infinite' }}
      >
        {next.isLocked ? (
          <>
            <Lock className="h-4 w-4" aria-hidden="true" />
            Continue (Plus)
          </>
        ) : (
          <>
            Continue — next puzzle
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>
    </div>
  );
};

export default NextPuzzlePanel;
