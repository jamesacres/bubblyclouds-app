'use client';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import EntryDueCard from '@bubblyclouds-app/moneybagsrace/components/EntryDueCard';
import NetWorthHeadline from '@bubblyclouds-app/moneybagsrace/components/NetWorthHeadline';
import SolverHeadline from '@bubblyclouds-app/moneybagsrace/components/SolverHeadline';
import StatCard from '@bubblyclouds-app/moneybagsrace/components/StatCard';
import { GLOBAL_EQUITY_ANNUAL_RETURNS } from '@bubblyclouds-app/moneybagsrace/data/globalEquityReturns';
import { findEarliestRetirementAsync } from '@bubblyclouds-app/moneybagsrace/engine/solver';
import { currentMonthId } from '@bubblyclouds-app/moneybagsrace/helpers/monthId';
import {
  buildNetWorthSeries,
  ChangeStat,
  monthOnMonthChange,
  NetWorthPoint,
} from '@bubblyclouds-app/moneybagsrace/helpers/networth';
import { useHousehold } from '@bubblyclouds-app/moneybagsrace/hooks/useHousehold';
import { useRetirementModel } from '@bubblyclouds-app/moneybagsrace/hooks/useRetirementModel';
import { SolverResult } from '@bubblyclouds-app/moneybagsrace/types/simulation';
import { PremiumFeatures } from '@bubblyclouds-app/template/components/PremiumFeatures';
import { RateAppButton } from '@bubblyclouds-app/template/components/RateAppButton';
import { isCapacitor } from '@bubblyclouds-app/template/helpers/capacitor';
import { useOnline } from '@bubblyclouds-app/template/hooks/online';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';
import Footer from '@bubblyclouds-app/ui/components/Footer';
import { Home as HomeIcon, LineChart, Settings, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useRef, useState } from 'react';
import { APP_CONFIG } from '../../app.config.js';
import { PREMIUM_FEATURES } from '../config/premiumFeatures';

const memberMonthOnMonthChange = (
  series: NetWorthPoint[],
  userId: string
): ChangeStat | undefined => {
  if (series.length < 2) {
    return undefined;
  }
  const latest = series[series.length - 1].perMemberPence[userId];
  const base = series[series.length - 2].perMemberPence[userId];
  if (latest === undefined || base === undefined || base === 0) {
    return undefined;
  }
  const absolutePence = latest - base;
  return { absolutePence, percent: (absolutePence / Math.abs(base)) * 100 };
};

const SOLVER_RUNS = 5000;
const SOLVER_WINDOW_YEARS = 40;

function RetirementSection() {
  const { household } = useHousehold();
  const { members, startMonth, assumptions, readiness } = useRetirementModel();
  const [solver, setSolver] = useState<SolverResult | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(true);
  const [progress, setProgress] = useState(0);
  // One seed per page load (created lazily off the render path): the
  // headline stays stable within a visit and refreshes as each monthly
  // snapshot lands (the model change re-runs the effect)
  const seedRef = useRef<number | undefined>(undefined);

  const defaultWithdrawalAnnualPence = assumptions.defaultWithdrawalAnnualPence;
  const primaryUserId = household.members.find(
    (member) => member.isUser
  )?.userId;

  // The solve runs off the render path: started in an effect once remembered
  // defaults exist, cancelled on unmount or when the model changes
  useEffect(() => {
    if (
      !readiness.ready ||
      startMonth === undefined ||
      defaultWithdrawalAnnualPence === undefined
    ) {
      return;
    }
    const controller = new AbortController();
    // setTimeout(0) keeps every setState out of the synchronous effect body
    // (same idiom as the data provider's load effects)
    const timeout = setTimeout(() => {
      setIsRunning(true);
      setSolver(undefined);
      setProgress(0);
      const seed = seedRef.current ?? Date.now() >>> 0;
      seedRef.current = seed;
      findEarliestRetirementAsync(
        {
          members,
          startMonth,
          planToAge: assumptions.defaultPlanToAge ?? 95,
          withdrawalAnnualPence: defaultWithdrawalAnnualPence,
          includeStatePension: true,
          applyTax: true,
          assumptions,
          returns: GLOBAL_EQUITY_ANNUAL_RETURNS,
          runs: SOLVER_RUNS,
          seed,
        },
        {
          windowYears: SOLVER_WINDOW_YEARS,
          signal: controller.signal,
          onProgress: (done, total) => setProgress(done / total),
        }
      )
        .then((result) => {
          setSolver(result);
          setIsRunning(false);
        })
        .catch((error: unknown) => {
          if (!(error instanceof Error && error.name === 'AbortError')) {
            setIsRunning(false);
          }
        });
    }, 0);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [
    assumptions,
    defaultWithdrawalAnnualPence,
    members,
    readiness.ready,
    startMonth,
  ]);

  if (!readiness.ready) {
    return (
      <Link
        href="/settings"
        data-testid="retirement-setup-cta"
        className="liquid-glass block rounded-3xl p-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.97]"
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/35">
          Retirement
        </p>
        <p className="mb-2 text-xl font-black leading-tight text-white">
          Set up retirement planning
        </p>
        <p className="text-xs leading-snug text-white/45">
          Add dates of birth, accounts and contributions in Settings to see how
          early you could retire
        </p>
      </Link>
    );
  }
  if (defaultWithdrawalAnnualPence === undefined) {
    return (
      <Link
        href="/retirement"
        data-testid="retirement-ready-card"
        className="liquid-glass block rounded-3xl p-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.97]"
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/35">
          Retirement
        </p>
        <p className="mb-2 text-xl font-black leading-tight text-white">
          Run your retirement plan
        </p>
        <p className="text-xs leading-snug text-white/45">
          Simulate withdrawals and find your earliest retirement date
        </p>
      </Link>
    );
  }
  return (
    <Link
      href="/retirement"
      data-testid="retirement-headline-card"
      className="liquid-glass block rounded-3xl p-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.97]"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/35">
        Retirement
      </p>
      {/* The card is hard-dark like the rest of the dashboard, so force the
          shared component's dark styling regardless of theme */}
      <div className="dark">
        <SolverHeadline
          result={solver}
          targetSuccessRatePct={assumptions.targetSuccessRatePct}
          primaryUserId={primaryUserId}
          isRunning={isRunning}
          progress={progress}
        />
      </div>
      <p className="mt-2 text-xs leading-snug text-white/45">
        Open the retirement planner to adjust the plan
      </p>
    </Link>
  );
}

function NavCard({
  href,
  label,
  title,
  description,
}: {
  href: string;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="liquid-glass flex flex-col rounded-3xl p-4 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.97]"
    >
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/35">
        {label}
      </p>
      <p className="mb-1 text-lg font-black leading-tight text-white">
        {title}
      </p>
      <p className="text-xs leading-snug text-white/45">{description}</p>
    </Link>
  );
}

function Hero() {
  return (
    <div className="mb-5 flex items-center gap-4">
      <div
        className="liquid-glass-strong flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[18px]"
        style={{
          boxShadow:
            '0 0 0 1px rgba(255,255,255,0.15), 0 0 40px rgba(80,120,255,0.3), inset 0 1px 0 rgba(255,255,255,0.22)',
        }}
      >
        <Image
          src="/icons/icon-animated.webp"
          alt={APP_CONFIG.appName}
          width={44}
          height={44}
          className="h-[44px] w-[44px]"
        />
      </div>
      <div>
        <span className="text-base font-bold tracking-tight text-white/70">
          {APP_CONFIG.appName}
        </span>
      </div>
    </div>
  );
}

function Dashboard() {
  const { household, isLoading, ownUserId } = useHousehold();
  const series = buildNetWorthSeries(
    household,
    'nominal',
    household.effectiveAssumptions.inflationRatePct
  );
  const latest = series.length > 0 ? series[series.length - 1] : undefined;
  const change = monthOnMonthChange(series);

  const month = currentMonthId();
  const currentMonth = household.months[month];
  const entryDue = currentMonth?.memberSnapshots[ownUserId] === undefined;
  const doneNicknames = household.members
    .filter(
      (member) => currentMonth?.memberSnapshots[member.userId] !== undefined
    )
    .map((member) => member.nickname);
  const outstandingNicknames = household.members
    .filter(
      (member) => currentMonth?.memberSnapshots[member.userId] === undefined
    )
    .map((member) => member.nickname);

  return (
    <div className="flex flex-col gap-4">
      <div className="liquid-glass rounded-3xl p-5">
        {isLoading ? (
          <p data-testid="dashboard-loading" className="text-sm text-white/50">
            Loading your balances…
          </p>
        ) : (
          <NetWorthHeadline
            valuePence={latest?.householdPence ?? 0}
            change={change}
          />
        )}
      </div>

      {!isLoading && latest && household.members.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {household.members.map((member) => (
            <StatCard
              key={member.userId}
              label={member.nickname}
              valuePence={latest.perMemberPence[member.userId] ?? 0}
              change={memberMonthOnMonthChange(series, member.userId)}
            />
          ))}
        </div>
      )}

      {entryDue && (
        <EntryDueCard
          month={month}
          doneNicknames={doneNicknames}
          outstandingNicknames={outstandingNicknames}
        />
      )}

      <RetirementSection />

      {!household.partyId && (
        <Link
          href="/settings"
          data-testid="invite-partner-cta"
          className="liquid-glass block rounded-3xl p-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.97]"
        >
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/35">
            Household
          </p>
          <p className="mb-1 text-lg font-black leading-tight text-white">
            Invite your partner
          </p>
          <p className="text-xs leading-snug text-white/45">
            Track your household net worth together — send an invite from
            Settings
          </p>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <NavCard
          href={`/state?month=${month}`}
          label="Entry"
          title="Monthly entry"
          description="Update this month's balances"
        />
        <NavCard
          href="/projection"
          label="Projection"
          title="Growth projection"
          description="Fan chart with contribution controls"
        />
      </div>
    </div>
  );
}

function Marketing() {
  const context = useContext(UserContext);
  const { showLoginModal } = context || {};
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1
          className="mb-2 text-[2.6rem] font-black leading-[1.1] tracking-tight text-white md:text-5xl"
          style={{
            textShadow:
              '0 0 12px rgba(56,189,248,0.75), 0 0 30px rgba(59,130,246,0.55), 0 0 60px rgba(59,130,246,0.3)',
          }}
        >
          {APP_CONFIG.appName}
        </h1>
        <p className="mb-3 text-base font-medium leading-snug text-white/60 md:text-lg">
          Track your household net worth month by month, watch it grow, and find
          your earliest retirement date.
        </p>
      </div>
      <button
        onClick={() => showLoginModal?.(undefined, LoginContext.PUZZLE_ENTRY)}
        className="group relative w-full cursor-pointer overflow-hidden rounded-3xl p-4 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.97]"
        style={{
          background:
            'linear-gradient(155deg, rgba(30,64,175,0.5) 0%, rgba(4,12,30,0.92) 65%)',
          border: '1px solid rgba(59,130,246,0.35)',
          boxShadow:
            '0 0 32px rgba(59,130,246,0.25), 0 8px 24px rgba(2,6,23,0.6)',
        }}
      >
        <p className="font-orbitron mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
          Get started
        </p>
        <p className="mb-1 text-xl font-black leading-tight text-white">
          Sign in to start tracking
        </p>
        <p className="mb-3 text-xs leading-snug text-white/50">
          Enter your first month of balances in minutes
        </p>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white"
          style={{
            background:
              'linear-gradient(135deg, rgba(59,130,246,0.5) 0%, rgba(6,182,212,0.4) 100%)',
            border: '1px solid rgba(56,189,248,0.4)',
          }}
        >
          <Zap className="h-3.5 w-3.5" />
          Sign in
        </span>
      </button>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const context = useContext(UserContext);
  const { user } = context || {};
  useOnline();

  return (
    <>
      <div className="min-h-dvh bg-[#030711] pb-32">
        <div className="relative min-h-dvh overflow-hidden bg-[#030711] px-5 pb-10">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            <div className="absolute -left-20 -top-40 h-[32rem] w-[32rem] rounded-full bg-blue-600/35 blur-[110px]" />
            <div className="absolute -right-10 top-10 h-72 w-72 rounded-full bg-cyan-400/25 blur-[80px]" />
          </div>

          <div className="container relative z-10 mx-auto max-w-4xl pt-4 md:pt-8">
            <Hero />
            {user ? <Dashboard /> : <Marketing />}
          </div>
        </div>

        <RateAppButton
          variant="card"
          appName={APP_CONFIG.gameName}
          appStoreUrl={APP_CONFIG.appStoreUrl}
          googlePlayUrl={APP_CONFIG.googlePlayUrl}
        />

        <PremiumFeatures
          features={PREMIUM_FEATURES}
          title="Premium features"
          subtitle={`Unlock the full ${APP_CONFIG.appName} experience`}
        />

        <div className="h-32" />
      </div>

      <Footer isCapacitor={isCapacitor}>
        <button
          onClick={() => router.push('/')}
          className="text-theme-primary dark:text-theme-primary-light group inline-flex cursor-pointer flex-col items-center justify-center px-0 font-semibold transition-all duration-200 active:opacity-70"
        >
          <HomeIcon className="text-theme-primary dark:text-theme-primary-light mb-1 h-6 w-6 drop-shadow-[0_0_8px_var(--theme-primary)] transition-all duration-200" />
          <span className="text-center text-xs font-medium">Home</span>
        </button>
        <button
          onClick={() => router.push('/history')}
          className="group inline-flex cursor-pointer flex-col items-center justify-center px-0 text-gray-500 transition-all duration-200 active:opacity-70 dark:text-gray-400"
        >
          <LineChart className="mb-1 h-6 w-6 text-gray-400 transition-all duration-200 dark:text-gray-500" />
          <span className="text-center text-xs font-medium">History</span>
        </button>
        <button
          onClick={() => router.push('/settings')}
          className="group inline-flex cursor-pointer flex-col items-center justify-center px-0 text-gray-500 transition-all duration-200 active:opacity-70 dark:text-gray-400"
        >
          <Settings className="mb-1 h-6 w-6 text-gray-400 transition-all duration-200 dark:text-gray-500" />
          <span className="text-center text-xs font-medium">Settings</span>
        </button>
      </Footer>
    </>
  );
}
