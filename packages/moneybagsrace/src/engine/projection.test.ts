import { InvestmentWrapper } from '../types/accounts';
import { ContributionPlan } from '../types/profile';
import {
  accumulateContributions,
  contributionsForMonth,
  monthlyRateFromAnnualPct,
  nominalAnnualPct,
  projectInvestments,
  ProjectionInputs,
} from './projection';

const emptyPlan: ContributionPlan = {
  monthlyPencePerWrapper: {},
  stepChanges: [],
};

const plan = (
  monthlyPencePerWrapper: ContributionPlan['monthlyPencePerWrapper'],
  stepChanges: ContributionPlan['stepChanges'] = []
): ContributionPlan => ({ monthlyPencePerWrapper, stepChanges });

describe('monthlyRateFromAnnualPct', () => {
  it('compounds back to the annual rate over 12 months', () => {
    const monthly = monthlyRateFromAnnualPct(5);
    expect((1 + monthly) ** 12).toBeCloseTo(1.05, 10);
  });

  it('is zero for a zero annual rate', () => {
    expect(monthlyRateFromAnnualPct(0)).toBe(0);
  });
});

describe('nominalAnnualPct', () => {
  it('compounds real return with inflation', () => {
    expect(nominalAnnualPct(5, 2.5)).toBeCloseTo(7.625, 10);
  });

  it('equals the real rate at zero inflation', () => {
    expect(nominalAnnualPct(5, 0)).toBeCloseTo(5, 10);
  });
});

describe('contributionsForMonth', () => {
  it('returns the base plan before any step change', () => {
    const contributions = plan({ [InvestmentWrapper.ISA]: 10000 }, [
      {
        fromMonth: '2027-01',
        wrapper: InvestmentWrapper.ISA,
        monthlyPence: 20000,
      },
    ]);
    expect(contributionsForMonth(contributions, '2026-12')).toEqual({
      [InvestmentWrapper.ISA]: 10000,
    });
  });

  it('applies a step change from its month onward', () => {
    const contributions = plan({ [InvestmentWrapper.ISA]: 10000 }, [
      {
        fromMonth: '2027-01',
        wrapper: InvestmentWrapper.ISA,
        monthlyPence: 20000,
      },
    ]);
    expect(contributionsForMonth(contributions, '2027-01')).toEqual({
      [InvestmentWrapper.ISA]: 20000,
    });
    expect(contributionsForMonth(contributions, '2030-06')).toEqual({
      [InvestmentWrapper.ISA]: 20000,
    });
  });

  it('uses the step change with the latest effective month', () => {
    const contributions = plan({ [InvestmentWrapper.SIPP]: 10000 }, [
      {
        fromMonth: '2028-01',
        wrapper: InvestmentWrapper.SIPP,
        monthlyPence: 30000,
      },
      {
        fromMonth: '2027-01',
        wrapper: InvestmentWrapper.SIPP,
        monthlyPence: 20000,
      },
    ]);
    expect(contributionsForMonth(contributions, '2027-06')).toEqual({
      [InvestmentWrapper.SIPP]: 20000,
    });
    expect(contributionsForMonth(contributions, '2028-01')).toEqual({
      [InvestmentWrapper.SIPP]: 30000,
    });
  });

  it('only affects the step change wrapper', () => {
    const contributions = plan(
      {
        [InvestmentWrapper.ISA]: 10000,
        [InvestmentWrapper.SIPP]: 50000,
      },
      [
        {
          fromMonth: '2027-01',
          wrapper: InvestmentWrapper.ISA,
          monthlyPence: 20000,
        },
      ]
    );
    expect(contributionsForMonth(contributions, '2027-02')).toEqual({
      [InvestmentWrapper.ISA]: 20000,
      [InvestmentWrapper.SIPP]: 50000,
    });
  });
});

describe('accumulateContributions', () => {
  it('matches the closed-form annuity value for level contributions', () => {
    const monthlyRate = monthlyRateFromAnnualPct(5);
    const points = accumulateContributions({
      startBalancesPencePerWrapper: {},
      contributions: plan({ [InvestmentWrapper.ISA]: 10000 }),
      startMonth: '2026-07',
      months: 12,
      monthlyGrowthFactor: () => 1 + monthlyRate,
    });
    const closedForm = (10000 * ((1 + monthlyRate) ** 12 - 1)) / monthlyRate;
    const finalBalance =
      points[11].balancesPencePerWrapper[InvestmentWrapper.ISA];
    expect(Math.abs((finalBalance ?? 0) - closedForm)).toBeLessThanOrEqual(1);
  });

  it('matches the closed-form value for principal plus contributions', () => {
    const monthlyRate = monthlyRateFromAnnualPct(5);
    const points = accumulateContributions({
      startBalancesPencePerWrapper: { [InvestmentWrapper.SIPP]: 1_000_000 },
      contributions: plan({ [InvestmentWrapper.SIPP]: 10000 }),
      startMonth: '2026-07',
      months: 12,
      monthlyGrowthFactor: () => 1 + monthlyRate,
    });
    const closedForm =
      1_000_000 * (1 + monthlyRate) ** 12 +
      (10000 * ((1 + monthlyRate) ** 12 - 1)) / monthlyRate;
    const finalBalance =
      points[11].balancesPencePerWrapper[InvestmentWrapper.SIPP];
    expect(Math.abs((finalBalance ?? 0) - closedForm)).toBeLessThanOrEqual(1);
  });

  it('grows the principal exactly at the annual rate over 12 months', () => {
    const monthlyRate = monthlyRateFromAnnualPct(5);
    const points = accumulateContributions({
      startBalancesPencePerWrapper: { [InvestmentWrapper.GIA]: 1_000_000 },
      contributions: emptyPlan,
      startMonth: '2026-07',
      months: 12,
      monthlyGrowthFactor: () => 1 + monthlyRate,
    });
    expect(points[11].balancesPencePerWrapper[InvestmentWrapper.GIA]).toBe(
      1_050_000
    );
  });

  it('adds contributions without growth when the growth factor is 1', () => {
    const points = accumulateContributions({
      startBalancesPencePerWrapper: { [InvestmentWrapper.ISA]: 5000 },
      contributions: plan({ [InvestmentWrapper.ISA]: 10000 }),
      startMonth: '2026-07',
      months: 3,
      monthlyGrowthFactor: () => 1,
    });
    expect(
      points.map(
        (point) => point.balancesPencePerWrapper[InvestmentWrapper.ISA]
      )
    ).toEqual([15000, 25000, 35000]);
  });

  it('labels points with consecutive months from the start month', () => {
    const points = accumulateContributions({
      startBalancesPencePerWrapper: {},
      contributions: emptyPlan,
      startMonth: '2026-11',
      months: 3,
      monthlyGrowthFactor: () => 1,
    });
    expect(points.map((point) => point.month)).toEqual([
      '2026-12',
      '2027-01',
      '2027-02',
    ]);
    expect(points.map((point) => point.monthIndex)).toEqual([1, 2, 3]);
  });

  it('applies step changes from their month during accumulation', () => {
    const points = accumulateContributions({
      startBalancesPencePerWrapper: {},
      contributions: plan({ [InvestmentWrapper.ISA]: 10000 }, [
        {
          fromMonth: '2026-10',
          wrapper: InvestmentWrapper.ISA,
          monthlyPence: 20000,
        },
      ]),
      startMonth: '2026-07',
      months: 5,
      monthlyGrowthFactor: () => 1,
    });
    expect(
      points.map(
        (point) => point.balancesPencePerWrapper[InvestmentWrapper.ISA]
      )
    ).toEqual([10000, 20000, 40000, 60000, 80000]);
  });

  it('tracks wrappers only contributed to via step changes', () => {
    const points = accumulateContributions({
      startBalancesPencePerWrapper: {},
      contributions: plan({}, [
        {
          fromMonth: '2026-09',
          wrapper: InvestmentWrapper.CRYPTO,
          monthlyPence: 5000,
        },
      ]),
      startMonth: '2026-07',
      months: 3,
      monthlyGrowthFactor: () => 1,
    });
    expect(points[0].balancesPencePerWrapper[InvestmentWrapper.CRYPTO]).toBe(
      undefined
    );
    expect(points[1].balancesPencePerWrapper[InvestmentWrapper.CRYPTO]).toBe(
      5000
    );
    expect(points[2].balancesPencePerWrapper[InvestmentWrapper.CRYPTO]).toBe(
      10000
    );
  });
});

describe('projectInvestments', () => {
  const baseInputs: ProjectionInputs = {
    members: [
      {
        balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 1_000_000 },
        contributions: plan({ [InvestmentWrapper.ISA]: 10000 }),
      },
    ],
    startMonth: '2026-07',
    horizonMonths: 24,
    scenarios: { lowerRealPct: 2, centralRealPct: 5, upperRealPct: 7 },
    mode: 'real',
    inflationRatePct: 2.5,
  };

  it('starts at the current total for all three scenarios', () => {
    const points = projectInvestments(baseInputs);
    expect(points[0]).toEqual({
      monthIndex: 0,
      month: '2026-07',
      lowerPence: 1_000_000,
      centralPence: 1_000_000,
      upperPence: 1_000_000,
    });
  });

  it('produces horizon + 1 points with consecutive months', () => {
    const points = projectInvestments(baseInputs);
    expect(points).toHaveLength(25);
    expect(points[1].month).toBe('2026-08');
    expect(points[24].month).toBe('2028-07');
  });

  it('orders scenarios lower <= central <= upper', () => {
    const points = projectInvestments(baseInputs);
    for (const point of points) {
      expect(point.lowerPence).toBeLessThanOrEqual(point.centralPence);
      expect(point.centralPence).toBeLessThanOrEqual(point.upperPence);
    }
  });

  it('matches the closed-form central value at 12 months', () => {
    const monthlyRate = monthlyRateFromAnnualPct(5);
    const points = projectInvestments(baseInputs);
    const closedForm =
      1_000_000 * 1.05 + (10000 * ((1 + monthlyRate) ** 12 - 1)) / monthlyRate;
    expect(Math.abs(points[12].centralPence - closedForm)).toBeLessThanOrEqual(
      1
    );
  });

  it('real mode with zero inflation equals nominal mode', () => {
    const real = projectInvestments({
      ...baseInputs,
      mode: 'real',
      inflationRatePct: 0,
    });
    const nominal = projectInvestments({
      ...baseInputs,
      mode: 'nominal',
      inflationRatePct: 0,
    });
    expect(nominal).toEqual(real);
  });

  it('nominal mode exceeds real mode with positive inflation', () => {
    const real = projectInvestments(baseInputs);
    const nominal = projectInvestments({ ...baseInputs, mode: 'nominal' });
    expect(nominal[24].centralPence).toBeGreaterThan(real[24].centralPence);
  });

  it('sums balances and contributions across members', () => {
    const twoMembers = projectInvestments({
      ...baseInputs,
      members: [
        ...baseInputs.members,
        {
          balancesPencePerWrapper: { [InvestmentWrapper.SIPP]: 500_000 },
          contributions: plan({ [InvestmentWrapper.SIPP]: 20000 }),
        },
      ],
    });
    const secondMemberOnly = projectInvestments({
      ...baseInputs,
      members: [
        {
          balancesPencePerWrapper: { [InvestmentWrapper.SIPP]: 500_000 },
          contributions: plan({ [InvestmentWrapper.SIPP]: 20000 }),
        },
      ],
    });
    const oneMember = projectInvestments(baseInputs);
    expect(twoMembers[12].centralPence).toBe(
      oneMember[12].centralPence + secondMemberOnly[12].centralPence
    );
  });
});
