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
  withdrawalAnnualPence: number; // household, today's money, net
  withdrawalStrategy?: WithdrawalStrategy; // defaults to FIXED_REAL
  includeStatePension: boolean; // per-run toggle
  applyTax: boolean; // per-run toggle
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

export interface SimulationResult {
  successRatePct: number;
  endingWealthPercentilesPence: PercentileBand;
  percentilePathsPence: PercentilePathPoint[];
  // Per-year net household income (real terms). Constant by construction for
  // FIXED_REAL; varies for the balance-linked strategies.
  incomePathsPence: PercentilePathPoint[];
  // A bounded, deterministically sampled subset of individual run wealth
  // trajectories (by run index) for the Monte Carlo spaghetti chart.
  sampledPathsPence: SampledRunPath[];
  failures: {
    count: number;
    medianFailureYear?: number;
    byKind: Record<FailureKind, number>;
  };
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
