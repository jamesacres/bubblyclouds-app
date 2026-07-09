'use client';

import { Redo2, RotateCcw, Undo2 } from 'lucide-react';

interface ControlsProps {
  undo: () => void;
  redo: () => void;
  reset: () => void;
  isUndoDisabled: boolean;
  isRedoDisabled: boolean;
  isDisabled?: boolean;
  // Live move count against the stage's par; the chip is omitted when the
  // caller doesn't track moves (e.g. standalone renders in tests).
  movesMade?: number;
  movesRequired?: number;
}

const controlButtonClass =
  'flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-stone-200/80 bg-white/70 text-stone-600 shadow-sm backdrop-blur transition-all duration-200 hover:bg-white hover:text-stone-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white/70 disabled:hover:text-stone-600 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:disabled:hover:bg-zinc-900/60 dark:disabled:hover:text-zinc-300';

// Compact undo/redo/reset icon toolbar with the live moves-vs-par chip on
// the same row, directly above the board — the par count drives the race
// percentage, so it lives next to the action instead of buried in the
// race-track legend.
const Controls = ({
  undo,
  redo,
  reset,
  isUndoDisabled,
  isRedoDisabled,
  isDisabled,
  movesMade,
  movesRequired,
}: ControlsProps) => {
  const showMoves = movesMade !== undefined && movesRequired !== undefined;
  const isOverPar = showMoves && movesMade > movesRequired;

  return (
    <div
      data-testid="controls-toolbar"
      className="ml-auto mr-auto flex w-full max-w-xl items-center justify-between gap-2 px-4 py-2 lg:mr-0"
    >
      {showMoves ? (
        <span
          data-testid="moves-par"
          className={`flex items-baseline gap-1.5 rounded-full border border-stone-200/70 bg-white/60 px-2.5 py-1 backdrop-blur dark:border-white/10 dark:bg-zinc-900/60 ${
            isOverPar
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-stone-700 dark:text-zinc-200'
          }`}
        >
          <span className="text-[0.6rem] font-black uppercase tracking-widest opacity-60">
            Moves
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums">
            {movesMade}/{movesRequired}
          </span>
        </span>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">
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
    </div>
  );
};

export default Controls;
