import { GLOBAL_EQUITY_ANNUAL_RETURNS } from '../data/globalEquityReturns';
import { InvestmentWrapper } from '../types/accounts';
import {
  HouseholdAssumptions,
  WithdrawalStrategyKind,
} from '../types/assumptions';
import {
  AnnualReturn,
  FailureKind,
  SimulationInputs,
  SimulationMember,
} from '../types/simulation';
import {
  prepareSimulationContext,
  runRetirementSimulation,
  runSimulationOnce,
} from './simulate';
import { runRetirementSimulationAsync } from './runAsync';
import { DEFAULT_TAX_BANDS } from './tax';

const STATE_PENSION_PENCE = 1_197_300;

const flatReturns = (realPct: number): AnnualReturn[] => [
  { year: 2000, realPct, nominalPct: realPct },
];

const ZERO_RETURNS = flatReturns(0);

const assumptions: HouseholdAssumptions = {
  inflationRatePct: 2.5,
  returnScenarios: { lowerRealPct: 2, centralRealPct: 5, upperRealPct: 7 },
  taxBands: DEFAULT_TAX_BANDS,
  statePensionAnnualPence: STATE_PENSION_PENCE,
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

// Personal plans read each member's own desiredWithdrawalAnnualPence. These
// fixtures are single-earner households, so the household withdrawalAnnualPence
// is projected onto the first member unless that member set its own; the
// resulting household plan is the sum of the personal plans.
const withHouseholdWithdrawal = (
  members: SimulationMember[],
  householdWithdrawalPence: number
): SimulationMember[] =>
  members.map((member, index) =>
    index === 0 && !member.desiredWithdrawalAnnualPence
      ? { ...member, desiredWithdrawalAnnualPence: householdWithdrawalPence }
      : member
  );

const makeInputs = (
  overrides: Partial<SimulationInputs> = {}
): SimulationInputs => {
  const base: SimulationInputs = {
    members: [makeMember()],
    startMonth: '2030-01',
    retirementMonth: '2030-01',
    planToAge: 70,
    withdrawalAnnualPence: 1_000_000,
    includeStatePension: false,
    applyTax: false,
    assumptions,
    returns: ZERO_RETURNS,
    runs: 5,
    seed: 1,
    ...overrides,
  };
  return {
    ...base,
    members: withHouseholdWithdrawal(base.members, base.withdrawalAnnualPence),
  };
};

describe('runRetirementSimulation input validation', () => {
  it('rejects zero runs', () => {
    expect(() => runRetirementSimulation(makeInputs({ runs: 0 }))).toThrow(
      'at least one run'
    );
  });

  it('rejects an empty household', () => {
    expect(() => runRetirementSimulation(makeInputs({ members: [] }))).toThrow(
      'at least one member'
    );
  });

  it('rejects an empty returns dataset', () => {
    expect(() => runRetirementSimulation(makeInputs({ returns: [] }))).toThrow(
      'returns dataset'
    );
  });
});

describe('zero-volatility analytic cases (single member, all ISA)', () => {
  // DOB 1970-01-01, retiring 2030-01 at age 60, planToAge 70 => exactly 10
  // annual withdrawal steps of 1,000,000 pence each
  const isaInputs = (isaPence: number): SimulationInputs =>
    makeInputs({
      members: [
        makeMember({
          balancesPencePerWrapper: { [InvestmentWrapper.ISA]: isaPence },
        }),
      ],
    });

  it('succeeds with wealth exactly equal to total withdrawals, ending at zero', () => {
    const result = runRetirementSimulation(isaInputs(10_000_000));
    expect(result.successRatePct).toBe(100);
    expect(result.failures.count).toBe(0);
    expect(result.failures.medianFailureYear).toBeUndefined();
    expect(result.endingWealthPercentilesPence).toEqual({
      p5: 0,
      p25: 0,
      p50: 0,
      p75: 0,
      p95: 0,
    });
  });

  it('tracks exact wealth along the percentile path', () => {
    const result = runRetirementSimulation(isaInputs(10_500_000));
    expect(result.successRatePct).toBe(100);
    expect(result.percentilePathsPence).toHaveLength(11);
    expect(result.percentilePathsPence[0]).toEqual({
      year: 2030,
      p5: 10_500_000,
      p25: 10_500_000,
      p50: 10_500_000,
      p75: 10_500_000,
      p95: 10_500_000,
    });
    expect(result.percentilePathsPence[1].p50).toBe(9_500_000);
    expect(result.percentilePathsPence[10]).toEqual({
      year: 2040,
      p5: 500_000,
      p25: 500_000,
      p50: 500_000,
      p75: 500_000,
      p95: 500_000,
    });
    expect(result.endingWealthPercentilesPence.p50).toBe(500_000);
  });

  it('fails in the final year when one penny short of total withdrawals', () => {
    const result = runRetirementSimulation(isaInputs(9_999_999));
    expect(result.successRatePct).toBe(0);
    expect(result.failures.count).toBe(5);
    expect(result.failures.byKind[FailureKind.WEALTH_EXHAUSTED]).toBe(5);
    expect(result.failures.byKind[FailureKind.BRIDGE_EXHAUSTED]).toBe(0);
    expect(result.failures.medianFailureYear).toBe(2039);
    expect(result.endingWealthPercentilesPence.p95).toBe(0);
  });

  it('withdraws at the start of the year before applying growth', () => {
    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 2_000_000 },
          }),
        ],
        planToAge: 61,
        returns: flatReturns(10),
      })
    );
    expect(result.endingWealthPercentilesPence.p50).toBe(1_100_000);
  });

  it('compounds remaining wealth annually when no withdrawal is needed', () => {
    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 1_000_000 },
          }),
        ],
        planToAge: 62,
        withdrawalAnnualPence: 0,
        returns: flatReturns(10),
      })
    );
    expect(result.percentilePathsPence.map((point) => point.p50)).toEqual([
      1_000_000, 1_100_000, 1_210_000,
    ]);
    expect(result.successRatePct).toBe(100);
  });
});

describe('accumulation phase', () => {
  // planToAge equals the age at retirement, so there are no withdrawal
  // steps and ending wealth is the wealth accumulated by retirement
  it('applies monthly contributions from the month after startMonth through retirementMonth', () => {
    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            contributions: {
              monthlyPencePerWrapper: { [InvestmentWrapper.ISA]: 100_000 },
              stepChanges: [],
            },
          }),
        ],
        startMonth: '2029-01',
        retirementMonth: '2030-01',
        planToAge: 60,
      })
    );
    expect(result.successRatePct).toBe(100);
    expect(result.percentilePathsPence).toEqual([
      {
        year: 2030,
        p5: 1_200_000,
        p25: 1_200_000,
        p50: 1_200_000,
        p75: 1_200_000,
        p95: 1_200_000,
      },
    ]);
    expect(result.endingWealthPercentilesPence.p50).toBe(1_200_000);
  });

  it('honours contribution step changes', () => {
    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            contributions: {
              monthlyPencePerWrapper: { [InvestmentWrapper.ISA]: 100_000 },
              stepChanges: [
                {
                  fromMonth: '2029-07',
                  wrapper: InvestmentWrapper.ISA,
                  monthlyPence: 200_000,
                },
              ],
            },
          }),
        ],
        startMonth: '2029-01',
        retirementMonth: '2030-01',
        planToAge: 60,
      })
    );
    // 5 months (Feb-Jun) at 100,000 + 7 months (Jul-Jan) at 200,000
    expect(result.endingWealthPercentilesPence.p50).toBe(1_900_000);
  });

  it('pro-rates a partial accumulation year geometrically', () => {
    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 1_000_000 },
          }),
        ],
        startMonth: '2029-01',
        retirementMonth: '2030-07',
        planToAge: 60,
        returns: flatReturns(10),
      })
    );
    // 18 months at a flat 10%/yr => 1.1^1.5 growth
    const expectedPence = Math.round(1_000_000 * 1.1 ** 1.5);
    expect(
      Math.abs(result.endingWealthPercentilesPence.p50 - expectedPence)
    ).toBeLessThanOrEqual(1);
  });
});

describe('portfolio extremes', () => {
  it('gives 100% success for a huge portfolio', () => {
    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            balancesPencePerWrapper: {
              [InvestmentWrapper.ISA]: 1_000_000_000_000,
            },
          }),
        ],
        planToAge: 95,
        withdrawalAnnualPence: 2_000_000,
        returns: GLOBAL_EQUITY_ANNUAL_RETURNS,
        runs: 200,
        seed: 42,
      })
    );
    expect(result.successRatePct).toBe(100);
    expect(result.failures.count).toBe(0);
  });

  it('gives 0% success with WEALTH_EXHAUSTED for a zero portfolio', () => {
    const result = runRetirementSimulation(
      makeInputs({
        planToAge: 95,
        withdrawalAnnualPence: 2_000_000,
        returns: GLOBAL_EQUITY_ANNUAL_RETURNS,
        runs: 20,
        seed: 42,
      })
    );
    expect(result.successRatePct).toBe(0);
    expect(result.failures.count).toBe(20);
    expect(result.failures.byKind[FailureKind.WEALTH_EXHAUSTED]).toBe(20);
    expect(result.failures.byKind[FailureKind.BRIDGE_EXHAUSTED]).toBe(0);
    expect(result.failures.medianFailureYear).toBe(2030);
    expect(result.endingWealthPercentilesPence.p95).toBe(0);
  });
});

describe('access rules', () => {
  it('fails with BRIDGE_EXHAUSTED when a SIPP-only member retires long before NMPA', () => {
    // DOB 1990-01-01 => NMPA 57; retiring 2030-01 at age 40 with 5 years of
    // withdrawals, all before pension access
    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            dateOfBirth: '1990-01-01',
            balancesPencePerWrapper: { [InvestmentWrapper.SIPP]: 100_000_000 },
          }),
        ],
        planToAge: 45,
        withdrawalAnnualPence: 2_000_000,
        runs: 10,
        seed: 7,
      })
    );
    expect(result.successRatePct).toBe(0);
    expect(result.failures.byKind[FailureKind.BRIDGE_EXHAUSTED]).toBe(10);
    expect(result.failures.byKind[FailureKind.WEALTH_EXHAUSTED]).toBe(0);
    expect(result.failures.medianFailureYear).toBe(2030);
  });

  it('spends the bridge before touching an unlocked pension', () => {
    // DOB 1965-01-01 => NMPA 55, so the SIPP is unlocked at 65 -- but two
    // years of withdrawals fit in the ISA, so with tax on the SIPP must end
    // exactly untouched (any pension draw would leak tax)
    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            dateOfBirth: '1965-01-01',
            balancesPencePerWrapper: {
              [InvestmentWrapper.ISA]: 2_000_000,
              [InvestmentWrapper.SIPP]: 5_000_000,
            },
          }),
        ],
        planToAge: 67,
        applyTax: true,
      })
    );
    expect(result.successRatePct).toBe(100);
    expect(result.endingWealthPercentilesPence.p50).toBe(5_000_000);
  });

  it('runs each member’s pension against their own personal tax bands', () => {
    // Personal plans: each member drains only their own SIPP against their own
    // tax bands. A per-member net desired of 1,676,000 grosses up to a taxable
    // slice of exactly the personal allowance (1,676,000 * 0.75 = 1,257,000),
    // so neither member pays tax and each ends with 10,000,000 - 1,676,000.
    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            userId: 'member-1',
            dateOfBirth: '1965-01-01',
            balancesPencePerWrapper: { [InvestmentWrapper.SIPP]: 10_000_000 },
            desiredWithdrawalAnnualPence: 1_676_000,
          }),
          makeMember({
            userId: 'member-2',
            dateOfBirth: '1965-01-01',
            balancesPencePerWrapper: { [InvestmentWrapper.SIPP]: 10_000_000 },
            desiredWithdrawalAnnualPence: 1_676_000,
          }),
        ],
        planToAge: 66,
        applyTax: true,
      })
    );
    expect(result.successRatePct).toBe(100);
    expect(result.endingWealthPercentilesPence.p50).toBe(16_648_000);
    expect(result.memberBreakdowns.map((m) => m.userId)).toEqual([
      'member-1',
      'member-2',
    ]);
    for (const breakdown of result.memberBreakdowns) {
      expect(breakdown.successRatePct).toBe(100);
    }
  });

  it('fails the household when only one member’s plan fails (retire together)', () => {
    // Member A holds enough ISA to cover 10 years at 1,000,000; member B is a
    // penny short, so B exhausts and the household run fails even though A does
    // not. Per-member outcomes attribute the failure to B alone.
    const context = prepareSimulationContext(
      makeInputs({
        members: [
          makeMember({
            userId: 'A',
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 10_000_000 },
            desiredWithdrawalAnnualPence: 1_000_000,
          }),
          makeMember({
            userId: 'B',
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 9_999_999 },
            desiredWithdrawalAnnualPence: 1_000_000,
          }),
        ],
        withdrawalAnnualPence: 2_000_000,
      })
    );
    const outcome = runSimulationOnce(context, 0);
    expect(outcome.failure?.kind).toBe(FailureKind.WEALTH_EXHAUSTED);
    const memberA = outcome.memberOutcomes.find((m) => m.userId === 'A');
    const memberB = outcome.memberOutcomes.find((m) => m.userId === 'B');
    expect(memberA?.failure).toBeUndefined();
    expect(memberB?.failure?.kind).toBe(FailureKind.WEALTH_EXHAUSTED);

    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            userId: 'A',
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 10_000_000 },
            desiredWithdrawalAnnualPence: 1_000_000,
          }),
          makeMember({
            userId: 'B',
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 9_999_999 },
            desiredWithdrawalAnnualPence: 1_000_000,
          }),
        ],
        withdrawalAnnualPence: 2_000_000,
      })
    );
    expect(result.successRatePct).toBeLessThan(100);
    expect(result.successRatePct).toBe(0);
  });
});

describe('pot-exhausted failure toggle for fraction-of-pot strategies', () => {
  // DOB 1975-01-01 => NMPA 57; retiring 2030-01 at age 55 with the whole pot in
  // a still-locked SIPP, so a fraction-of-pot strategy cannot deliver its target
  // in the early years even though the pot is full.
  const lockedFixedPercentInputs = (
    overrides: Partial<SimulationInputs> = {}
  ): SimulationInputs =>
    makeInputs({
      members: [
        makeMember({
          dateOfBirth: '1975-01-01',
          balancesPencePerWrapper: { [InvestmentWrapper.SIPP]: 100_000_000 },
          withdrawalStrategy: {
            kind: WithdrawalStrategyKind.FIXED_PERCENT,
            fixedPercentRatePct: 4,
          },
        }),
      ],
      planToAge: 58,
      withdrawalAnnualPence: 2_000_000,
      runs: 10,
      seed: 7,
      ...overrides,
    });

  it('fails with INCOME_BELOW_FLOOR by default when the target cannot be delivered', () => {
    const result = runRetirementSimulation(lockedFixedPercentInputs());
    expect(result.successRatePct).toBe(0);
    expect(result.failures.byKind[FailureKind.INCOME_BELOW_FLOOR]).toBe(10);
    expect(result.failures.byKind[FailureKind.WEALTH_EXHAUSTED]).toBe(0);
  });

  it('floor-fails FIXED_PERCENT when its income falls below the desired spend', () => {
    // Accessible pot, 4% of pot each year against a 2,000,000 desired spend:
    // the very first draw (4% of 10,000,000 = 400,000) is already below the
    // desired, so the floor breaches immediately even though the pot is fine.
    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            dateOfBirth: '1965-01-01',
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 10_000_000 },
            desiredWithdrawalAnnualPence: 2_000_000,
            withdrawalStrategy: {
              kind: WithdrawalStrategyKind.FIXED_PERCENT,
              fixedPercentRatePct: 4,
            },
          }),
        ],
        planToAge: 66,
        withdrawalAnnualPence: 2_000_000,
      })
    );
    expect(result.successRatePct).toBe(0);
    expect(result.failures.byKind[FailureKind.INCOME_BELOW_FLOOR]).toBe(5);
    expect(result.failures.medianFailureYear).toBe(2030);
  });

  it('does not fail when the pot survives and pot-exhausted failure is enabled', () => {
    const result = runRetirementSimulation(
      lockedFixedPercentInputs({
        potExhaustedFailureForFractionStrategies: true,
      })
    );
    expect(result.successRatePct).toBe(100);
    expect(result.failures.count).toBe(0);
  });

  it('does not treat an RMD final-year spend-down as exhaustion', () => {
    // RMD draws pot / remaining-years, so the final withdrawal year empties the
    // pot entirely by design. That planned spend-down is not a failure: with
    // pot-exhausted failure on, RMD is effectively unfailable like fixed-percent.
    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            dateOfBirth: '1965-01-01',
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 10_000_000 },
            withdrawalStrategy: { kind: WithdrawalStrategyKind.RMD },
          }),
        ],
        planToAge: 66,
        withdrawalAnnualPence: 2_000_000,
        potExhaustedFailureForFractionStrategies: true,
      })
    );
    expect(result.successRatePct).toBe(100);
    expect(result.failures.byKind[FailureKind.WEALTH_EXHAUSTED]).toBe(0);
    expect(result.failures.byKind[FailureKind.INCOME_BELOW_FLOOR]).toBe(0);
  });

  it('does not floor-fail RMD on an accessible pot even with the toggle off', () => {
    // With an accessible (unlocked) pot RMD always delivers its scheduled draw,
    // so the income-below-floor default never triggers: RMD only floor-fails
    // when its target draws on money that is not yet accessible (locked pension).
    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            dateOfBirth: '1965-01-01',
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 10_000_000 },
            withdrawalStrategy: { kind: WithdrawalStrategyKind.RMD },
          }),
        ],
        planToAge: 66,
        withdrawalAnnualPence: 2_000_000,
        returns: GLOBAL_EQUITY_ANNUAL_RETURNS,
        runs: 20,
        seed: 7,
      })
    );
    expect(result.successRatePct).toBe(100);
    expect(result.failures.count).toBe(0);
  });
});

describe('per-member breakdowns', () => {
  const twoMemberInputs = (): SimulationInputs =>
    makeInputs({
      members: [
        makeMember({
          userId: 'A',
          balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 10_000_000 },
          desiredWithdrawalAnnualPence: 1_000_000,
        }),
        makeMember({
          userId: 'B',
          balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 9_999_999 },
          desiredWithdrawalAnnualPence: 1_000_000,
        }),
      ],
      withdrawalAnnualPence: 2_000_000,
    });

  it('has one breakdown per member with the right userIds in member order', () => {
    const result = runRetirementSimulation(twoMemberInputs());
    expect(result.memberBreakdowns).toHaveLength(2);
    expect(result.memberBreakdowns.map((m) => m.userId)).toEqual(['A', 'B']);
  });

  it('keeps the household success rate at or below every member (A succeeds, B fails)', () => {
    const result = runRetirementSimulation(twoMemberInputs());
    const memberA = result.memberBreakdowns.find((m) => m.userId === 'A');
    const memberB = result.memberBreakdowns.find((m) => m.userId === 'B');
    expect(memberA?.successRatePct).toBe(100);
    expect(memberB?.successRatePct).toBe(0);
    const minMemberSuccess = Math.min(
      ...result.memberBreakdowns.map((m) => m.successRatePct)
    );
    expect(result.successRatePct).toBeLessThanOrEqual(minMemberSuccess);
    expect(result.successRatePct).toBe(0);
    expect(memberB?.failures.byKind[FailureKind.WEALTH_EXHAUSTED]).toBe(
      memberB?.failures.count
    );
  });

  it('gives each member an income path with one point per income year', () => {
    const inputs = twoMemberInputs();
    const context = prepareSimulationContext(inputs);
    const incomeYears = context.pathYears.length - 1;
    const result = runRetirementSimulation(inputs);
    for (const breakdown of result.memberBreakdowns) {
      expect(breakdown.incomePathsPence).toHaveLength(incomeYears);
    }
  });
});

describe('state pension toggle', () => {
  // DOB 1958-01-01 => state pension age 66; retiring 2030-01 at age 72 the
  // member draws state pension every withdrawal year. The ISA holds exactly
  // 10 years of (withdrawal - state pension), so the run succeeds iff the
  // state pension is included.
  const spInputs = (includeStatePension: boolean): SimulationInputs =>
    makeInputs({
      members: [
        makeMember({
          dateOfBirth: '1958-01-01',
          balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 8_027_000 },
        }),
      ],
      planToAge: 82,
      withdrawalAnnualPence: 2_000_000,
      includeStatePension,
    });

  it('raises the success rate for the same seed', () => {
    const withStatePension = runRetirementSimulation(spInputs(true));
    const withoutStatePension = runRetirementSimulation(spInputs(false));
    expect(withStatePension.successRatePct).toBe(100);
    expect(withoutStatePension.successRatePct).toBe(0);
    expect(withStatePension.successRatePct).toBeGreaterThan(
      withoutStatePension.successRatePct
    );
  });

  it('raises the success rate on a marginal stochastic portfolio', () => {
    const stochasticInputs = (includeStatePension: boolean): SimulationInputs =>
      makeInputs({
        members: [
          makeMember({
            dateOfBirth: '1958-01-01',
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 60_000_000 },
          }),
        ],
        planToAge: 95,
        withdrawalAnnualPence: 3_000_000,
        includeStatePension,
        returns: GLOBAL_EQUITY_ANNUAL_RETURNS,
        runs: 300,
        seed: 5,
      });
    const withStatePension = runRetirementSimulation(stochasticInputs(true));
    const withoutStatePension = runRetirementSimulation(
      stochasticInputs(false)
    );
    expect(withStatePension.successRatePct).toBeGreaterThan(
      withoutStatePension.successRatePct
    );
  });

  it('honours a per-member state pension override', () => {
    const overriddenPence = 500_000;
    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            dateOfBirth: '1958-01-01',
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 8_027_000 },
            overrides: { statePensionAnnualPenceOverride: overriddenPence },
          }),
        ],
        planToAge: 82,
        withdrawalAnnualPence: 2_000_000,
        includeStatePension: true,
      })
    );
    // Need is now 1,500,000/yr, so the 8,027,000 ISA runs out in year 6
    expect(result.successRatePct).toBe(0);
    expect(result.failures.medianFailureYear).toBe(2035);
  });
});

describe('tax toggle', () => {
  // SIPP holds exactly 10 years of net withdrawals: tax-naive succeeds
  // exactly; grossing-up (~2,057,177/yr for a 2,000,000 net) fails
  const taxInputs = (applyTax: boolean): SimulationInputs =>
    makeInputs({
      members: [
        makeMember({
          dateOfBirth: '1965-01-01',
          balancesPencePerWrapper: { [InvestmentWrapper.SIPP]: 20_000_000 },
        }),
      ],
      planToAge: 75,
      withdrawalAnnualPence: 2_000_000,
      applyTax,
    });

  it('lowers the success rate for the same seed when pension withdrawals occur', () => {
    const withTax = runRetirementSimulation(taxInputs(true));
    const withoutTax = runRetirementSimulation(taxInputs(false));
    expect(withoutTax.successRatePct).toBe(100);
    expect(withoutTax.endingWealthPercentilesPence.p50).toBe(0);
    expect(withTax.successRatePct).toBe(0);
    expect(withTax.failures.byKind[FailureKind.WEALTH_EXHAUSTED]).toBe(5);
    expect(withTax.successRatePct).toBeLessThan(withoutTax.successRatePct);
  });

  it('lowers the success rate on a marginal stochastic portfolio', () => {
    const stochasticInputs = (applyTax: boolean): SimulationInputs =>
      makeInputs({
        members: [
          makeMember({
            dateOfBirth: '1965-01-01',
            balancesPencePerWrapper: { [InvestmentWrapper.SIPP]: 50_000_000 },
          }),
        ],
        planToAge: 95,
        withdrawalAnnualPence: 3_000_000,
        applyTax,
        returns: GLOBAL_EQUITY_ANNUAL_RETURNS,
        runs: 300,
        seed: 9,
      });
    const withTax = runRetirementSimulation(stochasticInputs(true));
    const withoutTax = runRetirementSimulation(stochasticInputs(false));
    expect(withTax.successRatePct).toBeLessThan(withoutTax.successRatePct);
  });
});

describe('stochastic results', () => {
  const mixedInputs = (): SimulationInputs =>
    makeInputs({
      members: [
        makeMember({
          userId: 'member-1',
          dateOfBirth: '1968-05-10',
          balancesPencePerWrapper: {
            [InvestmentWrapper.ISA]: 30_000_000,
            [InvestmentWrapper.SIPP]: 40_000_000,
          },
          contributions: {
            monthlyPencePerWrapper: { [InvestmentWrapper.ISA]: 50_000 },
            stepChanges: [],
          },
        }),
        makeMember({
          userId: 'member-2',
          dateOfBirth: '1972-03-04',
          balancesPencePerWrapper: {
            [InvestmentWrapper.GIA]: 10_000_000,
            [InvestmentWrapper.COMPANY_PENSION]: 20_000_000,
          },
        }),
      ],
      startMonth: '2026-07',
      retirementMonth: '2030-06',
      planToAge: 90,
      withdrawalAnnualPence: 4_000_000,
      includeStatePension: true,
      applyTax: true,
      returns: GLOBAL_EQUITY_ANNUAL_RETURNS,
      runs: 150,
      seed: 11,
    });

  it('is deterministic for the same inputs and seed', () => {
    expect(runRetirementSimulation(mixedInputs())).toEqual(
      runRetirementSimulation(mixedInputs())
    );
  });

  it('matches the async result for two members on different strategies', async () => {
    // Two members sharing the same market but each on their own personal plan
    // and strategy; the single-RNG / shared-draw design must keep sync and
    // async byte-for-byte identical.
    const mixedStrategyInputs = (): SimulationInputs =>
      makeInputs({
        members: [
          makeMember({
            userId: 'member-1',
            dateOfBirth: '1966-02-01',
            balancesPencePerWrapper: {
              [InvestmentWrapper.ISA]: 40_000_000,
              [InvestmentWrapper.SIPP]: 30_000_000,
            },
            desiredWithdrawalAnnualPence: 2_400_000,
            withdrawalStrategy: {
              kind: WithdrawalStrategyKind.VANGUARD_DYNAMIC,
              fixedPercentRatePct: 4,
            },
          }),
          makeMember({
            userId: 'member-2',
            dateOfBirth: '1969-09-20',
            balancesPencePerWrapper: {
              [InvestmentWrapper.GIA]: 20_000_000,
              [InvestmentWrapper.COMPANY_PENSION]: 25_000_000,
            },
            desiredWithdrawalAnnualPence: 1_800_000,
            withdrawalStrategy: {
              kind: WithdrawalStrategyKind.SPENDING_DECLINE,
              spendingDeclinePctPerYear: -1.5,
            },
          }),
        ],
        startMonth: '2027-03',
        retirementMonth: '2031-05',
        planToAge: 92,
        withdrawalAnnualPence: 4_200_000,
        includeStatePension: true,
        applyTax: true,
        returns: GLOBAL_EQUITY_ANNUAL_RETURNS,
        runs: 123,
        seed: 17,
      });
    const syncResult = runRetirementSimulation(mixedStrategyInputs());
    for (const chunkSize of [10, 123, 1000]) {
      const asyncResult = await runRetirementSimulationAsync(
        mixedStrategyInputs(),
        { chunkSize }
      );
      expect(asyncResult).toEqual(syncResult);
    }
  });

  it('produces ordered percentiles and a consistent path shape', () => {
    const result = runRetirementSimulation(mixedInputs());
    // Oldest member (DOB 1968-05-10) is 62 at retirement in 2030-06, so
    // there are 28 withdrawal years plus the at-retirement point
    expect(result.percentilePathsPence).toHaveLength(29);
    result.percentilePathsPence.forEach((point, index) => {
      expect(point.year).toBe(2030 + index);
      expect(point.p5).toBeLessThanOrEqual(point.p25);
      expect(point.p25).toBeLessThanOrEqual(point.p50);
      expect(point.p50).toBeLessThanOrEqual(point.p75);
      expect(point.p75).toBeLessThanOrEqual(point.p95);
    });
    const ending = result.endingWealthPercentilesPence;
    expect(ending.p5).toBeLessThanOrEqual(ending.p25);
    expect(ending.p25).toBeLessThanOrEqual(ending.p50);
    expect(ending.p50).toBeLessThanOrEqual(ending.p75);
    expect(ending.p75).toBeLessThanOrEqual(ending.p95);
    expect(result.successRatePct).toBeGreaterThanOrEqual(0);
    expect(result.successRatePct).toBeLessThanOrEqual(100);
    expect(result.failures.count).toBe(
      result.failures.byKind[FailureKind.BRIDGE_EXHAUSTED] +
        result.failures.byKind[FailureKind.WEALTH_EXHAUSTED]
    );
  });
});
