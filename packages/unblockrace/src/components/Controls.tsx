'use client';

import { Redo2, RotateCcw, Undo2 } from 'lucide-react';

interface ControlsProps {
  movesMade: number;
  movesRequired: number;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  isUndoDisabled: boolean;
  isRedoDisabled: boolean;
  isDisabled?: boolean;
}

const controlButtonClass =
  'flex cursor-pointer items-center justify-center rounded-xl border border-stone-200 bg-white p-3 text-stone-700 transition-all duration-200 hover:bg-stone-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700';

// Undo/reset/moves-counter bar, mirrors SudokuControls' role. The move
// counter shows both numbers separately (SPEC.md §6) — moves are not
// blended into the distance-based progress bar — with a warning affordance
// when over the known-optimal count rather than clamping or hiding it.
const Controls = ({
  movesMade,
  movesRequired,
  undo,
  redo,
  reset,
  isUndoDisabled,
  isRedoDisabled,
  isDisabled,
}: ControlsProps) => {
  const isOverPar = movesRequired > 0 && movesMade > movesRequired;

  return (
    <div className="ml-auto mr-auto flex max-w-xl items-center gap-2 px-4 py-3 lg:mr-0">
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
      <div className="grow text-right">
        <span
          data-testid="move-counter"
          className="text-theme-primary dark:text-theme-primary-light text-lg font-bold"
        >
          {movesMade}
          {movesRequired > 0 && (
            <span className="text-sm font-semibold text-stone-400 dark:text-zinc-500">
              /{movesRequired} moves ⚡
            </span>
          )}
          {isOverPar && (
            <span aria-label="Over optimal moves" title="Over optimal moves">
              {' '}
              ⚠️
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default Controls;
