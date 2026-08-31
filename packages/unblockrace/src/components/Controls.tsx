'use client';

import { memo } from 'react';
import { Lightbulb, Redo2, RotateCcw, Undo2 } from 'lucide-react';

interface ControlsProps {
  undo: () => void;
  redo: () => void;
  reset: () => void;
  isUndoDisabled: boolean;
  isRedoDisabled: boolean;
  isDisabled?: boolean;
  // "Ask for help": reveals the solver's next best move. The button only
  // renders when the caller wires a handler (solver-less renders omit it).
  onHint?: () => void;
  isHintDisabled?: boolean;
  // Live move count against the stage's par; the gauge is omitted when the
  // caller doesn't track moves (e.g. standalone renders in tests).
  movesMade?: number;
  movesRequired?: number;
}

const controlButtonBaseClass =
  'flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-stone-200/80 bg-white/70 text-stone-600 shadow-sm backdrop-blur transition-all duration-200 hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white/70 disabled:hover:text-stone-600 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:disabled:hover:bg-zinc-900/60 dark:disabled:hover:text-zinc-300';

const controlButtonClass = `${controlButtonBaseClass} hover:text-stone-900 dark:hover:text-white`;

// Reset throws the whole stage away, so its hover reads destructive — the
// undo/redo pair next to it stay neutral.
const resetButtonClass = `${controlButtonBaseClass} hover:text-rose-600 dark:hover:text-rose-400`;

// Bottom row of the HUD card (RaceHud is the top row): the clock and the
// fuel-gauge-style moves-vs-par bar side by side on the left — the gauge
// fills toward par and flips amber once over — with the undo/redo toolbar
// and, past a divider, the destructive reset on the right. The par count
// drives the race percentage, so it lives next to the action instead of
// buried in the race-track legend. RaceTimer renders as this component's
// sibling (see UnblockRace.tsx) rather than a prop, so the 1s tick that
// re-renders the clock never re-runs this component's body — the "contents"
// wrapper below keeps its two children flex items of that outer row instead
// of introducing a nested flex layer.
// Memoized so re-renders in the parent that don't touch these props (e.g.
// unrelated dialog state, or the timer tick) skip it entirely.
const Controls = memo(function Controls({
  undo,
  redo,
  reset,
  isUndoDisabled,
  isRedoDisabled,
  isDisabled,
  onHint,
  isHintDisabled,
  movesMade,
  movesRequired,
}: ControlsProps) {
  const showMoves = movesMade !== undefined && movesRequired !== undefined;
  const isOverPar = showMoves && movesMade > movesRequired;
  const parFraction = showMoves
    ? Math.min(movesMade / Math.max(movesRequired, 1), 1)
    : 0;

  return (
    <div data-testid="controls-toolbar" className="contents">
      <style>{`
        @keyframes unblock-move-pop {
          0% { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        @keyframes unblock-over-par-flash {
          0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.7); }
          100% { box-shadow: 0 0 0 7px rgba(245,158,11,0); }
        }
        @keyframes unblock-hint-rainbow-spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-testid="moves-par"] * { animation: none !important; }
          [data-testid="hint-rainbow-ring"] { animation: none !important; }
        }
      `}</style>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {showMoves ? (
          <span
            data-testid="moves-par"
            className={`flex min-w-0 flex-col gap-1 ${
              isOverPar
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-stone-700 dark:text-zinc-200'
            }`}
          >
            <span className="text-[0.6rem] font-black uppercase tracking-widest opacity-60">
              Moves
            </span>
            <span className="flex items-center gap-1.5">
              <span
                key={movesMade}
                className="inline-block origin-left font-mono text-sm font-semibold tabular-nums leading-none"
                style={{ animation: 'unblock-move-pop 260ms ease-out' }}
              >
                {movesMade}/{movesRequired}
              </span>
              <span
                // Keyed on the par state so crossing par fires one amber
                // ring pulse out of the gauge — the moment costs a move, it
                // shouldn't pass as a silent recolour
                key={isOverPar ? 'over-par' : 'under-par'}
                className="h-1 w-16 overflow-hidden rounded-full bg-stone-200 sm:w-24 dark:bg-white/10"
                style={
                  isOverPar
                    ? { animation: 'unblock-over-par-flash 700ms ease-out' }
                    : undefined
                }
              >
                <span
                  className={`block h-full rounded-full transition-all duration-300 ${
                    isOverPar ? 'bg-amber-500' : 'bg-theme-primary'
                  }`}
                  style={{ width: `${parFraction * 100}%` }}
                />
              </span>
            </span>
          </span>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {onHint ? (
          <span className="flex items-center gap-1.5">
            {/* Always-on animated rainbow ring: a spinning conic-gradient in
                a wrapper whose padding forms the border width; the inner
                button sits on top and masks the centre. Reduced motion stops
                the spin (the gradient stays as a static ring). The button
                never disables on running out of hints — it opens the Plus
                purchase instead, so help is always one tap away. */}
            <span
              data-testid="hint-rainbow-wrapper"
              className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl p-[2px]"
            >
              <span
                data-testid="hint-rainbow-ring"
                aria-hidden="true"
                className="pointer-events-none absolute -inset-1"
                style={{
                  background:
                    'conic-gradient(from 0deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa, #f472b6, #f87171)',
                  animation: 'unblock-hint-rainbow-spin 3s linear infinite',
                }}
              />
              <button
                type="button"
                aria-label="Hint"
                title="Ask for help"
                className={`${controlButtonClass} relative h-full w-full`}
                onClick={onHint}
                disabled={isHintDisabled || isDisabled}
              >
                <Lightbulb className="h-4.5 w-4.5" />
              </button>
            </span>
          </span>
        ) : null}
        <button
          type="button"
          aria-label="Undo"
          className={controlButtonClass}
          onClick={undo}
          disabled={isUndoDisabled || isDisabled}
        >
          <Undo2 className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          aria-label="Redo"
          className={controlButtonClass}
          onClick={redo}
          disabled={isRedoDisabled || isDisabled}
        >
          <Redo2 className="h-4.5 w-4.5" />
        </button>
        <span
          aria-hidden="true"
          className="mx-0.5 h-5 w-px bg-stone-200 dark:bg-white/10"
        />
        <button
          type="button"
          aria-label="Reset"
          className={resetButtonClass}
          onClick={reset}
          disabled={isDisabled}
        >
          <RotateCcw className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
});

export default Controls;
