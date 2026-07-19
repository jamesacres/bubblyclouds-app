export interface TaxBand {
  thresholdPence: number; // annual, ascending
  ratePct: number;
}

export enum WithdrawalStrategyKind {
  FIXED_REAL = 'FIXED_REAL',
  FIXED_PERCENT = 'FIXED_PERCENT',
  GUARDRAILS = 'GUARDRAILS',
  RMD = 'RMD',
  FIXED_REAL_NO_INFLATION_AFTER_LOSS = 'FIXED_REAL_NO_INFLATION_AFTER_LOSS',
  VANGUARD_DYNAMIC = 'VANGUARD_DYNAMIC',
  SPENDING_DECLINE = 'SPENDING_DECLINE',
  ENDOWMENT_TEN_YEAR_AVG = 'ENDOWMENT_TEN_YEAR_AVG',
  PROBABILITY_GUARDRAILS = 'PROBABILITY_GUARDRAILS',
}

export interface WithdrawalStrategy {
  kind: WithdrawalStrategyKind;
  // FIXED_PERCENT: annual withdrawal rate applied to the current portfolio.
  // GUARDRAILS: initial withdrawal rate; when undefined the initial desired
  // withdrawal divided by the starting portfolio is used instead.
  // VANGUARD_DYNAMIC / ENDOWMENT_TEN_YEAR_AVG: the target rate applied to the
  // portfolio (Vanguard before clamping, endowment against the smoothed average).
  fixedPercentRatePct?: number;
  // GUARDRAILS: half-width of the no-change band around the initial rate as a
  // fraction (0.2 => guardrails at initialRate * 0.8 and initialRate * 1.2).
  guardrailWidthPct?: number;
  // VANGUARD_DYNAMIC: floor on the year-on-year change in withdrawal as a
  // percent (-1.5 => this year's target may not fall below last year's * 0.985).
  vanguardFloorPct?: number;
  // VANGUARD_DYNAMIC: ceiling on the year-on-year change in withdrawal as a
  // percent (5 => this year's target may not rise above last year's * 1.05).
  vanguardCeilingPct?: number;
  // SPENDING_DECLINE: annual real change in desired spending as a percent
  // (-1 => spending tapers by 1% each year to model reduced late-life spending).
  spendingDeclinePctPerYear?: number;
  // ENDOWMENT_TEN_YEAR_AVG: number of years of portfolio history averaged
  // before applying the target rate, smoothing income against market swings.
  endowmentAveragingYears?: number;
  // PROBABILITY_GUARDRAILS: lower funded-ratio band as a percent; below it the
  // carried spend is cut (reinterpreted as a funded-ratio guardrail, not a
  // Monte Carlo success probability).
  probabilityGuardrailLowerPct?: number;
  // PROBABILITY_GUARDRAILS: upper funded-ratio band as a percent; above it the
  // carried spend is raised.
  probabilityGuardrailUpperPct?: number;
}

export const DEFAULT_FIXED_PERCENT_RATE_PCT = 4;
export const DEFAULT_GUARDRAIL_WIDTH_PCT = 20;
export const DEFAULT_VANGUARD_FLOOR_PCT = -1.5;
export const DEFAULT_VANGUARD_CEILING_PCT = 5;
export const DEFAULT_SPENDING_DECLINE_PCT_PER_YEAR = -1;
export const DEFAULT_ENDOWMENT_AVERAGING_YEARS = 10;
export const DEFAULT_PROBABILITY_GUARDRAIL_LOWER_PCT = 80;
export const DEFAULT_PROBABILITY_GUARDRAIL_UPPER_PCT = 99;

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
