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
  aggregateSimulationOutcomes,
  MAX_SAMPLED_PATHS,
  prepareSimulationContext,
  runRetirementSimulation,
  runSimulationOnce,
} from './simulate';
import { DEFAULT_TAX_BANDS } from './tax';

const flatReturns = (realPct: number): AnnualReturn[] => [
  { year: 2000, realPct, nominalPct: realPct },
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

// Personal plans read each member's own desiredWithdrawalAnnualPence /
// withdrawalStrategy. To keep these single-earner household fixtures meaningful,
// the household withdrawalAnnualPence / withdrawalStrategy passed to makeInputs
// is projected onto the first member unless that member set its own non-default.
const withHouseholdPlan = (
  members: SimulationMember[],
  householdWithdrawalPence: number,
  householdStrategy: SimulationInputs['withdrawalStrategy']
): SimulationMember[] =>
  members.map((member, index) =>
    index === 0
      ? {
          ...member,
          desiredWithdrawalAnnualPence:
            member.desiredWithdrawalAnnualPence || householdWithdrawalPence,
          withdrawalStrategy:
            member.withdrawalStrategy.kind === WithdrawalStrategyKind.FIXED_REAL
              ? (householdStrategy ?? member.withdrawalStrategy)
              : member.withdrawalStrategy,
        }
      : member
  );

const makeInputs = (
  overrides: Partial<SimulationInputs> = {}
): SimulationInputs => {
  const base: SimulationInputs = {
    members: [
      makeMember({
        balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 10_000_000 },
      }),
    ],
    startMonth: '2030-01',
    retirementMonth: '2030-01',
    planToAge: 70,
    withdrawalAnnualPence: 1_000_000,
    includeStatePension: false,
    applyTax: false,
    assumptions,
    returns: flatReturns(0),
    runs: 5,
    seed: 1,
    ...overrides,
  };
  return {
    ...base,
    members: withHouseholdPlan(
      base.members,
      base.withdrawalAnnualPence,
      base.withdrawalStrategy
    ),
  };
};

describe('FIXED_REAL strategy (default)', () => {
  it('matches an explicit FIXED_REAL strategy to the default', () => {
    const base = makeInputs();
    const withDefault = runRetirementSimulation(base);
    const withExplicit = runRetirementSimulation({
      ...base,
      withdrawalStrategy: { kind: WithdrawalStrategyKind.FIXED_REAL },
    });
    expect(withExplicit.percentilePathsPence).toEqual(
      withDefault.percentilePathsPence
    );
    expect(withExplicit.successRatePct).toBe(withDefault.successRatePct);
  });

  it('reports a constant net income equal to the desired withdrawal', () => {
    const result = runRetirementSimulation(makeInputs());
    for (const point of result.incomePathsPence) {
      expect(point.p50).toBe(1_000_000);
    }
  });
});

describe('FIXED_PERCENT strategy', () => {
  // Zero-return, 10-year plan, 1,000,000 ISA, 4% rate: each year draws 4% of
  // the remaining pot so income declines geometrically and never exhausts.
  const inputs = () =>
    makeInputs({
      members: [
        makeMember({
          balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 1_000_000 },
        }),
      ],
      withdrawalAnnualPence: 100_000,
      withdrawalStrategy: {
        kind: WithdrawalStrategyKind.FIXED_PERCENT,
        fixedPercentRatePct: 4,
      },
    });

  it('withdraws a fixed fraction of the current portfolio each year', () => {
    const context = prepareSimulationContext(inputs());
    const outcome = runSimulationOnce(context, 0);
    expect(outcome.incomeAnnualPence[0]).toBeCloseTo(40_000, 0);
    // After a 40,000 draw the pot is 960,000, so year two draws 4% of that
    expect(outcome.incomeAnnualPence[1]).toBeCloseTo(38_400, 0);
    expect(
      outcome.pathTotalsPence[outcome.pathTotalsPence.length - 1]
    ).toBeGreaterThan(0);
  });

  it('never exhausts and always delivers its own fraction from an accessible pot', () => {
    // The floor now IS the year's fixed-percent target, so an accessible ISA
    // always delivers it exactly: no exhaustion, no floor breach.
    const result = runRetirementSimulation(inputs());
    expect(result.failures.byKind[FailureKind.WEALTH_EXHAUSTED]).toBe(0);
    expect(result.failures.byKind[FailureKind.BRIDGE_EXHAUSTED]).toBe(0);
    expect(result.failures.byKind[FailureKind.INCOME_BELOW_FLOOR]).toBe(0);
    expect(result.successRatePct).toBe(100);
  });

  it('fails on the income floor when the target cannot be delivered before NMPA', () => {
    // DOB 1990-01-01 => NMPA 57; retiring at 40 the 4% target lands entirely on
    // a still-locked SIPP, so nothing is delivered and every run breaches the
    // income floor without exhausting the (locked) pot.
    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            dateOfBirth: '1990-01-01',
            balancesPencePerWrapper: { [InvestmentWrapper.SIPP]: 1_000_000 },
          }),
        ],
        planToAge: 45,
        withdrawalStrategy: {
          kind: WithdrawalStrategyKind.FIXED_PERCENT,
          fixedPercentRatePct: 4,
        },
      })
    );
    expect(result.failures.byKind[FailureKind.INCOME_BELOW_FLOOR]).toBe(5);
    expect(result.successRatePct).toBe(0);
  });
});

describe('RMD strategy', () => {
  // 1,000,000 pot, zero return, 10 withdrawal years: year one draws pot/10,
  // and the divisor shrinks as the horizon closes.
  const inputs = () =>
    makeInputs({
      members: [
        makeMember({
          balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 1_000_000 },
        }),
      ],
      withdrawalAnnualPence: 50_000,
      withdrawalStrategy: { kind: WithdrawalStrategyKind.RMD },
    });

  it('withdraws portfolio divided by the remaining horizon', () => {
    const context = prepareSimulationContext(inputs());
    const outcome = runSimulationOnce(context, 0);
    expect(outcome.incomeAnnualPence[0]).toBeCloseTo(100_000, 0);
    // Remaining 900,000 over 9 years => 100,000 again with zero return
    expect(outcome.incomeAnnualPence[1]).toBeCloseTo(100_000, 0);
    // The final year draws the whole remaining pot (divisor 1)
    const last =
      outcome.incomeAnnualPence[outcome.incomeAnnualPence.length - 1];
    expect(last).toBeCloseTo(100_000, 0);
  });

  it('never records an exhaustion failure', () => {
    const result = runRetirementSimulation(inputs());
    expect(result.failures.byKind[FailureKind.WEALTH_EXHAUSTED]).toBe(0);
    expect(result.failures.byKind[FailureKind.BRIDGE_EXHAUSTED]).toBe(0);
  });
});

describe('GUARDRAILS strategy', () => {
  it('cuts spending when the withdrawal rate breaches the upper guardrail', () => {
    // Starting rate 100,000 / 1,000,000 = 10%. A 20% drop in the pot pushes the
    // rate above the upper guardrail (10% * 1.2 = 12%), triggering a 10% cut.
    const context = prepareSimulationContext(
      makeInputs({
        members: [
          makeMember({
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 1_000_000 },
          }),
        ],
        withdrawalAnnualPence: 100_000,
        returns: flatReturns(-25),
        withdrawalStrategy: {
          kind: WithdrawalStrategyKind.GUARDRAILS,
          fixedPercentRatePct: 10,
          guardrailWidthPct: 20,
        },
      })
    );
    const outcome = runSimulationOnce(context, 0);
    expect(outcome.incomeAnnualPence[0]).toBeCloseTo(100_000, 0);
    // Year two: pot fell to (1,000,000 - 100,000) * 0.75 = 675,000; rate is
    // 100,000 / 675,000 ≈ 14.8% > 12%, so spending is cut to 90,000.
    expect(outcome.incomeAnnualPence[1]).toBeCloseTo(90_000, 0);
  });

  it('raises spending when the withdrawal rate drops below the lower guardrail', () => {
    // Strong growth grows the pot faster than spending, so the rate falls below
    // the lower guardrail (10% * 0.8 = 8%) and spending steps up 10%.
    const context = prepareSimulationContext(
      makeInputs({
        members: [
          makeMember({
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 1_000_000 },
          }),
        ],
        withdrawalAnnualPence: 100_000,
        returns: flatReturns(40),
        withdrawalStrategy: {
          kind: WithdrawalStrategyKind.GUARDRAILS,
          fixedPercentRatePct: 10,
          guardrailWidthPct: 20,
        },
      })
    );
    const outcome = runSimulationOnce(context, 0);
    expect(outcome.incomeAnnualPence[0]).toBeCloseTo(100_000, 0);
    // Year two: pot grew to (1,000,000 - 100,000) * 1.4 = 1,260,000; rate is
    // 100,000 / 1,260,000 ≈ 7.9% < 8%, so spending rises to 110,000.
    expect(outcome.incomeAnnualPence[1]).toBeCloseTo(110_000, 0);
  });
});

describe('FIXED_REAL_NO_INFLATION_AFTER_LOSS strategy', () => {
  // Every year is a loss year here, so the real target is deflated by one year
  // of inflation persistently — it compounds down and never re-inflates.
  it('erodes the real target after each loss year and never re-inflates', () => {
    const context = prepareSimulationContext(
      makeInputs({
        members: [
          makeMember({
            balancesPencePerWrapper: {
              [InvestmentWrapper.ISA]: 100_000_000,
            },
          }),
        ],
        withdrawalAnnualPence: 1_000_000,
        withdrawalStrategy: {
          kind: WithdrawalStrategyKind.FIXED_REAL_NO_INFLATION_AFTER_LOSS,
        },
        returns: flatReturns(-10),
      })
    );
    const outcome = runSimulationOnce(context, 0);
    // Year 1 draws the full desired 1,000,000 (no prior return to react to)
    expect(outcome.incomeAnnualPence[0]).toBeCloseTo(1_000_000, 0);
    // Each subsequent year saw a loss the year before, so the deflator compounds
    // by another year of 2.5% inflation and never recovers.
    expect(outcome.incomeAnnualPence[1]).toBeCloseTo(1_000_000 / 1.025, 0);
    expect(outcome.incomeAnnualPence[2]).toBeCloseTo(1_000_000 / 1.025 ** 2, 0);
  });

  it('leaves the target untouched when no year makes a loss', () => {
    const context = prepareSimulationContext(
      makeInputs({
        members: [
          makeMember({
            balancesPencePerWrapper: {
              [InvestmentWrapper.ISA]: 100_000_000,
            },
          }),
        ],
        withdrawalAnnualPence: 1_000_000,
        withdrawalStrategy: {
          kind: WithdrawalStrategyKind.FIXED_REAL_NO_INFLATION_AFTER_LOSS,
        },
        returns: flatReturns(5),
      })
    );
    const outcome = runSimulationOnce(context, 0);
    for (const income of outcome.incomeAnnualPence) {
      expect(income).toBeCloseTo(1_000_000, 0);
    }
  });
});

describe('VANGUARD_DYNAMIC strategy', () => {
  it('clamps a crash-year cut at the floor', () => {
    // 4% of 1,000,000 = 40,000 year one. A -50% crash would push the raw target
    // to 4% of 480,000 = 19,200, but the -1.5% floor holds it at 40,000*0.985.
    const context = prepareSimulationContext(
      makeInputs({
        members: [
          makeMember({
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 1_000_000 },
          }),
        ],
        withdrawalAnnualPence: 40_000,
        returns: flatReturns(-50),
        withdrawalStrategy: {
          kind: WithdrawalStrategyKind.VANGUARD_DYNAMIC,
          fixedPercentRatePct: 4,
          vanguardFloorPct: -1.5,
          vanguardCeilingPct: 5,
        },
      })
    );
    const outcome = runSimulationOnce(context, 0);
    expect(outcome.incomeAnnualPence[0]).toBeCloseTo(40_000, 0);
    expect(outcome.incomeAnnualPence[1]).toBeCloseTo(40_000 * 0.985, 0);
  });

  it('clamps a boom-year rise at the ceiling', () => {
    // 4% of 1,000,000 = 40,000 year one. A +100% boom would push the raw target
    // to 4% of 1,920,000 = 76,800, but the +5% ceiling holds it at 40,000*1.05.
    const context = prepareSimulationContext(
      makeInputs({
        members: [
          makeMember({
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 1_000_000 },
          }),
        ],
        withdrawalAnnualPence: 40_000,
        returns: flatReturns(100),
        withdrawalStrategy: {
          kind: WithdrawalStrategyKind.VANGUARD_DYNAMIC,
          fixedPercentRatePct: 4,
          vanguardFloorPct: -1.5,
          vanguardCeilingPct: 5,
        },
      })
    );
    const outcome = runSimulationOnce(context, 0);
    expect(outcome.incomeAnnualPence[0]).toBeCloseTo(40_000, 0);
    expect(outcome.incomeAnnualPence[1]).toBeCloseTo(40_000 * 1.05, 0);
  });
});

describe('SPENDING_DECLINE strategy', () => {
  it('tapers the desired spend geometrically each year', () => {
    const context = prepareSimulationContext(
      makeInputs({
        members: [
          makeMember({
            balancesPencePerWrapper: {
              [InvestmentWrapper.ISA]: 100_000_000,
            },
          }),
        ],
        withdrawalAnnualPence: 1_000_000,
        withdrawalStrategy: {
          kind: WithdrawalStrategyKind.SPENDING_DECLINE,
          spendingDeclinePctPerYear: -10,
        },
      })
    );
    const outcome = runSimulationOnce(context, 0);
    expect(outcome.incomeAnnualPence[0]).toBeCloseTo(1_000_000, 0);
    expect(outcome.incomeAnnualPence[1]).toBeCloseTo(900_000, 0);
    expect(outcome.incomeAnnualPence[2]).toBeCloseTo(810_000, 0);
  });
});

describe('ENDOWMENT_TEN_YEAR_AVG strategy', () => {
  it('smooths income against a step change in wealth via the rolling average', () => {
    // Zero return keeps wealth flat once withdrawals settle; a 3-year window on
    // a 1,000,000 pot at 4% pays 40,000 the first year and lags as the average
    // of the (shrinking) history catches up.
    const context = prepareSimulationContext(
      makeInputs({
        members: [
          makeMember({
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 1_000_000 },
          }),
        ],
        withdrawalAnnualPence: 40_000,
        withdrawalStrategy: {
          kind: WithdrawalStrategyKind.ENDOWMENT_TEN_YEAR_AVG,
          fixedPercentRatePct: 4,
          endowmentAveragingYears: 3,
        },
      })
    );
    const outcome = runSimulationOnce(context, 0);
    // Year 1: history [1,000,000] => 4% * 1,000,000 = 40,000
    expect(outcome.incomeAnnualPence[0]).toBeCloseTo(40_000, 0);
    // Year 2: pot is 960,000; history avg (1,000,000 + 960,000)/2 = 980,000 =>
    // 4% => 39,200, i.e. lagging the current pot's own 4% of 38,400.
    expect(outcome.incomeAnnualPence[1]).toBeCloseTo(39_200, 0);
  });
});

describe('PROBABILITY_GUARDRAILS strategy', () => {
  // The funded ratio is memberWealth / (carriedSpend * annuityFactor) at the
  // lower real return; below the lower band the spend is cut ×0.9, above the
  // upper band it is raised ×1.1.
  it('cuts the carried spend when the funded ratio is below the lower band', () => {
    // 500,000 pot, 100,000 carried spend, lowerRealPct 2%, 10-year horizon.
    // annuityFactor(0.02, 10) ≈ 8.9826, required ≈ 898,259, funded ≈ 0.557 <
    // 0.80 => cut to 90,000.
    const context = prepareSimulationContext(
      makeInputs({
        members: [
          makeMember({
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 500_000 },
          }),
        ],
        withdrawalAnnualPence: 100_000,
        withdrawalStrategy: {
          kind: WithdrawalStrategyKind.PROBABILITY_GUARDRAILS,
          probabilityGuardrailLowerPct: 80,
          probabilityGuardrailUpperPct: 99,
        },
      })
    );
    const outcome = runSimulationOnce(context, 0);
    expect(outcome.incomeAnnualPence[0]).toBeCloseTo(90_000, 0);
  });

  it('raises the carried spend when the funded ratio is above the upper band', () => {
    // A very large pot against a small carried spend makes the funded ratio far
    // above 0.99, so the first year steps the spend up ×1.1.
    const context = prepareSimulationContext(
      makeInputs({
        members: [
          makeMember({
            balancesPencePerWrapper: {
              [InvestmentWrapper.ISA]: 100_000_000,
            },
          }),
        ],
        withdrawalAnnualPence: 100_000,
        withdrawalStrategy: {
          kind: WithdrawalStrategyKind.PROBABILITY_GUARDRAILS,
          probabilityGuardrailLowerPct: 80,
          probabilityGuardrailUpperPct: 99,
        },
      })
    );
    const outcome = runSimulationOnce(context, 0);
    expect(outcome.incomeAnnualPence[0]).toBeCloseTo(110_000, 0);
  });
});

describe('sampled Monte Carlo paths', () => {
  it('caps the sampled paths and keeps their trajectories', () => {
    const context = prepareSimulationContext(
      makeInputs({ runs: MAX_SAMPLED_PATHS + 40 })
    );
    const outcomes = Array.from(
      { length: MAX_SAMPLED_PATHS + 40 },
      (_, runIndex) => runSimulationOnce(context, runIndex)
    );
    const result = aggregateSimulationOutcomes(context, outcomes);
    expect(result.sampledPathsPence).toHaveLength(MAX_SAMPLED_PATHS);
    expect(result.sampledPathsPence[0].runIndex).toBe(0);
    expect(
      result.sampledPathsPence[result.sampledPathsPence.length - 1].runIndex
    ).toBe(MAX_SAMPLED_PATHS + 39);
    expect(result.sampledPathsPence[0].totalsPence).toEqual(
      outcomes[0].pathTotalsPence
    );
  });

  it('returns every run when below the cap', () => {
    const result = runRetirementSimulation(makeInputs({ runs: 5 }));
    expect(result.sampledPathsPence).toHaveLength(5);
    expect(result.sampledPathsPence.map((path) => path.runIndex)).toEqual([
      0, 1, 2, 3, 4,
    ]);
  });
});

describe('lifetime value metrics', () => {
  it('accumulates a fixed-real income into a monotonic lifetime total', () => {
    // 100,000 ISA, 10,000/yr desired, zero return: withdraws 10,000 a year and
    // exhausts the pot exactly over the 10-year plan, so lifetime withdrawals
    // total the whole pot and nothing is left.
    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 10_000_000 },
          }),
        ],
        withdrawalAnnualPence: 1_000_000,
        withdrawalStrategy: { kind: WithdrawalStrategyKind.FIXED_REAL },
      })
    );
    const cumulative = result.cumulativeIncomePathsPence;
    expect(cumulative[0].p50).toBe(0);
    for (let index = 1; index < cumulative.length; index += 1) {
      expect(cumulative[index].p50).toBeGreaterThanOrEqual(
        cumulative[index - 1].p50
      );
    }
    // The final cumulative point is the total lifetime withdrawals band.
    expect(cumulative[cumulative.length - 1].p50).toBe(
      result.totalLifetimeWithdrawalsPence.p50
    );
    expect(result.totalLifetimeWithdrawalsPence.p50).toBeCloseTo(10_000_000, 0);
    expect(result.endingWealthPercentilesPence.p50).toBeCloseTo(0, 0);
  });

  it('combines lifetime withdrawals with the ending pot', () => {
    // Fixed-percent never exhausts, so a real ending pot remains and the
    // combined total exceeds lifetime withdrawals alone.
    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 10_000_000 },
          }),
        ],
        withdrawalAnnualPence: 100_000,
        withdrawalStrategy: {
          kind: WithdrawalStrategyKind.FIXED_PERCENT,
          fixedPercentRatePct: 4,
        },
      })
    );
    expect(result.combinedTotalPence.p50).toBeCloseTo(
      result.totalLifetimeWithdrawalsPence.p50 +
        result.endingWealthPercentilesPence.p50,
      0
    );
    expect(result.combinedTotalPence.p50).toBeGreaterThan(
      result.totalLifetimeWithdrawalsPence.p50
    );
  });

  it('reports lifetime value per member that rolls up to the household', () => {
    const result = runRetirementSimulation(
      makeInputs({
        members: [
          makeMember({
            userId: 'a',
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 10_000_000 },
          }),
          makeMember({
            userId: 'b',
            balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 6_000_000 },
          }),
        ],
        withdrawalAnnualPence: 1_000_000,
        withdrawalStrategy: { kind: WithdrawalStrategyKind.FIXED_REAL },
      })
    );
    expect(result.memberBreakdowns).toHaveLength(2);
    for (const breakdown of result.memberBreakdowns) {
      expect(breakdown.cumulativeIncomePathsPence[0].p50).toBe(0);
      expect(
        breakdown.cumulativeIncomePathsPence[
          breakdown.cumulativeIncomePathsPence.length - 1
        ].p50
      ).toBe(breakdown.totalLifetimeWithdrawalsPence.p50);
    }
  });
});
