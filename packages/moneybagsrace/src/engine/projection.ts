import { addMonths } from '../helpers/monthId';
import { InvestmentWrapper } from '../types/accounts';
import { ReturnScenarios } from '../types/assumptions';
import { MonthId } from '../types/monthId';
import { ContributionPlan } from '../types/profile';

export type WrapperBalancesPence = Partial<Record<InvestmentWrapper, number>>;

export const monthlyRateFromAnnualPct = (annualPct: number): number =>
  (1 + annualPct / 100) ** (1 / 12) - 1;

// Nominal annual return = real return compounded with inflation
export const nominalAnnualPct = (
  realAnnualPct: number,
  inflationRatePct: number
): number =>
  ((1 + realAnnualPct / 100) * (1 + inflationRatePct / 100) - 1) * 100;

// Effective monthly contribution per wrapper for a given month: the base
// plan amount, overridden by the step change with the latest fromMonth <= month
export const contributionsForMonth = (
  plan: ContributionPlan,
  month: MonthId
): WrapperBalancesPence => {
  const amounts: WrapperBalancesPence = { ...plan.monthlyPencePerWrapper };
  const applied: Partial<Record<InvestmentWrapper, MonthId>> = {};
  for (const step of plan.stepChanges) {
    if (step.fromMonth > month) {
      continue;
    }
    const appliedFrom = applied[step.wrapper];
    if (appliedFrom !== undefined && appliedFrom > step.fromMonth) {
      continue;
    }
    applied[step.wrapper] = step.fromMonth;
    amounts[step.wrapper] = step.monthlyPence;
  }
  return amounts;
};

export interface AccumulateContributionsInputs {
  startBalancesPencePerWrapper: WrapperBalancesPence;
  contributions: ContributionPlan;
  // Month of the start balances; step 1 covers the following month
  startMonth: MonthId;
  months: number;
  // Growth factor applied to the balance before that month's contribution
  // is added; monthIndex is 1-based
  monthlyGrowthFactor: (monthIndex: number, month: MonthId) => number;
}

export interface WrapperBalancesPoint {
  monthIndex: number; // 1-based number of monthly steps from the start balances
  month: MonthId;
  balancesPencePerWrapper: WrapperBalancesPence; // rounded to whole pence
}

// Month-by-month accumulation: each step grows the balance then adds that
// month's contribution (end-of-month contributions, no growth in the month
// they are added). Balances accumulate as floats internally; emitted values
// are rounded to whole pence.
export const accumulateContributions = (
  inputs: AccumulateContributionsInputs
): WrapperBalancesPoint[] => {
  const {
    startBalancesPencePerWrapper,
    contributions,
    startMonth,
    months,
    monthlyGrowthFactor,
  } = inputs;
  const running = new Map<InvestmentWrapper, number>();
  for (const [wrapper, balance] of Object.entries(
    startBalancesPencePerWrapper
  ) as [InvestmentWrapper, number][]) {
    running.set(wrapper, balance);
  }
  const points: WrapperBalancesPoint[] = [];
  for (let monthIndex = 1; monthIndex <= months; monthIndex += 1) {
    const month = addMonths(startMonth, monthIndex);
    const growthFactor = monthlyGrowthFactor(monthIndex, month);
    for (const [wrapper, balance] of running) {
      running.set(wrapper, balance * growthFactor);
    }
    const monthContributions = contributionsForMonth(contributions, month);
    for (const [wrapper, contribution] of Object.entries(
      monthContributions
    ) as [InvestmentWrapper, number][]) {
      running.set(wrapper, (running.get(wrapper) ?? 0) + contribution);
    }
    const balancesPencePerWrapper: WrapperBalancesPence = {};
    for (const [wrapper, balance] of running) {
      balancesPencePerWrapper[wrapper] = Math.round(balance);
    }
    points.push({ monthIndex, month, balancesPencePerWrapper });
  }
  return points;
};

export interface ProjectionMember {
  balancesPencePerWrapper: WrapperBalancesPence;
  contributions: ContributionPlan;
}

export interface ProjectionInputs {
  members: ProjectionMember[];
  // Month of the current balances (latest snapshot); projection point 0
  startMonth: MonthId;
  horizonMonths: number;
  scenarios: ReturnScenarios; // annual real return % (spec §5.1)
  // 'real': today's money, compounding at the real scenario rates.
  // 'nominal': the real rates compounded with inflationRatePct.
  mode: 'real' | 'nominal';
  inflationRatePct: number;
}

export interface ProjectionPoint {
  monthIndex: number; // 0 = startMonth (current balances)
  month: MonthId;
  lowerPence: number;
  centralPence: number;
  upperPence: number;
}

const totalPence = (balances: WrapperBalancesPence): number =>
  Object.values(balances).reduce((total, balance) => total + balance, 0);

const scenarioSeries = (
  inputs: ProjectionInputs,
  realAnnualPct: number
): number[] => {
  const annualPct =
    inputs.mode === 'real'
      ? realAnnualPct
      : nominalAnnualPct(realAnnualPct, inputs.inflationRatePct);
  const growthFactor = 1 + monthlyRateFromAnnualPct(annualPct);
  const totals = new Array<number>(inputs.horizonMonths).fill(0);
  for (const member of inputs.members) {
    const points = accumulateContributions({
      startBalancesPencePerWrapper: member.balancesPencePerWrapper,
      contributions: member.contributions,
      startMonth: inputs.startMonth,
      months: inputs.horizonMonths,
      monthlyGrowthFactor: () => growthFactor,
    });
    for (const point of points) {
      totals[point.monthIndex - 1] += totalPence(point.balancesPencePerWrapper);
    }
  }
  return totals;
};

// Deterministic fan-chart projection (spec §5): investments only, monthly
// compounding at the three scenario rates, contributions applied monthly
export const projectInvestments = (
  inputs: ProjectionInputs
): ProjectionPoint[] => {
  const lower = scenarioSeries(inputs, inputs.scenarios.lowerRealPct);
  const central = scenarioSeries(inputs, inputs.scenarios.centralRealPct);
  const upper = scenarioSeries(inputs, inputs.scenarios.upperRealPct);
  const startTotal = inputs.members.reduce(
    (total, member) => total + totalPence(member.balancesPencePerWrapper),
    0
  );
  const points: ProjectionPoint[] = [
    {
      monthIndex: 0,
      month: inputs.startMonth,
      lowerPence: startTotal,
      centralPence: startTotal,
      upperPence: startTotal,
    },
  ];
  for (
    let monthIndex = 1;
    monthIndex <= inputs.horizonMonths;
    monthIndex += 1
  ) {
    points.push({
      monthIndex,
      month: addMonths(inputs.startMonth, monthIndex),
      lowerPence: lower[monthIndex - 1],
      centralPence: central[monthIndex - 1],
      upperPence: upper[monthIndex - 1],
    });
  }
  return points;
};
