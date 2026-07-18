'use client';
import { Suspense, useContext, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, ChevronLeft, ChevronRight } from 'lucide-react';
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

  const handleSave = async () => {
    if (!user) {
      showLoginModal?.(undefined, LoginContext.PUZZLE_ENTRY);
      return;
    }
    await entry.save();
  };

  return (
    <div className="pt-safe container mx-auto max-w-2xl px-5 pb-32">
      <div className="flex flex-col gap-1 pb-6 pt-5">
        <Link
          href="/"
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
        <div className="flex items-center justify-between gap-3">
          <button
            aria-label="Previous month"
            onClick={() =>
              router.push(`/state?month=${previousMonthId(month)}`)
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
            onClick={() => router.push(`/state?month=${nextMonthId(month)}`)}
            className="cursor-pointer rounded-xl border border-zinc-200 p-2 text-zinc-600 transition-all duration-200 active:scale-95 dark:border-zinc-700 dark:text-zinc-300"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {entry.monthComplete && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              Month complete
            </span>
          )}
          {entry.partnerCompletion.map((partner) => (
            <span
              key={partner.userId}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                partner.complete
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                  : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              {partner.nickname}:{' '}
              {partner.complete ? 'entered' : 'not yet entered'}
            </span>
          ))}
        </div>
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
                    />
                  ))}
                </div>
              </section>
            ))
          )}

          <section aria-label="Shared property" className={sectionClassName}>
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

          <div className="flex items-center gap-3">
            {entry.complete ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                <Check className="h-4 w-4" />
                Marked complete
              </span>
            ) : (
              <button
                onClick={entry.markComplete}
                className="cursor-pointer rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-all duration-200 active:scale-95 dark:border-zinc-700 dark:text-zinc-300"
              >
                Mark month complete
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={entry.isSaving}
              className="bg-theme-primary cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              {entry.isSaving ? 'Saving…' : 'Save'}
            </button>
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
