'use client';

import { memo } from 'react';
import { ChevronLeft } from 'lucide-react';

interface StageTopBarProps {
  showPrevious: boolean;
  isDisabled: boolean;
  onPrevious: () => void;
}

// Compact nav row above the HUD: jumping back a stage (multi-stage runs).
// Memoized so it doesn't re-render on the parent's 1s timer tick — none of
// its props are timer-driven.
const StageTopBar = memo(function StageTopBar({
  showPrevious,
  isDisabled,
  onPrevious,
}: StageTopBarProps) {
  if (!showPrevious) {
    return null;
  }

  return (
    <div data-testid="stage-top-bar" className="mb-1.5 flex items-center">
      <button
        type="button"
        data-testid="previous-stage-button"
        onClick={onPrevious}
        disabled={isDisabled}
        className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-stone-500 transition-all duration-200 hover:bg-stone-500/10 hover:text-stone-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Previous
      </button>
    </div>
  );
});

export default StageTopBar;
