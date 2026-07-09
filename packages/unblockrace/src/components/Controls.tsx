'use client';

import { Redo2, RotateCcw, Undo2 } from 'lucide-react';

interface ControlsProps {
  undo: () => void;
  redo: () => void;
  reset: () => void;
  isUndoDisabled: boolean;
  isRedoDisabled: boolean;
  isDisabled?: boolean;
}

const controlButtonClass =
  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-200/80 bg-white/70 px-3 py-3 text-stone-600 shadow-sm backdrop-blur transition-all duration-200 hover:bg-white hover:text-stone-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white/70 disabled:hover:text-stone-600 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:disabled:hover:bg-zinc-900/60 dark:disabled:hover:text-zinc-300';

// Undo/redo/reset toolbar, sitting directly above the board (mirrors
// SudokuControls' role). The live move count and difficulty that used to
// share this bar now live on the race-track legend and the chain stats.
const Controls = ({
  undo,
  redo,
  reset,
  isUndoDisabled,
  isRedoDisabled,
  isDisabled,
}: ControlsProps) => {
  return (
    <div
      data-testid="controls-toolbar"
      className="ml-auto mr-auto flex w-full max-w-xl items-stretch gap-2 px-4 py-3 lg:mr-0"
    >
      <button
        type="button"
        aria-label="Undo"
        className={controlButtonClass}
        onClick={undo}
        disabled={isUndoDisabled || isDisabled}
      >
        <Undo2 className="h-5 w-5" />
        <span className="text-xs font-semibold">Undo</span>
      </button>
      <button
        type="button"
        aria-label="Redo"
        className={controlButtonClass}
        onClick={redo}
        disabled={isRedoDisabled || isDisabled}
      >
        <Redo2 className="h-5 w-5" />
        <span className="text-xs font-semibold">Redo</span>
      </button>
      <button
        type="button"
        aria-label="Reset"
        className={controlButtonClass}
        onClick={reset}
        disabled={isDisabled}
      >
        <RotateCcw className="h-5 w-5" />
        <span className="text-xs font-semibold">Reset</span>
      </button>
    </div>
  );
};

export default Controls;
