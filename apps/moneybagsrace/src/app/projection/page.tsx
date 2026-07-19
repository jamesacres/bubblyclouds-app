'use client';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { ContributionsForm } from '@bubblyclouds-app/moneybagsrace/components/ContributionsForm';
import { CurrencyInput } from '@bubblyclouds-app/moneybagsrace/components/CurrencyInput';
import FanChart from '@bubblyclouds-app/moneybagsrace/components/FanChart';
import RealNominalToggle, {
  NetWorthMode,
} from '@bubblyclouds-app/moneybagsrace/components/RealNominalToggle';
import { currentMonthId } from '@bubblyclouds-app/moneybagsrace/helpers/monthId';
import { useHousehold } from '@bubblyclouds-app/moneybagsrace/hooks/useHousehold';
import { EMPTY_PROFILE } from '@bubblyclouds-app/moneybagsrace/providers/MoneyBagsDataProvider';
import { ContributionPlan } from '@bubblyclouds-app/moneybagsrace/types/profile';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useContext, useState } from 'react';

const HORIZON_YEARS_OPTIONS = [10, 20, 30, 40];
const DEFAULT_HORIZON_YEARS = 30;

const sectionClassName =
  'flex flex-col gap-3 rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:border-zinc-700/60 dark:bg-zinc-800/60';

export default function ProjectionPage() {
  const context = useContext(UserContext);
  const { user, showLoginModal } = context || {};
  const { household, ownUserId, ownProfile, saveOwnProfile } = useHousehold();

  const [mode, setMode] = useState<NetWorthMode>('nominal');
  const [horizonYears, setHorizonYears] = useState(DEFAULT_HORIZON_YEARS);
  const [milestonePence, setMilestonePence] = useState(0);
  const [planEdits, setPlanEdits] = useState<ContributionPlan | undefined>(
    undefined
  );
  const [isSaving, setIsSaving] = useState(false);

  const plan =
    planEdits ?? ownProfile?.contributions ?? EMPTY_PROFILE.contributions;

  const handleSaveContributions = async () => {
    if (!user) {
      showLoginModal?.(undefined, LoginContext.PUZZLE_ENTRY);
      return;
    }
    setIsSaving(true);
    try {
      await saveOwnProfile({
        ...(ownProfile ?? EMPTY_PROFILE),
        contributions: plan,
      });
      setPlanEdits(undefined);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pt-safe min-h-dvh bg-stone-50 pb-32 dark:bg-zinc-900">
      <div className="container mx-auto max-w-2xl px-5">
        <div className="flex flex-col gap-1 pb-6 pt-5">
          <Link
            href="/"
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Projection
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Household growth projection — both of you combined, at the lower,
            central and upper return scenarios.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div
              role="group"
              aria-label="Projection horizon"
              className="flex flex-wrap gap-2"
            >
              {HORIZON_YEARS_OPTIONS.map((years) => (
                <button
                  key={years}
                  type="button"
                  aria-pressed={horizonYears === years}
                  onClick={() => setHorizonYears(years)}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                    horizonYears === years
                      ? 'border-cyan-500/40 bg-cyan-500/20 text-zinc-900 dark:text-white'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:text-zinc-700 dark:border-white/15 dark:bg-white/5 dark:text-white/50 dark:hover:text-white/80'
                  }`}
                >
                  {years}y
                </button>
              ))}
            </div>
            <RealNominalToggle value={mode} onChange={setMode} />
          </div>

          <div className={sectionClassName}>
            <FanChart
              household={household}
              mode={mode}
              horizonMonths={horizonYears * 12}
              contributionOverrides={{ [ownUserId]: plan }}
              milestonePence={milestonePence > 0 ? milestonePence : undefined}
            />
          </div>

          <section className={sectionClassName} aria-label="Milestone">
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              Milestone
            </h2>
            <CurrencyInput
              id="fire-number"
              label="FIRE number"
              valuePence={milestonePence}
              onChangePence={setMilestonePence}
              placeholder="e.g. £600,000"
            />
            <p className="text-xs text-zinc-400 dark:text-white/35">
              Marks when each scenario first crosses your target.
            </p>
          </section>

          <section className={sectionClassName} aria-label="Your contributions">
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              Your contributions
            </h2>
            <p className="text-xs text-zinc-400 dark:text-white/35">
              The fan chart above is your household combined; these
              contributions are personal — you can only edit your own.
            </p>
            <ContributionsForm
              plan={plan}
              currentMonth={currentMonthId()}
              onChange={setPlanEdits}
            />
            <button
              onClick={handleSaveContributions}
              disabled={isSaving || planEdits === undefined}
              className="bg-theme-primary cursor-pointer self-start rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
