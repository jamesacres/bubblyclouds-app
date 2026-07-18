import { AccountKind, InvestmentWrapper } from '../types/accounts';

export const KIND_LABELS: Record<AccountKind, string> = {
  [AccountKind.INVESTMENT]: 'Investment',
  [AccountKind.CASH]: 'Cash',
  [AccountKind.CREDIT_CARD]: 'Credit card',
};

export const WRAPPER_LABELS: Record<InvestmentWrapper, string> = {
  [InvestmentWrapper.SIPP]: 'SIPP',
  [InvestmentWrapper.COMPANY_PENSION]: 'Company pension',
  [InvestmentWrapper.ISA]: 'ISA',
  [InvestmentWrapper.GIA]: 'GIA',
  [InvestmentWrapper.CRYPTO]: 'Crypto',
  [InvestmentWrapper.OTHER]: 'Other',
};

export const accountBadgeLabel = (
  kind: AccountKind,
  wrapper?: InvestmentWrapper
): string =>
  kind === AccountKind.INVESTMENT && wrapper
    ? WRAPPER_LABELS[wrapper]
    : KIND_LABELS[kind];
