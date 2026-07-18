import { HouseholdAssumptions } from './assumptions';
import { MonthId } from './monthId';
import { ProfileData } from './profile';
import { MonthlySnapshotData, SharedAssetsEntry } from './snapshot';

// Merged view from the data provider
export interface HouseholdMember {
  userId: string;
  nickname: string;
  isUser: boolean;
  profile?: ProfileData;
}

export interface HouseholdMonth {
  month: MonthId;
  memberSnapshots: { [userId: string]: MonthlySnapshotData | undefined };
  effectiveShared?: SharedAssetsEntry;
  complete: boolean;
}

export interface HouseholdData {
  partyId?: string;
  members: HouseholdMember[];
  months: { [month: MonthId]: HouseholdMonth };
  orderedMonths: MonthId[];
  effectiveAssumptions: HouseholdAssumptions;
}
