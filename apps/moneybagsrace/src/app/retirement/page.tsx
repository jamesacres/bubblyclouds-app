'use client';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { CurrencyInput } from '@bubblyclouds-app/moneybagsrace/components/CurrencyInput';
import IncomeVsTargetChart from '@bubblyclouds-app/moneybagsrace/components/IncomeVsTargetChart';
import LifetimeValueChart from '@bubblyclouds-app/moneybagsrace/components/LifetimeValueChart';
import MonteCarloPathsChart from '@bubblyclouds-app/moneybagsrace/components/MonteCarloPathsChart';
import PercentilePathsChart from '@bubblyclouds-app/moneybagsrace/components/PercentilePathsChart';
import { PercentSlider } from '@bubblyclouds-app/moneybagsrace/components/PercentSlider';
import RealNominalToggle, {
  NetWorthMode,
} from '@bubblyclouds-app/moneybagsrace/components/RealNominalToggle';
import RetirementResultPanel from '@bubblyclouds-app/moneybagsrace/components/RetirementResultPanel';
import SensitivityTable from '@bubblyclouds-app/moneybagsrace/components/SensitivityTable';
import SolverHeadline from '@bubblyclouds-app/moneybagsrace/components/SolverHeadline';
import { ToggleRow } from '@bubblyclouds-app/moneybagsrace/components/ToggleRow';
import { GLOBAL_EQUITY_ANNUAL_RETURNS } from '@bubblyclouds-app/moneybagsrace/data/globalEquityReturns';
import { formatPence } from '@bubblyclouds-app/moneybagsrace/helpers/money';
import { runRetirementSimulationAsync } from '@bubblyclouds-app/moneybagsrace/engine/runAsync';
import { computeSensitivityAsync } from '@bubblyclouds-app/moneybagsrace/engine/sensitivity';
import {
  findEarliestRetirementAsync,
  SolverBaseInputs,
} from '@bubblyclouds-app/moneybagsrace/engine/solver';
import {
  addMonths,
  currentMonthId,
  isValidMonthId,
  monthIdToLabel,
} from '@bubblyclouds-app/moneybagsrace/helpers/monthId';
import { useHousehold } from '@bubblyclouds-app/moneybagsrace/hooks/useHousehold';
import { useRetirementModel } from '@bubblyclouds-app/moneybagsrace/hooks/useRetirementModel';
import { EMPTY_PROFILE } from '@bubblyclouds-app/moneybagsrace/providers/MoneyBagsDataProvider';
import {
  DEFAULT_ENDOWMENT_AVERAGING_YEARS,
  DEFAULT_FIXED_PERCENT_RATE_PCT,
  DEFAULT_GUARDRAIL_WIDTH_PCT,
  DEFAULT_PROBABILITY_GUARDRAIL_LOWER_PCT,
  DEFAULT_PROBABILITY_GUARDRAIL_UPPER_PCT,
  DEFAULT_SPENDING_DECLINE_PCT_PER_YEAR,
  DEFAULT_VANGUARD_CEILING_PCT,
  DEFAULT_VANGUARD_FLOOR_PCT,
  DEFAULT_WITHDRAWAL_STRATEGY,
  HouseholdAssumptions,
  WithdrawalStrategy,
  WithdrawalStrategyKind,
} from '@bubblyclouds-app/moneybagsrace/types/assumptions';
import { MonthId } from '@bubblyclouds-app/moneybagsrace/types/monthId';
import {
  SimulationMember,
  SensitivityResult,
  SimulationResult,
  SolverResult,
} from '@bubblyclouds-app/moneybagsrace/types/simulation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useContext, useEffect, useRef, useState } from 'react';

const RUNS = 5000;
const DEFAULT_PLAN_TO_AGE = 95;

const STRATEGY_OPTIONS: {
  kind: WithdrawalStrategyKind;
  label: string;
  description: string;
}[] = [
  {
    kind: WithdrawalStrategyKind.FIXED_REAL,
    label: 'Fixed real',
    description: 'Spend the same amount every year (inflation-proofed).',
  },
  {
    kind: WithdrawalStrategyKind.FIXED_PERCENT,
    label: 'Fixed %',
    description: 'Spend a fixed percent of the pot; income rises and falls.',
  },
  {
    kind: WithdrawalStrategyKind.GUARDRAILS,
    label: 'Guardrails',
    description: 'Adjust spending up or down when the withdrawal rate drifts.',
  },
  {
    kind: WithdrawalStrategyKind.RMD,
    label: 'RMD',
    description: 'Spend the pot divided by the years of plan remaining.',
  },
  {
    kind: WithdrawalStrategyKind.FIXED_REAL_NO_INFLATION_AFTER_LOSS,
    label: 'Forgo inflation after loss',
    description:
      'Fixed real, but skip the inflation rise the year after a loss.',
  },
  {
    kind: WithdrawalStrategyKind.VANGUARD_DYNAMIC,
    label: 'Vanguard dynamic',
    description:
      'Spend a % of the pot, but cap how much the amount can change each year.',
  },
  {
    kind: WithdrawalStrategyKind.SPENDING_DECLINE,
    label: 'Spending declines',
    description: 'Fixed real that gently tapers down as you age.',
  },
  {
    kind: WithdrawalStrategyKind.ENDOWMENT_TEN_YEAR_AVG,
    label: 'Endowment 10-yr avg',
    description: "Spend a % of your pot's smoothed 10-year average value.",
  },
  {
    kind: WithdrawalStrategyKind.PROBABILITY_GUARDRAILS,
    label: 'Probability guardrails',
    description:
      'Adjust spending up or down as your plan’s funding health drifts.',
  },
];

const strategyDescription = (kind: WithdrawalStrategyKind): string =>
  STRATEGY_OPTIONS.find((option) => option.kind === kind)?.description ?? '';

type DateMode = 'earliest' | 'specific';
type RunPhase = 'idle' | 'solving' | 'simulating' | 'sensitivity';

const PHASE_LABELS: { [key in Exclude<RunPhase, 'idle'>]: string } = {
  solving: 'Searching for your earliest retirement date…',
  simulating: `Running ${RUNS.toLocaleString('en-GB')} simulations…`,
  sensitivity: 'Computing sensitivity…',
};

interface SpecificOutcome {
  kind: 'specific';
  retirementMonth: MonthId;
  result: SimulationResult;
  // The target the results were graded against, frozen at run time so later
  // slider edits don't re-colour the displayed results before a re-run.
  targetSuccessRatePct: number;
  // The household desired real withdrawal this run targeted, frozen so the
  // income-vs-target chart keeps comparing against what the run actually used.
  targetWithdrawalPence: number;
  // Signature of the inputs this run used; drives the stale-results hint.
  signature: string;
}

interface EarliestOutcome {
  kind: 'earliest';
  solver: SolverResult;
  resultAtDate?: SimulationResult;
  sensitivity?: SensitivityResult;
  targetSuccessRatePct: number;
  targetWithdrawalPence: number;
  signature: string;
}

type Outcome = SpecificOutcome | EarliestOutcome;

const sectionClassName =
  'flex flex-col gap-3 rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:border-zinc-700/60 dark:bg-zinc-800/60';

const numberFieldClassName =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white';

const modeChipClassName = (isActive: boolean): string =>
  `cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
    isActive
      ? 'border-cyan-500/40 bg-cyan-500/20 text-zinc-900 dark:text-white'
      : 'border-zinc-200 bg-white text-zinc-500 hover:text-zinc-700 dark:border-white/15 dark:bg-white/5 dark:text-white/50 dark:hover:text-white/80'
  }`;

const resolveStrategyParam = (
  strategy: WithdrawalStrategy,
  key: keyof WithdrawalStrategy,
  fallback: number
): number => {
  const value = strategy[key];
  return typeof value === 'number' ? value : fallback;
};

// A labelled number field for the strategy params that PercentSlider's
// range control doesn't suit (negative / fractional bands).
const NumberField = ({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <label
      htmlFor={id}
      className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40"
    >
      {label}
    </label>
    <input
      id={id}
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(event) => {
        const parsed = Number(event.target.value);
        if (!Number.isNaN(parsed)) {
          onChange(parsed);
        }
      }}
      className={`${numberFieldClassName} disabled:opacity-60`}
    />
  </div>
);

// Per-strategy parameter controls, shared by the own (editable) and partner
// (disabled) member cards. The disabled flag makes the partner's card
// read-only while still surfacing their resolved settings.
const StrategyParams = ({
  userId,
  strategy,
  onChange,
  disabled,
}: {
  userId: string;
  strategy: WithdrawalStrategy;
  onChange: (strategy: WithdrawalStrategy) => void;
  disabled: boolean;
}) => {
  const rate = resolveStrategyParam(
    strategy,
    'fixedPercentRatePct',
    DEFAULT_FIXED_PERCENT_RATE_PCT
  );
  const width = resolveStrategyParam(
    strategy,
    'guardrailWidthPct',
    DEFAULT_GUARDRAIL_WIDTH_PCT
  );
  const patch = (next: Partial<WithdrawalStrategy>) => {
    if (disabled) {
      return;
    }
    onChange({ ...strategy, ...next });
  };

  switch (strategy.kind) {
    case WithdrawalStrategyKind.FIXED_PERCENT:
    case WithdrawalStrategyKind.ENDOWMENT_TEN_YEAR_AVG:
    case WithdrawalStrategyKind.VANGUARD_DYNAMIC:
      return (
        <>
          <PercentSlider
            id={`member-${userId}-rate`}
            label="Withdrawal rate"
            value={rate}
            onChange={(value) => patch({ fixedPercentRatePct: value })}
            min={1}
            max={10}
            step={0.5}
          />
          {strategy.kind === WithdrawalStrategyKind.VANGUARD_DYNAMIC && (
            <>
              <NumberField
                id={`member-${userId}-floor`}
                label="Yearly decrease floor (%)"
                value={resolveStrategyParam(
                  strategy,
                  'vanguardFloorPct',
                  DEFAULT_VANGUARD_FLOOR_PCT
                )}
                onChange={(value) => patch({ vanguardFloorPct: value })}
                min={-5}
                max={0}
                step={0.5}
                disabled={disabled}
              />
              <NumberField
                id={`member-${userId}-ceiling`}
                label="Yearly increase ceiling (%)"
                value={resolveStrategyParam(
                  strategy,
                  'vanguardCeilingPct',
                  DEFAULT_VANGUARD_CEILING_PCT
                )}
                onChange={(value) => patch({ vanguardCeilingPct: value })}
                min={0}
                max={15}
                step={0.5}
                disabled={disabled}
              />
            </>
          )}
          {strategy.kind === WithdrawalStrategyKind.ENDOWMENT_TEN_YEAR_AVG && (
            <NumberField
              id={`member-${userId}-averaging-years`}
              label="Averaging years"
              value={resolveStrategyParam(
                strategy,
                'endowmentAveragingYears',
                DEFAULT_ENDOWMENT_AVERAGING_YEARS
              )}
              onChange={(value) => patch({ endowmentAveragingYears: value })}
              min={1}
              max={20}
              step={1}
              disabled={disabled}
            />
          )}
        </>
      );
    case WithdrawalStrategyKind.GUARDRAILS:
      return (
        <>
          <PercentSlider
            id={`member-${userId}-initial-rate`}
            label="Initial withdrawal rate"
            value={rate}
            onChange={(value) => patch({ fixedPercentRatePct: value })}
            min={1}
            max={10}
            step={0.5}
          />
          <PercentSlider
            id={`member-${userId}-guardrail-width`}
            label="Guardrail width"
            value={width}
            onChange={(value) => patch({ guardrailWidthPct: value })}
            min={5}
            max={40}
            step={5}
          />
        </>
      );
    case WithdrawalStrategyKind.SPENDING_DECLINE:
      return (
        <NumberField
          id={`member-${userId}-decline`}
          label="Annual decline (%)"
          value={resolveStrategyParam(
            strategy,
            'spendingDeclinePctPerYear',
            DEFAULT_SPENDING_DECLINE_PCT_PER_YEAR
          )}
          onChange={(value) => patch({ spendingDeclinePctPerYear: value })}
          min={-5}
          max={0}
          step={0.5}
          disabled={disabled}
        />
      );
    case WithdrawalStrategyKind.PROBABILITY_GUARDRAILS:
      return (
        <>
          <NumberField
            id={`member-${userId}-prob-lower`}
            label="Lower funded band (%)"
            value={resolveStrategyParam(
              strategy,
              'probabilityGuardrailLowerPct',
              DEFAULT_PROBABILITY_GUARDRAIL_LOWER_PCT
            )}
            onChange={(value) => patch({ probabilityGuardrailLowerPct: value })}
            min={40}
            max={100}
            step={1}
            disabled={disabled}
          />
          <NumberField
            id={`member-${userId}-prob-upper`}
            label="Upper funded band (%)"
            value={resolveStrategyParam(
              strategy,
              'probabilityGuardrailUpperPct',
              DEFAULT_PROBABILITY_GUARDRAIL_UPPER_PCT
            )}
            onChange={(value) => patch({ probabilityGuardrailUpperPct: value })}
            min={80}
            max={130}
            step={1}
            disabled={disabled}
          />
        </>
      );
    default:
      return null;
  }
};

// One member's personal plan: their desired withdrawal + strategy + params.
// Only the current user's own card is editable; the partner's card mirrors
// projection's "you can only edit your own" pattern with disabled inputs.
const MemberPlanCard = ({
  userId,
  nickname,
  isOwn,
  desiredWithdrawalAnnualPence,
  strategy,
  onWithdrawalChange,
  onStrategyChange,
}: {
  userId: string;
  nickname: string;
  isOwn: boolean;
  desiredWithdrawalAnnualPence: number;
  strategy: WithdrawalStrategy;
  onWithdrawalChange: (pence: number) => void;
  onStrategyChange: (strategy: WithdrawalStrategy) => void;
}) => {
  const selectStrategy = (kind: WithdrawalStrategyKind) => {
    if (!isOwn) {
      return;
    }
    onStrategyChange({ ...strategy, kind });
  };
  return (
    <div
      data-testid={`member-plan-${userId}`}
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 p-4 dark:border-white/10"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
          {nickname}’s personal plan
        </h3>
        {!isOwn && (
          <span className="text-xs font-medium text-zinc-400 dark:text-white/35">
            Read-only
          </span>
        )}
      </div>
      {isOwn ? (
        <CurrencyInput
          id={`member-withdrawal-${userId}`}
          label="Desired annual withdrawal (net, today's money)"
          valuePence={desiredWithdrawalAnnualPence}
          onChangePence={onWithdrawalChange}
        />
      ) : (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40">
            Desired annual withdrawal (net, today's money)
          </span>
          <p
            data-testid={`member-withdrawal-${userId}`}
            className="text-sm font-semibold text-zinc-900 dark:text-white"
          >
            {formatPence(desiredWithdrawalAnnualPence)}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40">
          Withdrawal strategy
        </span>
        <div
          role="group"
          aria-label={`${nickname}’s withdrawal strategy`}
          className="flex flex-wrap gap-2"
        >
          {STRATEGY_OPTIONS.map((option) => (
            <button
              key={option.kind}
              type="button"
              data-testid={`member-strategy-${userId}-${option.kind}`}
              aria-pressed={strategy.kind === option.kind}
              disabled={!isOwn}
              onClick={() => selectStrategy(option.kind)}
              className={`${modeChipClassName(
                strategy.kind === option.kind
              )} disabled:cursor-default disabled:opacity-70`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p
          data-testid={`member-strategy-description-${userId}`}
          className="text-xs text-zinc-500 dark:text-white/50"
        >
          {strategyDescription(strategy.kind)}
        </p>
        <StrategyParams
          userId={userId}
          strategy={strategy}
          onChange={onStrategyChange}
          disabled={!isOwn}
        />
      </div>
    </div>
  );
};

function NotReady({
  missingDob,
  hasSnapshots,
}: {
  missingDob: string[];
  hasSnapshots: boolean;
}) {
  return (
    <div className={sectionClassName} data-testid="retirement-not-ready">
      <p className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
        Almost there
      </p>
      {missingDob.length > 0 && (
        <p
          data-testid="retirement-missing-dob"
          className="text-sm text-zinc-600 dark:text-zinc-300"
        >
          Add dates of birth for: {missingDob.join(', ')} —{' '}
          <Link href="/settings" className="font-semibold underline">
            open Settings
          </Link>
        </p>
      )}
      {!hasSnapshots && (
        <p
          data-testid="retirement-no-snapshots"
          className="text-sm text-zinc-600 dark:text-zinc-300"
        >
          Enter at least one month of balances first —{' '}
          <Link
            href={`/state?month=${currentMonthId()}`}
            className="font-semibold underline"
          >
            enter this month
          </Link>
        </p>
      )}
    </div>
  );
}

// Year span of the loaded returns dataset, so the explainer copy stays
// accurate if the series is swapped for a licensed or updated one.
const RETURNS_FIRST_YEAR = GLOBAL_EQUITY_ANNUAL_RETURNS[0]?.year;
const RETURNS_LAST_YEAR =
  GLOBAL_EQUITY_ANNUAL_RETURNS[GLOBAL_EQUITY_ANNUAL_RETURNS.length - 1]?.year;

// Expandable "how this works" note under the Monte Carlo chart. Explains that
// each path is a random sequence of real historical market years (bootstrap),
// not a bell-curve model, so the numbers are grounded in what actually happened.
function MonteCarloExplainer() {
  return (
    <details
      data-testid="monte-carlo-explainer"
      className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
    >
      <summary className="cursor-pointer font-semibold text-zinc-700 dark:text-white/80">
        How this simulation works
      </summary>
      <div className="mt-3 flex flex-col gap-2 text-zinc-600 dark:text-white/60">
        <p>
          Each faint line is one possible future for your pot. We build{' '}
          {RUNS.toLocaleString('en-GB')} of them — this is the Monte Carlo
          method: run the plan thousands of times under different market luck
          and see how often it survives.
        </p>
        <p>
          <span className="font-semibold text-zinc-700 dark:text-white/80">
            Yes — it uses real historical data.
          </span>{' '}
          For every year of every run we draw an actual world-equity return at
          random from{' '}
          {RETURNS_FIRST_YEAR !== undefined && RETURNS_LAST_YEAR !== undefined
            ? `${RETURNS_FIRST_YEAR}–${RETURNS_LAST_YEAR} (${GLOBAL_EQUITY_ANNUAL_RETURNS.length} years of history)`
            : 'over a century of market history'}
          , then string those years together. So a single run might hand you
          1974’s crash next to 1985’s boom — a fresh shuffle of years that
          really happened, rather than a smooth bell-curve guess.
        </p>
        <p>
          Returns are in today’s money (inflation already stripped out), so a
          steady spend keeps its buying power. The success rate is the share of
          runs where your money outlasts your plan; the shaded band spans the
          5th to 95th percentile, and the bold line is the median outcome.
        </p>
      </div>
    </details>
  );
}

// Shown above the results when a plan input has changed since the last run:
// the figures below reflect the previous inputs until the user re-runs.
function StaleResultsHint() {
  return (
    <p
      data-testid="stale-results-hint"
      className="rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300"
    >
      Inputs changed — run the simulation again to update these results.
    </p>
  );
}

export default function RetirementPage() {
  const context = useContext(UserContext);
  const { user } = context || {};
  const {
    household,
    ownUserId,
    ownProfile,
    saveOwnProfile,
    saveSharedAssumptions,
  } = useHousehold();
  const {
    members,
    startMonth,
    assumptions,
    readiness,
    householdDesiredWithdrawalAnnualPence,
  } = useRetirementModel();

  // Per-member local edits, keyed by userId; only the own card writes any.
  const [withdrawalEdits, setWithdrawalEdits] = useState<
    Record<string, number>
  >({});
  const [strategyEdits, setStrategyEdits] = useState<
    Record<string, WithdrawalStrategy>
  >({});
  const [planToAgeEdit, setPlanToAgeEdit] = useState<number | undefined>(
    undefined
  );
  const [targetEdit, setTargetEdit] = useState<number | undefined>(undefined);
  const [resultMode, setResultMode] = useState<NetWorthMode>('real');
  const [dateMode, setDateMode] = useState<DateMode>('earliest');
  const [retirementMonth, setRetirementMonth] = useState<MonthId>(() =>
    addMonths(currentMonthId(), 12)
  );
  const [includeStatePension, setIncludeStatePension] = useState(true);
  const [applyTax, setApplyTax] = useState(true);
  const [
    potExhaustedFailureForFractionStrategies,
    setPotExhaustedFailureForFractionStrategies,
  ] = useState(false);

  const planToAge =
    planToAgeEdit ?? assumptions.defaultPlanToAge ?? DEFAULT_PLAN_TO_AGE;
  const targetSuccessRatePct = targetEdit ?? assumptions.targetSuccessRatePct;

  const memberNicknames = Object.fromEntries(
    household.members.map((member) => [member.userId, member.nickname])
  );

  // The owner's birth year, so the result charts can show the owner's age
  // beneath each calendar year on the x-axis.
  const ownBirthYear = (() => {
    const ownDateOfBirth = members.find(
      (member) => member.userId === ownUserId
    )?.dateOfBirth;
    if (!ownDateOfBirth) {
      return undefined;
    }
    const year = Number(ownDateOfBirth.slice(0, 4));
    return Number.isFinite(year) ? year : undefined;
  })();

  // Each member's effective plan: local own-card edits win over the resolved
  // per-member settings from the model.
  const memberWithdrawal = (member: SimulationMember): number =>
    withdrawalEdits[member.userId] ?? member.desiredWithdrawalAnnualPence;
  const memberStrategy = (member: SimulationMember): WithdrawalStrategy =>
    strategyEdits[member.userId] ?? member.withdrawalStrategy;

  // Household combined = Σ per-member desired, with any own-card edits applied.
  // Falls back to the model's household figure when there are no members.
  const householdWithdrawalPence =
    members.length > 0
      ? members.reduce((total, member) => total + memberWithdrawal(member), 0)
      : householdDesiredWithdrawalAnnualPence;

  const seedRef = useRef<number | undefined>(undefined);

  const [phase, setPhase] = useState<RunPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | undefined>(undefined);
  const [runFailed, setRunFailed] = useState(false);
  const abortRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => () => abortRef.current?.abort(), []);

  const isRunning = phase !== 'idle';

  // Thread the own-card edits onto each member so the run reflects the
  // in-progress edits before they are persisted.
  const runMembers: SimulationMember[] = members.map((member) => ({
    ...member,
    desiredWithdrawalAnnualPence: memberWithdrawal(member),
    withdrawalStrategy: memberStrategy(member),
  }));

  // A signature of every input that changes a run's numbers. Frozen into the
  // outcome at run time; when the current signature drifts from it, the shown
  // results are stale and the user is nudged to re-run.
  const runSignature = JSON.stringify({
    members: runMembers.map((member) => ({
      userId: member.userId,
      desiredWithdrawalAnnualPence: member.desiredWithdrawalAnnualPence,
      withdrawalStrategy: member.withdrawalStrategy,
    })),
    startMonth,
    planToAge,
    householdWithdrawalPence,
    targetSuccessRatePct,
    includeStatePension,
    applyTax,
    potExhaustedFailureForFractionStrategies,
    dateMode,
    retirementMonth: dateMode === 'specific' ? retirementMonth : undefined,
  });

  const isStale = outcome !== undefined && outcome.signature !== runSignature;

  const handleRun = async () => {
    if (startMonth === undefined || isRunning) {
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    // Freeze the target and input signature this run is graded against, so the
    // displayed results stay pinned to it until the next explicit run.
    const runTargetSuccessRatePct = targetSuccessRatePct;
    const runTargetWithdrawalPence = householdWithdrawalPence;
    const signature = runSignature;
    setOutcome(undefined);
    setRunFailed(false);
    setProgress(0);
    const seed = seedRef.current ?? Date.now() >>> 0;
    seedRef.current = seed;
    const ownMember = runMembers.find((member) => member.userId === ownUserId);
    const runAssumptions: HouseholdAssumptions = {
      ...assumptions,
      targetSuccessRatePct,
      defaultWithdrawalAnnualPence: householdWithdrawalPence,
      defaultPlanToAge: planToAge,
      defaultWithdrawalStrategy:
        ownMember?.withdrawalStrategy ??
        assumptions.defaultWithdrawalStrategy ??
        DEFAULT_WITHDRAWAL_STRATEGY,
    };
    const base: SolverBaseInputs = {
      members: runMembers,
      startMonth,
      planToAge,
      withdrawalAnnualPence: householdWithdrawalPence,
      withdrawalStrategy: runAssumptions.defaultWithdrawalStrategy,
      includeStatePension,
      applyTax,
      potExhaustedFailureForFractionStrategies,
      assumptions: runAssumptions,
      returns: GLOBAL_EQUITY_ANNUAL_RETURNS,
      runs: RUNS,
      seed,
    };
    const onProgress = (done: number, total: number) =>
      setProgress(done / total);
    try {
      if (dateMode === 'specific') {
        setPhase('simulating');
        const result = await runRetirementSimulationAsync(
          { ...base, retirementMonth },
          { signal: controller.signal, onProgress }
        );
        setOutcome({
          kind: 'specific',
          retirementMonth,
          result,
          targetSuccessRatePct: runTargetSuccessRatePct,
          targetWithdrawalPence: runTargetWithdrawalPence,
          signature,
        });
      } else {
        setPhase('solving');
        const solver = await findEarliestRetirementAsync(base, {
          signal: controller.signal,
          onProgress,
        });
        let resultAtDate: SimulationResult | undefined;
        if (solver.earliestRetirementMonth !== undefined) {
          setPhase('simulating');
          setProgress(0);
          resultAtDate = await runRetirementSimulationAsync(
            { ...base, retirementMonth: solver.earliestRetirementMonth },
            { signal: controller.signal, onProgress }
          );
        }
        setOutcome({
          kind: 'earliest',
          solver,
          resultAtDate,
          targetSuccessRatePct: runTargetSuccessRatePct,
          targetWithdrawalPence: runTargetWithdrawalPence,
          signature,
        });
        if (solver.earliestRetirementMonth !== undefined) {
          setPhase('sensitivity');
          setProgress(0);
          const sensitivity = await computeSensitivityAsync(base, {
            signal: controller.signal,
            onProgress,
          });
          setOutcome((previous) =>
            previous?.kind === 'earliest'
              ? { ...previous, sensitivity }
              : previous
          );
        }
      }
      if (user) {
        // Persist the current user's personal plan into their own profile,
        // and the genuinely shared knobs into shared assumptions.
        if (ownMember) {
          await saveOwnProfile({
            ...(ownProfile ?? EMPTY_PROFILE),
            overrides: {
              ...(ownProfile ?? EMPTY_PROFILE).overrides,
              desiredWithdrawalAnnualPence:
                ownMember.desiredWithdrawalAnnualPence,
              withdrawalStrategy: ownMember.withdrawalStrategy,
            },
          });
        }
        await saveSharedAssumptions(runAssumptions);
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        setRunFailed(true);
      }
    } finally {
      setPhase('idle');
      abortRef.current = undefined;
    }
  };

  return (
    <div className="pt-safe min-h-dvh bg-stone-50 pb-32 dark:bg-zinc-900">
      <div className="container mx-auto max-w-2xl px-5">
        <div className="flex flex-col gap-1 pb-6 pt-5">
          <Link
            href="/"
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Retirement
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            A Monte Carlo simulation: {RUNS.toLocaleString('en-GB')} runs, each
            a random shuffle of real historical market years. Full details are
            under the chart once you run it.
          </p>
        </div>

        {!readiness.ready ? (
          <NotReady
            missingDob={readiness.missingDob}
            hasSnapshots={readiness.hasSnapshots}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <section
              className={sectionClassName}
              aria-label="Household summary"
            >
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                Household — combined across both of you
              </h2>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40">
                  Combined desired annual withdrawal
                </span>
                <p
                  data-testid="household-withdrawal-total"
                  className="text-2xl font-black tabular-nums text-zinc-900 dark:text-white"
                >
                  {formatPence(householdWithdrawalPence)}
                </p>
                <p className="text-xs text-zinc-500 dark:text-white/45">
                  The sum of each person’s personal plan below — you retire
                  together on one date.
                </p>
              </div>
            </section>

            <section className={sectionClassName} aria-label="Personal plans">
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                Personal plans
              </h2>
              <p className="text-xs text-zinc-500 dark:text-white/45">
                Each person runs their own pots, withdrawal and strategy. You
                can only edit your own plan.
              </p>
              {members.map((member) => (
                <MemberPlanCard
                  key={member.userId}
                  userId={member.userId}
                  nickname={memberNicknames[member.userId] ?? member.userId}
                  isOwn={member.userId === ownUserId}
                  desiredWithdrawalAnnualPence={memberWithdrawal(member)}
                  strategy={memberStrategy(member)}
                  onWithdrawalChange={(pence) =>
                    setWithdrawalEdits((previous) => ({
                      ...previous,
                      [member.userId]: pence,
                    }))
                  }
                  onStrategyChange={(strategy) =>
                    setStrategyEdits((previous) => ({
                      ...previous,
                      [member.userId]: strategy,
                    }))
                  }
                />
              ))}
            </section>

            <section className={sectionClassName} aria-label="Plan inputs">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="plan-to-age"
                  className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40"
                >
                  Plan to age
                </label>
                <input
                  id="plan-to-age"
                  type="number"
                  min={50}
                  max={120}
                  value={planToAge}
                  onChange={(event) => {
                    const parsed = Number(event.target.value);
                    if (!Number.isNaN(parsed)) {
                      setPlanToAgeEdit(parsed);
                    }
                  }}
                  className={numberFieldClassName}
                />
              </div>

              <div
                role="group"
                aria-label="Retirement date mode"
                className="flex flex-wrap gap-2"
              >
                <button
                  type="button"
                  aria-pressed={dateMode === 'earliest'}
                  onClick={() => setDateMode('earliest')}
                  className={modeChipClassName(dateMode === 'earliest')}
                >
                  Earliest date
                </button>
                <button
                  type="button"
                  aria-pressed={dateMode === 'specific'}
                  onClick={() => setDateMode('specific')}
                  className={modeChipClassName(dateMode === 'specific')}
                >
                  Specific date
                </button>
              </div>
              {dateMode === 'specific' && (
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="retirement-month"
                    className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40"
                  >
                    Retirement month
                  </label>
                  <input
                    id="retirement-month"
                    type="month"
                    value={retirementMonth}
                    onChange={(event) => {
                      if (isValidMonthId(event.target.value)) {
                        setRetirementMonth(event.target.value);
                      }
                    }}
                    className={numberFieldClassName}
                  />
                </div>
              )}

              <ToggleRow
                label="Include state pension"
                description="Reduces required withdrawals from each member's state pension age"
                isEnabled={includeStatePension}
                setEnabled={setIncludeStatePension}
              />
              <ToggleRow
                label="Apply tax"
                description="Grosses up pension withdrawals through the UK bands"
                isEnabled={applyTax}
                setEnabled={setApplyTax}
              />
              <ToggleRow
                label="Fail on pot exhaustion"
                description="For fixed-percent, RMD and endowment strategies, count a failure only when the pot runs out rather than when income drops below the target"
                isEnabled={potExhaustedFailureForFractionStrategies}
                setEnabled={setPotExhaustedFailureForFractionStrategies}
              />
              <PercentSlider
                id="target-success"
                label="Target success rate"
                value={targetSuccessRatePct}
                onChange={setTargetEdit}
                min={50}
                max={99}
                step={1}
              />

              {isRunning ? (
                <div className="flex flex-col gap-2" data-testid="run-progress">
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {PHASE_LABELS[phase]}
                  </p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                    <div
                      data-testid="run-progress-bar"
                      className="h-full rounded-full bg-cyan-400 transition-all duration-200"
                      style={{
                        width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`,
                      }}
                    />
                  </div>
                  <button
                    onClick={() => abortRef.current?.abort()}
                    className="cursor-pointer self-start rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-all duration-200 active:scale-95 dark:border-white/10 dark:text-white/70"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleRun}
                  disabled={householdWithdrawalPence <= 0}
                  className="bg-theme-primary cursor-pointer self-start rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-95 disabled:opacity-50"
                >
                  Run simulation
                </button>
              )}
              {runFailed && (
                <p
                  data-testid="run-error"
                  className="text-sm text-rose-600 dark:text-rose-400"
                >
                  Something went wrong running the simulation — please try
                  again.
                </p>
              )}
            </section>

            {outcome?.kind === 'specific' && (
              <section className={sectionClassName} aria-label="Results">
                {isStale && <StaleResultsHint />}
                <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                  Retiring {monthIdToLabel(outcome.retirementMonth)}
                </h2>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40">
                  Household success (both plans combined)
                </p>
                <RetirementResultPanel
                  result={outcome.result}
                  targetSuccessRatePct={outcome.targetSuccessRatePct}
                  memberNicknames={memberNicknames}
                />
                <RealNominalToggle
                  value={resultMode}
                  onChange={setResultMode}
                />
                <MonteCarloPathsChart
                  paths={outcome.result.percentilePathsPence}
                  sampledPaths={outcome.result.sampledPathsPence}
                  mode={resultMode}
                  inflationRatePct={assumptions.inflationRatePct}
                  birthYear={ownBirthYear}
                />
                <MonteCarloExplainer />
                <PercentilePathsChart
                  paths={outcome.result.percentilePathsPence}
                  mode={resultMode}
                  inflationRatePct={assumptions.inflationRatePct}
                  birthYear={ownBirthYear}
                />
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40">
                  Lifetime value — total withdrawn over time
                </p>
                <LifetimeValueChart
                  paths={outcome.result.cumulativeIncomePathsPence}
                  mode={resultMode}
                  inflationRatePct={assumptions.inflationRatePct}
                  birthYear={ownBirthYear}
                />
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40">
                  Yearly income vs target
                </p>
                <IncomeVsTargetChart
                  paths={outcome.result.incomePathsPence}
                  targetPence={outcome.targetWithdrawalPence}
                  mode={resultMode}
                  inflationRatePct={assumptions.inflationRatePct}
                  birthYear={ownBirthYear}
                />
              </section>
            )}

            {outcome?.kind === 'earliest' && (
              <section className={sectionClassName} aria-label="Results">
                {isStale && <StaleResultsHint />}
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40">
                  Household success (both plans combined)
                </p>
                <SolverHeadline
                  result={outcome.solver}
                  targetSuccessRatePct={outcome.targetSuccessRatePct}
                  primaryUserId={ownUserId}
                />
                {outcome.solver.achievedSuccessRatePct !== undefined && (
                  <p
                    data-testid="achieved-success"
                    className="text-sm text-zinc-600 dark:text-zinc-300"
                  >
                    Achieved {outcome.solver.achievedSuccessRatePct.toFixed(1)}%
                    at that date
                  </p>
                )}
                {outcome.resultAtDate && (
                  <>
                    <RetirementResultPanel
                      result={outcome.resultAtDate}
                      targetSuccessRatePct={outcome.targetSuccessRatePct}
                      memberNicknames={memberNicknames}
                    />
                    <RealNominalToggle
                      value={resultMode}
                      onChange={setResultMode}
                    />
                    <MonteCarloPathsChart
                      paths={outcome.resultAtDate.percentilePathsPence}
                      sampledPaths={outcome.resultAtDate.sampledPathsPence}
                      mode={resultMode}
                      inflationRatePct={assumptions.inflationRatePct}
                      birthYear={ownBirthYear}
                    />
                    <MonteCarloExplainer />
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40">
                      Lifetime value — total withdrawn over time
                    </p>
                    <LifetimeValueChart
                      paths={outcome.resultAtDate.cumulativeIncomePathsPence}
                      mode={resultMode}
                      inflationRatePct={assumptions.inflationRatePct}
                      birthYear={ownBirthYear}
                    />
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40">
                      Yearly income vs target
                    </p>
                    <IncomeVsTargetChart
                      paths={outcome.resultAtDate.incomePathsPence}
                      targetPence={outcome.targetWithdrawalPence}
                      mode={resultMode}
                      inflationRatePct={assumptions.inflationRatePct}
                      birthYear={ownBirthYear}
                    />
                  </>
                )}
                {outcome.sensitivity && (
                  <SensitivityTable
                    result={outcome.sensitivity}
                    baseMonth={outcome.solver.earliestRetirementMonth}
                  />
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
