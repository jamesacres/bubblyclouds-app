import { InvestmentWrapper } from './accounts';
import { HouseholdAssumptions } from './assumptions';
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
}

export interface SimulationResult {
  successRatePct: number;
  endingWealthPercentilesPence: {
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
  percentilePathsPence: {
    year: number;
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  }[];
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
