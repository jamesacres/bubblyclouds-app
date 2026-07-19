import { InvestmentWrapper } from '../types/accounts';
import { ContributionPlan } from '../types/profile';
import { SensitivityResult, SimulationMember } from '../types/simulation';
import {
  DEFAULT_SOLVER_WINDOW_YEARS,
  findEarliestRetirement,
  findEarliestRetirementAsync,
  SolverBaseInputs,
  solverProbeBudget,
} from './solver';

// Each SensitivityResult field is the earliest retirement month found by
// rerunning the solver with that single input nudged (undefined when the
// target is unachievable within the window):
// - withdrawalPlus5k / withdrawalMinus5k: desired net withdrawal +/-
//   GBP 5,000/yr (floored at zero)
// - contributionsPlus500 / contributionsMinus500: household contributions
//   +/- GBP 500/mo, spread across members proportionally to their current
//   total monthly contribution

export const SENSITIVITY_WITHDRAWAL_DELTA_PENCE = 500_000;
export const SENSITIVITY_CONTRIBUTION_DELTA_MONTHLY_PENCE = 50_000;

export interface ComputeSensitivityOptions {
  windowYears?: number;
}

export interface ComputeSensitivityAsyncOptions {
  windowYears?: number;
  // Aggregated across the four solver runs; probesTotal is the worst-case
  // probe budget, so early-exiting solves finish below it
  onProgress?: (probesDone: number, probesTotal: number) => void;
  signal?: AbortSignal;
}

const planTotalMonthlyPence = (plan: ContributionPlan): number =>
  Object.values(plan.monthlyPencePerWrapper).reduce(
    (total, pence) => total + (pence ?? 0),
    0
  );

// Scales a member's base plan by their share of the household delta. The
// scaling is proportional across wrappers and floored at zero, so
// per-wrapper amounts never go negative; a member with no contributions
// receiving an increase puts it in their ISA. Step changes are left
// untouched — the nudge applies to the current base plan only.
const adjustPlan = (
  plan: ContributionPlan,
  memberDeltaMonthlyPence: number
): ContributionPlan => {
  if (memberDeltaMonthlyPence === 0) {
    return plan;
  }
  const totalPence = planTotalMonthlyPence(plan);
  if (totalPence <= 0) {
    if (memberDeltaMonthlyPence <= 0) {
      return plan;
    }
    return {
      ...plan,
      monthlyPencePerWrapper: {
        ...plan.monthlyPencePerWrapper,
        [InvestmentWrapper.ISA]:
          (plan.monthlyPencePerWrapper[InvestmentWrapper.ISA] ?? 0) +
          Math.round(memberDeltaMonthlyPence),
      },
    };
  }
  const factor = Math.max(
    0,
    (totalPence + memberDeltaMonthlyPence) / totalPence
  );
  const adjusted: Partial<Record<InvestmentWrapper, number>> = {};
  for (const wrapper of Object.values(InvestmentWrapper)) {
    const pence = plan.monthlyPencePerWrapper[wrapper];
    if (pence !== undefined) {
      adjusted[wrapper] = Math.round(pence * factor);
    }
  }
  return { ...plan, monthlyPencePerWrapper: adjusted };
};

// Household-wide monthly delta spread across members proportionally to each
// member's current total monthly contribution; when every member contributes
// nothing, a positive delta is split equally
export const applyContributionDelta = (
  members: SimulationMember[],
  deltaMonthlyPence: number
): SimulationMember[] => {
  const memberTotals = members.map((member) =>
    planTotalMonthlyPence(member.contributions)
  );
  const householdTotalPence = memberTotals.reduce(
    (total, pence) => total + pence,
    0
  );
  return members.map((member, memberIndex) => ({
    ...member,
    contributions: adjustPlan(
      member.contributions,
      householdTotalPence > 0
        ? (deltaMonthlyPence * memberTotals[memberIndex]) / householdTotalPence
        : deltaMonthlyPence / members.length
    ),
  }));
};

// Household-wide annual desired-withdrawal delta spread across members
// proportionally to each member's current desiredWithdrawalAnnualPence; when
// every member's desired withdrawal is zero, the delta is split equally. Each
// member's resulting desired withdrawal is floored at zero.
export const applyWithdrawalDelta = (
  members: SimulationMember[],
  deltaPence: number
): SimulationMember[] => {
  const householdDesiredPence = members.reduce(
    (total, member) => total + member.desiredWithdrawalAnnualPence,
    0
  );
  return members.map((member) => {
    const memberDelta =
      householdDesiredPence > 0
        ? (deltaPence * member.desiredWithdrawalAnnualPence) /
          householdDesiredPence
        : deltaPence / members.length;
    return {
      ...member,
      desiredWithdrawalAnnualPence: Math.max(
        0,
        Math.round(member.desiredWithdrawalAnnualPence + memberDelta)
      ),
    };
  });
};

interface SensitivityVariants {
  withdrawalPlus5k: SolverBaseInputs;
  withdrawalMinus5k: SolverBaseInputs;
  contributionsPlus500: SolverBaseInputs;
  contributionsMinus500: SolverBaseInputs;
}

// Shift the household desired withdrawal by delta via the proportional
// per-member split (applyWithdrawalDelta), keeping the household
// withdrawalAnnualPence fallback in step with the new sum of members' desired.
const withWithdrawalDelta = (
  base: SolverBaseInputs,
  deltaPence: number
): SolverBaseInputs => {
  const members = applyWithdrawalDelta(base.members, deltaPence);
  const withdrawalAnnualPence = members.reduce(
    (total, member) => total + member.desiredWithdrawalAnnualPence,
    0
  );
  return { ...base, members, withdrawalAnnualPence };
};

const buildVariants = (base: SolverBaseInputs): SensitivityVariants => ({
  withdrawalPlus5k: withWithdrawalDelta(
    base,
    SENSITIVITY_WITHDRAWAL_DELTA_PENCE
  ),
  withdrawalMinus5k: withWithdrawalDelta(
    base,
    -SENSITIVITY_WITHDRAWAL_DELTA_PENCE
  ),
  contributionsPlus500: {
    ...base,
    members: applyContributionDelta(
      base.members,
      SENSITIVITY_CONTRIBUTION_DELTA_MONTHLY_PENCE
    ),
  },
  contributionsMinus500: {
    ...base,
    members: applyContributionDelta(
      base.members,
      -SENSITIVITY_CONTRIBUTION_DELTA_MONTHLY_PENCE
    ),
  },
});

export const computeSensitivity = (
  base: SolverBaseInputs,
  options: ComputeSensitivityOptions = {}
): SensitivityResult => {
  const windowYears = options.windowYears ?? DEFAULT_SOLVER_WINDOW_YEARS;
  const variants = buildVariants(base);
  return {
    withdrawalPlus5k: findEarliestRetirement(
      variants.withdrawalPlus5k,
      windowYears
    ).earliestRetirementMonth,
    withdrawalMinus5k: findEarliestRetirement(
      variants.withdrawalMinus5k,
      windowYears
    ).earliestRetirementMonth,
    contributionsPlus500: findEarliestRetirement(
      variants.contributionsPlus500,
      windowYears
    ).earliestRetirementMonth,
    contributionsMinus500: findEarliestRetirement(
      variants.contributionsMinus500,
      windowYears
    ).earliestRetirementMonth,
  };
};

// Identical result to computeSensitivity for the same inputs; solves run
// sequentially and abort applies between (and within) probes
export const computeSensitivityAsync = async (
  base: SolverBaseInputs,
  options: ComputeSensitivityAsyncOptions = {}
): Promise<SensitivityResult> => {
  const windowYears = options.windowYears ?? DEFAULT_SOLVER_WINDOW_YEARS;
  const perSolveBudget = solverProbeBudget(windowYears);
  const probesTotal = perSolveBudget * 4;
  const variants = buildVariants(base);
  let solvesCompleted = 0;
  const solve = async (
    variant: SolverBaseInputs
  ): Promise<string | undefined> => {
    const result = await findEarliestRetirementAsync(variant, {
      windowYears,
      signal: options.signal,
      onProgress: (probesDone) => {
        options.onProgress?.(
          solvesCompleted * perSolveBudget + probesDone,
          probesTotal
        );
      },
    });
    solvesCompleted += 1;
    return result.earliestRetirementMonth;
  };
  return {
    withdrawalPlus5k: await solve(variants.withdrawalPlus5k),
    withdrawalMinus5k: await solve(variants.withdrawalMinus5k),
    contributionsPlus500: await solve(variants.contributionsPlus500),
    contributionsMinus500: await solve(variants.contributionsMinus500),
  };
};
