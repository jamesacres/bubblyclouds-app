export interface TaxBand {
  thresholdPence: number; // annual, ascending
  ratePct: number;
}

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
}

export interface SharedAssumptionsEntry {
  updatedAt: string;
  assumptions: HouseholdAssumptions;
}
