import { MonthId } from './monthId';

export enum AccountKind {
  INVESTMENT = 'INVESTMENT',
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
}

export enum InvestmentWrapper {
  SIPP = 'SIPP',
  COMPANY_PENSION = 'COMPANY_PENSION',
  ISA = 'ISA',
  GIA = 'GIA',
  CRYPTO = 'CRYPTO',
  OTHER = 'OTHER',
}

export interface AccountDefinition {
  accountId: string; // crypto.randomUUID()
  kind: AccountKind;
  wrapper?: InvestmentWrapper; // required when kind === INVESTMENT
  name: string;
  sortOrder: number;
  createdMonth: MonthId;
  archivedMonth?: MonthId; // hidden from this month onward; history untouched
}
