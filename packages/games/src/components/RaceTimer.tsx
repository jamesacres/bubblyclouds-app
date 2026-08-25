'use client';

import { Flag } from 'lucide-react';

interface RaceTimerProps {
  seconds: number;
  countdown?: number;
  isComplete?: boolean;
  formatSeconds: (seconds: number) => string;
}

// A game's own clock instrument — the shared @ui TimerDisplay keeps its
// watch-icon styling for sudoku. Styled as the twin of a moves/score gauge
// (tiny uppercase label over a mono readout) so the HUD's bottom row reads
// as one instrument cluster. A full-screen countdown overlay owns the
// 3-2-1 moment, so during the countdown this just idles dimmed at zero.
const RaceTimer = ({
  seconds,
  countdown,
  isComplete,
  formatSeconds,
}: RaceTimerProps) => (
  <span
    data-testid="race-timer"
    className={`flex flex-col gap-1 ${
      isComplete
        ? 'text-theme-primary dark:text-theme-primary-light'
        : countdown
          ? 'text-stone-400 dark:text-zinc-500'
          : 'text-stone-700 dark:text-zinc-200'
    }`}
  >
    <span className="flex items-center gap-1 text-[0.6rem] font-black uppercase tracking-widest opacity-60">
      {isComplete && <Flag className="h-2.5 w-2.5" aria-hidden="true" />}
      Time
    </span>
    <span className="font-mono text-sm font-semibold tabular-nums leading-none">
      {formatSeconds(countdown ? 0 : seconds)}
    </span>
  </span>
);

export default RaceTimer;
