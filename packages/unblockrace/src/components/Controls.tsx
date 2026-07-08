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
  'flex cursor-pointer items-center justify-center rounded-xl border border-stone-200 bg-white p-3 text-stone-700 transition-all duration-200 hover:bg-stone-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700';

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
      className="ml-auto mr-auto flex max-w-xl items-center gap-2 px-4 py-3 lg:mr-0"
    >
      <button
        type="button"
        aria-label="Undo"
        className={controlButtonClass}
        onClick={undo}
        disabled={isUndoDisabled || isDisabled}
      >
        <Undo2 className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Redo"
        className={controlButtonClass}
        onClick={redo}
        disabled={isRedoDisabled || isDisabled}
      >
        <Redo2 className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Reset"
        className={controlButtonClass}
        onClick={reset}
        disabled={isDisabled}
      >
        <RotateCcw className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Controls;
