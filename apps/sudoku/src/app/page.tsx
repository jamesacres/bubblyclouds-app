'use client';
import { useOnline } from '@sudoku-web/template/hooks/online';
import { useSudokuServerStorage } from '@sudoku-web/sudoku/hooks/useSudokuServerStorage';
import {
  UserContext,
  UserContextInterface,
} from '@sudoku-web/auth/providers/AuthProvider';
import { useSessions } from '@sudoku-web/template/providers/SessionsProvider';
import { Tab } from '@sudoku-web/types/tabs';
import SocialProof from '@sudoku-web/template/components/SocialProof';
import { PremiumFeatures } from '@sudoku-web/template/components/PremiumFeatures';
import { PREMIUM_FEATURES } from '../config/premiumFeatures';
import { Difficulty } from '@sudoku-web/games/types/difficulty';
import Footer from '@sudoku-web/ui/components/Footer';
import MyPuzzlesTab from '@sudoku-web/template/components/MyPuzzlesTab';
import FriendsTab from '@sudoku-web/template/components/FriendsTab';
import ActivityWidget from '@sudoku-web/games/components/ActivityWidget';
import { useParties } from '@sudoku-web/template/hooks/useParties';
import { isPuzzleCheated } from '@sudoku-web/sudoku/helpers/cheatDetection';
import { calculateCompletionPercentageFromState } from '@sudoku-web/sudoku/helpers/calculateCompletionPercentage';
import { buildPuzzleUrlFromState } from '@sudoku-web/sudoku/helpers/buildPuzzleUrl';
import SimpleSudoku from '@sudoku-web/sudoku/components/SimpleSudoku';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Users, Zap, Award, Camera } from 'react-feather';
import Link from 'next/link';
import Image from 'next/image';
import BookCover from '@sudoku-web/sudoku/components/BookCover';
import { buildPuzzleUrl } from '@sudoku-web/sudoku/helpers/buildPuzzleUrl';
import { isCapacitor } from '@sudoku-web/template/helpers/capacitor';
import { GameState } from '@sudoku-web/sudoku/types/state';

const SimpleStateWrapper = ({ state }: { state: GameState }) => (
  <SimpleSudoku state={state} />
);

function HomeComponent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || Tab.START_PUZZLE);

  // Update tab when search params change (only from external navigation)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || Tab.START_PUZZLE;
    setTab(tabFromUrl);
  }, [searchParams]);
  const router = useRouter();
  const context = useContext(UserContext) as UserContextInterface | undefined;
  const { user, loginRedirect } = context || {};
  useOnline();
  const [isLoading, setIsLoading] = useState(false);
  const { getSudokuOfTheDay } = useSudokuServerStorage();
  const { parties, refreshParties } = useParties({});
  const {
    sessions,
    refetchSessions,
    lazyLoadFriendSessions,
    fetchFriendSessions,
  } = useSessions<GameState>();

  const hasLoadedFriendSessionsRef = useRef(false);

  useEffect(() => {
    // Always refetch sessions when returning to homepage to get latest progress
    refetchSessions();
  }, [refetchSessions]);

  // Lazy load friend sessions when parties are available
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

    // Just navigate to book page, let it handle loading
    router.push('/book');
  };

  const tabBackground = (thisTab: Tab) =>
    thisTab === tab
      ? 'bg-transparent text-theme-primary dark:text-theme-primary-light font-semibold'
      : 'text-gray-500 dark:text-gray-400';

  const handleTabChange = (newTab: Tab) => {
    // Update state immediately to prevent unnecessary re-renders
    setTab(newTab);
    // Update URL without triggering navigation effects
    window.history.replaceState(null, '', `/?tab=${newTab}`);
    // Scroll to top when changing tabs
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate daily streak from sessions
  const calculateDailyStreak = useCallback(() => {
    if (!sessions || sessions.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionDates = sessions
      .map((session) => {
        const date = new Date(session.updatedAt);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
      .filter((date, index, array) => array.indexOf(date) === index) // Remove duplicates
      .sort((a, b) => b - a); // Sort newest first

    let streak = 0;
    let currentDate = today.getTime();

    for (const sessionDate of sessionDates) {
      if (sessionDate === currentDate) {
        streak++;
        currentDate -= 24 * 60 * 60 * 1000; // Go back one day
      } else if (sessionDate === currentDate + 24 * 60 * 60 * 1000) {
        // Session from yesterday, continue streak
        streak++;
        currentDate = sessionDate - 24 * 60 * 60 * 1000;
      } else {
        break; // Gap in streak
      }
    }

    return streak;
  }, [sessions]);

  const dailyStreak = calculateDailyStreak();

  const refreshLeaderboard = useCallback(async () => {
    await refreshParties();
    // After refreshing parties, we need to fetch fresh friend sessions
    if (parties && parties.length > 0) {
      await fetchFriendSessions(parties);
    }
  }, [refreshParties, fetchFriendSessions, parties]);

  return (
    <>
      {tab === Tab.START_PUZZLE ? (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          {/* Racing Hero Section */}
          <div className="pt-safe relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 px-6">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 container mx-auto max-w-4xl py-4 text-center text-white md:py-6">
              <div className="mb-3 flex justify-center md:mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm md:h-20 md:w-20">
                  <Image
                    src="/icons/icon-512.webp"
                    alt="Sudoku Race Logo"
                    width={64}
                    height={64}
                    className="h-10 w-10 md:h-12 md:w-12"
                  />
                </div>
              </div>
              <h1 className="mb-3 text-3xl font-bold md:mb-4 md:text-4xl">
                Ready to Race? 🏎️
              </h1>
              <p className="mb-6 text-lg opacity-90 md:mb-8 md:text-xl">
                Share the challenge! Invite friends to race and see who&apos;s
                the fastest Sudoku solver 🏁
              </p>

              {/* Social Proof - Motivational Message */}
              <SocialProof />

              {/* Daily Streak Section - Compact */}
              <div className="mb-4 md:mb-6">
                <div className="mx-auto max-w-sm rounded-xl border border-white/20 bg-purple-600/20 p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">🔥</div>
                      <div>
                        <span className="text-lg font-bold text-white">
                          {dailyStreak}
                        </span>
                        <span className="ml-1 text-sm text-white/80">
                          day streak
                        </span>
                      </div>
                    </div>
                    <button
                      className="cursor-pointer rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/30"
                      onClick={() => handleTabChange(Tab.FRIENDS)}
                    >
                      Leaderboard
                    </button>
                  </div>
                </div>
              </div>

              {/* Racing Action Buttons */}
              <div className="mx-auto max-w-4xl">
                {/* Daily Challenges - Full Width */}
                <div className="mb-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm md:mb-6 md:p-6">
                  <h3 className="mb-2 text-lg font-bold text-white md:mb-3 md:text-xl">
                    🏁 Daily Challenges
                  </h3>
                  <p className="mb-3 text-sm text-white/80 md:mb-4 md:text-base">
                    Choose your difficulty - race against the clock and your
                    friends! Fresh puzzles daily!
                  </p>
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    <button
                      onClick={() => openSudokuOfTheDay(Difficulty.SIMPLE)}
                      disabled={isLoading}
                      className={`${
                        isLoading ? 'cursor-wait' : 'cursor-pointer'
                      } flex flex-col items-center justify-center rounded-xl bg-white/20 p-3 font-bold text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/30 disabled:opacity-50 md:p-4`}
                    >
                      <span className="mb-1 text-xl md:mb-2 md:text-2xl">
                        ⚡
                      </span>
                      <span className="text-xs md:text-sm">Tricky</span>
                      <div className="mt-1 flex space-x-0.5">
                        <span className="text-xs text-yellow-300">⭐</span>
                      </div>
                    </button>
                    <button
                      onClick={() => openSudokuOfTheDay(Difficulty.EASY)}
                      disabled={isLoading}
                      className={`${
                        isLoading ? 'cursor-wait' : 'cursor-pointer'
                      } relative flex flex-col items-center justify-center rounded-xl bg-white/20 p-3 font-bold text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/30 disabled:opacity-50 md:p-4`}
                    >
                      <span className="mb-1 text-xl md:mb-2 md:text-2xl">
                        🔥
                      </span>
                      <span className="text-xs md:text-sm">Challenging</span>
                      <div className="mt-1 flex space-x-0.5">
                        <span className="text-xs text-yellow-300">⭐⭐</span>
                      </div>
                    </button>
                    <button
                      onClick={() =>
                        openSudokuOfTheDay(Difficulty.INTERMEDIATE)
                      }
                      disabled={isLoading}
                      className={`${
                        isLoading ? 'cursor-wait' : 'cursor-pointer'
                      } relative flex flex-col items-center justify-center rounded-xl bg-white/20 p-3 font-bold text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/30 disabled:opacity-50 md:p-4`}
                    >
                      <span className="mb-1 text-xl md:mb-2 md:text-2xl">
                        🚀
                      </span>
                      <span className="text-xs md:text-sm">Hard</span>
                      <div className="mt-1 flex space-x-0.5">
                        <span className="text-xs text-yellow-300">⭐⭐⭐</span>
                      </div>
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-white/80 md:mb-4 md:text-base">
                    For a larger range of difficulties and techniques check out
                    this month&apos;s book below!
                  </p>
                </div>

                {/* Monthly Puzzle Book */}
                {(() => {
                  const currentMonth = new Date(
                    new Date().toISOString()
                  ).toLocaleString('en-US', {
                    month: 'long',
                    timeZone: 'UTC',
                  });

                  return (
                    <div className="mb-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm md:mb-6 md:p-6">
                      <h3 className="mb-2 text-lg font-bold text-white md:mb-3 md:text-xl">
                        📚 {currentMonth} Puzzle Book
                      </h3>
                      <p className="mb-3 text-sm text-white/80 md:mb-4 md:text-base">
                        50 new puzzles each month with varied solving techniques
                      </p>
                      <div className="flex flex-col items-center rounded-xl bg-white/20 p-4 backdrop-blur-sm md:flex-row md:items-center md:justify-between md:p-6">
                        <div className="mb-4 flex flex-col items-center md:mb-0 md:flex-row md:items-center">
                          <button
                            onClick={openBook}
                            className="mb-3 cursor-pointer md:mr-6 md:mb-0"
                          >
                            <BookCover month={currentMonth} size="large" />
                          </button>
                          <div className="text-center md:text-left">
                            <div className="text-lg font-bold text-white md:text-xl">
                              {currentMonth} Edition
                            </div>
                            <div className="text-sm text-white/70 md:text-base">
                              50 Technique-Based Puzzles
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={openBook}
                          className="inline-flex cursor-pointer items-center justify-center rounded-full bg-white/20 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/30 md:px-8 md:py-4 md:text-base"
                        >
                          Browse Puzzles
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Import Your Own Puzzle - Full Width Feature */}
                <div className="mb-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm md:mb-6 md:p-6">
                  <h3 className="mb-2 text-lg font-bold text-white md:mb-3 md:text-xl">
                    🏁 Race Friends on ANY Puzzle!
                  </h3>
                  <p className="mb-3 text-sm text-white/80 md:mb-4 md:text-base">
                    Found the perfect puzzle? Scan any Sudoku from books,
                    newspapers, or websites and challenge your friends to solve
                    the same puzzle. See who can solve it fastest! 🚀
                  </p>
                  <div className="flex flex-col items-center rounded-xl bg-white/20 p-4 backdrop-blur-sm md:flex-row md:justify-between md:p-6">
                    <div className="mb-4 text-center md:mb-0 md:text-left">
                      <div className="mb-2 text-lg font-bold text-white md:text-xl">
                        📸 Import & Share Challenge
                      </div>
                      <div className="text-sm text-white/70 md:text-base">
                        Perfect for book puzzles, newspaper challenges, or that
                        impossible puzzle you found online
                      </div>
                    </div>
                    <Link
                      href="/import"
                      className="inline-flex items-center justify-center rounded-full bg-white/20 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/30 md:px-8 md:py-4 md:text-base"
                    >
                      <Camera className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                      Start Import Challenge
                    </Link>
                  </div>
                </div>

                {/* Friends Racing - Single column */}
                <div className="mb-4 rounded-2xl bg-white/8 p-4 backdrop-blur-sm md:mb-6 md:p-6">
                  <h3 className="mb-2 text-lg font-bold text-white md:mb-3 md:text-xl">
                    👥 Team Racing
                  </h3>
                  <p className="mb-3 text-sm text-white/80 md:mb-4 md:text-base">
                    Race against{' '}
                    {friendsList?.length
                      ? friendsList.slice(0, 3).join(', ')
                      : 'your racing team'}{' '}
                    and climb the leaderboard!
                  </p>
                  <button
                    onClick={() => handleTabChange(Tab.FRIENDS)}
                    className="inline-flex cursor-pointer items-center justify-center rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/30 md:px-6 md:py-3 md:text-base"
                  >
                    <Users className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    View Racing Teams
                  </button>
                </div>
              </div>
            </div>

            {/* Racing track decoration */}
            <div className="absolute right-0 bottom-0 left-0 h-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400"></div>
          </div>

          {/* Premium Features Section */}
          <PremiumFeatures
            features={PREMIUM_FEATURES}
            title="🏁 Premium Features"
            subtitle="Unlock the full Sudoku Race experience"
          />

          {/* Bottom padding to ensure content doesn't get hidden behind footer */}
          <div className="pb-24"></div>
        </div>
      ) : (
        <div className="pt-safe min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="container mx-auto max-w-4xl px-6 pb-24">
            <div className="flex justify-center">
              <ActivityWidget sessions={sessions || []} />
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
              />
            )}
          </div>
        </div>
      )}
      <Footer isCapacitor={isCapacitor}>
        <button
          onClick={() => handleTabChange(Tab.START_PUZZLE)}
          className={`group inline-flex cursor-pointer flex-col items-center justify-center px-0 transition-colors duration-200 active:opacity-70 ${tabBackground(Tab.START_PUZZLE)}`}
        >
          <Zap className="text-theme-primary dark:text-theme-primary-light mb-1 h-6 w-6" />
          <span className="text-center text-xs font-medium">Start Race</span>
        </button>
        <button
          onClick={() => handleTabChange(Tab.MY_PUZZLES)}
          className={`group inline-flex cursor-pointer flex-col items-center justify-center px-0 transition-colors duration-200 active:opacity-70 ${tabBackground(Tab.MY_PUZZLES)}`}
        >
          <Award className="text-theme-primary dark:text-theme-primary-light mb-1 h-6 w-6" />
          <span className="text-center text-xs font-medium">My Puzzles</span>
        </button>
        <button
          onClick={() => handleTabChange(Tab.FRIENDS)}
          className={`group inline-flex cursor-pointer flex-col items-center justify-center px-0 transition-colors duration-200 active:opacity-70 ${tabBackground(Tab.FRIENDS)}`}
        >
          <Users className="text-theme-primary dark:text-theme-primary-light mb-1 h-6 w-6" />
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
