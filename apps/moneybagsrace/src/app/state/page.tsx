'use client';
import {
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';
import { useHousehold } from '@bubblyclouds-app/moneybagsrace/hooks/useHousehold';
import { useMonthEntry } from '@bubblyclouds-app/moneybagsrace/hooks/useMonthEntry';
import {
  currentMonthId,
  isValidMonthId,
  monthIdToLabel,
  nextMonthId,
  previousMonthId,
} from '@bubblyclouds-app/moneybagsrace/helpers/monthId';
import { AccountEntryRow } from '@bubblyclouds-app/moneybagsrace/components/AccountEntryRow';
import { SharedPropertyForm } from '@bubblyclouds-app/moneybagsrace/components/SharedPropertyForm';
import { AccountKind } from '@bubblyclouds-app/moneybagsrace/types/accounts';

const sectionClassName =
  'flex flex-col rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:border-zinc-700/60 dark:bg-zinc-800/60';

function StateComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const context = useContext(UserContext);
  const { user, showLoginModal } = context || {};

  const monthParam = searchParams.get('month');
  const month =
    monthParam && isValidMonthId(monthParam) ? monthParam : currentMonthId();

  useEffect(() => {
    if (!monthParam) {
      router.replace(`/state?month=${currentMonthId()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthParam]);

  const { household, ownUserId, isLoading } = useHousehold();
  const entry = useMonthEntry(month);

  // Autosave on blur / navigation: persist pending edits when a field loses
  // focus or the user leaves the page, but never fire a redundant save.
  const entryRef = useRef(entry);
  useEffect(() => {
    entryRef.current = entry;
  });

  const commitSave = useCallback(() => {
    const current = entryRef.current;
    if (!current.isDirty) {
      return;
    }
    if (!user) {
      showLoginModal?.(undefined, LoginContext.PUZZLE_ENTRY);
      return;
    }
    void current.save();
  }, [user, showLoginModal]);

  useEffect(
    () => () => {
      if (entryRef.current.isDirty && user) {
        void entryRef.current.save();
      }
    },
    [user]
  );

  const navigateWithSave = useCallback(
    (href: string) => {
      commitSave();
      router.push(href);
    },
    [commitSave, router]
  );

  // Previous-month hints: balances from the nearest earlier month that has
  // an own snapshot (matches the pre-fill rule in useMonthEntry).
  const previousBalances = useMemo(() => {
    const previousSnapshot = household.orderedMonths
      .filter((candidate) => candidate < month)
      .reverse()
      .map(
        (candidate) => household.months[candidate]?.memberSnapshots[ownUserId]
      )
      .find((snapshot) => snapshot !== undefined);
    return new Map<string, number>(
      (previousSnapshot?.accounts ?? []).map((account) => [
        account.accountId,
        account.balancePence,
      ])
    );
  }, [household.months, household.orderedMonths, month, ownUserId]);

  const sharedUpdatedByNickname = useMemo(() => {
    if (!entry.sharedUpdatedAt) {
      return undefined;
    }
    const householdMonth = household.months[month];
    return household.members.find(
      (member) =>
        householdMonth?.memberSnapshots[member.userId]?.shared?.updatedAt ===
        entry.sharedUpdatedAt
    )?.nickname;
  }, [entry.sharedUpdatedAt, household.members, household.months, month]);

  const groups = [
    {
      title: 'Investments',
      accounts: entry.accounts.filter(
        (account) => account.kind === AccountKind.INVESTMENT
      ),
    },
    {
      title: 'Cash',
      accounts: entry.accounts.filter(
        (account) => account.kind === AccountKind.CASH
      ),
    },
    {
      title: 'Credit cards',
      accounts: entry.accounts.filter(
        (account) => account.kind === AccountKind.CREDIT_CARD
      ),
    },
  ].filter((group) => group.accounts.length > 0);

  return (
    <div className="pt-safe container mx-auto max-w-2xl px-5 pb-32">
      <div className="flex flex-col gap-1 pb-6 pt-5">
        <Link
          href="/"
          onClick={commitSave}
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
        <div className="flex items-center justify-between gap-3">
          <button
            aria-label="Previous month"
            onClick={() =>
              navigateWithSave(`/state?month=${previousMonthId(month)}`)
            }
            className="cursor-pointer rounded-xl border border-zinc-200 p-2 text-zinc-600 transition-all duration-200 active:scale-95 dark:border-zinc-700 dark:text-zinc-300"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {monthIdToLabel(month)}
          </h1>
          <button
            aria-label="Next month"
            onClick={() =>
              navigateWithSave(`/state?month=${nextMonthId(month)}`)
            }
            className="cursor-pointer rounded-xl border border-zinc-200 p-2 text-zinc-600 transition-all duration-200 active:scale-95 dark:border-zinc-700 dark:text-zinc-300"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        {entry.partnerCompletion.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {entry.partnerCompletion.map((partner) => (
              <span
                key={partner.userId}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  partner.entered
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {partner.nickname}:{' '}
                {partner.entered ? 'entered' : 'not yet entered'}
              </span>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : (
        <div className="flex flex-col gap-4">
          {entry.accounts.length === 0 ? (
            <div
              className={`${sectionClassName} items-center py-10 text-center`}
            >
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                No accounts yet
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Add your investment, cash and credit card accounts first.
              </p>
              <Link
                href="/settings"
                className="bg-theme-primary mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-95"
              >
                Go to Settings → Accounts
              </Link>
            </div>
          ) : (
            groups.map((group) => (
              <section
                key={group.title}
                aria-label={group.title}
                className={sectionClassName}
              >
                <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                  {group.title}
                </h2>
                <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-700/40">
                  {group.accounts.map((account) => (
                    <AccountEntryRow
                      key={account.accountId}
                      accountId={account.accountId}
                      kind={account.kind}
                      wrapper={account.wrapper}
                      name={account.name}
                      balancePence={account.balancePence}
                      previousBalancePence={previousBalances.get(
                        account.accountId
                      )}
                      onChangeBalance={(balancePence) =>
                        entry.setBalance(account.accountId, balancePence)
                      }
                      onCommit={commitSave}
                    />
                  ))}
                </div>
              </section>
            ))
          )}

          <section
            aria-label="Shared property"
            className={sectionClassName}
            onBlur={commitSave}
          >
            <h2 className="mb-3 text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              Shared property
            </h2>
            <SharedPropertyForm
              houseValuePence={entry.sharedHouseValuePence}
              mortgageBalancePence={entry.sharedMortgageBalancePence}
              onChange={entry.setShared}
              updatedAt={entry.sharedUpdatedAt}
              updatedByNickname={sharedUpdatedByNickname}
            />
          </section>

          <div
            aria-live="polite"
            className="h-5 text-sm font-medium text-zinc-400 dark:text-zinc-500"
          >
            {entry.isSaving
              ? 'Saving…'
              : entry.isDirty
                ? 'Unsaved changes'
                : ''}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StatePage() {
  return (
    <Suspense>
      <StateComponent />
    </Suspense>
  );
}
