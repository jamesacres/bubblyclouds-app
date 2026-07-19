'use client';
import { useMemo } from 'react';
import { AccountKind, InvestmentWrapper } from '../types/accounts';
import {
  DEFAULT_WITHDRAWAL_STRATEGY,
  HouseholdAssumptions,
} from '../types/assumptions';
import { MonthId } from '../types/monthId';
import { SimulationMember } from '../types/simulation';
import { useHousehold } from './useHousehold';

export interface RetirementReadiness {
  ready: boolean;
  missingDob: string[];
  hasSnapshots: boolean;
}

// SimulationInputs-shaped base model assembled from HouseholdData; per-run
// fields (retirement month, withdrawal, toggles, returns, runs, seed) are
// supplied by the caller when building full SimulationInputs.
export interface RetirementModel {
  members: SimulationMember[];
  startMonth?: MonthId;
  assumptions: HouseholdAssumptions;
  readiness: RetirementReadiness;
  // Sum of the resolved per-member desiredWithdrawalAnnualPence; the retirement
  // page shows this combined figure and uses it as the SimulationInputs
  // withdrawalAnnualPence household fallback.
  householdDesiredWithdrawalAnnualPence: number;
}

export function useRetirementModel(): RetirementModel {
  const { household } = useHousehold();

  return useMemo(() => {
    const monthsNewestFirst = [...household.orderedMonths].reverse();
    const startMonth = monthsNewestFirst.find((month) =>
      Object.values(household.months[month]?.memberSnapshots ?? {}).some(
        (snapshot) => snapshot !== undefined
      )
    );
    const hasSnapshots = startMonth !== undefined;
    const missingDob: string[] = [];
    const assumptions = household.effectiveAssumptions;
    const eligibleMembers = household.members.filter((member) => {
      if (!member.profile?.dateOfBirth) {
        missingDob.push(member.nickname);
        return false;
      }
      return true;
    });
    // Migration (read-time only): the legacy single household
    // defaultWithdrawalAnnualPence is split EQUALLY across every simulated
    // member — each member without their own personal override draws
    // defaultWithdrawalAnnualPence / memberCount from the shared pool (so an
    // existing £40k household with two members and no overrides becomes £20k
    // each; never doubled). Members with a personal override use it verbatim.
    const memberCount = eligibleMembers.length;
    const householdDefaultWithdrawalPence =
      assumptions.defaultWithdrawalAnnualPence ?? 0;
    const migrationSplitPence =
      memberCount > 0
        ? Math.round(householdDefaultWithdrawalPence / memberCount)
        : 0;
    const members: SimulationMember[] = eligibleMembers.map((member) => {
      const dateOfBirth = member.profile?.dateOfBirth;
      const overrides = member.profile?.overrides ?? {};
      const latestSnapshot = monthsNewestFirst
        .map((month) => household.months[month]?.memberSnapshots[member.userId])
        .find((snapshot) => snapshot !== undefined);
      const balancesPencePerWrapper: Partial<
        Record<InvestmentWrapper, number>
      > = {};
      for (const account of latestSnapshot?.accounts ?? []) {
        if (account.kind !== AccountKind.INVESTMENT) {
          continue;
        }
        const wrapper = account.wrapper ?? InvestmentWrapper.OTHER;
        balancesPencePerWrapper[wrapper] =
          (balancesPencePerWrapper[wrapper] ?? 0) + account.balancePence;
      }
      return {
        userId: member.userId,
        dateOfBirth: dateOfBirth ?? '',
        balancesPencePerWrapper,
        contributions: member.profile?.contributions ?? {
          monthlyPencePerWrapper: {},
          stepChanges: [],
        },
        overrides,
        desiredWithdrawalAnnualPence:
          overrides.desiredWithdrawalAnnualPence ?? migrationSplitPence,
        withdrawalStrategy:
          overrides.withdrawalStrategy ??
          assumptions.defaultWithdrawalStrategy ??
          DEFAULT_WITHDRAWAL_STRATEGY,
      };
    });
    const householdDesiredWithdrawalAnnualPence = members.reduce(
      (total, member) => total + member.desiredWithdrawalAnnualPence,
      0
    );
    return {
      members,
      startMonth,
      assumptions,
      readiness: {
        ready: hasSnapshots && members.length > 0 && missingDob.length === 0,
        missingDob,
        hasSnapshots,
      },
      householdDesiredWithdrawalAnnualPence,
    };
  }, [household]);
}
