'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountKind, InvestmentWrapper } from '../types/accounts';
import { MonthId } from '../types/monthId';
import { MonthlySnapshotData, SnapshotAccount } from '../types/snapshot';
import { useHousehold } from './useHousehold';

export interface MonthEntryAccountRow {
  accountId: string;
  kind: AccountKind;
  wrapper?: InvestmentWrapper;
  name: string;
  balancePence: number;
}

export interface PartnerCompletion {
  userId: string;
  nickname: string;
  entered: boolean;
}

export interface MonthEntry {
  month: MonthId;
  accounts: MonthEntryAccountRow[];
  sharedHouseValuePence: number;
  sharedMortgageBalancePence: number;
  // Set only when this month already has an effective shared entry (LWW
  // across members) — undefined when values are pre-filled or empty.
  sharedUpdatedAt?: string;
  partnerCompletion: PartnerCompletion[];
  isDirty: boolean;
  isSaving: boolean;
  setBalance: (accountId: string, balancePence: number) => void;
  setShared: (houseValuePence: number, mortgageBalancePence: number) => void;
  save: () => Promise<void>;
}

interface SharedEdit {
  houseValuePence: number;
  mortgageBalancePence: number;
}

export function useMonthEntry(month: MonthId): MonthEntry {
  const { household, ownUserId, ownProfile, saveOwnSnapshot } = useHousehold();

  const [balanceEdits, setBalanceEdits] = useState<{
    [accountId: string]: number;
  }>({});
  const [sharedEdit, setSharedEdit] = useState<SharedEdit | undefined>(
    undefined
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setBalanceEdits({});
    setSharedEdit(undefined);
  }, [month]);

  const householdMonth = household.months[month];
  const ownSnapshot = householdMonth?.memberSnapshots[ownUserId];

  const earlierMonths = useMemo(
    () =>
      household.orderedMonths
        .filter((candidate) => candidate < month)
        .reverse(),
    [household.orderedMonths, month]
  );

  // Q2: balances pre-fill from the previous month's snapshot (nearest
  // earlier month with an own snapshot, so gap months don't lose the carry).
  const previousOwnSnapshot = useMemo(
    () =>
      earlierMonths
        .map(
          (candidate) => household.months[candidate]?.memberSnapshots[ownUserId]
        )
        .find((snapshot) => snapshot !== undefined),
    [earlierMonths, household.months, ownUserId]
  );

  const previousShared = useMemo(
    () =>
      earlierMonths
        .map((candidate) => household.months[candidate]?.effectiveShared)
        .find((shared) => shared !== undefined),
    [earlierMonths, household.months]
  );

  // Frozen snapshot list (preserving historical balances) merged with any
  // active profile accounts added since, so newly-added accounts remain
  // editable on a month that already has a saved snapshot. Without a snapshot,
  // live profile definitions filtered to those not archived before this month.
  // createdMonth is deliberately not a lower bound: an account added later can
  // still have its balance backfilled for earlier months.
  const accounts = useMemo<MonthEntryAccountRow[]>(() => {
    const previousBalances = new Map<string, number>(
      (previousOwnSnapshot?.accounts ?? []).map((account) => [
        account.accountId,
        account.balancePence,
      ])
    );
    const activeProfileAccounts = (ownProfile?.accounts ?? [])
      .filter(
        (definition) =>
          !definition.archivedMonth || month < definition.archivedMonth
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
    let base: MonthEntryAccountRow[];
    if (ownSnapshot) {
      const snapshotIds = new Set(
        ownSnapshot.accounts.map((account) => account.accountId)
      );
      base = [
        ...ownSnapshot.accounts.map((account) => ({
          accountId: account.accountId,
          kind: account.kind,
          wrapper: account.wrapper,
          name: account.name,
          balancePence: account.balancePence,
        })),
        ...activeProfileAccounts
          .filter((definition) => !snapshotIds.has(definition.accountId))
          .map((definition) => ({
            accountId: definition.accountId,
            kind: definition.kind,
            wrapper: definition.wrapper,
            name: definition.name,
            balancePence: previousBalances.get(definition.accountId) ?? 0,
          })),
      ];
    } else {
      base = activeProfileAccounts.map((definition) => ({
        accountId: definition.accountId,
        kind: definition.kind,
        wrapper: definition.wrapper,
        name: definition.name,
        balancePence: previousBalances.get(definition.accountId) ?? 0,
      }));
    }
    return base.map((account) => ({
      ...account,
      balancePence: balanceEdits[account.accountId] ?? account.balancePence,
    }));
  }, [balanceEdits, month, ownProfile, ownSnapshot, previousOwnSnapshot]);

  const effectiveShared = householdMonth?.effectiveShared;
  const sharedHouseValuePence =
    sharedEdit?.houseValuePence ??
    effectiveShared?.houseValuePence ??
    previousShared?.houseValuePence ??
    0;
  const sharedMortgageBalancePence =
    sharedEdit?.mortgageBalancePence ??
    effectiveShared?.mortgageBalancePence ??
    previousShared?.mortgageBalancePence ??
    0;

  const isDirty =
    Object.keys(balanceEdits).length > 0 || sharedEdit !== undefined;

  const setBalance = useCallback((accountId: string, balancePence: number) => {
    setBalanceEdits((previous) => ({ ...previous, [accountId]: balancePence }));
  }, []);

  const setShared = useCallback(
    (houseValuePence: number, mortgageBalancePence: number) => {
      setSharedEdit({ houseValuePence, mortgageBalancePence });
    },
    []
  );

  const save = useCallback(async () => {
    const now = new Date().toISOString();
    const snapshotAccounts: SnapshotAccount[] = accounts.map((account) => ({
      accountId: account.accountId,
      kind: account.kind,
      wrapper: account.wrapper,
      name: account.name,
      balancePence: account.balancePence,
    }));
    // A shared entry is written only when this member edited it (stamped
    // now, LWW across members) — otherwise any existing own entry carries.
    const shared = sharedEdit
      ? {
          houseValuePence: sharedEdit.houseValuePence,
          mortgageBalancePence: sharedEdit.mortgageBalancePence,
          updatedAt: now,
        }
      : ownSnapshot?.shared;
    const data: MonthlySnapshotData = {
      schemaVersion: 1,
      month,
      enteredAt: ownSnapshot?.enteredAt ?? now,
      accounts: snapshotAccounts,
      // A month counts as entered once a snapshot exists; there is no manual
      // complete step. Always true for backward compatibility with readers.
      complete: true,
      ...(shared ? { shared } : {}),
    };
    setIsSaving(true);
    try {
      await saveOwnSnapshot(month, data);
      setBalanceEdits({});
      setSharedEdit(undefined);
    } finally {
      setIsSaving(false);
    }
  }, [accounts, month, ownSnapshot, saveOwnSnapshot, sharedEdit]);

  const partnerCompletion = useMemo<PartnerCompletion[]>(
    () =>
      household.members
        .filter((member) => !member.isUser)
        .map((member) => ({
          userId: member.userId,
          nickname: member.nickname,
          entered: householdMonth?.memberSnapshots[member.userId] !== undefined,
        })),
    [household.members, householdMonth]
  );

  return {
    month,
    accounts,
    sharedHouseValuePence,
    sharedMortgageBalancePence,
    sharedUpdatedAt: effectiveShared?.updatedAt,
    partnerCompletion,
    isDirty,
    isSaving,
    setBalance,
    setShared,
    save,
  };
}
