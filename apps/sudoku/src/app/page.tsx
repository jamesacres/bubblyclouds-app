'use client';
import { useOnline } from '@bubblyclouds-app/template/hooks/online';
import { useSudokuServerStorage } from '@bubblyclouds-app/sudoku/hooks/useSudokuServerStorage';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { useSessions } from '@bubblyclouds-app/template/providers/SessionsProvider';
import { Tab } from '@bubblyclouds-app/types/tabs';
import { PremiumFeatures } from '@bubblyclouds-app/template/components/PremiumFeatures';
import SocialProof from '@bubblyclouds-app/template/components/SocialProof';
import { PREMIUM_FEATURES } from '../config/premiumFeatures';
import { motivationalMessages } from '../config/motivationalMessages';
import { APP_CONFIG } from '../../app.config.js';
import { Difficulty } from '@bubblyclouds-app/games/types/difficulty';
import Footer from '@bubblyclouds-app/ui/components/Footer';
import MyPuzzlesTab from '@bubblyclouds-app/template/components/MyPuzzlesTab';
import FriendsTab from '@bubblyclouds-app/template/components/FriendsTab';
import ActivityWidget from '@bubblyclouds-app/games/components/ActivityWidget';
import Leaderboard from '@bubblyclouds-app/games/components/Leaderboard';
import { useParties } from '@bubblyclouds-app/template/hooks/useParties';
import { isPuzzleCheated } from '@bubblyclouds-app/sudoku/helpers/cheatDetection';
import { calculateCompletionPercentageFromState } from '@bubblyclouds-app/sudoku/helpers/calculateCompletionPercentage';
import { buildPuzzleUrlFromState } from '@bubblyclouds-app/sudoku/helpers/buildPuzzleUrl';
import SimpleSudoku from '@bubblyclouds-app/sudoku/components/SimpleSudoku';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Users, Zap, Award, Camera, BookOpen } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BookCover from '@bubblyclouds-app/sudoku/components/BookCover';
import { buildPuzzleUrl } from '@bubblyclouds-app/sudoku/helpers/buildPuzzleUrl';
import { isCapacitor } from '@bubblyclouds-app/template/helpers/capacitor';
import { GameState } from '@bubblyclouds-app/sudoku/types/state';

const SimpleStateWrapper = ({ state }: { state: GameState }) => (
  <SimpleSudoku state={state} />
);

const DIFFICULTY_OPTIONS = [
  {
    difficulty: Difficulty.SIMPLE,
    label: 'Tricky',
    stars: 1,
    bgFrom: '#10b981',
    bgTo: '#059669',
    glow: '0 0 28px rgba(16,185,129,0.55), 0 4px 16px rgba(16,185,129,0.3)',
    number: '3',
  },
  {
    difficulty: Difficulty.EASY,
    label: 'Challenging',
    stars: 2,
    bgFrom: '#f59e0b',
    bgTo: '#d97706',
    glow: '0 0 28px rgba(245,158,11,0.55), 0 4px 16px rgba(245,158,11,0.3)',
    number: '7',
  },
  {
    difficulty: Difficulty.INTERMEDIATE,
    label: 'Hard',
    stars: 3,
    bgFrom: '#f43f5e',
    bgTo: '#e11d48',
    glow: '0 0 28px rgba(244,63,94,0.55), 0 4px 16px rgba(244,63,94,0.3)',
    number: '9',
  },
] as const;

/* ── Animated 9×9 sudoku grid background ───────────────────────── */
const GRID_NUMBERS = [
  5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6,
  0, 8, 0, 0, 0, 6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0,
  0, 6, 0, 6, 0, 0, 0, 0, 2, 8, 0, 0, 0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0, 0, 8, 0,
  0, 7, 9,
];

function HeroGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Top-right quadrant only — gives an asymmetric feel */}
      <div
        className="animate-grid-drift absolute"
        style={{ top: '-5%', right: '-4%', width: '52%', opacity: 0.15 }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(9, 1fr)',
            gap: '3px',
          }}
        >
          {GRID_NUMBERS.map((n, i) => (
            <div
              key={i}
              className="animate-tile-pulse flex aspect-square items-center justify-center rounded-[4px] border border-violet-400/20 bg-violet-500/10 font-black text-violet-200/80"
              style={{
                animationDelay: `${(i % 7) * 0.45}s`,
                fontSize: 'clamp(7px, 1.1vw, 13px)',
              }}
            >
              {n > 0 ? n : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const { user, loginRedirect } = context || {};
  useOnline();
  const [isLoading, setIsLoading] = useState(false);
  const { getSudokuOfTheDay } = useSudokuServerStorage({
    app: APP_CONFIG.app,
    apiUrl: APP_CONFIG.apiUrl,
  });
  const { parties, refreshParties } = useParties({});
  const {
    sessions,
    refetchSessions,
    lazyLoadFriendSessions,
    fetchFriendSessions,
  } = useSessions<GameState>();

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

  const openSudokuOfTheDay = async (difficulty: Difficulty): Promise<void> => {
    setIsLoading(true);
    if (!user) {
      setIsLoading(false);
      const confirmed = confirm(
        'You need to sign in to continue. Would you like to sign in now?'
      );
      if (confirmed && loginRedirect) {
        loginRedirect({ userInitiated: true });
      }
      return;
    }
    const result = await getSudokuOfTheDay(difficulty);
    if (result) {
      router.push(
        buildPuzzleUrl(result.initial, result.final, {
          difficulty,
          sudokuId: result.sudokuId,
        })
      );
      return;
    }
    setIsLoading(false);
  };

  const openBook = (): void => {
    if (!user) {
      const confirmed = confirm(
        'You need to sign in to access the puzzle book. Would you like to sign in now?'
      );
      if (confirmed && loginRedirect) {
        loginRedirect({ userInitiated: true });
      }
      return;
    }
    router.push('/book');
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

  const currentMonth = new Date(new Date().toISOString()).toLocaleString(
    'en-US',
    { month: 'long', timeZone: 'UTC' }
  );

  return (
    <>
      {tab === Tab.START_PUZZLE ? (
        <div className="min-h-dvh bg-[#04020f] pb-32">
          {/* ══ HERO ══════════════════════════════════════════════ */}
          <div className="pt-safe relative min-h-dvh overflow-hidden bg-[#04020f] px-5 pb-10">
            <HeroGrid />

            {/* Neon ambient blobs */}
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
            >
              <div className="absolute -left-20 -top-40 h-[32rem] w-[32rem] rounded-full bg-violet-600/35 blur-[110px]" />
              <div className="absolute -right-10 top-10 h-72 w-72 rounded-full bg-fuchsia-500/30 blur-[80px]" />
              <div className="absolute bottom-10 left-1/3 h-56 w-80 rounded-full bg-cyan-400/20 blur-[70px]" />
              <div className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-blue-500/20 blur-[60px]" />
            </div>

            {/* Scanline overlay */}
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)',
              }}
            />

            <div className="container relative z-10 mx-auto max-w-4xl pt-6 md:pt-10">
              {/* App identity ─────────────────────────────────── */}
              <div className="mb-8 flex items-center gap-4">
                <div
                  className="liquid-glass-strong flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[18px]"
                  style={{
                    boxShadow:
                      '0 0 0 1px rgba(255,255,255,0.15), 0 0 40px rgba(80,120,255,0.3), inset 0 1px 0 rgba(255,255,255,0.22)',
                  }}
                >
                  <Image
                    src="/icons/icon-512.webp"
                    alt="Sudoku Race"
                    width={44}
                    height={44}
                    className="h-[44px] w-[44px]"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold tracking-tight text-white/70">
                      Sudoku Race
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-fuchsia-300">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-400" />
                      Live
                    </span>
                  </div>
                </div>
              </div>

              {/* Bold hero headline ─────────────────────────── */}
              <div className="mb-5">
                <h1
                  className="mb-2 text-[2.6rem] font-black leading-[1.1] tracking-tight text-white md:text-5xl"
                  style={{
                    textShadow:
                      '0 0 12px rgba(167,139,250,0.9), 0 0 30px rgba(139,92,246,0.6), 0 0 60px rgba(139,92,246,0.3)',
                  }}
                >
                  Ready to Race? 🏁
                </h1>
                <p className="mb-3 text-base font-medium leading-snug text-white/60 md:text-lg">
                  Share the challenge — invite friends and see who&apos;s the
                  fastest Sudoku solver.
                </p>
                <SocialProof motivationalMessages={motivationalMessages} />
              </div>

              {/* Activity card — dots + text summary ──────────── */}
              <div className="liquid-glass mb-5 rounded-2xl px-4 pb-3.5 pt-3">
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
                          'linear-gradient(135deg, rgba(139,92,246,0.4) 0%, rgba(217,70,239,0.3) 100%)',
                        border: '1px solid rgba(167,139,250,0.3)',
                      }}
                    >
                      <Award className="h-3.5 w-3.5 text-violet-300" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300">
                        Leaderboard
                      </span>
                    </button>
                  }
                />
              </div>

              {/* Daily challenges ─────────────────────────────── */}
              <div className="mb-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-black tracking-tight text-white">
                    Daily challenges
                  </h2>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                    refreshes daily
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {DIFFICULTY_OPTIONS.map(
                    ({
                      difficulty,
                      label,
                      stars,
                      bgFrom,
                      bgTo,
                      glow,
                      number,
                    }) => (
                      <button
                        key={difficulty}
                        onClick={() => openSudokuOfTheDay(difficulty)}
                        disabled={isLoading}
                        className="difficulty-card-shine group relative flex cursor-pointer flex-col justify-end overflow-hidden rounded-[20px] pb-3.5 pl-3.5 pr-3.5 pt-10 text-left transition-all duration-200 hover:scale-[1.03] active:scale-[0.96] disabled:opacity-40"
                        style={{
                          background: `linear-gradient(160deg, ${bgFrom} 0%, ${bgTo} 100%)`,
                          boxShadow: glow,
                          minHeight: '130px',
                        }}
                      >
                        {/* Giant ghost digit — positioned top-right */}
                        <span
                          className="text-white/18 pointer-events-none absolute -right-2 -top-3 select-none font-black leading-none"
                          aria-hidden="true"
                          style={{ fontSize: '96px' }}
                        >
                          {number}
                        </span>
                        {/* Stars row */}
                        <div className="relative mb-1.5 flex gap-0.5">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm leading-none ${i < stars ? 'text-white' : 'text-white/25'}`}
                              style={
                                i < stars
                                  ? {
                                      filter:
                                        'drop-shadow(0 0 4px rgba(255,255,255,0.7))',
                                    }
                                  : undefined
                              }
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        {/* Label */}
                        <p className="relative text-base font-black leading-tight text-white">
                          {label}
                        </p>
                      </button>
                    )
                  )}
                </div>

                <p className="mt-2 text-xs text-white/30">
                  More difficulty levels in the{' '}
                  <button
                    onClick={openBook}
                    className="text-white/55 underline underline-offset-2 hover:text-white/75"
                  >
                    puzzle book
                  </button>
                </p>
              </div>

              {/* Puzzle book — full width on mobile, left col on desktop */}
              <button
                onClick={openBook}
                className="liquid-glass mb-3 flex w-full cursor-pointer flex-col rounded-3xl p-4 text-left transition-all duration-200 active:scale-[0.97] md:mb-0 md:hidden"
              >
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-white/35">
                  {currentMonth} · 50 puzzles
                </p>
                <p className="mb-3 text-base font-black text-white">
                  Monthly book
                </p>
                <div
                  className="animate-float-card w-full overflow-hidden rounded-2xl"
                  style={{ aspectRatio: '2/3' }}
                >
                  <div
                    style={{
                      transform: 'scale(var(--book-scale, 1))',
                      transformOrigin: 'top left',
                      width: '240px',
                      height: '360px',
                    }}
                    ref={(el) => {
                      if (el) {
                        const parent = el.parentElement;
                        if (parent) {
                          const scale = parent.offsetWidth / 240;
                          el.style.setProperty('--book-scale', String(scale));
                          el.style.transform = `scale(${scale})`;
                        }
                      }
                    }}
                  >
                    <BookCover month={currentMonth} size="medium" />
                  </div>
                </div>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white/55">
                  <BookOpen className="h-2.5 w-2.5" />
                  Browse puzzles
                </span>
              </button>

              {/* Two action tiles — side by side on mobile */}
              <div className="grid grid-cols-2 gap-3 md:hidden">
                <Link
                  href="/import"
                  className="liquid-glass flex flex-col gap-2 rounded-2xl p-4 transition-all duration-200 active:scale-[0.97]"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.14)',
                    }}
                  >
                    <Camera className="h-3.5 w-3.5 text-white/70" />
                  </div>
                  <p className="text-base font-black leading-tight text-white">
                    Race any puzzle
                  </p>
                  <p className="text-xs leading-snug text-white/45">
                    Scan from a book or newspaper
                  </p>
                </Link>
                <button
                  onClick={() => handleTabChange(Tab.FRIENDS)}
                  className="liquid-glass flex cursor-pointer flex-col gap-2 rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.97]"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.14)',
                    }}
                  >
                    <Users className="h-3.5 w-3.5 text-white/70" />
                  </div>
                  <p className="text-base font-black leading-tight text-white">
                    Racing teams
                  </p>
                  <p className="text-xs leading-snug text-white/45">
                    {friendsList?.length
                      ? `Race ${friendsList.slice(0, 2).join(', ')} and more`
                      : 'Challenge friends to a race'}
                  </p>
                </button>
              </div>

              {/* Desktop: book left (2fr), tiles stacked right (1fr) */}
              <div className="hidden gap-3 md:grid md:grid-cols-[2fr_1fr]">
                <button
                  onClick={openBook}
                  className="liquid-glass flex cursor-pointer flex-col rounded-3xl p-4 text-left transition-all duration-200 active:scale-[0.97]"
                >
                  <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-white/35">
                    {currentMonth} · 50 puzzles
                  </p>
                  <p className="mb-3 text-base font-black text-white">
                    Monthly book
                  </p>
                  <div
                    className="animate-float-card mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl"
                    style={{ aspectRatio: '2/3' }}
                  >
                    <div
                      style={{
                        width: '240px',
                        height: '360px',
                        transformOrigin: 'top left',
                      }}
                      ref={(el) => {
                        if (el) {
                          const parent = el.parentElement;
                          if (parent) {
                            el.style.transform = `scale(${parent.offsetWidth / 240})`;
                          }
                        }
                      }}
                    >
                      <BookCover month={currentMonth} size="medium" />
                    </div>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white/55">
                    <BookOpen className="h-2.5 w-2.5" />
                    Browse puzzles
                  </span>
                </button>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/import"
                    className="liquid-glass flex flex-1 flex-col gap-2 rounded-2xl p-4 transition-all duration-200 active:scale-[0.97]"
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.14)',
                      }}
                    >
                      <Camera className="h-3.5 w-3.5 text-white/70" />
                    </div>
                    <p className="text-base font-black leading-tight text-white">
                      Race any puzzle
                    </p>
                    <p className="text-xs leading-snug text-white/45">
                      Scan from a book or newspaper
                    </p>
                  </Link>
                  <button
                    onClick={() => handleTabChange(Tab.FRIENDS)}
                    className="liquid-glass flex flex-1 cursor-pointer flex-col gap-2 rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.97]"
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.14)',
                      }}
                    >
                      <Users className="h-3.5 w-3.5 text-white/70" />
                    </div>
                    <p className="text-base font-black leading-tight text-white">
                      Racing teams
                    </p>
                    <p className="text-xs leading-snug text-white/45">
                      {friendsList?.length
                        ? `Race ${friendsList.slice(0, 2).join(', ')} and more`
                        : 'Challenge friends to a race'}
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Premium features */}
          <PremiumFeatures
            features={PREMIUM_FEATURES}
            title="Premium features"
            subtitle="Unlock the full Sudoku Race experience"
          />

          <div className="h-32" />
        </div>
      ) : (
        <div className="pt-safe min-h-dvh bg-stone-50 pb-32 dark:bg-zinc-900">
          <div className="container mx-auto max-w-4xl px-5">
            <div className="flex flex-col gap-3 pb-4 pt-5">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {tab === Tab.MY_PUZZLES ? 'My Puzzles' : 'Racing Teams'}
              </h1>
              {tab === Tab.MY_PUZZLES && (
                <ActivityWidget sessions={sessions || []} />
              )}
            </div>
            {tab === Tab.MY_PUZZLES && (
              <MyPuzzlesTab<GameState>
                sessions={sessions || []}
                SimpleState={SimpleStateWrapper}
                calculateCompletionPercentageFromState={
                  calculateCompletionPercentageFromState
                }
                isPuzzleCheated={isPuzzleCheated}
                buildPuzzleUrlFromState={buildPuzzleUrlFromState}
              />
            )}
            {tab === Tab.FRIENDS && (
              <FriendsTab<GameState>
                user={user}
                parties={parties}
                mySessions={sessions || []}
                onRefresh={refreshLeaderboard}
                SimpleState={SimpleStateWrapper}
                calculateCompletionPercentageFromState={
                  calculateCompletionPercentageFromState
                }
                isPuzzleCheated={isPuzzleCheated}
                buildPuzzleUrlFromState={buildPuzzleUrlFromState}
                LeaderboardComponent={Leaderboard}
                gameName="Sudoku"
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
          <span className="text-center text-xs font-medium">Start Race</span>
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
          <span className="text-center text-xs font-medium">My Puzzles</span>
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
