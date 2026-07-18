import { AccountKind, InvestmentWrapper } from '../types/accounts';
import { accountBadgeLabel } from './accountLabels';

describe('accountBadgeLabel', () => {
  it('uses the wrapper label for investments', () => {
    expect(
      accountBadgeLabel(AccountKind.INVESTMENT, InvestmentWrapper.SIPP)
    ).toBe('SIPP');
    expect(
      accountBadgeLabel(
        AccountKind.INVESTMENT,
        InvestmentWrapper.COMPANY_PENSION
      )
    ).toBe('Company pension');
  });

  it('falls back to the kind label', () => {
    expect(accountBadgeLabel(AccountKind.CASH)).toBe('Cash');
    expect(accountBadgeLabel(AccountKind.CREDIT_CARD)).toBe('Credit card');
    expect(accountBadgeLabel(AccountKind.INVESTMENT)).toBe('Investment');
  });
});
