import { InvestmentWrapper } from './accounts';
import { HouseholdAssumptions, WithdrawalStrategy } from './assumptions';
import { MonthId } from './monthId';
import { ContributionPlan, MemberRetirementOverrides } from './profile';

export interface SimulationMember {
  userId: string;
  dateOfBirth: string;
  balancesPencePerWrapper: Partial<Record<InvestmentWrapper, number>>; // latest snapshot
  contributions: ContributionPlan;
  overrides: MemberRetirementOverrides;
  // Resolved by useRetirementModel so the engine never reaches into
  // profile/assumptions: this member's personal desired withdrawal and strategy.
  desiredWithdrawalAnnualPence: number;
  withdrawalStrategy: WithdrawalStrategy;
}

export interface AnnualReturn {
  year: number;
  realPct: number;
  nominalPct: number;
}

export interface SimulationInputs {
  members: SimulationMember[];
  startMonth: MonthId;
  retirementMonth: MonthId;
  planToAge: number;
  // Household FALLBACK (today's money, net). The per-member
  // desiredWithdrawalAnnualPence / withdrawalStrategy fields win; these remain
  // for back-compat consumers (sensitivity/solver) and the floor fallback.
  withdrawalAnnualPence: number;
  withdrawalStrategy?: WithdrawalStrategy; // household fallback; defaults to FIXED_REAL
  includeStatePension: boolean; // per-run toggle
  applyTax: boolean; // per-run toggle
  // Per-run toggle. The fraction-of-pot strategies (FIXED_PERCENT / RMD /
  // ENDOWMENT) draw a slice of the current portfolio and so never exhaust it
  // from withdrawals alone. By default their failure is delivered income
  // falling below the year's desired target (INCOME_BELOW_FLOOR). When this is
  // true they instead fail on exhaustion semantics like the other strategies:
  // the run fails only once the pot is effectively depleted.
  potExhaustedFailureForFractionStrategies?: boolean;
  assumptions: HouseholdAssumptions;
  returns: AnnualReturn[]; // injected dataset (swappable)
  runs: number; // default 5000
  seed: number;
}

export enum FailureKind {
  BRIDGE_EXHAUSTED = 'BRIDGE_EXHAUSTED',
  WEALTH_EXHAUSTED = 'WEALTH_EXHAUSTED',
  INCOME_BELOW_FLOOR = 'INCOME_BELOW_FLOOR',
}

export interface PercentileBand {
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

export interface PercentilePathPoint extends PercentileBand {
  year: number;
}

export interface SampledRunPath {
  runIndex: number;
  totalsPence: number[];
}

export interface MemberBreakdown {
  userId: string;
  successRatePct: number;
  incomePathsPence: PercentilePathPoint[];
  // Running total of net income withdrawn from retirement to each year (real
  // terms); index 0 is the retirement year at zero.
  cumulativeIncomePathsPence: PercentilePathPoint[];
  // Total net income withdrawn over the whole plan (the final cumulative
  // point), percentiled across runs.
  totalLifetimeWithdrawalsPence: PercentileBand;
  // Total lifetime withdrawals plus the ending pot, percentiled across runs.
  combinedTotalPence: PercentileBand;
  endingWealthPercentilesPence: PercentileBand;
  failures: {
    count: number;
    medianFailureYear?: number;
    byKind: Record<FailureKind, number>;
  };
}

export interface SimulationResult {
  successRatePct: number;
  endingWealthPercentilesPence: PercentileBand;
  percentilePathsPence: PercentilePathPoint[];
  // Per-year net household income (real terms). Constant by construction for
  // FIXED_REAL; varies for the balance-linked strategies.
  incomePathsPence: PercentilePathPoint[];
  // Running total of net household income withdrawn from retirement to each
  // year (real terms); index 0 is the retirement year at zero. The lifetime
  // value graphed over time.
  cumulativeIncomePathsPence: PercentilePathPoint[];
  // Total net household income withdrawn over the whole plan, percentiled
  // across runs (the "how much did this strategy let us take out" figure).
  totalLifetimeWithdrawalsPence: PercentileBand;
  // Total lifetime withdrawals plus what is left in the pot at the end, so
  // strategies that spend less but leave more stay comparable.
  combinedTotalPence: PercentileBand;
  // A bounded, deterministically sampled subset of individual run wealth
  // trajectories (by run index) for the Monte Carlo spaghetti chart.
  sampledPathsPence: SampledRunPath[];
  failures: {
    count: number;
    medianFailureYear?: number;
    byKind: Record<FailureKind, number>;
  };
  // Per-member rollup of the household result; the top-level fields above are
  // the household headline.
  memberBreakdowns: MemberBreakdown[];
}

export interface SolverResult {
  earliestRetirementMonth?: MonthId; // undefined if unachievable in window
  achievedSuccessRatePct?: number;
  agesAtRetirement: { [userId: string]: number };
}

export interface SensitivityResult {
  withdrawalPlus5k?: MonthId;
  withdrawalMinus5k?: MonthId;
  contributionsPlus500?: MonthId;
  contributionsMinus500?: MonthId;
}
