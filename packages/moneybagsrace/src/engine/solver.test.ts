import { GLOBAL_EQUITY_ANNUAL_RETURNS } from '../data/globalEquityReturns';
import { addMonths } from '../helpers/monthId';
import { InvestmentWrapper } from '../types/accounts';
import {
  HouseholdAssumptions,
  WithdrawalStrategyKind,
} from '../types/assumptions';
import { AnnualReturn, SimulationMember } from '../types/simulation';
import { runRetirementSimulation } from './simulate';
import {
  findEarliestRetirement,
  findEarliestRetirementAsync,
  SolverBaseInputs,
  solverProbeBudget,
} from './solver';
import { DEFAULT_TAX_BANDS } from './tax';

const ZERO_RETURNS: AnnualReturn[] = [
  { year: 2000, realPct: 0, nominalPct: 0 },
];

const makeAssumptions = (targetSuccessRatePct = 90): HouseholdAssumptions => ({
  inflationRatePct: 2.5,
  returnScenarios: { lowerRealPct: 2, centralRealPct: 5, upperRealPct: 7 },
  taxBands: DEFAULT_TAX_BANDS,
  statePensionAnnualPence: 1_197_300,
  targetSuccessRatePct,
});

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

// Personal plans read each member's own desired withdrawal. These single-earner
// fixtures project the household withdrawalAnnualPence onto the first member so
// the analytic single-plan expectations still hold.
const withHouseholdWithdrawal = (
  members: SimulationMember[],
  householdWithdrawalPence: number
): SimulationMember[] =>
  members.map((member, index) =>
    index === 0 && !member.desiredWithdrawalAnnualPence
      ? { ...member, desiredWithdrawalAnnualPence: householdWithdrawalPence }
      : member
  );

// DOB 1970-01-01, startMonth 2030-01 (age 60), planToAge 70, zero-volatility
// returns, no starting wealth, ISA contributions of 100,000/mo. Retiring at
// offset k months gives wealth 100,000*k against (10 - floor(k/12)) annual
// withdrawals of 1,000,000, so the analytic earliest offset is k = 60
// (2035-01): 6,000,000 covers 5 withdrawal years, while k = 59 leaves
// 5,900,000 against 6,000,000 needed.
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
  assumptions: makeAssumptions(),
  returns: ZERO_RETURNS,
  runs: 3,
  seed: 1,
});

const stochasticBase = (): SolverBaseInputs => ({
  members: withHouseholdWithdrawal(
    [
      makeMember({
        dateOfBirth: '1975-06-15',
        balancesPencePerWrapper: {
          [InvestmentWrapper.ISA]: 20_000_000,
          [InvestmentWrapper.SIPP]: 30_000_000,
        },
        contributions: {
          monthlyPencePerWrapper: { [InvestmentWrapper.ISA]: 200_000 },
          stepChanges: [],
        },
      }),
    ],
    3_600_000
  ),
  startMonth: '2026-08',
  planToAge: 90,
  withdrawalAnnualPence: 3_600_000,
  includeStatePension: true,
  applyTax: true,
  assumptions: makeAssumptions(),
  returns: GLOBAL_EQUITY_ANNUAL_RETURNS,
  runs: 60,
  seed: 3,
});

describe('findEarliestRetirement', () => {
  it('finds exactly the analytic earliest month in a monotone synthetic case', () => {
    const result = findEarliestRetirement(monotoneBase());
    expect(result.earliestRetirementMonth).toBe('2035-01');
    expect(result.achievedSuccessRatePct).toBe(100);
    expect(result.agesAtRetirement).toEqual({ 'member-1': 65 });
  });

  it('sits exactly on the pass/fail boundary of the direct simulation', () => {
    const base = monotoneBase();
    const atFound = runRetirementSimulation({
      ...base,
      retirementMonth: '2035-01',
    });
    const monthBefore = runRetirementSimulation({
      ...base,
      retirementMonth: '2034-12',
    });
    expect(atFound.successRatePct).toBeGreaterThanOrEqual(
      base.assumptions.targetSuccessRatePct
    );
    expect(monthBefore.successRatePct).toBeLessThan(
      base.assumptions.targetSuccessRatePct
    );
  });

  it('returns startMonth when retiring immediately already meets the target', () => {
    const base: SolverBaseInputs = {
      ...monotoneBase(),
      members: [
        makeMember({
          balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 100_000_000 },
        }),
      ],
    };
    const result = findEarliestRetirement(base);
    expect(result.earliestRetirementMonth).toBe('2030-01');
    expect(result.achievedSuccessRatePct).toBe(100);
  });

  it('handles a zero-length window as a single retire-now probe', () => {
    const base: SolverBaseInputs = {
      ...monotoneBase(),
      members: [
        makeMember({
          balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 100_000_000 },
        }),
      ],
    };
    expect(findEarliestRetirement(base, 0).earliestRetirementMonth).toBe(
      '2030-01'
    );
    expect(solverProbeBudget(0)).toBe(1);
  });

  it('returns undefined when the target is unreachable within the window', () => {
    const base: SolverBaseInputs = {
      ...monotoneBase(),
      members: withHouseholdWithdrawal([makeMember()], 1_000_000),
    };
    const result = findEarliestRetirement(base, 5);
    expect(result.earliestRetirementMonth).toBeUndefined();
    expect(result.achievedSuccessRatePct).toBeUndefined();
    expect(result.agesAtRetirement).toEqual({});
  });

  it('reports each member age at the found month for differing DOBs', () => {
    const base: SolverBaseInputs = {
      ...monotoneBase(),
      members: withHouseholdWithdrawal(
        [
          makeMember({
            userId: 'older',
            contributions: {
              monthlyPencePerWrapper: { [InvestmentWrapper.ISA]: 100_000 },
              stepChanges: [],
            },
          }),
          makeMember({ userId: 'younger', dateOfBirth: '1975-07-15' }),
        ],
        1_000_000
      ),
    };
    const result = findEarliestRetirement(base);
    // The inert second member changes neither wealth nor the horizon (the
    // oldest DOB drives planToAge), so the analytic month stands
    expect(result.earliestRetirementMonth).toBe('2035-01');
    // At 2035-01-01 the younger member's July birthday has not yet passed
    expect(result.agesAtRetirement).toEqual({ older: 65, younger: 59 });
  });

  it('resolves and stays monotonic for two members on different strategies', () => {
    const base: SolverBaseInputs = {
      ...stochasticBase(),
      members: [
        makeMember({
          userId: 'fixed-real',
          dateOfBirth: '1974-03-01',
          balancesPencePerWrapper: {
            [InvestmentWrapper.ISA]: 15_000_000,
            [InvestmentWrapper.SIPP]: 20_000_000,
          },
          contributions: {
            monthlyPencePerWrapper: { [InvestmentWrapper.ISA]: 150_000 },
            stepChanges: [],
          },
          desiredWithdrawalAnnualPence: 1_800_000,
          withdrawalStrategy: { kind: WithdrawalStrategyKind.FIXED_REAL },
        }),
        makeMember({
          userId: 'fixed-percent',
          dateOfBirth: '1976-09-20',
          balancesPencePerWrapper: {
            [InvestmentWrapper.ISA]: 10_000_000,
            [InvestmentWrapper.SIPP]: 15_000_000,
          },
          contributions: {
            monthlyPencePerWrapper: { [InvestmentWrapper.ISA]: 120_000 },
            stepChanges: [],
          },
          desiredWithdrawalAnnualPence: 1_400_000,
          withdrawalStrategy: {
            kind: WithdrawalStrategyKind.FIXED_PERCENT,
            fixedPercentRatePct: 4,
          },
        }),
      ],
      withdrawalAnnualPence: 3_200_000,
    };
    const result = findEarliestRetirement(base);
    const foundMonth = result.earliestRetirementMonth;
    if (foundMonth === undefined) {
      throw new Error(
        'expected the two-member case to solve within the window'
      );
    }
    // Household success is the any-member-fails rollup; pushing the retirement
    // date later only helps each member under CRN, so a later probe never has
    // lower success than an earlier one.
    let previousSuccess = -1;
    for (let offset = 0; offset <= 120; offset += 12) {
      const { successRatePct } = runRetirementSimulation({
        ...base,
        retirementMonth: addMonths(base.startMonth, offset),
      });
      expect(successRatePct).toBeGreaterThanOrEqual(previousSuccess);
      previousSuccess = successRatePct;
    }
  });

  it('is stable under common random numbers and consistent with direct probes', () => {
    const base = stochasticBase();
    const first = findEarliestRetirement(base);
    const second = findEarliestRetirement(base);
    expect(second).toEqual(first);
    const foundMonth = first.earliestRetirementMonth;
    if (foundMonth === undefined) {
      throw new Error(
        'expected the stochastic case to solve within the window'
      );
    }
    expect(foundMonth).not.toBe(base.startMonth);
    const atFound = runRetirementSimulation({
      ...base,
      retirementMonth: foundMonth,
    });
    const monthBefore = runRetirementSimulation({
      ...base,
      retirementMonth: addMonths(foundMonth, -1),
    });
    expect(atFound.successRatePct).toBeGreaterThanOrEqual(
      base.assumptions.targetSuccessRatePct
    );
    expect(monthBefore.successRatePct).toBeLessThan(
      base.assumptions.targetSuccessRatePct
    );
    expect(first.achievedSuccessRatePct).toBe(atFound.successRatePct);
  });
});

describe('findEarliestRetirementAsync', () => {
  it('matches the synchronous solver on the stochastic case', async () => {
    const base = stochasticBase();
    expect(await findEarliestRetirementAsync(base)).toEqual(
      findEarliestRetirement(base)
    );
  });

  it('matches the synchronous solver on the monotone case', async () => {
    const base = monotoneBase();
    expect(await findEarliestRetirementAsync(base)).toEqual(
      findEarliestRetirement(base)
    );
  });

  it('reports monotone probe progress within the probe budget', async () => {
    const progress: [number, number][] = [];
    await findEarliestRetirementAsync(monotoneBase(), {
      onProgress: (probesDone, probesTotal) => {
        progress.push([probesDone, probesTotal]);
      },
    });
    const budget = solverProbeBudget();
    expect(progress.length).toBeGreaterThan(2);
    progress.forEach(([probesDone, probesTotal], index) => {
      expect(probesDone).toBe(index + 1);
      expect(probesTotal).toBe(budget);
    });
    expect(progress[progress.length - 1][0]).toBeLessThanOrEqual(budget);
  });

  it('rejects immediately when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      findEarliestRetirementAsync(monotoneBase(), {
        signal: controller.signal,
      })
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('rejects between probes when aborted mid-solve', async () => {
    const controller = new AbortController();
    const probesSeen: number[] = [];
    await expect(
      findEarliestRetirementAsync(monotoneBase(), {
        signal: controller.signal,
        onProgress: (probesDone) => {
          probesSeen.push(probesDone);
          controller.abort();
        },
      })
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(probesSeen).toEqual([1]);
  });
});
