'use client';

import { Redo2, RotateCcw, Undo2 } from 'lucide-react';

interface ControlsProps {
  undo: () => void;
  redo: () => void;
  reset: () => void;
  isUndoDisabled: boolean;
  isRedoDisabled: boolean;
  isDisabled?: boolean;
  // Live move count against the stage's par; the gauge is omitted when the
  // caller doesn't track moves (e.g. standalone renders in tests).
  movesMade?: number;
  movesRequired?: number;
}

const controlButtonClass =
  'flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-stone-200/80 bg-white/70 text-stone-600 shadow-sm backdrop-blur transition-all duration-200 hover:bg-white hover:text-stone-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white/70 disabled:hover:text-stone-600 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:disabled:hover:bg-zinc-900/60 dark:disabled:hover:text-zinc-300';

// Bottom row of the HUD card (RaceHud is the top row): a fuel-gauge-style
// moves-vs-par bar on the left — it fills toward par and flips amber once
// over — with the undo/redo/reset toolbar on the right. The par count
// drives the race percentage, so it lives next to the action instead of
// buried in the race-track legend.
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
  const parFraction = showMoves
    ? Math.min(movesMade / Math.max(movesRequired, 1), 1)
    : 0;

  return (
    <div
      data-testid="controls-toolbar"
      className="flex w-full items-center justify-between gap-3 px-3 pb-2 pt-1"
    >
      {showMoves ? (
        <span
          data-testid="moves-par"
          className={`flex min-w-0 flex-1 flex-col gap-1 ${
            isOverPar
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-stone-700 dark:text-zinc-200'
          }`}
        >
          <span className="flex items-baseline gap-1.5">
            <span className="text-[0.6rem] font-black uppercase tracking-widest opacity-60">
              Moves
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums">
              {movesMade}/{movesRequired}
            </span>
          </span>
          <span className="h-1 max-w-40 overflow-hidden rounded-full bg-stone-200 dark:bg-white/10">
            <span
              className={`block h-full rounded-full transition-all duration-300 ${
                isOverPar ? 'bg-amber-500' : 'bg-theme-primary'
              }`}
              style={{ width: `${parFraction * 100}%` }}
            />
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
