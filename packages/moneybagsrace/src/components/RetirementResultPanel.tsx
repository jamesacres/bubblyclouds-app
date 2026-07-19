'use client';
import { formatPence } from '../helpers/money';
import {
  FailureKind,
  MemberBreakdown,
  PercentileBand,
  SimulationResult,
} from '../types/simulation';

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

type PercentileCellKey = keyof SimulationResult['endingWealthPercentilesPence'];

const PERCENTILE_CELLS: {
  key: PercentileCellKey;
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
  [FailureKind.INCOME_BELOW_FLOOR]:
    'balance-linked income fell below the desired withdrawal',
};

const labelClassName =
  'text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40';

const EndingWealthCells = ({
  percentiles,
}: {
  percentiles: SimulationResult['endingWealthPercentilesPence'];
}) => (
  <div className="grid grid-cols-5 gap-2">
    {PERCENTILE_CELLS.map(({ key, label }) => (
      <div key={key} data-testid={`ending-wealth-${key}`}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-white/35">
          {label}
        </p>
        <p className="text-sm font-bold tabular-nums text-zinc-900 dark:text-white">
          {formatPence(percentiles[key])}
        </p>
      </div>
    ))}
  </div>
);

// Median headline with the 5th–95th range underneath, used for each of the
// three lifetime-value figures.
const LifetimeStat = ({
  label,
  band,
  emphasis,
  testId,
}: {
  label: string;
  band: PercentileBand;
  emphasis?: boolean;
  testId: string;
}) => (
  <div data-testid={testId}>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-white/35">
      {label}
    </p>
    <p
      className={`font-bold tabular-nums text-zinc-900 dark:text-white ${
        emphasis ? 'text-lg' : 'text-sm'
      }`}
    >
      {formatPence(band.p50)}
    </p>
    <p className="text-[10px] tabular-nums text-zinc-400 dark:text-white/35">
      {formatPence(band.p5)} – {formatPence(band.p95)}
    </p>
  </div>
);

// The three headline comparison figures for a strategy: how much was withdrawn
// over the whole plan, what is left at the end, and the two combined.
const LifetimeValueBlock = ({
  totalLifetimeWithdrawalsPence,
  endingWealthPercentilesPence,
  combinedTotalPence,
  testIdPrefix,
}: {
  totalLifetimeWithdrawalsPence: PercentileBand;
  endingWealthPercentilesPence: PercentileBand;
  combinedTotalPence: PercentileBand;
  testIdPrefix: string;
}) => (
  <div>
    <p className={`mb-1 ${labelClassName}`}>Lifetime value</p>
    <div className="grid grid-cols-3 gap-2">
      <LifetimeStat
        label="Total withdrawn"
        band={totalLifetimeWithdrawalsPence}
        testId={`${testIdPrefix}lifetime-withdrawn`}
      />
      <LifetimeStat
        label="Left in pot"
        band={endingWealthPercentilesPence}
        testId={`${testIdPrefix}lifetime-ending`}
      />
      <LifetimeStat
        label="Combined"
        band={combinedTotalPence}
        emphasis
        testId={`${testIdPrefix}lifetime-combined`}
      />
    </div>
    <p className="mt-1 text-[10px] text-zinc-400 dark:text-white/35">
      Median with 5th–95th range · today&apos;s money.
    </p>
  </div>
);

const FailuresBlock = ({
  failures,
  testIdPrefix,
}: {
  failures: SimulationResult['failures'];
  testIdPrefix: string;
}) =>
  failures.count === 0 ? (
    <p
      data-testid={`${testIdPrefix}failure-none`}
      className="text-sm text-zinc-600 dark:text-white/60"
    >
      None of the runs failed.
    </p>
  ) : (
    <div className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-white/60">
      <p data-testid={`${testIdPrefix}failure-summary`}>
        {failures.count} failing runs
        {failures.medianFailureYear !== undefined
          ? ` · median failure year ${failures.medianFailureYear}`
          : ''}
      </p>
      <ul className="flex flex-col gap-0.5 text-xs text-zinc-500 dark:text-white/45">
        <li data-testid={`${testIdPrefix}failure-bridge`}>
          {failures.byKind[FailureKind.BRIDGE_EXHAUSTED]} bridge exhausted —{' '}
          {FAILURE_EXPLANATIONS[FailureKind.BRIDGE_EXHAUSTED]}.
        </li>
        <li data-testid={`${testIdPrefix}failure-wealth`}>
          {failures.byKind[FailureKind.WEALTH_EXHAUSTED]} wealth exhausted —{' '}
          {FAILURE_EXPLANATIONS[FailureKind.WEALTH_EXHAUSTED]}.
        </li>
        {failures.byKind[FailureKind.INCOME_BELOW_FLOOR] > 0 && (
          <li data-testid={`${testIdPrefix}failure-income-floor`}>
            {failures.byKind[FailureKind.INCOME_BELOW_FLOOR]} income below floor
            — {FAILURE_EXPLANATIONS[FailureKind.INCOME_BELOW_FLOOR]}.
          </li>
        )}
      </ul>
    </div>
  );

const MemberBreakdownDetails = ({
  breakdown,
  nickname,
  targetSuccessRatePct,
}: {
  breakdown: MemberBreakdown;
  nickname: string;
  targetSuccessRatePct: number;
}) => (
  <details
    data-testid={`member-breakdown-${breakdown.userId}`}
    className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-white/10"
  >
    <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-semibold text-zinc-800 dark:text-white/80">
      <span>{nickname}</span>
      <span
        data-testid={`member-success-${breakdown.userId}`}
        className={`tabular-nums ${successColorClass(
          breakdown.successRatePct,
          targetSuccessRatePct
        )}`}
      >
        {breakdown.successRatePct.toFixed(1)}%
      </span>
    </summary>
    <div className="mt-3 flex flex-col gap-3">
      <LifetimeValueBlock
        totalLifetimeWithdrawalsPence={breakdown.totalLifetimeWithdrawalsPence}
        endingWealthPercentilesPence={breakdown.endingWealthPercentilesPence}
        combinedTotalPence={breakdown.combinedTotalPence}
        testIdPrefix={`member-${breakdown.userId}-`}
      />
      <div>
        <p className={`mb-1 ${labelClassName}`}>Ending wealth spread</p>
        <EndingWealthCells
          percentiles={breakdown.endingWealthPercentilesPence}
        />
      </div>
      <div>
        <p className={`mb-1 ${labelClassName}`}>Failures</p>
        <FailuresBlock
          failures={breakdown.failures}
          testIdPrefix={`member-${breakdown.userId}-`}
        />
      </div>
    </div>
  </details>
);

interface RetirementResultPanelProps {
  result: SimulationResult;
  targetSuccessRatePct: number;
  memberNicknames?: Record<string, string>;
}

const RetirementResultPanel = ({
  result,
  targetSuccessRatePct,
  memberNicknames,
}: RetirementResultPanelProps) => {
  const { failures, memberBreakdowns } = result;
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

      <LifetimeValueBlock
        totalLifetimeWithdrawalsPence={result.totalLifetimeWithdrawalsPence}
        endingWealthPercentilesPence={result.endingWealthPercentilesPence}
        combinedTotalPence={result.combinedTotalPence}
        testIdPrefix=""
      />

      <div>
        <p className={`mb-1 ${labelClassName}`}>Failures</p>
        <FailuresBlock failures={failures} testIdPrefix="" />
      </div>

      {memberBreakdowns.length > 0 && (
        <div
          data-testid="member-breakdowns"
          className="flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-white/10"
        >
          <p className="text-xs text-zinc-500 dark:text-white/45">
            Per-person detail — the household plan above combines both.
          </p>
          {memberBreakdowns.map((breakdown) => (
            <MemberBreakdownDetails
              key={breakdown.userId}
              breakdown={breakdown}
              nickname={memberNicknames?.[breakdown.userId] ?? breakdown.userId}
              targetSuccessRatePct={targetSuccessRatePct}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RetirementResultPanel;
