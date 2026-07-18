'use client';
import { useMemo } from 'react';
import { AccountKind, InvestmentWrapper } from '../types/accounts';
import { HouseholdAssumptions } from '../types/assumptions';
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
    const members: SimulationMember[] = [];
    for (const member of household.members) {
      const dateOfBirth = member.profile?.dateOfBirth;
      if (!dateOfBirth) {
        missingDob.push(member.nickname);
        continue;
      }
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
      members.push({
        userId: member.userId,
        dateOfBirth,
        balancesPencePerWrapper,
        contributions: member.profile?.contributions ?? {
          monthlyPencePerWrapper: {},
          stepChanges: [],
        },
        overrides: member.profile?.overrides ?? {},
      });
    }
    return {
      members,
      startMonth,
      assumptions: household.effectiveAssumptions,
      readiness: {
        ready: hasSnapshots && members.length > 0 && missingDob.length === 0,
        missingDob,
        hasSnapshots,
      },
    };
  }, [household]);
}
