'use client';

import { ReactNode } from 'react';
import { Users } from 'lucide-react';
import { UnblockDifficultyDisplay } from '../helpers/difficultyDisplay';

interface RaceHudProps {
  onOpponentsClick: () => void;
  stageCount: number;
  currentStageIndex: number;
  // Stage indexes already solved, so their pips render filled.
  completedStageIndexes: Set<number>;
  // Difficulty of the current stage — colours its pip and the a11y label.
  difficulty: UnblockDifficultyDisplay;
  timer: ReactNode;
}

// One-row HUD above the board: opponents on the left, a stage pip strip in
// the middle (can't wrap, unlike the old text chip), timer on the right.
// Unblock Race's own chrome — the shared @games LobbyButton keeps its
// styling for sudoku.
const RaceHud = ({
  onOpponentsClick,
  stageCount,
  currentStageIndex,
  completedStageIndexes,
  difficulty,
  timer,
}: RaceHudProps) => (
  <div
    data-testid="race-hud"
    className="ml-auto mr-auto flex w-full max-w-xl items-center gap-3 px-4 pb-1 lg:mr-0"
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
        aria-label={`Stage ${currentStageIndex + 1} of ${stageCount}, ${difficulty.label}`}
        className="flex items-center gap-2 whitespace-nowrap"
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
                    ? `w-4 ${difficulty.dotClass}`
                    : isDone
                      ? 'bg-theme-primary w-1.5'
                      : 'w-1.5 bg-stone-300 dark:bg-white/15'
                }`}
              />
            );
          })}
        </span>
        <span
          className="text-xs font-bold tabular-nums text-stone-600 dark:text-zinc-300"
          aria-hidden="true"
        >
          {currentStageIndex + 1}
          <span className="opacity-50">/{stageCount}</span>
        </span>
      </span>
    )}

    <div className="ml-auto text-right">{timer}</div>
  </div>
);

export default RaceHud;
