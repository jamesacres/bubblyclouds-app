import React, { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import {
  DEFAULT_ASSUMPTIONS,
  MoneyBagsDataContext,
  MoneyBagsDataContextValue,
} from '../providers/MoneyBagsDataProvider';
import { AccountKind, InvestmentWrapper } from '../types/accounts';
import { DEFAULT_WITHDRAWAL_STRATEGY } from '../types/assumptions';
import { HouseholdData, HouseholdMember } from '../types/household';
import { ProfileData } from '../types/profile';
import { MonthlySnapshotData } from '../types/snapshot';
import { useRetirementModel } from './useRetirementModel';

const profileWith = (overrides: Partial<ProfileData>): ProfileData => ({
  schemaVersion: 1,
  accounts: [],
  contributions: { monthlyPencePerWrapper: {}, stepChanges: [] },
  overrides: {},
  ...overrides,
});

const snapshot = (
  month: string,
  accounts: MonthlySnapshotData['accounts']
): MonthlySnapshotData => ({
  schemaVersion: 1,
  month,
  accounts,
  complete: true,
});

const buildValue = (
  members: HouseholdMember[],
  months: HouseholdData['months']
): MoneyBagsDataContextValue => ({
  household: {
    partyId: 'party-1',
    members,
    months,
    orderedMonths: Object.keys(months).sort(),
    effectiveAssumptions: DEFAULT_ASSUMPTIONS,
  },
  ownUserId: 'user-1',
  isLoading: false,
  isPartnerLoading: false,
  refresh: jest.fn(),
  saveOwnSnapshot: jest.fn(),
  saveOwnProfile: jest.fn(),
  saveSharedAssumptions: jest.fn(),
});

const renderModel = (value: MoneyBagsDataContextValue) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MoneyBagsDataContext.Provider value={value}>
      {children}
    </MoneyBagsDataContext.Provider>
  );
  return renderHook(() => useRetirementModel(), { wrapper });
};

describe('useRetirementModel', () => {
  const jamesContributions = {
    monthlyPencePerWrapper: { [InvestmentWrapper.SIPP]: 50_000 },
    stepChanges: [],
  };
  const jamesOverrides = { nmpaAgeOverride: 58 };
  const james: HouseholdMember = {
    userId: 'user-1',
    nickname: 'James',
    isUser: true,
    profile: profileWith({
      dateOfBirth: '1990-01-01',
      contributions: jamesContributions,
      overrides: jamesOverrides,
    }),
  };
  const maySnapshot = snapshot('2026-05', [
    {
      accountId: 'sipp-1',
      kind: AccountKind.INVESTMENT,
      wrapper: InvestmentWrapper.SIPP,
      name: 'SIPP one',
      balancePence: 100_000,
    },
    {
      accountId: 'sipp-2',
      kind: AccountKind.INVESTMENT,
      wrapper: InvestmentWrapper.SIPP,
      name: 'SIPP two',
      balancePence: 25_000,
    },
    {
      accountId: 'isa',
      kind: AccountKind.INVESTMENT,
      wrapper: InvestmentWrapper.ISA,
      name: 'ISA',
      balancePence: 50_000,
    },
    {
      accountId: 'unwrapped',
      kind: AccountKind.INVESTMENT,
      name: 'No wrapper',
      balancePence: 10_000,
    },
    {
      accountId: 'cash',
      kind: AccountKind.CASH,
      name: 'Bank',
      balancePence: 999_999,
    },
    {
      accountId: 'card',
      kind: AccountKind.CREDIT_CARD,
      name: 'Card',
      balancePence: 20_000,
    },
  ]);

  it('sums investment balances by wrapper from each member latest snapshot', () => {
    const sam: HouseholdMember = {
      userId: 'user-2',
      nickname: 'Sam',
      isUser: false,
      profile: profileWith({ dateOfBirth: '1992-02-02' }),
    };
    const juneSnapshot = snapshot('2026-06', [
      {
        accountId: 'sam-isa',
        kind: AccountKind.INVESTMENT,
        wrapper: InvestmentWrapper.ISA,
        name: 'Sam ISA',
        balancePence: 75_000,
      },
    ]);
    const value = buildValue([james, sam], {
      '2026-05': {
        month: '2026-05',
        memberSnapshots: { 'user-1': maySnapshot, 'user-2': undefined },
        complete: false,
      },
      '2026-06': {
        month: '2026-06',
        memberSnapshots: { 'user-1': undefined, 'user-2': juneSnapshot },
        complete: false,
      },
    });
    const { result } = renderModel(value);

    // Latest month with any snapshots
    expect(result.current.startMonth).toBe('2026-06');
    expect(result.current.readiness).toEqual({
      ready: true,
      missingDob: [],
      hasSnapshots: true,
    });
    expect(result.current.assumptions).toEqual(DEFAULT_ASSUMPTIONS);

    const [jamesMember, samMember] = result.current.members;
    // James has no June snapshot; his May balances are used. Cash and
    // credit cards are excluded; unwrapped investments count as OTHER.
    expect(jamesMember).toEqual({
      userId: 'user-1',
      dateOfBirth: '1990-01-01',
      balancesPencePerWrapper: {
        [InvestmentWrapper.SIPP]: 125_000,
        [InvestmentWrapper.ISA]: 50_000,
        [InvestmentWrapper.OTHER]: 10_000,
      },
      contributions: jamesContributions,
      overrides: jamesOverrides,
      desiredWithdrawalAnnualPence: 0,
      withdrawalStrategy: DEFAULT_WITHDRAWAL_STRATEGY,
    });
    expect(samMember.balancesPencePerWrapper).toEqual({
      [InvestmentWrapper.ISA]: 75_000,
    });
  });

  it('lists members without a date of birth and is not ready', () => {
    const sam: HouseholdMember = {
      userId: 'user-2',
      nickname: 'Sam',
      isUser: false,
      profile: profileWith({}),
    };
    const value = buildValue([james, sam], {
      '2026-05': {
        month: '2026-05',
        memberSnapshots: { 'user-1': maySnapshot, 'user-2': undefined },
        complete: false,
      },
    });
    const { result } = renderModel(value);

    expect(result.current.readiness).toEqual({
      ready: false,
      missingDob: ['Sam'],
      hasSnapshots: true,
    });
    expect(result.current.members.map((member) => member.userId)).toEqual([
      'user-1',
    ]);
  });

  it('is not ready when no snapshots exist', () => {
    const value = buildValue([james], {});
    const { result } = renderModel(value);

    expect(result.current.startMonth).toBeUndefined();
    expect(result.current.readiness).toEqual({
      ready: false,
      missingDob: [],
      hasSnapshots: false,
    });
  });

  it('splits a legacy household default equally across members without overrides', () => {
    const withoutOverrides: HouseholdMember = {
      userId: 'user-1',
      nickname: 'James',
      isUser: true,
      profile: profileWith({ dateOfBirth: '1990-01-01' }),
    };
    const sam: HouseholdMember = {
      userId: 'user-2',
      nickname: 'Sam',
      isUser: false,
      profile: profileWith({ dateOfBirth: '1992-02-02' }),
    };
    const value = buildValue([withoutOverrides, sam], {
      '2026-05': {
        month: '2026-05',
        memberSnapshots: { 'user-1': maySnapshot, 'user-2': undefined },
        complete: false,
      },
    });
    value.household.effectiveAssumptions = {
      ...DEFAULT_ASSUMPTIONS,
      defaultWithdrawalAnnualPence: 4_000_000,
    };
    const { result } = renderModel(value);

    const [jamesMember, samMember] = result.current.members;
    expect(jamesMember.desiredWithdrawalAnnualPence).toBe(2_000_000);
    expect(samMember.desiredWithdrawalAnnualPence).toBe(2_000_000);
    expect(result.current.householdDesiredWithdrawalAnnualPence).toBe(
      4_000_000
    );
  });

  it('uses a per-member override in place of the household split', () => {
    const withOverride: HouseholdMember = {
      userId: 'user-1',
      nickname: 'James',
      isUser: true,
      profile: profileWith({
        dateOfBirth: '1990-01-01',
        overrides: { desiredWithdrawalAnnualPence: 3_600_000 },
      }),
    };
    const sam: HouseholdMember = {
      userId: 'user-2',
      nickname: 'Sam',
      isUser: false,
      profile: profileWith({ dateOfBirth: '1992-02-02' }),
    };
    const value = buildValue([withOverride, sam], {
      '2026-05': {
        month: '2026-05',
        memberSnapshots: { 'user-1': maySnapshot, 'user-2': undefined },
        complete: false,
      },
    });
    value.household.effectiveAssumptions = {
      ...DEFAULT_ASSUMPTIONS,
      defaultWithdrawalAnnualPence: 4_000_000,
    };
    const { result } = renderModel(value);

    const [jamesMember, samMember] = result.current.members;
    // James's own plan target wins; Sam still draws the equal split of the
    // legacy household default (4,000,000 / 2 member count).
    expect(jamesMember.desiredWithdrawalAnnualPence).toBe(3_600_000);
    expect(samMember.desiredWithdrawalAnnualPence).toBe(2_000_000);
    expect(result.current.householdDesiredWithdrawalAnnualPence).toBe(
      5_600_000
    );
  });
});
