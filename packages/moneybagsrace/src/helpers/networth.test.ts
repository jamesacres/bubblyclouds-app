import { AccountKind, InvestmentWrapper } from '../types/accounts';
import { HouseholdData, HouseholdMonth } from '../types/household';
import { MonthId } from '../types/monthId';
import { MonthlySnapshotData, SnapshotAccount } from '../types/snapshot';
import {
  allTimeChange,
  buildNetWorthSeries,
  categoryBreakdownPence,
  householdNetWorthPence,
  memberTotalPence,
  monthOnMonthChange,
  NetWorthPoint,
  twelveMonthChange,
} from './networth';

const account = (
  kind: AccountKind,
  balancePence: number,
  name = 'Account'
): SnapshotAccount => ({
  accountId: `${name}-${kind}`,
  kind,
  wrapper: kind === AccountKind.INVESTMENT ? InvestmentWrapper.ISA : undefined,
  name,
  balancePence,
});

const snapshot = (
  month: MonthId,
  accounts: SnapshotAccount[]
): MonthlySnapshotData => ({
  schemaVersion: 1,
  month,
  accounts,
  complete: true,
});

const householdMonth = (
  month: MonthId,
  memberSnapshots: HouseholdMonth['memberSnapshots'],
  shared?: { houseValuePence: number; mortgageBalancePence: number }
): HouseholdMonth => ({
  month,
  memberSnapshots,
  effectiveShared: shared
    ? { ...shared, updatedAt: '2026-07-01T00:00:00.000Z' }
    : undefined,
  complete: true,
});

const household = (months: HouseholdMonth[]): HouseholdData => ({
  members: [],
  months: Object.fromEntries(months.map((month) => [month.month, month])),
  orderedMonths: months.map((month) => month.month),
  effectiveAssumptions: {
    inflationRatePct: 2.5,
    returnScenarios: { lowerRealPct: 2, centralRealPct: 5, upperRealPct: 7 },
    taxBands: [],
    statePensionAnnualPence: 0,
    targetSuccessRatePct: 90,
  },
});

describe('memberTotalPence', () => {
  it('sums investments and cash and subtracts credit cards', () => {
    const total = memberTotalPence(
      snapshot('2026-07', [
        account(AccountKind.INVESTMENT, 1_000_000),
        account(AccountKind.CASH, 200_000),
        account(AccountKind.CREDIT_CARD, 50_000),
      ])
    );
    expect(total).toBe(1_150_000);
  });

  it('is zero for an empty snapshot', () => {
    expect(memberTotalPence(snapshot('2026-07', []))).toBe(0);
  });

  it('can go negative when debt exceeds assets', () => {
    const total = memberTotalPence(
      snapshot('2026-07', [
        account(AccountKind.CASH, 10_000),
        account(AccountKind.CREDIT_CARD, 30_000),
      ])
    );
    expect(total).toBe(-20_000);
  });
});

describe('householdNetWorthPence', () => {
  it('sums member totals plus property equity', () => {
    const month = householdMonth(
      '2026-07',
      {
        alice: snapshot('2026-07', [account(AccountKind.INVESTMENT, 500_000)]),
        bob: snapshot('2026-07', [
          account(AccountKind.CASH, 100_000),
          account(AccountKind.CREDIT_CARD, 25_000),
        ]),
      },
      { houseValuePence: 30_000_000, mortgageBalancePence: 20_000_000 }
    );
    expect(householdNetWorthPence(month)).toBe(500_000 + 75_000 + 10_000_000);
  });

  it('omits the property term when shared assets are absent', () => {
    const month = householdMonth('2026-07', {
      alice: snapshot('2026-07', [account(AccountKind.CASH, 100_000)]),
    });
    expect(householdNetWorthPence(month)).toBe(100_000);
  });

  it('skips members without a snapshot', () => {
    const month = householdMonth('2026-07', {
      alice: snapshot('2026-07', [account(AccountKind.CASH, 100_000)]),
      bob: undefined,
    });
    expect(householdNetWorthPence(month)).toBe(100_000);
  });
});

describe('categoryBreakdownPence', () => {
  it('aggregates categories across members and derives property equity', () => {
    const month = householdMonth(
      '2026-07',
      {
        alice: snapshot('2026-07', [
          account(AccountKind.INVESTMENT, 500_000),
          account(AccountKind.CASH, 100_000),
        ]),
        bob: snapshot('2026-07', [
          account(AccountKind.INVESTMENT, 300_000),
          account(AccountKind.CREDIT_CARD, 40_000),
        ]),
      },
      { houseValuePence: 30_000_000, mortgageBalancePence: 20_000_000 }
    );
    expect(categoryBreakdownPence(month)).toEqual({
      investments: 800_000,
      cash: 100_000,
      creditCards: 40_000,
      propertyEquity: 10_000_000,
    });
  });

  it('returns zero property equity when shared assets are absent', () => {
    const month = householdMonth('2026-07', {
      alice: snapshot('2026-07', []),
    });
    expect(categoryBreakdownPence(month)).toEqual({
      investments: 0,
      cash: 0,
      creditCards: 0,
      propertyEquity: 0,
    });
  });
});

describe('buildNetWorthSeries', () => {
  const months = [
    householdMonth('2025-07', {
      alice: snapshot('2025-07', [account(AccountKind.CASH, 100_000)]),
      bob: snapshot('2025-07', [account(AccountKind.CASH, 50_000)]),
    }),
    householdMonth(
      '2026-07',
      {
        alice: snapshot('2026-07', [account(AccountKind.CASH, 120_000)]),
        bob: undefined,
      },
      { houseValuePence: 25_000_000, mortgageBalancePence: 20_000_000 }
    ),
  ];

  it('returns recorded values in nominal mode', () => {
    const series = buildNetWorthSeries(household(months), 'nominal', 2.5);
    expect(series).toEqual([
      {
        month: '2025-07',
        householdPence: 150_000,
        perMemberPence: { alice: 100_000, bob: 50_000 },
      },
      {
        month: '2026-07',
        householdPence: 5_120_000,
        perMemberPence: { alice: 120_000 },
      },
    ]);
  });

  it('restates earlier months into latest-month money in real mode', () => {
    const series = buildNetWorthSeries(household(months), 'real', 2.5);
    expect(series[0].householdPence).toBe(Math.round(150_000 * 1.025));
    expect(series[0].perMemberPence.alice).toBe(Math.round(100_000 * 1.025));
    expect(series[1].householdPence).toBe(5_120_000);
  });

  it('real mode with zero inflation equals nominal mode', () => {
    expect(buildNetWorthSeries(household(months), 'real', 0)).toEqual(
      buildNetWorthSeries(household(months), 'nominal', 0)
    );
  });

  it('returns an empty series for an empty household', () => {
    expect(buildNetWorthSeries(household([]), 'nominal', 2.5)).toEqual([]);
  });
});

describe('change stats', () => {
  const point = (month: MonthId, householdPence: number): NetWorthPoint => ({
    month,
    householdPence,
    perMemberPence: {},
  });

  it('monthOnMonthChange compares the latest month with the previous month', () => {
    const change = monthOnMonthChange([
      point('2026-05', 90_000),
      point('2026-06', 100_000),
      point('2026-07', 110_000),
    ]);
    expect(change).toEqual({ absolutePence: 10_000, percent: 10 });
  });

  it('monthOnMonthChange is undefined when the previous month is missing', () => {
    expect(
      monthOnMonthChange([point('2026-05', 90_000), point('2026-07', 110_000)])
    ).toBeUndefined();
  });

  it('twelveMonthChange compares with exactly twelve months earlier', () => {
    const change = twelveMonthChange([
      point('2025-07', 200_000),
      point('2026-06', 240_000),
      point('2026-07', 250_000),
    ]);
    expect(change).toEqual({ absolutePence: 50_000, percent: 25 });
  });

  it('twelveMonthChange is undefined without a point twelve months back', () => {
    expect(
      twelveMonthChange([point('2026-06', 240_000), point('2026-07', 250_000)])
    ).toBeUndefined();
  });

  it('allTimeChange compares the first and latest points', () => {
    const change = allTimeChange([
      point('2024-01', 100_000),
      point('2025-01', 160_000),
      point('2026-07', 180_000),
    ]);
    expect(change).toEqual({ absolutePence: 80_000, percent: 80 });
  });

  it('reports negative changes', () => {
    const change = monthOnMonthChange([
      point('2026-06', 100_000),
      point('2026-07', 80_000),
    ]);
    expect(change).toEqual({ absolutePence: -20_000, percent: -20 });
  });

  it('is undefined with fewer than two points', () => {
    expect(monthOnMonthChange([point('2026-07', 100_000)])).toBeUndefined();
    expect(twelveMonthChange([])).toBeUndefined();
    expect(allTimeChange([point('2026-07', 100_000)])).toBeUndefined();
  });

  it('is undefined when the base value is zero', () => {
    const series = [point('2026-06', 0), point('2026-07', 100_000)];
    expect(monthOnMonthChange(series)).toBeUndefined();
    expect(allTimeChange(series)).toBeUndefined();
  });
});
