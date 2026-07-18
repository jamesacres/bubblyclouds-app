import { addMonths, monthsBetween } from '../helpers/monthId';
import { InvestmentWrapper } from '../types/accounts';
import { MonthId } from '../types/monthId';
import {
  FailureKind,
  SimulationInputs,
  SimulationMember,
  SimulationResult,
} from '../types/simulation';
import { ageAtDate, getNmpaAge, getStatePensionAge } from './accessRules';
import { accumulateContributions } from './projection';
import { createRng, sampleIndex } from './rng';
import {
  grossPensionForNet,
  netFromGrossPension,
  TAXABLE_PENSION_FRACTION,
} from './tax';

// Everything runs in today's-money (real) terms: growth is bootstrapped from
// the dataset's REAL annual returns, so the constant net withdrawal keeps its
// purchasing power without explicit inflation handling.

const ALL_WRAPPERS: InvestmentWrapper[] = Object.values(InvestmentWrapper);

const BRIDGE_WITHDRAWAL_ORDER: InvestmentWrapper[] = [
  InvestmentWrapper.ISA,
  InvestmentWrapper.GIA,
  InvestmentWrapper.CRYPTO,
  InvestmentWrapper.OTHER,
];

// Within a member the two pension wrappers are financially identical (same
// access age, same tax), so they are drained in this fixed order.
const PENSION_WRAPPERS: InvestmentWrapper[] = [
  InvestmentWrapper.SIPP,
  InvestmentWrapper.COMPANY_PENSION,
];

// Tolerance for float dust in flow-control comparisons
const FLOW_EPSILON_PENCE = 1e-6;
// Shortfalls under half a penny are rounding artefacts of the tax
// inversion, not genuine failures
const FAILURE_EPSILON_PENCE = 0.5;

interface SimulationMemberContext {
  member: SimulationMember;
  nmpaAge: number;
  statePensionAge: number;
  statePensionAnnualPence: number;
}

export interface SimulationContext {
  inputs: SimulationInputs;
  members: SimulationMemberContext[];
  accumulationMonths: number;
  // Start-of-year ISO dates for each annual withdrawal step; the run ends
  // (horizon) once the oldest member's age at a step start reaches planToAge
  withdrawalYearStartIsoDates: string[];
  // Calendar years for the percentile paths: index 0 is wealth at
  // retirement, index i is wealth after withdrawal step i
  pathYears: number[];
}

export interface SimulationRunFailure {
  kind: FailureKind;
  year: number;
}

export interface SimulationRunOutcome {
  endingWealthPence: number;
  failure?: SimulationRunFailure;
  pathTotalsPence: number[];
}

const isoDateAtMonthStart = (monthId: MonthId): string => `${monthId}-01`;

const yearOfIsoDate = (isoDate: string): number => Number(isoDate.slice(0, 4));

export const prepareSimulationContext = (
  inputs: SimulationInputs
): SimulationContext => {
  if (inputs.runs < 1) {
    throw new Error('runRetirementSimulation requires at least one run');
  }
  if (inputs.members.length === 0) {
    throw new Error('runRetirementSimulation requires at least one member');
  }
  if (inputs.returns.length === 0) {
    throw new Error('runRetirementSimulation requires a returns dataset');
  }
  if (!Number.isFinite(inputs.planToAge)) {
    throw new Error('runRetirementSimulation requires a finite planToAge');
  }
  const members = inputs.members.map((member) => ({
    member,
    nmpaAge: getNmpaAge(member.dateOfBirth, member.overrides.nmpaAgeOverride),
    statePensionAge: getStatePensionAge(
      member.dateOfBirth,
      member.overrides.statePensionAgeOverride
    ),
    statePensionAnnualPence:
      member.overrides.statePensionAnnualPenceOverride ??
      inputs.assumptions.statePensionAnnualPence,
  }));
  const accumulationMonths = Math.max(
    0,
    monthsBetween(inputs.startMonth, inputs.retirementMonth)
  );
  const oldestDateOfBirth = members.reduce(
    (oldest, memberContext) =>
      memberContext.member.dateOfBirth < oldest
        ? memberContext.member.dateOfBirth
        : oldest,
    members[0].member.dateOfBirth
  );
  const withdrawalYearStartIsoDates: string[] = [];
  for (let yearIndex = 0; ; yearIndex += 1) {
    const stepStartIsoDate = isoDateAtMonthStart(
      addMonths(inputs.retirementMonth, yearIndex * 12)
    );
    if (ageAtDate(oldestDateOfBirth, stepStartIsoDate) >= inputs.planToAge) {
      break;
    }
    withdrawalYearStartIsoDates.push(stepStartIsoDate);
  }
  const retirementYear = yearOfIsoDate(
    isoDateAtMonthStart(inputs.retirementMonth)
  );
  const pathYears = [retirementYear];
  for (
    let yearIndex = 1;
    yearIndex <= withdrawalYearStartIsoDates.length;
    yearIndex += 1
  ) {
    pathYears.push(retirementYear + yearIndex);
  }
  return {
    inputs,
    members,
    accumulationMonths,
    withdrawalYearStartIsoDates,
    pathYears,
  };
};

// Per-run seeds are a pure hash of (seed, runIndex) so a run's outcome never
// depends on execution order or chunking (sync and async agree exactly)
export const deriveRunSeed = (seed: number, runIndex: number): number => {
  let mixed = (seed ^ Math.imul(runIndex + 1, 0x9e3779b9)) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x85ebca6b) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 13), 0xc2b2ae35) >>> 0;
  return (mixed ^ (mixed >>> 16)) >>> 0;
};

export const runSimulationOnce = (
  context: SimulationContext,
  runIndex: number
): SimulationRunOutcome => {
  const { inputs } = context;
  const rng = createRng(deriveRunSeed(inputs.seed, runIndex));
  const drawAnnualRealPct = (): number =>
    inputs.returns[sampleIndex(rng, inputs.returns.length)].realPct;

  // Accumulation: one bootstrap draw per 12-month block anchored at
  // startMonth; each month in the block compounds at the annual rate's
  // twelfth root, so a partial final year pro-rates its draw geometrically
  const accumulationYears = Math.ceil(context.accumulationMonths / 12);
  const accumulationYearRealPcts: number[] = [];
  for (let yearIndex = 0; yearIndex < accumulationYears; yearIndex += 1) {
    accumulationYearRealPcts.push(drawAnnualRealPct());
  }
  const monthlyGrowthFactor = (monthIndex: number): number =>
    (1 + accumulationYearRealPcts[Math.floor((monthIndex - 1) / 12)] / 100) **
    (1 / 12);

  const memberBalances = context.members.map((memberContext) => {
    let balancesAtRetirement = memberContext.member.balancesPencePerWrapper;
    if (context.accumulationMonths > 0) {
      const points = accumulateContributions({
        startBalancesPencePerWrapper:
          memberContext.member.balancesPencePerWrapper,
        contributions: memberContext.member.contributions,
        startMonth: inputs.startMonth,
        months: context.accumulationMonths,
        monthlyGrowthFactor,
      });
      balancesAtRetirement = points[points.length - 1].balancesPencePerWrapper;
    }
    const balances = new Map<InvestmentWrapper, number>();
    for (const wrapper of ALL_WRAPPERS) {
      balances.set(wrapper, balancesAtRetirement[wrapper] ?? 0);
    }
    return balances;
  });

  const memberWrapperTotal = (
    memberIndex: number,
    wrappers: InvestmentWrapper[]
  ): number =>
    wrappers.reduce(
      (total, wrapper) =>
        total + (memberBalances[memberIndex].get(wrapper) ?? 0),
      0
    );

  const totalWealthPence = (): number =>
    memberBalances.reduce((total, _, memberIndex) => {
      return total + memberWrapperTotal(memberIndex, ALL_WRAPPERS);
    }, 0);

  const deductPension = (memberIndex: number, amountPence: number): void => {
    let remainingPence = amountPence;
    for (const wrapper of PENSION_WRAPPERS) {
      const balancePence = memberBalances[memberIndex].get(wrapper) ?? 0;
      const drawPence = Math.min(balancePence, remainingPence);
      memberBalances[memberIndex].set(wrapper, balancePence - drawPence);
      remainingPence -= drawPence;
      if (remainingPence <= 0) {
        break;
      }
    }
  };

  const pathTotalsPence: number[] = [totalWealthPence()];
  let failure: SimulationRunFailure | undefined;

  // Withdrawal phase, annual steps: state pension first, then bridge
  // wrappers in fixed order (each wrapper split across members
  // proportionally to their balance in it), then unlocked pensions
  // proportionally to members' pension balances. Withdrawals happen at the
  // start of the year; growth applies to what remains.
  for (const stepStartIsoDate of context.withdrawalYearStartIsoDates) {
    if (failure) {
      pathTotalsPence.push(0);
      continue;
    }

    const statePensionByMember = context.members.map((memberContext) =>
      inputs.includeStatePension &&
      ageAtDate(memberContext.member.dateOfBirth, stepStartIsoDate) >=
        memberContext.statePensionAge
        ? memberContext.statePensionAnnualPence
        : 0
    );
    let needNetPence = Math.max(
      0,
      inputs.withdrawalAnnualPence -
        statePensionByMember.reduce((total, pence) => total + pence, 0)
    );

    for (const wrapper of BRIDGE_WITHDRAWAL_ORDER) {
      if (needNetPence <= FLOW_EPSILON_PENCE) {
        break;
      }
      const wrapperTotalPence = memberBalances.reduce(
        (total, balances) => total + (balances.get(wrapper) ?? 0),
        0
      );
      if (wrapperTotalPence <= 0) {
        continue;
      }
      const drawPence = Math.min(needNetPence, wrapperTotalPence);
      for (const balances of memberBalances) {
        const balancePence = balances.get(wrapper) ?? 0;
        balances.set(
          wrapper,
          balancePence - (drawPence * balancePence) / wrapperTotalPence
        );
      }
      needNetPence -= drawPence;
    }

    if (needNetPence > FLOW_EPSILON_PENCE) {
      const unlockedMemberIndexes = context.members
        .map((memberContext, memberIndex) => ({ memberContext, memberIndex }))
        .filter(
          ({ memberContext }) =>
            ageAtDate(memberContext.member.dateOfBirth, stepStartIsoDate) >=
            memberContext.nmpaAge
        )
        .map(({ memberIndex }) => memberIndex);
      const grossPensionDrawnByMember = context.members.map(() => 0);
      // Each pass allocates the remaining net need across eligible members
      // proportionally to their pension balances; members whose pot cannot
      // cover their grossed-up share are drained, and the residual need is
      // reallocated in the next pass. Terminates because a pass either
      // satisfies the need or drains at least one member's pension.
      for (;;) {
        if (needNetPence <= FLOW_EPSILON_PENCE) {
          break;
        }
        const eligibleMemberIndexes = unlockedMemberIndexes.filter(
          (memberIndex) =>
            memberWrapperTotal(memberIndex, PENSION_WRAPPERS) >
            FLOW_EPSILON_PENCE
        );
        if (eligibleMemberIndexes.length === 0) {
          break;
        }
        const totalPensionPence = eligibleMemberIndexes.reduce(
          (total, memberIndex) =>
            total + memberWrapperTotal(memberIndex, PENSION_WRAPPERS),
          0
        );
        let deliveredNetPence = 0;
        for (const memberIndex of eligibleMemberIndexes) {
          const pensionPence = memberWrapperTotal(
            memberIndex,
            PENSION_WRAPPERS
          );
          const netSharePence =
            (needNetPence * pensionPence) / totalPensionPence;
          // State pension (when received) plus the taxable slice of pension
          // already drawn this year both use up the member's tax bands
          const otherTaxableIncomePence =
            statePensionByMember[memberIndex] +
            TAXABLE_PENSION_FRACTION * grossPensionDrawnByMember[memberIndex];
          const grossNeededPence = inputs.applyTax
            ? grossPensionForNet(
                netSharePence,
                otherTaxableIncomePence,
                inputs.assumptions.taxBands
              )
            : netSharePence;
          if (grossNeededPence > pensionPence) {
            deliveredNetPence += inputs.applyTax
              ? netFromGrossPension(
                  pensionPence,
                  otherTaxableIncomePence,
                  inputs.assumptions.taxBands
                )
              : pensionPence;
            grossPensionDrawnByMember[memberIndex] += pensionPence;
            deductPension(memberIndex, pensionPence);
          } else {
            deliveredNetPence += netSharePence;
            grossPensionDrawnByMember[memberIndex] += grossNeededPence;
            deductPension(memberIndex, grossNeededPence);
          }
        }
        needNetPence -= deliveredNetPence;
      }
    }

    if (needNetPence > FAILURE_EPSILON_PENCE) {
      // Everything accessible has been drained (the pension loop only exits
      // with unlocked pensions empty), so remaining wealth is exactly the
      // still-locked pensions of members below their NMPA: nonzero means the
      // bridge ran dry before pensions unlocked, zero means total exhaustion
      const remainingWealthPence = totalWealthPence();
      failure = {
        kind:
          remainingWealthPence > FAILURE_EPSILON_PENCE
            ? FailureKind.BRIDGE_EXHAUSTED
            : FailureKind.WEALTH_EXHAUSTED,
        year: yearOfIsoDate(stepStartIsoDate),
      };
      pathTotalsPence.push(0);
      continue;
    }

    const growthFactor = 1 + drawAnnualRealPct() / 100;
    for (const balances of memberBalances) {
      for (const [wrapper, balancePence] of balances) {
        balances.set(wrapper, balancePence * growthFactor);
      }
    }
    pathTotalsPence.push(totalWealthPence());
  }

  return {
    endingWealthPence: failure ? 0 : totalWealthPence(),
    failure,
    pathTotalsPence,
  };
};

const percentileFromSorted = (
  sortedAscending: number[],
  percentile: number
): number => {
  const position = (percentile / 100) * (sortedAscending.length - 1);
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const fraction = position - lowerIndex;
  return Math.round(
    sortedAscending[lowerIndex] +
      (sortedAscending[upperIndex] - sortedAscending[lowerIndex]) * fraction
  );
};

const percentileSummary = (
  values: number[]
): { p5: number; p25: number; p50: number; p75: number; p95: number } => {
  const sorted = [...values].sort((first, second) => first - second);
  return {
    p5: percentileFromSorted(sorted, 5),
    p25: percentileFromSorted(sorted, 25),
    p50: percentileFromSorted(sorted, 50),
    p75: percentileFromSorted(sorted, 75),
    p95: percentileFromSorted(sorted, 95),
  };
};

export const aggregateSimulationOutcomes = (
  context: SimulationContext,
  outcomes: SimulationRunOutcome[]
): SimulationResult => {
  const byKind: Record<FailureKind, number> = {
    [FailureKind.BRIDGE_EXHAUSTED]: 0,
    [FailureKind.WEALTH_EXHAUSTED]: 0,
  };
  const failureYears: number[] = [];
  for (const outcome of outcomes) {
    if (outcome.failure) {
      byKind[outcome.failure.kind] += 1;
      failureYears.push(outcome.failure.year);
    }
  }
  failureYears.sort((first, second) => first - second);
  // Lower median so the reported year is always an actual failure year
  const medianFailureYear =
    failureYears.length > 0
      ? failureYears[Math.floor((failureYears.length - 1) / 2)]
      : undefined;
  return {
    successRatePct:
      ((outcomes.length - failureYears.length) / outcomes.length) * 100,
    endingWealthPercentilesPence: percentileSummary(
      outcomes.map((outcome) => outcome.endingWealthPence)
    ),
    percentilePathsPence: context.pathYears.map((year, pathIndex) => ({
      year,
      ...percentileSummary(
        outcomes.map((outcome) => outcome.pathTotalsPence[pathIndex])
      ),
    })),
    failures: {
      count: failureYears.length,
      medianFailureYear,
      byKind,
    },
  };
};

export const runRetirementSimulation = (
  inputs: SimulationInputs
): SimulationResult => {
  const context = prepareSimulationContext(inputs);
  const outcomes: SimulationRunOutcome[] = [];
  for (let runIndex = 0; runIndex < inputs.runs; runIndex += 1) {
    outcomes.push(runSimulationOnce(context, runIndex));
  }
  return aggregateSimulationOutcomes(context, outcomes);
};
