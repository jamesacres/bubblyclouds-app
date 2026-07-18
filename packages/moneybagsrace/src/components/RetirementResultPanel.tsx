'use client';
import { formatPence } from '../helpers/money';
import { FailureKind, SimulationResult } from '../types/simulation';

// Colour grading vs the target: at/above target green, within 10 points
// amber, further below rose
export const successColorClass = (
  successRatePct: number,
  targetSuccessRatePct: number
): string => {
  if (successRatePct >= targetSuccessRatePct) {
    return 'text-emerald-600 dark:text-emerald-400';
  }
  if (successRatePct >= targetSuccessRatePct - 10) {
    return 'text-amber-600 dark:text-amber-400';
  }
  return 'text-rose-600 dark:text-rose-400';
};

const PERCENTILE_CELLS: {
  key: keyof SimulationResult['endingWealthPercentilesPence'];
  label: string;
}[] = [
  { key: 'p5', label: '5th' },
  { key: 'p25', label: '25th' },
  { key: 'p50', label: 'Median' },
  { key: 'p75', label: '75th' },
  { key: 'p95', label: '95th' },
];

const FAILURE_EXPLANATIONS: { [key in FailureKind]: string } = {
  [FailureKind.BRIDGE_EXHAUSTED]:
    'accessible savings (ISA/GIA) ran out before pension access age',
  [FailureKind.WEALTH_EXHAUSTED]:
    'total wealth ran out before the end of the plan',
};

const labelClassName =
  'text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40';

interface RetirementResultPanelProps {
  result: SimulationResult;
  targetSuccessRatePct: number;
}

const RetirementResultPanel = ({
  result,
  targetSuccessRatePct,
}: RetirementResultPanelProps) => {
  const { failures } = result;
  return (
    <div data-testid="retirement-result-panel" className="flex flex-col gap-4">
      <div>
        <p className={labelClassName}>Success rate</p>
        <p
          data-testid="success-rate"
          className={`text-4xl font-black tabular-nums leading-tight ${successColorClass(
            result.successRatePct,
            targetSuccessRatePct
          )}`}
        >
          {result.successRatePct.toFixed(1)}%
        </p>
        <p className="text-xs text-zinc-500 dark:text-white/45">
          Target {targetSuccessRatePct}%
        </p>
      </div>

      <div>
        <p className={`mb-1 ${labelClassName}`}>Ending wealth</p>
        <div className="grid grid-cols-5 gap-2">
          {PERCENTILE_CELLS.map(({ key, label }) => (
            <div key={key} data-testid={`ending-wealth-${key}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-white/35">
                {label}
              </p>
              <p className="text-sm font-bold tabular-nums text-zinc-900 dark:text-white">
                {formatPence(result.endingWealthPercentilesPence[key])}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className={`mb-1 ${labelClassName}`}>Failures</p>
        {failures.count === 0 ? (
          <p
            data-testid="failure-none"
            className="text-sm text-zinc-600 dark:text-white/60"
          >
            None of the runs failed.
          </p>
        ) : (
          <div className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-white/60">
            <p data-testid="failure-summary">
              {failures.count} failing runs
              {failures.medianFailureYear !== undefined
                ? ` · median failure year ${failures.medianFailureYear}`
                : ''}
            </p>
            <ul className="flex flex-col gap-0.5 text-xs text-zinc-500 dark:text-white/45">
              <li data-testid="failure-bridge">
                {failures.byKind[FailureKind.BRIDGE_EXHAUSTED]} bridge exhausted
                — {FAILURE_EXPLANATIONS[FailureKind.BRIDGE_EXHAUSTED]}.
              </li>
              <li data-testid="failure-wealth">
                {failures.byKind[FailureKind.WEALTH_EXHAUSTED]} wealth exhausted
                — {FAILURE_EXPLANATIONS[FailureKind.WEALTH_EXHAUSTED]}.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetirementResultPanel;
