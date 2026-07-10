'use client';

import { Users } from 'lucide-react';
import { UnblockDifficultyDisplay } from '../helpers/difficultyDisplay';

interface RaceHudProps {
  onOpponentsClick: () => void;
  stageCount: number;
  currentStageIndex: number;
  // Stage indexes already solved, so their pips render filled.
  completedStageIndexes: Set<number>;
  // Difficulty of the current stage — shown as its own chip; pips stay in
  // the theme colour so a hard stage doesn't read as a warning light.
  difficulty: UnblockDifficultyDisplay;
}

// Top row of the HUD card (Controls is the bottom row): opponents on the
// left, a stage pip strip in the middle, the difficulty chip on the right.
// The clock lives with the moves gauge in the bottom row, so nothing here
// competes for width and the chip never truncates. Unblock Race's own
// chrome — the shared @games LobbyButton keeps its styling for sudoku. Pip
// semantics: filled = done, ring = upcoming, wide glowing pill = current.
const RaceHud = ({
  onOpponentsClick,
  stageCount,
  currentStageIndex,
  completedStageIndexes,
  difficulty,
}: RaceHudProps) => (
  <div
    data-testid="race-hud"
    className="flex w-full items-center gap-3 px-3 pb-1 pt-2"
  >
    <button
      type="button"
      onClick={onOpponentsClick}
      className="text-theme-primary dark:text-theme-primary-light flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-stone-200/70 bg-white/60 px-2.5 py-1.5 text-xs font-semibold backdrop-blur transition-all duration-200 hover:bg-white active:scale-95 dark:border-white/10 dark:bg-zinc-900/60 dark:hover:bg-zinc-800"
    >
      <Users className="h-4 w-4" aria-hidden="true" />
      Opponents
    </button>

    {stageCount > 1 && (
      <span
        data-testid="stage-chip"
        aria-label={`Stage ${currentStageIndex + 1} of ${stageCount}`}
        className="flex items-center gap-1"
      >
        <span className="flex items-center gap-1" aria-hidden="true">
          {Array.from({ length: stageCount }, (_, i) => {
            const isCurrent = i === currentStageIndex;
            const isDone = completedStageIndexes.has(i);
            return (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? 'bg-theme-primary w-4 shadow-[0_0_6px_var(--theme-primary)]'
                    : isDone
                      ? 'bg-theme-primary w-1.5'
                      : 'w-1.5 border border-stone-400/60 bg-transparent dark:border-white/25'
                }`}
              />
            );
          })}
        </span>
        {/* Pips alone don't carry a count at a glance */}
        <span
          aria-hidden="true"
          className="text-[0.6rem] font-bold tabular-nums text-stone-400 dark:text-zinc-500"
        >
          {currentStageIndex + 1}/{stageCount}
        </span>
      </span>
    )}

    <span
      className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide ${difficulty.chipClass}`}
    >
      {difficulty.shortLabel}
    </span>
  </div>
);

export default RaceHud;
