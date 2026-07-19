export interface TaxBand {
  thresholdPence: number; // annual, ascending
  ratePct: number;
}

export enum WithdrawalStrategyKind {
  FIXED_REAL = 'FIXED_REAL',
  FIXED_PERCENT = 'FIXED_PERCENT',
  GUARDRAILS = 'GUARDRAILS',
  RMD = 'RMD',
}

export interface WithdrawalStrategy {
  kind: WithdrawalStrategyKind;
  // FIXED_PERCENT: annual withdrawal rate applied to the current portfolio.
  // GUARDRAILS: initial withdrawal rate; when undefined the initial desired
  // withdrawal divided by the starting portfolio is used instead.
  fixedPercentRatePct?: number;
  // GUARDRAILS: half-width of the no-change band around the initial rate as a
  // fraction (0.2 => guardrails at initialRate * 0.8 and initialRate * 1.2).
  guardrailWidthPct?: number;
}

export const DEFAULT_FIXED_PERCENT_RATE_PCT = 4;
export const DEFAULT_GUARDRAIL_WIDTH_PCT = 20;

export const DEFAULT_WITHDRAWAL_STRATEGY: WithdrawalStrategy = {
  kind: WithdrawalStrategyKind.FIXED_REAL,
};

export interface ReturnScenarios {
  lowerRealPct: number;
  centralRealPct: number;
  upperRealPct: number;
}

export interface HouseholdAssumptions {
  inflationRatePct: number; // default 2.5
  returnScenarios: ReturnScenarios; // defaults 2 / 5 / 7
  taxBands: TaxBand[]; // editable
  statePensionAnnualPence: number; // default full new state pension
  targetSuccessRatePct: number; // default 90
  defaultWithdrawalAnnualPence?: number; // remembered between runs
  defaultPlanToAge?: number;
  defaultWithdrawalStrategy?: WithdrawalStrategy; // remembered between runs
}

export interface SharedAssumptionsEntry {
  updatedAt: string;
  assumptions: HouseholdAssumptions;
}
