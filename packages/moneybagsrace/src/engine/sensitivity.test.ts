import { InvestmentWrapper } from '../types/accounts';
import {
  HouseholdAssumptions,
  WithdrawalStrategyKind,
} from '../types/assumptions';
import { AnnualReturn, SimulationMember } from '../types/simulation';
import {
  applyContributionDelta,
  applyWithdrawalDelta,
  computeSensitivity,
  computeSensitivityAsync,
  SENSITIVITY_CONTRIBUTION_DELTA_MONTHLY_PENCE,
} from './sensitivity';
import { findEarliestRetirement, SolverBaseInputs } from './solver';
import { DEFAULT_TAX_BANDS } from './tax';

const ZERO_RETURNS: AnnualReturn[] = [
  { year: 2000, realPct: 0, nominalPct: 0 },
];

const assumptions: HouseholdAssumptions = {
  inflationRatePct: 2.5,
  returnScenarios: { lowerRealPct: 2, centralRealPct: 5, upperRealPct: 7 },
  taxBands: DEFAULT_TAX_BANDS,
  statePensionAnnualPence: 1_197_300,
  targetSuccessRatePct: 90,
};

const makeMember = (
  overrides: Partial<SimulationMember> = {}
): SimulationMember => ({
  userId: 'member-1',
  dateOfBirth: '1970-01-01',
  balancesPencePerWrapper: {},
  contributions: { monthlyPencePerWrapper: {}, stepChanges: [] },
  overrides: {},
  desiredWithdrawalAnnualPence: 0,
  withdrawalStrategy: { kind: WithdrawalStrategyKind.FIXED_REAL },
  ...overrides,
});

// Personal plans read each member's own desired withdrawal; project the
// household withdrawalAnnualPence onto the first member so the single-earner
// sensitivity fixtures still solve to the analytic months.
const withHouseholdWithdrawal = (
  members: SimulationMember[],
  householdWithdrawalPence: number
): SimulationMember[] =>
  members.map((member, index) =>
    index === 0 && !member.desiredWithdrawalAnnualPence
      ? { ...member, desiredWithdrawalAnnualPence: householdWithdrawalPence }
      : member
  );

// Same analytic setup as solver.test.ts: earliest offset k satisfies
// C*k >= (10 - floor(k/12)) * W with C = 100,000/mo and W = 1,000,000/yr,
// giving a base answer of k = 60 (2035-01). The four nudges move it to
// analytically computable months.
const monotoneBase = (): SolverBaseInputs => ({
  members: withHouseholdWithdrawal(
    [
      makeMember({
        contributions: {
          monthlyPencePerWrapper: { [InvestmentWrapper.ISA]: 100_000 },
          stepChanges: [],
        },
      }),
    ],
    1_000_000
  ),
  startMonth: '2030-01',
  planToAge: 70,
  withdrawalAnnualPence: 1_000_000,
  includeStatePension: false,
  applyTax: false,
  assumptions,
  returns: ZERO_RETURNS,
  runs: 3,
  seed: 1,
});

describe('computeSensitivity', () => {
  it('finds the analytic earliest month for each nudge', () => {
    const result = computeSensitivity(monotoneBase());
    // W = 1,500,000: k >= 15*(10 - floor(k/12)) first holds at k = 72
    expect(result.withdrawalPlus5k).toBe('2036-01');
    // W = 500,000: k >= 5*(10 - floor(k/12)) first holds at k = 36
    expect(result.withdrawalMinus5k).toBe('2033-01');
    // C = 150,000: 0.15k >= 10 - floor(k/12) first holds at k = 47
    expect(result.contributionsPlus500).toBe('2033-12');
    // C = 50,000: 0.05k >= 10 - floor(k/12) first holds at k = 80
    expect(result.contributionsMinus500).toBe('2036-09');
  });

  it('orders each nudged month correctly against the base month', () => {
    const base = monotoneBase();
    const baseMonth = findEarliestRetirement(base).earliestRetirementMonth;
    const result = computeSensitivity(base);
    if (
      baseMonth === undefined ||
      result.withdrawalPlus5k === undefined ||
      result.withdrawalMinus5k === undefined ||
      result.contributionsPlus500 === undefined ||
      result.contributionsMinus500 === undefined
    ) {
      throw new Error('expected every sensitivity variant to solve');
    }
    // MonthId strings compare chronologically
    expect(result.withdrawalPlus5k >= baseMonth).toBe(true);
    expect(result.withdrawalMinus5k <= baseMonth).toBe(true);
    expect(result.contributionsPlus500 <= baseMonth).toBe(true);
    expect(result.contributionsMinus500 >= baseMonth).toBe(true);
  });

  it('floors the reduced withdrawal at zero and reports unreachable nudges as undefined', () => {
    // No wealth and no contributions; planToAge far beyond the window so no
    // candidate month is trivially past the horizon
    const base: SolverBaseInputs = {
      ...monotoneBase(),
      members: withHouseholdWithdrawal([makeMember()], 400_000),
      withdrawalAnnualPence: 400_000,
      planToAge: 120,
    };
    const result = computeSensitivity(base, { windowYears: 2 });
    // 400,000 - 500,000 floors at zero need, so retiring immediately works
    expect(result.withdrawalMinus5k).toBe('2030-01');
    expect(result.withdrawalPlus5k).toBeUndefined();
    expect(result.contributionsPlus500).toBeUndefined();
    expect(result.contributionsMinus500).toBeUndefined();
  });
});

describe('applyContributionDelta', () => {
  const planOf = (
    members: SimulationMember[],
    userId: string
  ): Partial<Record<InvestmentWrapper, number>> => {
    const member = members.find((candidate) => candidate.userId === userId);
    if (!member) {
      throw new Error(`missing member ${userId}`);
    }
    return member.contributions.monthlyPencePerWrapper;
  };

  it('spreads the household delta proportionally across members and wrappers', () => {
    const members = [
      makeMember({
        userId: 'heavy',
        contributions: {
          monthlyPencePerWrapper: {
            [InvestmentWrapper.ISA]: 300_000,
            [InvestmentWrapper.GIA]: 100_000,
          },
          stepChanges: [],
        },
      }),
      makeMember({
        userId: 'light',
        contributions: {
          monthlyPencePerWrapper: { [InvestmentWrapper.ISA]: 100_000 },
          stepChanges: [],
        },
      }),
    ];
    const adjusted = applyContributionDelta(
      members,
      SENSITIVITY_CONTRIBUTION_DELTA_MONTHLY_PENCE
    );
    // heavy contributes 400,000 of 500,000 => +40,000, split 3:1 by wrapper
    expect(planOf(adjusted, 'heavy')).toEqual({
      [InvestmentWrapper.ISA]: 330_000,
      [InvestmentWrapper.GIA]: 110_000,
    });
    // light contributes 100,000 of 500,000 => +10,000
    expect(planOf(adjusted, 'light')).toEqual({
      [InvestmentWrapper.ISA]: 110_000,
    });
    // Inputs are untouched
    expect(planOf(members, 'heavy')).toEqual({
      [InvestmentWrapper.ISA]: 300_000,
      [InvestmentWrapper.GIA]: 100_000,
    });
  });

  it('splits a positive delta equally into ISA when nobody contributes', () => {
    const members = [
      makeMember({ userId: 'first' }),
      makeMember({ userId: 'second' }),
    ];
    const adjusted = applyContributionDelta(members, 50_000);
    expect(planOf(adjusted, 'first')).toEqual({
      [InvestmentWrapper.ISA]: 25_000,
    });
    expect(planOf(adjusted, 'second')).toEqual({
      [InvestmentWrapper.ISA]: 25_000,
    });
  });

  it('leaves zero-contribution members unchanged for a negative delta', () => {
    const members = [
      makeMember({ userId: 'first' }),
      makeMember({ userId: 'second' }),
    ];
    const adjusted = applyContributionDelta(members, -50_000);
    expect(planOf(adjusted, 'first')).toEqual({});
    expect(planOf(adjusted, 'second')).toEqual({});
  });

  it('clamps a reduction at zero instead of going negative', () => {
    const members = [
      makeMember({
        userId: 'small',
        contributions: {
          monthlyPencePerWrapper: { [InvestmentWrapper.ISA]: 30_000 },
          stepChanges: [],
        },
      }),
    ];
    const adjusted = applyContributionDelta(members, -50_000);
    expect(planOf(adjusted, 'small')).toEqual({ [InvestmentWrapper.ISA]: 0 });
  });

  it('preserves step changes untouched', () => {
    const stepChanges = [
      {
        fromMonth: '2031-01',
        wrapper: InvestmentWrapper.ISA,
        monthlyPence: 250_000,
      },
    ];
    const members = [
      makeMember({
        contributions: {
          monthlyPencePerWrapper: { [InvestmentWrapper.ISA]: 100_000 },
          stepChanges,
        },
      }),
    ];
    const adjusted = applyContributionDelta(members, 50_000);
    expect(adjusted[0].contributions.stepChanges).toEqual(stepChanges);
  });
});

describe('applyWithdrawalDelta', () => {
  it('spreads the delta proportionally across members with unequal desired', () => {
    const members = [
      makeMember({ userId: 'big', desiredWithdrawalAnnualPence: 3_000_000 }),
      makeMember({ userId: 'small', desiredWithdrawalAnnualPence: 1_000_000 }),
    ];
    const adjusted = applyWithdrawalDelta(members, 400_000);
    // big holds 3/4 of the 4,000,000 household desired => +300,000
    expect(adjusted[0].desiredWithdrawalAnnualPence).toBe(3_300_000);
    // small holds 1/4 => +100,000
    expect(adjusted[1].desiredWithdrawalAnnualPence).toBe(1_100_000);
    // Inputs are untouched
    expect(members[0].desiredWithdrawalAnnualPence).toBe(3_000_000);
  });

  it('splits the delta equally when every member desires zero', () => {
    const members = [
      makeMember({ userId: 'first' }),
      makeMember({ userId: 'second' }),
    ];
    const adjusted = applyWithdrawalDelta(members, 500_000);
    expect(adjusted[0].desiredWithdrawalAnnualPence).toBe(250_000);
    expect(adjusted[1].desiredWithdrawalAnnualPence).toBe(250_000);
  });

  it('clamps a reduction at zero instead of going negative', () => {
    const members = [
      makeMember({ userId: 'big', desiredWithdrawalAnnualPence: 3_000_000 }),
      makeMember({ userId: 'small', desiredWithdrawalAnnualPence: 200_000 }),
    ];
    // small holds 200,000 of 3,200,000 => share of -3,200,000 is -200,000
    const adjusted = applyWithdrawalDelta(members, -3_200_000);
    expect(adjusted[0].desiredWithdrawalAnnualPence).toBe(0);
    expect(adjusted[1].desiredWithdrawalAnnualPence).toBe(0);
  });
});

describe('computeSensitivityAsync', () => {
  it('matches the synchronous result', async () => {
    const base = monotoneBase();
    expect(await computeSensitivityAsync(base)).toEqual(
      computeSensitivity(base)
    );
  });

  it('reports monotone aggregated progress across the four solves', async () => {
    const progress: [number, number][] = [];
    await computeSensitivityAsync(monotoneBase(), {
      onProgress: (probesDone, probesTotal) => {
        progress.push([probesDone, probesTotal]);
      },
    });
    expect(progress.length).toBeGreaterThan(4);
    const totals = new Set(progress.map(([, probesTotal]) => probesTotal));
    expect(totals.size).toBe(1);
    progress.forEach(([probesDone, probesTotal], index) => {
      expect(probesDone).toBeLessThanOrEqual(probesTotal);
      if (index > 0) {
        expect(probesDone).toBeGreaterThan(progress[index - 1][0]);
      }
    });
  });

  it('rejects when aborted between probes', async () => {
    const controller = new AbortController();
    await expect(
      computeSensitivityAsync(monotoneBase(), {
        signal: controller.signal,
        onProgress: () => {
          controller.abort();
        },
      })
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
