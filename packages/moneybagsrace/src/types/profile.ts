import { AccountDefinition, InvestmentWrapper } from './accounts';
import { SharedAssumptionsEntry } from './assumptions';
import { MonthId } from './monthId';

export interface ContributionStepChange {
  fromMonth: MonthId;
  wrapper: InvestmentWrapper;
  monthlyPence: number;
}

export interface ContributionPlan {
  monthlyPencePerWrapper: Partial<Record<InvestmentWrapper, number>>; // per member per wrapper
  stepChanges: ContributionStepChange[];
}

export interface MemberRetirementOverrides {
  nmpaAgeOverride?: number;
  statePensionAgeOverride?: number;
  statePensionAnnualPenceOverride?: number; // partial NI records
}

export interface ProfileData {
  schemaVersion: 1;
  accounts: AccountDefinition[];
  dateOfBirth?: string; // ISO
  contributions: ContributionPlan;
  overrides: MemberRetirementOverrides;
  sharedAssumptions?: SharedAssumptionsEntry;
}
