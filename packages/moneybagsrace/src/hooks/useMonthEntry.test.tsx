import React, { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import {
  DEFAULT_ASSUMPTIONS,
  MoneyBagsDataContext,
  MoneyBagsDataContextValue,
} from '../providers/MoneyBagsDataProvider';
import { AccountKind, InvestmentWrapper } from '../types/accounts';
import { HouseholdData, HouseholdMonth } from '../types/household';
import { ProfileData } from '../types/profile';
import { MonthlySnapshotData, SharedAssetsEntry } from '../types/snapshot';
import { useMonthEntry } from './useMonthEntry';

const snapshot = (
  month: string,
  overrides: Partial<MonthlySnapshotData> = {}
): MonthlySnapshotData => ({
  schemaVersion: 1,
  month,
  accounts: [],
  complete: false,
  ...overrides,
});

const profile: ProfileData = {
  schemaVersion: 1,
  accounts: [
    {
      accountId: 'isa',
      kind: AccountKind.INVESTMENT,
      wrapper: InvestmentWrapper.ISA,
      name: 'ISA',
      sortOrder: 1,
      createdMonth: '2026-01',
    },
    {
      accountId: 'new-cash',
      kind: AccountKind.CASH,
      name: 'New bank',
      sortOrder: 2,
      createdMonth: '2026-06',
    },
    {
      accountId: 'old-cash',
      kind: AccountKind.CASH,
      name: 'Closed bank',
      sortOrder: 3,
      createdMonth: '2026-01',
      archivedMonth: '2026-06',
    },
  ],
  contributions: { monthlyPencePerWrapper: {}, stepChanges: [] },
  overrides: {},
};

const mayShared: SharedAssetsEntry = {
  houseValuePence: 30_000_000,
  mortgageBalancePence: 10_000_000,
  updatedAt: '2026-05-17T00:00:00Z',
};

const maySnapshot = snapshot('2026-05', {
  enteredAt: '2026-05-17T00:00:00Z',
  complete: true,
  shared: mayShared,
  accounts: [
    {
      accountId: 'isa',
      kind: AccountKind.INVESTMENT,
      wrapper: InvestmentWrapper.ISA,
      name: 'ISA',
      balancePence: 100_000,
    },
    {
      accountId: 'old-cash',
      kind: AccountKind.CASH,
      name: 'Closed bank',
      balancePence: 50_000,
    },
  ],
});

const householdMonth = (
  month: string,
  memberSnapshots: { [userId: string]: MonthlySnapshotData | undefined },
  effectiveShared?: SharedAssetsEntry,
  complete = false
): HouseholdMonth => ({ month, memberSnapshots, effectiveShared, complete });

const buildValue = (
  months: { [month: string]: HouseholdMonth },
  overrides: Partial<MoneyBagsDataContextValue> = {}
): MoneyBagsDataContextValue => {
  const household: HouseholdData = {
    partyId: 'party-1',
    members: [
      { userId: 'user-1', nickname: 'James', isUser: true, profile },
      { userId: 'user-2', nickname: 'Sam', isUser: false },
    ],
    months,
    orderedMonths: Object.keys(months).sort(),
    effectiveAssumptions: DEFAULT_ASSUMPTIONS,
  };
  return {
    household,
    ownUserId: 'user-1',
    ownProfile: profile,
    isLoading: false,
    isPartnerLoading: false,
    refresh: jest.fn(),
    saveOwnSnapshot: jest.fn().mockResolvedValue(undefined),
    saveOwnProfile: jest.fn(),
    saveSharedAssumptions: jest.fn(),
    ...overrides,
  };
};

const renderMonthEntry = (
  value: MoneyBagsDataContextValue,
  month = '2026-06'
) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MoneyBagsDataContext.Provider value={value}>
      {children}
    </MoneyBagsDataContext.Provider>
  );
  return renderHook(({ month: m }: { month: string }) => useMonthEntry(m), {
    wrapper,
    initialProps: { month },
  });
};

describe('useMonthEntry', () => {
  it('pre-fills active accounts from the previous month, honouring the add/archive lifecycle', () => {
    const value = buildValue({
      '2026-05': householdMonth(
        '2026-05',
        { 'user-1': maySnapshot, 'user-2': undefined },
        mayShared
      ),
    });
    const { result } = renderMonthEntry(value);

    // Archived account excluded, new account included at zero, existing
    // account pre-filled from May.
    expect(result.current.accounts).toEqual([
      {
        accountId: 'isa',
        kind: AccountKind.INVESTMENT,
        wrapper: InvestmentWrapper.ISA,
        name: 'ISA',
        balancePence: 100_000,
      },
      {
        accountId: 'new-cash',
        kind: AccountKind.CASH,
        wrapper: undefined,
        name: 'New bank',
        balancePence: 0,
      },
    ]);
  });

  it('merges a newly-added profile account into an existing snapshot month', async () => {
    // June snapshot was saved before "new-cash" (createdMonth 2026-06) was
    // added to the profile, so it holds only the frozen "isa" balance.
    const juneSnapshot = snapshot('2026-06', {
      enteredAt: '2026-06-17T00:00:00Z',
      accounts: [
        {
          accountId: 'isa',
          kind: AccountKind.INVESTMENT,
          wrapper: InvestmentWrapper.ISA,
          name: 'ISA',
          balancePence: 120_000,
        },
      ],
    });
    const value = buildValue({
      '2026-05': householdMonth(
        '2026-05',
        { 'user-1': maySnapshot, 'user-2': undefined },
        mayShared
      ),
      '2026-06': householdMonth(
        '2026-06',
        { 'user-1': juneSnapshot, 'user-2': undefined },
        mayShared
      ),
    });
    const { result } = renderMonthEntry(value);

    // Frozen "isa" balance preserved; the new account appended and editable.
    expect(result.current.accounts).toEqual([
      {
        accountId: 'isa',
        kind: AccountKind.INVESTMENT,
        wrapper: InvestmentWrapper.ISA,
        name: 'ISA',
        balancePence: 120_000,
      },
      {
        accountId: 'new-cash',
        kind: AccountKind.CASH,
        wrapper: undefined,
        name: 'New bank',
        balancePence: 0,
      },
    ]);

    act(() => {
      result.current.setBalance('new-cash', 42_000);
    });
    expect(
      result.current.accounts.find(
        (account) => account.accountId === 'new-cash'
      )?.balancePence
    ).toBe(42_000);

    await act(async () => {
      await result.current.save();
    });

    const [, data] = (value.saveOwnSnapshot as jest.Mock).mock.calls[0];
    expect(data.accounts).toEqual([
      {
        accountId: 'isa',
        kind: AccountKind.INVESTMENT,
        wrapper: InvestmentWrapper.ISA,
        name: 'ISA',
        balancePence: 120_000,
      },
      {
        accountId: 'new-cash',
        kind: AccountKind.CASH,
        wrapper: undefined,
        name: 'New bank',
        balancePence: 42_000,
      },
    ]);
  });

  it('shows the archived account in its own historical month', () => {
    const value = buildValue({
      '2026-05': householdMonth(
        '2026-05',
        { 'user-1': maySnapshot, 'user-2': undefined },
        mayShared
      ),
    });
    const { result } = renderMonthEntry(value, '2026-05');

    // Frozen snapshot list wins over the profile definitions.
    expect(result.current.accounts.map((account) => account.accountId)).toEqual(
      ['isa', 'old-cash']
    );
  });

  it('pre-fills shared values from the previous month effective entry without an updatedAt', () => {
    const value = buildValue({
      '2026-05': householdMonth(
        '2026-05',
        { 'user-1': maySnapshot, 'user-2': undefined },
        mayShared
      ),
    });
    const { result } = renderMonthEntry(value);

    expect(result.current.sharedHouseValuePence).toBe(30_000_000);
    expect(result.current.sharedMortgageBalancePence).toBe(10_000_000);
    expect(result.current.sharedUpdatedAt).toBeUndefined();
  });

  it('shows the current month effective shared entry with its updatedAt', () => {
    const juneShared: SharedAssetsEntry = {
      houseValuePence: 31_000_000,
      mortgageBalancePence: 9_000_000,
      updatedAt: '2026-06-17T00:00:00Z',
    };
    const value = buildValue({
      '2026-06': householdMonth(
        '2026-06',
        {
          'user-1': undefined,
          'user-2': snapshot('2026-06', { shared: juneShared }),
        },
        juneShared
      ),
    });
    const { result } = renderMonthEntry(value);

    expect(result.current.sharedHouseValuePence).toBe(31_000_000);
    expect(result.current.sharedUpdatedAt).toBe('2026-06-17T00:00:00Z');
  });

  it('saves edited balances using the live account list', async () => {
    const value = buildValue({
      '2026-05': householdMonth(
        '2026-05',
        { 'user-1': maySnapshot, 'user-2': undefined },
        mayShared
      ),
    });
    const { result } = renderMonthEntry(value);

    expect(result.current.isDirty).toBe(false);
    act(() => {
      result.current.setBalance('isa', 123_456);
    });
    expect(result.current.isDirty).toBe(true);
    expect(result.current.accounts[0].balancePence).toBe(123_456);

    await act(async () => {
      await result.current.save();
    });

    expect(value.saveOwnSnapshot).toHaveBeenCalledTimes(1);
    const [month, data] = (value.saveOwnSnapshot as jest.Mock).mock.calls[0];
    expect(month).toBe('2026-06');
    expect(data.schemaVersion).toBe(1);
    expect(data.month).toBe('2026-06');
    expect(typeof data.enteredAt).toBe('string');
    expect(data.complete).toBe(true);
    expect(data.accounts).toEqual([
      {
        accountId: 'isa',
        kind: AccountKind.INVESTMENT,
        wrapper: InvestmentWrapper.ISA,
        name: 'ISA',
        balancePence: 123_456,
      },
      {
        accountId: 'new-cash',
        kind: AccountKind.CASH,
        wrapper: undefined,
        name: 'New bank',
        balancePence: 0,
      },
    ]);
    // Shared was not edited by this member, so no shared entry is written.
    expect(data.shared).toBeUndefined();
    expect(result.current.isDirty).toBe(false);
  });

  it('writes a freshly stamped shared entry only when this member edited it', async () => {
    const value = buildValue({
      '2026-05': householdMonth(
        '2026-05',
        { 'user-1': maySnapshot, 'user-2': undefined },
        mayShared
      ),
    });
    const { result } = renderMonthEntry(value);

    const before = Date.now();
    act(() => {
      result.current.setShared(32_000_000, 8_000_000);
    });
    expect(result.current.sharedHouseValuePence).toBe(32_000_000);

    await act(async () => {
      await result.current.save();
    });

    const [, data] = (value.saveOwnSnapshot as jest.Mock).mock.calls[0];
    expect(data.shared.houseValuePence).toBe(32_000_000);
    expect(data.shared.mortgageBalancePence).toBe(8_000_000);
    expect(Date.parse(data.shared.updatedAt)).toBeGreaterThanOrEqual(before);
  });

  it('carries the existing own shared entry forward untouched when saving without edits', async () => {
    const value = buildValue({
      '2026-05': householdMonth(
        '2026-05',
        { 'user-1': maySnapshot, 'user-2': undefined },
        mayShared,
        false
      ),
    });
    const { result } = renderMonthEntry(value, '2026-05');

    await act(async () => {
      await result.current.save();
    });

    const [, data] = (value.saveOwnSnapshot as jest.Mock).mock.calls[0];
    expect(data.shared).toEqual(mayShared);
    expect(data.enteredAt).toBe('2026-05-17T00:00:00Z');
  });

  it('reports partner completion from snapshot existence', () => {
    const value = buildValue({
      '2026-06': householdMonth(
        '2026-06',
        {
          'user-1': snapshot('2026-06'),
          'user-2': snapshot('2026-06', { shared: mayShared }),
        },
        mayShared
      ),
    });
    const { result } = renderMonthEntry(value);

    expect(result.current.partnerCompletion).toEqual([
      { userId: 'user-2', nickname: 'Sam', entered: true },
    ]);
  });

  it('reports a partner as not entered when they have no snapshot', () => {
    const value = buildValue({
      '2026-06': householdMonth(
        '2026-06',
        {
          'user-1': snapshot('2026-06'),
          'user-2': undefined,
        },
        mayShared
      ),
    });
    const { result } = renderMonthEntry(value);

    expect(result.current.partnerCompletion).toEqual([
      { userId: 'user-2', nickname: 'Sam', entered: false },
    ]);
  });

  it('resets pending edits when the month changes', () => {
    const value = buildValue({
      '2026-05': householdMonth(
        '2026-05',
        { 'user-1': maySnapshot, 'user-2': undefined },
        mayShared
      ),
    });
    const { result, rerender } = renderMonthEntry(value);

    act(() => {
      result.current.setBalance('isa', 999);
    });
    expect(result.current.isDirty).toBe(true);

    rerender({ month: '2026-07' });
    expect(result.current.isDirty).toBe(false);
    expect(
      result.current.accounts.find((account) => account.accountId === 'isa')
        ?.balancePence
    ).toBe(100_000);
  });
});
