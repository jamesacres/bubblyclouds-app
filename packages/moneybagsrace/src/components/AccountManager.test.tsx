import { fireEvent, render, screen } from '@testing-library/react';
import {
  AccountDefinition,
  AccountKind,
  InvestmentWrapper,
} from '../types/accounts';
import { AccountManager } from './AccountManager';

const account = (
  overrides: Partial<AccountDefinition> & { accountId: string }
): AccountDefinition => ({
  kind: AccountKind.CASH,
  name: overrides.accountId,
  sortOrder: 0,
  createdMonth: '2026-01',
  ...overrides,
});

describe('AccountManager', () => {
  const currentMonth = '2026-07';
  const onChange = jest.fn();

  const accounts: AccountDefinition[] = [
    account({
      accountId: 'isa',
      name: 'Vanguard ISA',
      kind: AccountKind.INVESTMENT,
      wrapper: InvestmentWrapper.ISA,
      sortOrder: 0,
    }),
    account({ accountId: 'monzo', name: 'Monzo', sortOrder: 1 }),
    account({
      accountId: 'old',
      name: 'Closed bank',
      sortOrder: 2,
      archivedMonth: '2026-03',
    }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists active accounts and hides archived ones behind a collapsed section', () => {
    render(
      <AccountManager
        accounts={accounts}
        currentMonth={currentMonth}
        onChange={onChange}
      />
    );
    expect(screen.getByDisplayValue('Vanguard ISA')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Monzo')).toBeInTheDocument();
    expect(screen.queryByText('Closed bank')).not.toBeInTheDocument();
    expect(screen.getByText('Archived (1)')).toBeInTheDocument();
  });

  it('expands the archived section and unarchives', () => {
    render(
      <AccountManager
        accounts={accounts}
        currentMonth={currentMonth}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText('Archived (1)'));
    expect(screen.getByText('Closed bank')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Unarchive Closed bank'));
    const updated: AccountDefinition[] = onChange.mock.calls[0][0];
    const closed = updated.find((candidate) => candidate.accountId === 'old');
    expect(closed?.archivedMonth).toBeUndefined();
  });

  it('archives an active account as of the current month', () => {
    render(
      <AccountManager
        accounts={accounts}
        currentMonth={currentMonth}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByLabelText('Archive Monzo'));
    const updated: AccountDefinition[] = onChange.mock.calls[0][0];
    expect(
      updated.find((candidate) => candidate.accountId === 'monzo')
        ?.archivedMonth
    ).toBe(currentMonth);
  });

  it('renames an account', () => {
    render(
      <AccountManager
        accounts={accounts}
        currentMonth={currentMonth}
        onChange={onChange}
      />
    );
    fireEvent.change(screen.getByLabelText('Rename Monzo'), {
      target: { value: 'Starling' },
    });
    const updated: AccountDefinition[] = onChange.mock.calls[0][0];
    expect(
      updated.find((candidate) => candidate.accountId === 'monzo')?.name
    ).toBe('Starling');
  });

  it('reorders active accounts with the down button', () => {
    render(
      <AccountManager
        accounts={accounts}
        currentMonth={currentMonth}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByLabelText('Move Vanguard ISA down'));
    const updated: AccountDefinition[] = onChange.mock.calls[0][0];
    const sortOrderOf = (accountId: string) =>
      updated.find((candidate) => candidate.accountId === accountId)?.sortOrder;
    expect(sortOrderOf('isa')).toBe(1);
    expect(sortOrderOf('monzo')).toBe(0);
  });

  it('disables the up button on the first row', () => {
    render(
      <AccountManager
        accounts={accounts}
        currentMonth={currentMonth}
        onChange={onChange}
      />
    );
    expect(screen.getByLabelText('Move Vanguard ISA up')).toBeDisabled();
    expect(screen.getByLabelText('Move Monzo down')).toBeDisabled();
  });

  it('adds an investment account with the picked wrapper', () => {
    render(
      <AccountManager
        accounts={accounts}
        currentMonth={currentMonth}
        onChange={onChange}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('Account name'), {
      target: { value: 'New SIPP' },
    });
    fireEvent.change(screen.getByLabelText('Wrapper'), {
      target: { value: InvestmentWrapper.SIPP },
    });
    fireEvent.click(screen.getByText('Add'));
    const updated: AccountDefinition[] = onChange.mock.calls[0][0];
    expect(updated).toHaveLength(4);
    const added = updated[3];
    expect(added.name).toBe('New SIPP');
    expect(added.kind).toBe(AccountKind.INVESTMENT);
    expect(added.wrapper).toBe(InvestmentWrapper.SIPP);
    expect(added.createdMonth).toBe(currentMonth);
    expect(added.sortOrder).toBe(3);
    expect(added.accountId).toBeTruthy();
  });

  it('hides the wrapper picker and omits wrapper for non-investment accounts', () => {
    render(
      <AccountManager
        accounts={accounts}
        currentMonth={currentMonth}
        onChange={onChange}
      />
    );
    fireEvent.change(screen.getByLabelText('Account type'), {
      target: { value: AccountKind.CREDIT_CARD },
    });
    expect(screen.queryByLabelText('Wrapper')).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Account name'), {
      target: { value: 'Amex' },
    });
    fireEvent.click(screen.getByText('Add'));
    const updated: AccountDefinition[] = onChange.mock.calls[0][0];
    expect(updated[3].kind).toBe(AccountKind.CREDIT_CARD);
    expect(updated[3].wrapper).toBeUndefined();
  });

  it('does not add an account without a name', () => {
    render(
      <AccountManager
        accounts={[]}
        currentMonth={currentMonth}
        onChange={onChange}
      />
    );
    expect(
      screen.getByText('No accounts yet — add your first account below.')
    ).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeDisabled();
    fireEvent.click(screen.getByText('Add'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
