import { AccountKind } from '../types/accounts';
import { HouseholdData, HouseholdMonth } from '../types/household';
import { MonthId } from '../types/monthId';
import { MonthlySnapshotData, SnapshotAccount } from '../types/snapshot';
import { monthlyRateFromAnnualPct } from '../engine/projection';
import { monthsBetween } from './monthId';

const signedBalancePence = (account: SnapshotAccount): number =>
  account.kind === AccountKind.CREDIT_CARD
    ? -account.balancePence
    : account.balancePence;

// member_total = Σ investments + Σ cash − Σ credit_cards (spec §2.4)
export const memberTotalPence = (snapshot: MonthlySnapshotData): number =>
  snapshot.accounts.reduce(
    (total, account) => total + signedBalancePence(account),
    0
  );

const propertyEquityPence = (month: HouseholdMonth): number =>
  month.effectiveShared
    ? month.effectiveShared.houseValuePence -
      month.effectiveShared.mortgageBalancePence
    : 0;

// household = Σ member_totals + (house_value − mortgage_balance) (spec §2.4);
// no property term when shared assets are absent
export const householdNetWorthPence = (month: HouseholdMonth): number =>
  Object.values(month.memberSnapshots).reduce(
    (total, snapshot) => total + (snapshot ? memberTotalPence(snapshot) : 0),
    propertyEquityPence(month)
  );

export interface CategoryBreakdownPence {
  investments: number;
  cash: number;
  creditCards: number; // positive amount owed
  propertyEquity: number;
}

export const categoryBreakdownPence = (
  month: HouseholdMonth
): CategoryBreakdownPence => {
  const breakdown: CategoryBreakdownPence = {
    investments: 0,
    cash: 0,
    creditCards: 0,
    propertyEquity: propertyEquityPence(month),
  };
  for (const snapshot of Object.values(month.memberSnapshots)) {
    for (const account of snapshot?.accounts ?? []) {
      switch (account.kind) {
        case AccountKind.INVESTMENT:
          breakdown.investments += account.balancePence;
          break;
        case AccountKind.CASH:
          breakdown.cash += account.balancePence;
          break;
        case AccountKind.CREDIT_CARD:
          breakdown.creditCards += account.balancePence;
          break;
      }
    }
  }
  return breakdown;
};

export interface NetWorthPoint {
  month: MonthId;
  householdPence: number;
  perMemberPence: { [userId: string]: number };
}

// mode 'nominal': values as recorded. mode 'real': each month's value is
// restated in the latest month's money by compounding the monthly inflation
// factor over the months-distance to the latest month
export const buildNetWorthSeries = (
  household: HouseholdData,
  mode: 'real' | 'nominal',
  inflationRatePct: number
): NetWorthPoint[] => {
  const { orderedMonths } = household;
  if (orderedMonths.length === 0) {
    return [];
  }
  const latestMonth = orderedMonths[orderedMonths.length - 1];
  const monthlyInflationFactor = 1 + monthlyRateFromAnnualPct(inflationRatePct);
  return orderedMonths.flatMap((monthId) => {
    const month = household.months[monthId];
    if (!month) {
      return [];
    }
    const factor =
      mode === 'real'
        ? monthlyInflationFactor ** monthsBetween(monthId, latestMonth)
        : 1;
    const perMemberPence: { [userId: string]: number } = {};
    for (const [userId, snapshot] of Object.entries(month.memberSnapshots)) {
      if (snapshot) {
        perMemberPence[userId] = Math.round(
          memberTotalPence(snapshot) * factor
        );
      }
    }
    return [
      {
        month: monthId,
        householdPence: Math.round(householdNetWorthPence(month) * factor),
        perMemberPence,
      },
    ];
  });
};

export interface ChangeStat {
  absolutePence: number;
  percent: number;
}

const changeFromBase = (
  basePence: number,
  latestPence: number
): ChangeStat | undefined => {
  if (basePence === 0) {
    return undefined;
  }
  const absolutePence = latestPence - basePence;
  return {
    absolutePence,
    percent: (absolutePence / Math.abs(basePence)) * 100,
  };
};

const changeOverMonths = (
  series: NetWorthPoint[],
  monthsBack: number
): ChangeStat | undefined => {
  if (series.length < 2) {
    return undefined;
  }
  const latest = series[series.length - 1];
  const base = series.find(
    (point) => monthsBetween(point.month, latest.month) === monthsBack
  );
  if (!base) {
    return undefined;
  }
  return changeFromBase(base.householdPence, latest.householdPence);
};

export const monthOnMonthChange = (
  series: NetWorthPoint[]
): ChangeStat | undefined => changeOverMonths(series, 1);

export const twelveMonthChange = (
  series: NetWorthPoint[]
): ChangeStat | undefined => changeOverMonths(series, 12);

export const allTimeChange = (
  series: NetWorthPoint[]
): ChangeStat | undefined => {
  if (series.length < 2) {
    return undefined;
  }
  return changeFromBase(
    series[0].householdPence,
    series[series.length - 1].householdPence
  );
};
