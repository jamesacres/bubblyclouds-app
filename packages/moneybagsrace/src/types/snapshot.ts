import { AccountKind, InvestmentWrapper } from './accounts';
import { MonthId } from './monthId';

export interface SnapshotAccount {
  // frozen as-of-month copy
  accountId: string;
  kind: AccountKind;
  wrapper?: InvestmentWrapper;
  name: string;
  balancePence: number; // credit cards: positive amount owed
}

export interface SharedAssetsEntry {
  houseValuePence: number;
  mortgageBalancePence: number;
  updatedAt: string; // ISO — last write wins across members
}

export interface MonthlySnapshotData {
  schemaVersion: 1;
  month: MonthId;
  enteredAt?: string;
  accounts: SnapshotAccount[];
  complete: boolean;
  shared?: SharedAssetsEntry;
}
