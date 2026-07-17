'use client';
import { useOnline } from '@bubblyclouds-app/template/hooks/online';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { useSessions } from '@bubblyclouds-app/template/providers/SessionsProvider';
import { Tab } from '@bubblyclouds-app/types/tabs';
import { PremiumFeatures } from '@bubblyclouds-app/template/components/PremiumFeatures';
import { RateAppButton } from '@bubblyclouds-app/template/components/RateAppButton';
import Footer from '@bubblyclouds-app/ui/components/Footer';
import ActivityWidget from '@bubblyclouds-app/games/components/ActivityWidget';
import MyStatesTab from '../components/MyStatesTab';
import RacingTeamsTab from '../components/RacingTeamsTab';
import { useParties } from '@bubblyclouds-app/template/hooks/useParties';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Users, Zap, Award } from 'lucide-react';
import Image from 'next/image';
import { isCapacitor } from '@bubblyclouds-app/template/helpers/capacitor';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';
import { APP_CONFIG } from '../../app.config.js';
import { MoneyBagsState } from '../types/state';
import { PREMIUM_FEATURES } from '../config/premiumFeatures';
import { currentMonthStateId } from '../helpers/monthStateId';

function HomeComponent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || Tab.START_PUZZLE);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || Tab.START_PUZZLE;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTab(tabFromUrl);
  }, [searchParams]);

  const router = useRouter();
  const context = useContext(UserContext);
  const { user, showLoginModal } = context || {};
  useOnline();
  const { parties, refreshParties } = useParties({});
  const {
    sessions,
    refetchSessions,
    lazyLoadFriendSessions,
    fetchFriendSessions,
  } = useSessions<MoneyBagsState>();

  const hasLoadedFriendSessionsRef = useRef(false);

  useEffect(() => {
    refetchSessions();
  }, [refetchSessions]);

  useEffect(() => {
    if (parties && parties.length > 0 && !hasLoadedFriendSessionsRef.current) {
      hasLoadedFriendSessionsRef.current = true;
      lazyLoadFriendSessions(parties);
    }
  }, [parties, lazyLoadFriendSessions]);

  const friendsList = Array.from(
    new Set(
      parties
        ?.map(({ members }) =>
          (members || [])
            .filter(({ userId }) => userId !== user?.sub)
            .map(({ memberNickname }) => memberNickname)
        )
        .flat() || []
    )
  );

  const openCurrentMonth = (): void => {
    if (!user) {
      showLoginModal?.(undefined, LoginContext.PUZZLE_ENTRY);
      return;
    }
    router.push(`/state?month=${currentMonthStateId()}`);
  };

  const tabBackground = (thisTab: Tab) =>
    thisTab === tab
      ? 'text-theme-primary dark:text-theme-primary-light font-semibold'
      : 'text-gray-500 dark:text-gray-400';

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    window.history.replaceState(null, '', `/?tab=${newTab}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshLeaderboard = useCallback(async () => {
    await refreshParties();
    if (parties && parties.length > 0) {
      await fetchFriendSessions(parties);
    }
  }, [refreshParties, fetchFriendSessions, parties]);

  return (
    <>
      {tab === Tab.START_PUZZLE ? (
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

              <div className="mb-4">
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
                  {APP_CONFIG.appDescription}
                </p>
              </div>

              <div className="liquid-glass mb-4 rounded-2xl px-4 pb-3.5 pt-3">
                <ActivityWidget
                  sessions={sessions || undefined}
                  variant="dark"
                  onClick={() => handleTabChange(Tab.MY_PUZZLES)}
                  action={
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTabChange(Tab.FRIENDS);
                      }}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all duration-200 active:scale-[0.95]"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(59,130,246,0.4) 0%, rgba(6,182,212,0.3) 100%)',
                        border: '1px solid rgba(56,189,248,0.3)',
                      }}
                    >
                      <Award className="h-3.5 w-3.5 text-cyan-300" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                        View team
                      </span>
                    </button>
                  }
                />
              </div>

              <div className="mb-4">
                <button
                  onClick={openCurrentMonth}
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
                    This month
                  </p>
                  <p className="mb-1 text-xl font-black leading-tight text-white">
                    {currentMonthStateId()}
                  </p>
                  <p className="mb-3 text-xs leading-snug text-white/50">
                    Open this month&apos;s saved state
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
                    Open
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <button
                  onClick={() => handleTabChange(Tab.MY_PUZZLES)}
                  className="liquid-glass flex cursor-pointer flex-col rounded-3xl p-4 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.97] md:p-6"
                >
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/35">
                    History
                  </p>
                  <p className="mb-2 text-xl font-black leading-tight text-white md:text-2xl">
                    My states
                  </p>
                  <p className="mt-2 text-xs leading-snug text-white/45">
                    Browse states saved for past months
                  </p>
                </button>
                <button
                  onClick={() => handleTabChange(Tab.FRIENDS)}
                  className="liquid-glass flex cursor-pointer flex-col rounded-3xl p-4 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.97] md:p-6"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/35">
                      Multiplayer
                    </p>
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.14)',
                      }}
                    >
                      <Users className="h-3.5 w-3.5 text-white/70" />
                    </div>
                  </div>
                  <p className="mb-2 text-xl font-black leading-tight text-white md:text-2xl">
                    Racing teams
                  </p>
                  <p className="mt-2 text-xs leading-snug text-white/45">
                    {friendsList?.length
                      ? `With ${friendsList.slice(0, 2).join(', ')} and more`
                      : 'Invite friends to your team'}
                  </p>
                </button>
              </div>
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
      ) : (
        <div className="pt-safe min-h-dvh bg-stone-50 pb-32 dark:bg-zinc-900">
          <div className="container mx-auto max-w-4xl px-5">
            <div className="flex flex-col gap-3 pb-4 pt-5">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {tab === Tab.MY_PUZZLES ? 'My States' : 'Racing Teams'}
              </h1>
              {tab === Tab.MY_PUZZLES && (
                <ActivityWidget sessions={sessions || []} />
              )}
            </div>
            {tab === Tab.MY_PUZZLES && (
              <MyStatesTab sessions={sessions || []} app={APP_CONFIG.app} />
            )}
            {tab === Tab.FRIENDS && (
              <RacingTeamsTab
                user={user}
                parties={parties}
                onRefresh={refreshLeaderboard}
              />
            )}
          </div>
        </div>
      )}

      <Footer isCapacitor={isCapacitor}>
        <button
          onClick={() => handleTabChange(Tab.START_PUZZLE)}
          className={`group inline-flex cursor-pointer flex-col items-center justify-center px-0 transition-all duration-200 active:opacity-70 ${tabBackground(Tab.START_PUZZLE)}`}
        >
          <Zap
            className={`mb-1 h-6 w-6 transition-all duration-200 ${
              tab === Tab.START_PUZZLE
                ? 'text-theme-primary dark:text-theme-primary-light drop-shadow-[0_0_8px_var(--theme-primary)]'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          />
          <span className="text-center text-xs font-medium">Home</span>
        </button>
        <button
          onClick={() => handleTabChange(Tab.MY_PUZZLES)}
          className={`group inline-flex cursor-pointer flex-col items-center justify-center px-0 transition-all duration-200 active:opacity-70 ${tabBackground(Tab.MY_PUZZLES)}`}
        >
          <Award
            className={`mb-1 h-6 w-6 transition-all duration-200 ${
              tab === Tab.MY_PUZZLES
                ? 'text-theme-primary dark:text-theme-primary-light drop-shadow-[0_0_8px_var(--theme-primary)]'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          />
          <span className="text-center text-xs font-medium">My States</span>
        </button>
        <button
          onClick={() => handleTabChange(Tab.FRIENDS)}
          className={`group inline-flex cursor-pointer flex-col items-center justify-center px-0 transition-all duration-200 active:opacity-70 ${tabBackground(Tab.FRIENDS)}`}
        >
          <Users
            className={`mb-1 h-6 w-6 transition-all duration-200 ${
              tab === Tab.FRIENDS
                ? 'text-theme-primary dark:text-theme-primary-light drop-shadow-[0_0_8px_var(--theme-primary)]'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          />
          <span className="text-center text-xs font-medium">Racing Teams</span>
        </button>
      </Footer>
    </>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeComponent />
    </Suspense>
  );
}
