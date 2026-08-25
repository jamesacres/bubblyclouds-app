'use client';
import { useOnline } from '@bubblyclouds-app/template/hooks/online';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { useSessions } from '@bubblyclouds-app/template/providers/SessionsProvider';
import { Tab } from '@bubblyclouds-app/types/tabs';
import { PremiumFeatures } from '@bubblyclouds-app/template/components/PremiumFeatures';
import { RateAppButton } from '@bubblyclouds-app/template/components/RateAppButton';
import SocialProof from '@bubblyclouds-app/template/components/SocialProof';
import { PREMIUM_FEATURES } from '../config/premiumFeatures';
import { motivationalMessages } from '../config/motivationalMessages';
import Footer from '@bubblyclouds-app/ui/components/Footer';
import MyPuzzlesTab from '@bubblyclouds-app/template/components/MyPuzzlesTab';
import FriendsTab from '@bubblyclouds-app/template/components/FriendsTab';
import ActivityWidget from '@bubblyclouds-app/games/components/ActivityWidget';
import UnblockLeaderboard from '../components/UnblockLeaderboard';
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
import { Users, Zap, Award, BookOpen, ChevronsRight } from 'lucide-react';
import Image from 'next/image';
import { isCapacitor } from '@bubblyclouds-app/template/helpers/capacitor';
import { getUnblockDifficultyDisplay } from '@bubblyclouds-app/unblockrace/helpers/difficultyDisplay';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';
import { APP_CONFIG } from '../../app.config.js';
import { GameState } from '@bubblyclouds-app/unblockrace/types/state';
import { calculateCompletionPercentageFromState } from '@bubblyclouds-app/unblockrace/helpers/calculateCompletionPercentage';
import { isPuzzleCheated } from '@bubblyclouds-app/unblockrace/helpers/cheatDetection';
import { movesDisplayFromState } from '@bubblyclouds-app/unblockrace/helpers/calculateStatsDisplay';
import { starRatingFromState } from '@bubblyclouds-app/unblockrace/helpers/starRating';
import { buildPuzzleUrlFromState } from '@bubblyclouds-app/unblockrace/helpers/buildPuzzleUrl';
import { buildPuzzleUrl } from '@bubblyclouds-app/unblockrace/helpers/buildPuzzleUrl';
import { useUnblockServerStorage } from '@bubblyclouds-app/unblockrace/hooks/useUnblockServerStorage';
import SimpleBoard from '@bubblyclouds-app/unblockrace/components/SimpleBoard';
import CollectionCover from '@bubblyclouds-app/unblockrace/components/UnblockCollectionCover';

const SimpleStateWrapper = ({ state }: { state: GameState }) => (
  <SimpleBoard state={state} />
);

const jamCell = (value: number) => `${(value / 6) * 100}%`;

const jamPieceStyle = (
  col: number,
  row: number,
  width: number,
  height: number
) => ({
  left: jamCell(col),
  top: jamCell(row),
  width: jamCell(width),
  height: jamCell(height),
});

const JAM_STATIC_PIECES = [
  { col: 0, row: 0, width: 2, height: 1, color: '#06b6d4' },
  { col: 0, row: 3, width: 1, height: 2, color: '#84cc16' },
  { col: 0, row: 5, width: 3, height: 1, color: '#f97316' },
  { col: 4, row: 4, width: 2, height: 1, color: '#14b8a6' },
];

// Looping preview of the game itself: two rivals slide clear, then the
// theme-coloured hero block escapes through the exit (keyframes in
// globals.css, choreographed on a shared 9s clock).
const JamBoardPreview = () => (
  <div
    aria-hidden="true"
    className="relative aspect-square w-full overflow-hidden rounded-2xl"
    style={{
      background: 'rgba(2,8,20,0.85)',
      border: '1px solid rgba(148,163,184,0.16)',
      backgroundImage:
        'linear-gradient(rgba(148,163,184,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.09) 1px, transparent 1px)',
      backgroundSize: 'calc(100% / 6) calc(100% / 6)',
    }}
  >
    {JAM_STATIC_PIECES.map(({ col, row, width, height, color }) => (
      <div
        key={`${col}-${row}`}
        className="absolute"
        style={jamPieceStyle(col, row, width, height)}
      >
        <div
          className="absolute"
          style={{
            inset: '8%',
            borderRadius: '22%',
            background: color,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        />
      </div>
    ))}
    <div className="jam-rival-down absolute" style={jamPieceStyle(3, 0, 1, 3)}>
      <div
        className="absolute"
        style={{
          inset: '8%',
          borderRadius: '22%',
          background: '#f59e0b',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
      />
    </div>
    <div className="jam-rival-up absolute" style={jamPieceStyle(5, 1, 1, 2)}>
      <div
        className="absolute"
        style={{
          inset: '8%',
          borderRadius: '22%',
          background: '#f43f5e',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
      />
    </div>
    <div className="jam-hero absolute" style={jamPieceStyle(0, 2, 2, 1)}>
      <div
        className="absolute"
        style={{
          inset: '8%',
          borderRadius: '22%',
          background: 'var(--theme-primary)',
          boxShadow:
            '0 0 14px var(--theme-primary), inset 0 1px 0 rgba(255,255,255,0.4)',
        }}
      />
    </div>
    <div
      className="absolute right-0 flex items-center justify-end pr-0.5"
      style={{ top: jamCell(2), height: jamCell(1) }}
    >
      <div
        className="absolute right-0 h-full w-[3px]"
        style={{
          background:
            'linear-gradient(180deg, transparent, var(--theme-primary-light), transparent)',
        }}
      />
      <ChevronsRight className="jam-exit-pulse h-4 w-4 text-cyan-300" />
    </div>
  </div>
);

const RACE_LANE_BLOCKS = [
  {
    laneClass: 'race-lane-amber',
    color: '#f59e0b',
    glow: '0 0 8px rgba(245,158,11,0.5)',
  },
  {
    laneClass: 'race-lane-hero',
    color: 'var(--theme-primary)',
    glow: '0 0 12px var(--theme-primary)',
  },
  {
    laneClass: 'race-lane-rose',
    color: '#f43f5e',
    glow: '0 0 8px rgba(244,63,94,0.5)',
  },
];

// Mini race for the Racing teams tile: three blocks burst toward the
// checkered finish on the jam board's shared 9s clock and the
// theme-coloured hero block edges the win (keyframes in globals.css).
const RaceLanesPreview = () => (
  <div
    aria-hidden="true"
    className="relative w-full overflow-hidden rounded-2xl"
    style={{
      background: 'rgba(2,8,20,0.85)',
      border: '1px solid rgba(148,163,184,0.16)',
    }}
  >
    <div
      className="absolute bottom-1 right-1 top-1 w-2 rounded-sm opacity-60"
      style={{
        background:
          'repeating-conic-gradient(rgba(255,255,255,0.8) 0% 25%, rgba(2,6,23,0.9) 0% 50%) 0 0 / 4px 4px',
      }}
    />
    {RACE_LANE_BLOCKS.map(({ laneClass, color, glow }, lane) => (
      <div
        key={laneClass}
        className={`flex h-9 items-center px-1.5 ${lane > 0 ? 'border-t border-white/5' : ''}`}
      >
        <div
          className={`${laneClass} h-5 w-1/4 rounded-md`}
          style={{
            background: color,
            boxShadow: `${glow}, inset 0 1px 0 rgba(255,255,255,0.35)`,
          }}
        />
      </div>
    ))}
  </div>
);

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
  const [isLoading, setIsLoading] = useState(false);
  const { getUnblockRaceOfTheDay } = useUnblockServerStorage({
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

  const openUnblockRaceOfTheDay = async (): Promise<void> => {
    setIsLoading(true);
    if (!user) {
      setIsLoading(false);
      showLoginModal?.(undefined, LoginContext.DAILY_PUZZLE);
      return;
    }
    const run = await getUnblockRaceOfTheDay();
    setIsLoading(false);
    if (!run) {
      return;
    }
    router.push(
      buildPuzzleUrl(
        run.puzzles.map((puzzle) => puzzle.initial),
        run.puzzles.map((puzzle) => puzzle.movesRequired),
        { runId: run.runId }
      )
    );
  };

  const openCollection = (): void => {
    if (!user) {
      showLoginModal?.(undefined, LoginContext.COLLECTION);
      return;
    }
    router.push('/collection');
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
        <div className="min-h-dvh bg-[#030711] pb-32">
          {/* ══ HERO ══════════════════════════════════════════════ */}
          <div className="relative min-h-dvh overflow-hidden bg-[#030711] px-5 pb-10">
            {/* Ambient glow — static gradient, no blur filters (avoids WebView compositing flicker) */}
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
              style={{
                backgroundImage:
                  'radial-gradient(ellipse 900px 700px at 0% 0%, rgba(37,99,235,0.35), transparent 60%), radial-gradient(ellipse 500px 500px at 100% 15%, rgba(34,211,238,0.22), transparent 60%), radial-gradient(ellipse 600px 400px at 40% 90%, rgba(251,191,36,0.12), transparent 60%)',
              }}
            />

            {/* Faint board-grid overlay — blocks motif */}
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)',
                backgroundSize: '44px 44px',
              }}
            />

            <div className="container relative z-10 mx-auto max-w-4xl pt-4 md:pt-8">
              {/* App identity ─────────────────────────────────── */}
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
                    alt="Unblock Race"
                    width={44}
                    height={44}
                    className="h-[44px] w-[44px]"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold tracking-tight text-white/70">
                      Unblock Race
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-cyan-300">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                      Live
                    </span>
                  </div>
                </div>
              </div>

              {/* Bold hero headline ─────────────────────────── */}
              <div className="mb-4">
                <h1
                  className="mb-2 text-[2.6rem] font-black leading-[1.1] tracking-tight text-white md:text-5xl"
                  style={{
                    textShadow:
                      '0 0 12px rgba(56,189,248,0.75), 0 0 30px rgba(59,130,246,0.55), 0 0 60px rgba(59,130,246,0.3)',
                  }}
                >
                  Clear the jam.
                  <br />
                  <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                    Win the race
                  </span>{' '}
                  🏁
                </h1>
                <p className="mb-3 text-base font-medium leading-snug text-white/60 md:text-lg">
                  Slide the blocks, break the glowing one free, and race your
                  friends to the exit.
                </p>
                <SocialProof motivationalMessages={motivationalMessages} />
              </div>

              {/* Activity card — dots + text summary ──────────── */}
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
                        Leaderboard
                      </span>
                    </button>
                  }
                />
              </div>

              {/* Daily race — animated jam board is the CTA ───── */}
              <div className="mb-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-black tracking-tight text-white">
                    Daily race
                  </h2>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                    refreshes daily
                  </span>
                </div>

                <button
                  onClick={() => openUnblockRaceOfTheDay()}
                  disabled={isLoading}
                  className="group relative w-full cursor-pointer overflow-hidden rounded-3xl p-4 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.97] disabled:opacity-40"
                  style={{
                    background:
                      'linear-gradient(155deg, rgba(30,64,175,0.5) 0%, rgba(4,12,30,0.92) 65%)',
                    border: '1px solid rgba(59,130,246,0.35)',
                    boxShadow:
                      '0 0 32px rgba(59,130,246,0.25), 0 8px 24px rgba(2,6,23,0.6)',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-orbitron mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                        Today&apos;s race
                      </p>
                      <p className="mb-1 text-xl font-black leading-tight text-white">
                        Beginner → Expert
                      </p>
                      <p className="mb-3 text-xs leading-snug text-white/50">
                        Five boards, one clock — fastest escape wins.
                      </p>
                      <div className="mb-3 flex items-center gap-1.5">
                        {[
                          '#10b981',
                          '#84cc16',
                          '#f59e0b',
                          '#f97316',
                          '#f43f5e',
                        ].map((color) => (
                          <span
                            key={color}
                            className="h-2.5 w-2.5 rounded-[4px]"
                            style={{
                              background: color,
                              boxShadow: `0 0 6px ${color}66`,
                            }}
                          />
                        ))}
                        <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                          5 stages
                        </span>
                      </div>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(59,130,246,0.5) 0%, rgba(6,182,212,0.4) 100%)',
                          border: '1px solid rgba(56,189,248,0.4)',
                        }}
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Start racing
                      </span>
                    </div>
                    <div className="w-[42%] max-w-[210px] shrink-0">
                      <JamBoardPreview />
                    </div>
                  </div>
                </button>

                <p className="mt-2 text-xs text-white/30">
                  More puzzles in the{' '}
                  <button
                    onClick={openCollection}
                    className="text-white/55 underline underline-offset-2 hover:text-white/75"
                  >
                    puzzle collection
                  </button>
                </p>
              </div>

              {/* Monthly collection + Racing teams — compact landscape
                  cards sharing the daily race card's text-left,
                  board-right layout */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[3fr_2fr]">
                <button
                  onClick={openCollection}
                  className="group relative w-full cursor-pointer overflow-hidden rounded-3xl p-4 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.97] md:p-6"
                  style={{
                    background:
                      'linear-gradient(155deg, rgba(11,58,143,0.45) 0%, rgba(4,12,30,0.92) 60%, rgba(14,116,144,0.3) 100%)',
                    border: '1px solid rgba(56,189,248,0.3)',
                    boxShadow:
                      '0 0 32px rgba(6,182,212,0.18), 0 8px 24px rgba(2,6,23,0.6)',
                  }}
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/35">
                        {currentMonth} · daily puzzles
                      </p>
                      <p className="mb-1 text-xl font-black leading-tight text-white md:text-2xl">
                        Monthly collection
                      </p>
                      <p className="mb-3 text-xs leading-snug text-white/50 md:text-sm">
                        A fresh jam for every day of {currentMonth} — clear them
                        all before the month is out.
                      </p>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(59,130,246,0.5) 0%, rgba(6,182,212,0.4) 100%)',
                          border: '1px solid rgba(56,189,248,0.4)',
                        }}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        Browse puzzles
                      </span>
                    </div>
                    <div className="w-[34%] max-w-[150px] shrink-0">
                      <div className="animate-float-card">
                        <CollectionCover month={currentMonth} variant="tile" />
                      </div>
                    </div>
                  </div>
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
                  <div className="my-auto py-2">
                    <RaceLanesPreview />
                  </div>
                  <p className="mt-2 text-xs leading-snug text-white/45">
                    {friendsList?.length
                      ? `Race ${friendsList.slice(0, 2).join(', ')} and more`
                      : 'Challenge friends to a race'}
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Rate the app */}
          <RateAppButton
            variant="card"
            appName={APP_CONFIG.gameName}
            appStoreUrl={APP_CONFIG.appStoreUrl}
            googlePlayUrl={APP_CONFIG.googlePlayUrl}
          />

          {/* Premium features */}
          <PremiumFeatures
            features={PREMIUM_FEATURES}
            title="Premium features"
            subtitle="Unlock the full Unblock Race experience"
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
                getDifficultyDisplay={getUnblockDifficultyDisplay}
                getMovesDisplay={movesDisplayFromState}
                getStarRating={starRatingFromState}
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
                LeaderboardComponent={UnblockLeaderboard}
                gameName={APP_CONFIG.gameName}
                getDifficultyDisplay={getUnblockDifficultyDisplay}
                getMovesDisplay={movesDisplayFromState}
                getStarRating={starRatingFromState}
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
