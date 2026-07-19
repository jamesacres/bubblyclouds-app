import { addMonths, monthsBetween } from '../helpers/monthId';
import { InvestmentWrapper } from '../types/accounts';
import { MonthId } from '../types/monthId';
import {
  DEFAULT_ENDOWMENT_AVERAGING_YEARS,
  DEFAULT_FIXED_PERCENT_RATE_PCT,
  DEFAULT_GUARDRAIL_WIDTH_PCT,
  DEFAULT_PROBABILITY_GUARDRAIL_LOWER_PCT,
  DEFAULT_PROBABILITY_GUARDRAIL_UPPER_PCT,
  DEFAULT_SPENDING_DECLINE_PCT_PER_YEAR,
  DEFAULT_VANGUARD_CEILING_PCT,
  DEFAULT_VANGUARD_FLOOR_PCT,
  WithdrawalStrategy,
  WithdrawalStrategyKind,
} from '../types/assumptions';
import {
  FailureKind,
  MemberBreakdown,
  PercentileBand,
  PercentilePathPoint,
  SampledRunPath,
  SimulationInputs,
  SimulationMember,
  SimulationResult,
} from '../types/simulation';
import { ageAtDate, getNmpaAge, getStatePensionAge } from './accessRules';
import { accumulateContributions } from './projection';
import { createRng, sampleIndex } from './rng';
import { grossPensionForNet, netFromGrossPension } from './tax';

// Everything runs in today's-money (real) terms: growth is bootstrapped from
// the dataset's REAL annual returns, so a constant net withdrawal keeps its
// purchasing power without explicit inflation handling. Balance-linked
// strategies (fixed-percent, guardrails, RMD, endowment, probability-guardrails,
// Vanguard-dynamic) recompute the year's target from the current real portfolio,
// so their income also stays in real terms.
//
// The one exception is FIXED_REAL_NO_INFLATION_AFTER_LOSS, which deliberately
// erodes purchasing power: after any year of realised real loss it scales the
// real target down by one year of inflation and never restores it, modelling a
// retiree who freezes their nominal spend after a bad year.
//
// Members run fully-personal plans against a SHARED market: one run-level RNG
// draws one accumulation-year array and one withdrawal-phase growth sequence,
// and every member is grown by the same factor each year. No member has its own
// RNG stream (that would break sync-vs-async parity). Each member drains only
// their own pots, offsets only their own state pension, and gates pensions on
// their own NMPA; the household result is the sum/rollup of the personal plans,
// and the run is a household failure if any member's plan fails.

const ALL_WRAPPERS: InvestmentWrapper[] = Object.values(InvestmentWrapper);

// Cap on how many individual run trajectories are retained for the Monte Carlo
// spaghetti chart; sampled by run index so the subset is deterministic and the
// UI payload stays bounded regardless of the run count.
export const MAX_SAMPLED_PATHS = 120;

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

export interface SimulationMemberRunOutcome {
  userId: string;
  endingWealthPence: number;
  failure?: SimulationRunFailure;
  incomeAnnualPence: number[];
  pathTotalsPence: number[];
}

export interface SimulationRunOutcome {
  endingWealthPence: number;
  failure?: SimulationRunFailure;
  pathTotalsPence: number[];
  // Net household income delivered each withdrawal year (real terms). Index i
  // aligns with withdrawal step i; there is no entry for the at-retirement
  // point, so this array is one shorter than pathTotalsPence.
  incomeAnnualPence: number[];
  // Per-member view of this run: one entry per member, each running its own
  // personal plan. The household fields above are the roll-up of these.
  memberOutcomes: SimulationMemberRunOutcome[];
}

const resolveStrategy = (
  strategy: WithdrawalStrategy | undefined
): Required<WithdrawalStrategy> => ({
  kind: strategy?.kind ?? WithdrawalStrategyKind.FIXED_REAL,
  fixedPercentRatePct:
    strategy?.fixedPercentRatePct ?? DEFAULT_FIXED_PERCENT_RATE_PCT,
  guardrailWidthPct: strategy?.guardrailWidthPct ?? DEFAULT_GUARDRAIL_WIDTH_PCT,
  vanguardFloorPct: strategy?.vanguardFloorPct ?? DEFAULT_VANGUARD_FLOOR_PCT,
  vanguardCeilingPct:
    strategy?.vanguardCeilingPct ?? DEFAULT_VANGUARD_CEILING_PCT,
  spendingDeclinePctPerYear:
    strategy?.spendingDeclinePctPerYear ??
    DEFAULT_SPENDING_DECLINE_PCT_PER_YEAR,
  endowmentAveragingYears:
    strategy?.endowmentAveragingYears ?? DEFAULT_ENDOWMENT_AVERAGING_YEARS,
  probabilityGuardrailLowerPct:
    strategy?.probabilityGuardrailLowerPct ??
    DEFAULT_PROBABILITY_GUARDRAIL_LOWER_PCT,
  probabilityGuardrailUpperPct:
    strategy?.probabilityGuardrailUpperPct ??
    DEFAULT_PROBABILITY_GUARDRAIL_UPPER_PCT,
});

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

  // Per-member carried state: own pots, own resolved strategy and desired
  // withdrawal, plus whatever running quantities each strategy ratchets between
  // years. No cross-member pooling: each member drains only these balances.
  const memberPlans = context.members.map((memberContext) => {
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
    const strategy = resolveStrategy(memberContext.member.withdrawalStrategy);
    const desiredWithdrawalPence =
      memberContext.member.desiredWithdrawalAnnualPence;
    const startingWealthPence = ALL_WRAPPERS.reduce(
      (total, wrapper) => total + (balances.get(wrapper) ?? 0),
      0
    );
    const guardrailInitialRate =
      (strategy.fixedPercentRatePct ?? DEFAULT_FIXED_PERCENT_RATE_PCT) / 100;
    return {
      memberContext,
      balances,
      strategy,
      desiredWithdrawalPence,
      guardrailInitialRate,
      // GUARDRAILS running target: initial rate on the starting pot, or the
      // desired withdrawal when there is no starting pot.
      guardrailWithdrawalPence:
        startingWealthPence > 0
          ? guardrailInitialRate * startingWealthPence
          : desiredWithdrawalPence,
      // VANGUARD_DYNAMIC last delivered target (undefined in the first year).
      lastActualWithdrawalPence: undefined as number | undefined,
      // FIXED_REAL_NO_INFLATION_AFTER_LOSS persistent real-terms deflator.
      deflatedFactor: 1,
      // ENDOWMENT_TEN_YEAR_AVG rolling start-of-year wealth window.
      portfolioHistoryPence: [] as number[],
      // PROBABILITY_GUARDRAILS carried spend, ratcheted by the funded ratio.
      probabilityWithdrawalPence: desiredWithdrawalPence,
      // Per-member run recording.
      incomeAnnualPence: [] as number[],
      pathTotalsPence: [] as number[],
      failure: undefined as SimulationRunFailure | undefined,
    };
  });

  type MemberPlan = (typeof memberPlans)[number];

  const wrapperTotal = (
    plan: MemberPlan,
    wrappers: InvestmentWrapper[]
  ): number =>
    wrappers.reduce(
      (total, wrapper) => total + (plan.balances.get(wrapper) ?? 0),
      0
    );

  const memberWealthPence = (plan: MemberPlan): number =>
    wrapperTotal(plan, ALL_WRAPPERS);

  const deductPension = (plan: MemberPlan, amountPence: number): void => {
    let remainingPence = amountPence;
    for (const wrapper of PENSION_WRAPPERS) {
      const balancePence = plan.balances.get(wrapper) ?? 0;
      const drawPence = Math.min(balancePence, remainingPence);
      plan.balances.set(wrapper, balancePence - drawPence);
      remainingPence -= drawPence;
      if (remainingPence <= 0) {
        break;
      }
    }
  };

  for (const plan of memberPlans) {
    plan.pathTotalsPence.push(memberWealthPence(plan));
  }

  // The member's desired gross withdrawal (before state pension offset) for the
  // year, given its own strategy and its own current real portfolio.
  const desiredWithdrawalForYear = (
    plan: MemberPlan,
    memberWealthPence: number,
    stepIndex: number,
    realGrowthPreviousYearPct: number | undefined
  ): number => {
    const { strategy } = plan;
    const rate = strategy.fixedPercentRatePct / 100;
    switch (strategy.kind) {
      case WithdrawalStrategyKind.FIXED_PERCENT:
        return plan.guardrailInitialRate * memberWealthPence;
      case WithdrawalStrategyKind.RMD: {
        const remainingYears = Math.max(
          1,
          context.withdrawalYearStartIsoDates.length - stepIndex
        );
        return memberWealthPence / remainingYears;
      }
      case WithdrawalStrategyKind.GUARDRAILS: {
        if (memberWealthPence <= 0) {
          return plan.guardrailWithdrawalPence;
        }
        const currentRate = plan.guardrailWithdrawalPence / memberWealthPence;
        const bandWidth = strategy.guardrailWidthPct / 100;
        if (currentRate > plan.guardrailInitialRate * (1 + bandWidth)) {
          plan.guardrailWithdrawalPence *= 0.9;
        } else if (currentRate < plan.guardrailInitialRate * (1 - bandWidth)) {
          plan.guardrailWithdrawalPence *= 1.1;
        }
        return plan.guardrailWithdrawalPence;
      }
      case WithdrawalStrategyKind.FIXED_REAL_NO_INFLATION_AFTER_LOSS: {
        // After a year of realised real loss, freeze nominal spend: scale the
        // real target down by one year of inflation, persistently, never
        // re-inflating. The previous year's realised return is used so we never
        // peek at this year's (not yet drawn) growth.
        if (
          realGrowthPreviousYearPct !== undefined &&
          realGrowthPreviousYearPct < 0
        ) {
          plan.deflatedFactor *=
            1 / (1 + inputs.assumptions.inflationRatePct / 100);
        }
        return plan.desiredWithdrawalPence * plan.deflatedFactor;
      }
      case WithdrawalStrategyKind.VANGUARD_DYNAMIC: {
        const raw = rate * memberWealthPence;
        const last = plan.lastActualWithdrawalPence;
        const target =
          last === undefined
            ? raw
            : Math.min(
                Math.max(raw, last * (1 + strategy.vanguardFloorPct / 100)),
                last * (1 + strategy.vanguardCeilingPct / 100)
              );
        plan.lastActualWithdrawalPence = target;
        return target;
      }
      case WithdrawalStrategyKind.SPENDING_DECLINE:
        return (
          plan.desiredWithdrawalPence *
          (1 + strategy.spendingDeclinePctPerYear / 100) ** stepIndex
        );
      case WithdrawalStrategyKind.ENDOWMENT_TEN_YEAR_AVG: {
        plan.portfolioHistoryPence.push(memberWealthPence);
        if (
          plan.portfolioHistoryPence.length > strategy.endowmentAveragingYears
        ) {
          plan.portfolioHistoryPence.shift();
        }
        const average =
          plan.portfolioHistoryPence.reduce((sum, value) => sum + value, 0) /
          plan.portfolioHistoryPence.length;
        return rate * average;
      }
      case WithdrawalStrategyKind.PROBABILITY_GUARDRAILS: {
        // DETERMINISTIC funded-ratio approximation, NOT a nested Monte Carlo.
        // Re-simulating each member each year would make the whole run O(n^2);
        // instead we compare the pot to the present value of the carried spend
        // over the remaining horizon at the pessimistic (lower) real return and
        // nudge spend up/down when that funded ratio breaches the guardrails.
        const remainingYears = Math.max(
          1,
          context.withdrawalYearStartIsoDates.length - stepIndex
        );
        const realRate = inputs.assumptions.returnScenarios.lowerRealPct / 100;
        const annuityFactor =
          Math.abs(realRate) < 1e-9
            ? remainingYears
            : (1 - (1 + realRate) ** -remainingYears) / realRate;
        const required = plan.probabilityWithdrawalPence * annuityFactor;
        const fundedRatio =
          required > 0 ? memberWealthPence / required : Infinity;
        if (fundedRatio < strategy.probabilityGuardrailLowerPct / 100) {
          plan.probabilityWithdrawalPence *= 0.9;
        } else if (fundedRatio > strategy.probabilityGuardrailUpperPct / 100) {
          plan.probabilityWithdrawalPence *= 1.1;
        }
        return plan.probabilityWithdrawalPence;
      }
      case WithdrawalStrategyKind.FIXED_REAL:
      default:
        return plan.desiredWithdrawalPence;
    }
  };

  // FIXED_PERCENT / RMD / ENDOWMENT draw a fraction of the current pot and so
  // can never exhaust it from withdrawals alone; their failure is delivered
  // income falling below the year's desired target (income-below-floor). Every
  // other strategy keeps exhaustion semantics: an unmet net need means the
  // accessible pot ran dry.
  const usesFloorFailure = (plan: MemberPlan): boolean =>
    plan.strategy.kind === WithdrawalStrategyKind.FIXED_PERCENT ||
    plan.strategy.kind === WithdrawalStrategyKind.RMD ||
    plan.strategy.kind === WithdrawalStrategyKind.ENDOWMENT_TEN_YEAR_AVG;

  // Realised real growth of the most recent completed withdrawal year, shared
  // by every member (single market). Undefined before the first year.
  let realGrowthPreviousYearPct: number | undefined;

  for (
    let stepIndex = 0;
    stepIndex < context.withdrawalYearStartIsoDates.length;
    stepIndex += 1
  ) {
    const stepStartIsoDate = context.withdrawalYearStartIsoDates[stepIndex];

    // Each member withdraws against their own pots; run one shared growth draw
    // afterwards. State pension first (own eligibility), then own bridge
    // wrappers in fixed order, then own unlocked pensions with tax.
    for (const plan of memberPlans) {
      // Exhaustion halts this member (pot empty). A floor breach only flags the
      // member as failed; the balance-linked strategies keep paying out.
      if (
        plan.failure &&
        plan.failure.kind !== FailureKind.INCOME_BELOW_FLOOR
      ) {
        plan.pathTotalsPence.push(0);
        plan.incomeAnnualPence.push(0);
        continue;
      }

      const { memberContext } = plan;
      const statePensionPence =
        inputs.includeStatePension &&
        ageAtDate(memberContext.member.dateOfBirth, stepStartIsoDate) >=
          memberContext.statePensionAge
          ? memberContext.statePensionAnnualPence
          : 0;

      const memberWealthAtStartPence = memberWealthPence(plan);
      const desiredWithdrawalPence = desiredWithdrawalForYear(
        plan,
        memberWealthAtStartPence,
        stepIndex,
        realGrowthPreviousYearPct
      );
      const targetNetPence = Math.max(desiredWithdrawalPence, 0);
      let needNetPence = Math.max(0, targetNetPence - statePensionPence);
      const needNetAtStartPence = needNetPence;

      for (const wrapper of BRIDGE_WITHDRAWAL_ORDER) {
        if (needNetPence <= FLOW_EPSILON_PENCE) {
          break;
        }
        const wrapperPence = plan.balances.get(wrapper) ?? 0;
        if (wrapperPence <= 0) {
          continue;
        }
        const drawPence = Math.min(needNetPence, wrapperPence);
        plan.balances.set(wrapper, wrapperPence - drawPence);
        needNetPence -= drawPence;
      }

      const pensionUnlocked =
        ageAtDate(memberContext.member.dateOfBirth, stepStartIsoDate) >=
        memberContext.nmpaAge;
      if (needNetPence > FLOW_EPSILON_PENCE && pensionUnlocked) {
        const pensionPence = wrapperTotal(plan, PENSION_WRAPPERS);
        if (pensionPence > FLOW_EPSILON_PENCE) {
          // The state pension taxable income uses the member's bands before any
          // pension draw; the pension's taxable slice stacks on top.
          const otherTaxableIncomePence = statePensionPence;
          const grossNeededPence = inputs.applyTax
            ? grossPensionForNet(
                needNetPence,
                otherTaxableIncomePence,
                inputs.assumptions.taxBands
              )
            : needNetPence;
          if (grossNeededPence > pensionPence) {
            const deliveredNetPence = inputs.applyTax
              ? netFromGrossPension(
                  pensionPence,
                  otherTaxableIncomePence,
                  inputs.assumptions.taxBands
                )
              : pensionPence;
            deductPension(plan, pensionPence);
            needNetPence -= deliveredNetPence;
          } else {
            deductPension(plan, grossNeededPence);
            needNetPence = 0;
          }
        }
      }

      const deliveredFromPortfolioPence = needNetAtStartPence - needNetPence;
      const deliveredIncomePence =
        statePensionPence + deliveredFromPortfolioPence;

      if (usesFloorFailure(plan)) {
        plan.incomeAnnualPence.push(deliveredIncomePence);
        // Floor comparison uses this year's per-member desired target so the
        // fraction-of-portfolio and declining-target strategies compare like
        // for like.
        if (
          !plan.failure &&
          deliveredIncomePence < targetNetPence - FAILURE_EPSILON_PENCE
        ) {
          plan.failure = {
            kind: FailureKind.INCOME_BELOW_FLOOR,
            year: yearOfIsoDate(stepStartIsoDate),
          };
        }
        continue;
      }

      if (needNetPence > FAILURE_EPSILON_PENCE) {
        // Bridge and unlocked pensions are drained; any remaining wealth is the
        // member's still-locked pensions (below their NMPA): nonzero means the
        // bridge ran dry before their pensions unlocked, zero means total
        // exhaustion.
        const remainingWealthPence = memberWealthPence(plan);
        plan.failure = {
          kind:
            remainingWealthPence > FAILURE_EPSILON_PENCE
              ? FailureKind.BRIDGE_EXHAUSTED
              : FailureKind.WEALTH_EXHAUSTED,
          year: yearOfIsoDate(stepStartIsoDate),
        };
        plan.pathTotalsPence.push(0);
        plan.incomeAnnualPence.push(deliveredIncomePence);
        continue;
      }

      plan.incomeAnnualPence.push(deliveredIncomePence);
    }

    // Single shared market draw grows every member's remaining balances.
    const realGrowthPct = drawAnnualRealPct();
    const growthFactor = 1 + realGrowthPct / 100;
    for (const plan of memberPlans) {
      if (
        plan.failure &&
        plan.failure.kind !== FailureKind.INCOME_BELOW_FLOOR
      ) {
        continue;
      }
      for (const [wrapper, balancePence] of plan.balances) {
        plan.balances.set(wrapper, balancePence * growthFactor);
      }
      plan.pathTotalsPence.push(memberWealthPence(plan));
    }
    realGrowthPreviousYearPct = realGrowthPct;
  }

  // Per-member exhaustion-zeroing: a member whose plan exhausted reports zero
  // ending wealth (empty, or only still-locked pensions the plan never
  // reached); floor-based members always report their real remaining pot.
  const memberOutcomes: SimulationMemberRunOutcome[] = memberPlans.map(
    (plan) => {
      const isExhaustionFailure =
        plan.failure?.kind === FailureKind.BRIDGE_EXHAUSTED ||
        plan.failure?.kind === FailureKind.WEALTH_EXHAUSTED;
      const endingWealthPence = isExhaustionFailure
        ? 0
        : memberWealthPence(plan);
      return {
        userId: plan.memberContext.member.userId,
        endingWealthPence,
        failure: plan.failure,
        incomeAnnualPence: plan.incomeAnnualPence,
        pathTotalsPence: plan.pathTotalsPence,
      };
    }
  );

  const pointCount = context.withdrawalYearStartIsoDates.length + 1;
  const pathTotalsPence: number[] = [];
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
    pathTotalsPence.push(
      memberOutcomes.reduce(
        (total, outcome) => total + outcome.pathTotalsPence[pointIndex],
        0
      )
    );
  }
  const incomeAnnualPence: number[] = [];
  for (
    let stepIndex = 0;
    stepIndex < context.withdrawalYearStartIsoDates.length;
    stepIndex += 1
  ) {
    incomeAnnualPence.push(
      memberOutcomes.reduce(
        (total, outcome) => total + outcome.incomeAnnualPence[stepIndex],
        0
      )
    );
  }

  const endingWealthPence = memberOutcomes.reduce(
    (total, outcome) => total + outcome.endingWealthPence,
    0
  );

  // Household failure if ANY member failed; attribute to the failing member
  // with the earliest failure year (tie-break by member index).
  let failure: SimulationRunFailure | undefined;
  for (const outcome of memberOutcomes) {
    if (outcome.failure && (!failure || outcome.failure.year < failure.year)) {
      failure = outcome.failure;
    }
  }

  return {
    endingWealthPence,
    failure,
    pathTotalsPence,
    incomeAnnualPence,
    memberOutcomes,
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

const percentileSummary = (values: number[]): PercentileBand => {
  const sorted = [...values].sort((first, second) => first - second);
  return {
    p5: percentileFromSorted(sorted, 5),
    p25: percentileFromSorted(sorted, 25),
    p50: percentileFromSorted(sorted, 50),
    p75: percentileFromSorted(sorted, 75),
    p95: percentileFromSorted(sorted, 95),
  };
};

// Evenly spaced run indices (always including the first and last available
// run) so the retained subset is deterministic and spread across the runs.
const sampleRunIndexes = (runCount: number, maxSamples: number): number[] => {
  if (runCount <= maxSamples) {
    return Array.from({ length: runCount }, (_, index) => index);
  }
  const indexes: number[] = [];
  for (let sample = 0; sample < maxSamples; sample += 1) {
    indexes.push(Math.round((sample * (runCount - 1)) / (maxSamples - 1)));
  }
  return indexes;
};

// Minimal per-run shape the summariser needs, shared by the household rollup
// (from the top-level run outcomes) and by each member's rollup (from the
// matching per-member outcomes).
interface RunRecord {
  failure?: SimulationRunFailure;
  endingWealthPence: number;
  incomeAnnualPence: number[];
  pathTotalsPence: number[];
}

interface RunSummary {
  successRatePct: number;
  endingWealthPercentilesPence: PercentileBand;
  incomePathsPence: PercentilePathPoint[];
  // Running total of net income withdrawn from retirement to each year (real
  // terms). Index 0 is the retirement year at zero; each later point is the
  // cumulative withdrawals up to and including that withdrawal step.
  cumulativeIncomePathsPence: PercentilePathPoint[];
  // Distribution of the total net income withdrawn over the whole plan (the
  // final cumulative point). Percentiled across runs, so the median is the
  // median total lifetime withdrawal, not the sum of per-year medians.
  totalLifetimeWithdrawalsPence: PercentileBand;
  // Distribution of total lifetime withdrawals plus what is left in the pot at
  // the end, so a strategy that spends less but leaves more stays comparable.
  combinedTotalPence: PercentileBand;
  failures: {
    count: number;
    medianFailureYear?: number;
    byKind: Record<FailureKind, number>;
  };
}

// Success rate, ending-wealth percentiles, per-year income percentiles and the
// failure tally (by kind + median failure year) for a set of per-run records.
// Used identically for the household and each member so the two views can never
// drift.
const summariseRuns = (
  context: SimulationContext,
  records: RunRecord[]
): RunSummary => {
  const byKind: Record<FailureKind, number> = {
    [FailureKind.BRIDGE_EXHAUSTED]: 0,
    [FailureKind.WEALTH_EXHAUSTED]: 0,
    [FailureKind.INCOME_BELOW_FLOOR]: 0,
  };
  const failureYears: number[] = [];
  for (const record of records) {
    if (record.failure) {
      byKind[record.failure.kind] += 1;
      failureYears.push(record.failure.year);
    }
  }
  failureYears.sort((first, second) => first - second);
  // Lower median so the reported year is always an actual failure year
  const medianFailureYear =
    failureYears.length > 0
      ? failureYears[Math.floor((failureYears.length - 1) / 2)]
      : undefined;
  const incomeYears = context.pathYears.slice(1);
  // Per-run running total of income withdrawn by each withdrawal step, summed
  // once here so both the cumulative-over-time path and the final-total bands
  // read from the same figures.
  const cumulativeByRun = records.map((record) => {
    const cumulative: number[] = [];
    let running = 0;
    for (const yearIncome of record.incomeAnnualPence) {
      running += yearIncome;
      cumulative.push(running);
    }
    return cumulative;
  });
  const totalLifetimeByRun = cumulativeByRun.map((cumulative) =>
    cumulative.length > 0 ? cumulative[cumulative.length - 1] : 0
  );
  // The at-retirement point (pathYears[0]) is a zero baseline so the cumulative
  // chart shares the wealth charts' x-axis; each later point percentiles that
  // year's running total across runs.
  const zeroBand: PercentileBand = { p5: 0, p25: 0, p50: 0, p75: 0, p95: 0 };
  const cumulativeIncomePathsPence: PercentilePathPoint[] = [
    { year: context.pathYears[0], ...zeroBand },
    ...incomeYears.map((year, incomeIndex) => ({
      year,
      ...percentileSummary(
        cumulativeByRun.map((cumulative) => cumulative[incomeIndex])
      ),
    })),
  ];
  return {
    successRatePct:
      ((records.length - failureYears.length) / records.length) * 100,
    endingWealthPercentilesPence: percentileSummary(
      records.map((record) => record.endingWealthPence)
    ),
    incomePathsPence: incomeYears.map((year, incomeIndex) => ({
      year,
      ...percentileSummary(
        records.map((record) => record.incomeAnnualPence[incomeIndex])
      ),
    })),
    cumulativeIncomePathsPence,
    totalLifetimeWithdrawalsPence: percentileSummary(totalLifetimeByRun),
    combinedTotalPence: percentileSummary(
      records.map(
        (record, runIndex) =>
          totalLifetimeByRun[runIndex] + record.endingWealthPence
      )
    ),
    failures: {
      count: failureYears.length,
      medianFailureYear,
      byKind,
    },
  };
};

export const aggregateSimulationOutcomes = (
  context: SimulationContext,
  outcomes: SimulationRunOutcome[]
): SimulationResult => {
  const household = summariseRuns(context, outcomes);
  const sampledPathsPence: SampledRunPath[] = sampleRunIndexes(
    outcomes.length,
    MAX_SAMPLED_PATHS
  ).map((runIndex) => ({
    runIndex,
    totalsPence: outcomes[runIndex].pathTotalsPence,
  }));

  // Collect each member's per-run records keyed by userId, preserving the
  // first-seen member order (the engine guarantees the same members in the same
  // order every run).
  const memberRecords = new Map<string, RunRecord[]>();
  for (const outcome of outcomes) {
    for (const memberOutcome of outcome.memberOutcomes) {
      let records = memberRecords.get(memberOutcome.userId);
      if (!records) {
        records = [];
        memberRecords.set(memberOutcome.userId, records);
      }
      records.push({
        failure: memberOutcome.failure,
        endingWealthPence: memberOutcome.endingWealthPence,
        incomeAnnualPence: memberOutcome.incomeAnnualPence,
        pathTotalsPence: memberOutcome.pathTotalsPence,
      });
    }
  }
  const memberBreakdowns: MemberBreakdown[] = Array.from(
    memberRecords.entries()
  ).map(([userId, records]) => {
    const memberSummary = summariseRuns(context, records);
    return {
      userId,
      successRatePct: memberSummary.successRatePct,
      incomePathsPence: memberSummary.incomePathsPence,
      cumulativeIncomePathsPence: memberSummary.cumulativeIncomePathsPence,
      totalLifetimeWithdrawalsPence:
        memberSummary.totalLifetimeWithdrawalsPence,
      combinedTotalPence: memberSummary.combinedTotalPence,
      endingWealthPercentilesPence: memberSummary.endingWealthPercentilesPence,
      failures: memberSummary.failures,
    };
  });

  return {
    successRatePct: household.successRatePct,
    endingWealthPercentilesPence: household.endingWealthPercentilesPence,
    percentilePathsPence: context.pathYears.map((year, pathIndex) => ({
      year,
      ...percentileSummary(
        outcomes.map((outcome) => outcome.pathTotalsPence[pathIndex])
      ),
    })),
    incomePathsPence: household.incomePathsPence,
    cumulativeIncomePathsPence: household.cumulativeIncomePathsPence,
    totalLifetimeWithdrawalsPence: household.totalLifetimeWithdrawalsPence,
    combinedTotalPence: household.combinedTotalPence,
    sampledPathsPence,
    failures: household.failures,
    memberBreakdowns,
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
