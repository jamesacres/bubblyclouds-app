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
  ...overrides,
});

const makeInputs = (
  overrides: Partial<SimulationInputs> = {}
): SimulationInputs => ({
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
});

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

  it('never exhausts the pot but fails on the income floor', () => {
    const result = runRetirementSimulation(inputs());
    expect(result.failures.byKind[FailureKind.WEALTH_EXHAUSTED]).toBe(0);
    expect(result.failures.byKind[FailureKind.BRIDGE_EXHAUSTED]).toBe(0);
    // 4% of 1,000,000 is 40,000, below the 100,000 floor, so every run fails
    // on the income floor rather than exhausting
    expect(result.failures.byKind[FailureKind.INCOME_BELOW_FLOOR]).toBe(5);
    expect(result.successRatePct).toBe(0);
  });

  it('succeeds when the fixed percent clears the floor every year', () => {
    // Income declines from 40,000 in year one to ~27,700 by the final year, so
    // a 25,000 floor is cleared every year and every run succeeds.
    const result = runRetirementSimulation({
      ...inputs(),
      withdrawalAnnualPence: 25_000,
    });
    expect(result.successRatePct).toBe(100);
    expect(result.failures.count).toBe(0);
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
