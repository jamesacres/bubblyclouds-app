'use client';
import { monthIdToLongLabel } from '../helpers/monthId';
import { SolverResult } from '../types/simulation';

// Spec §6.3 shows a single age in the headline: prefer the viewing user's
// own age, falling back to the first member's
export const solverHeadlineAge = (
  result: SolverResult,
  primaryUserId?: string
): number | undefined => {
  if (
    primaryUserId !== undefined &&
    result.agesAtRetirement[primaryUserId] !== undefined
  ) {
    return result.agesAtRetirement[primaryUserId];
  }
  return Object.values(result.agesAtRetirement)[0];
};

interface SolverHeadlineProps {
  result?: SolverResult;
  targetSuccessRatePct: number;
  primaryUserId?: string;
  isRunning?: boolean;
  // Solve progress as a 0–1 fraction, shown while isRunning
  progress?: number;
}

// Dashboard headline: "You can retire in March 2041 (age 52) at 90%
// confidence" (spec §6.3), with loading and unachievable states
const SolverHeadline = ({
  result,
  targetSuccessRatePct,
  primaryUserId,
  isRunning = false,
  progress = 0,
}: SolverHeadlineProps) => {
  if (isRunning) {
    const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);
    return (
      <div
        data-testid="solver-headline-loading"
        className="flex flex-col gap-2"
      >
        <p className="text-sm font-semibold text-zinc-600 dark:text-white/60">
          Finding your earliest retirement date…
        </p>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10"
        >
          <div
            data-testid="solver-headline-progress"
            className="h-full rounded-full bg-cyan-400 transition-all duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  }
  if (!result) {
    return null;
  }
  if (result.earliestRetirementMonth === undefined) {
    return (
      <p
        data-testid="solver-headline-unachievable"
        className="text-lg font-black leading-tight text-zinc-900 dark:text-white"
      >
        Not yet achievable within 40 years — try the retirement planner
      </p>
    );
  }
  const age = solverHeadlineAge(result, primaryUserId);
  return (
    <p
      data-testid="solver-headline"
      className="text-xl font-black leading-tight text-zinc-900 dark:text-white"
    >
      You can retire in {monthIdToLongLabel(result.earliestRetirementMonth)}
      {age !== undefined ? ` (age ${age})` : ''} at {targetSuccessRatePct}%
      confidence
    </p>
  );
};

export default SolverHeadline;
