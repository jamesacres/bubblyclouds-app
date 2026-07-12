'use client';
import { useRouter } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import CollectionCover from '@bubblyclouds-app/unblockrace/components/CollectionCover';
import { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { useSessions } from '@bubblyclouds-app/template/providers/SessionsProvider';
import { ServerStateResult } from '@bubblyclouds-app/types/serverTypes';
import { UnblockCollectionPuzzle } from '@bubblyclouds-app/unblockrace/types/serverTypes';
import {
  GameState,
  ServerState,
} from '@bubblyclouds-app/unblockrace/types/state';
import { useParties } from '@bubblyclouds-app/template/hooks/useParties';
import { useCollection } from '@bubblyclouds-app/unblockrace/providers/CollectionProvider';
import IntegratedSessionRow from '@bubblyclouds-app/template/components/IntegratedSessionRow';
import { getDifficultyDisplay } from '@bubblyclouds-app/games/helpers/getDifficultyDisplay';
import SimpleBoard from '@bubblyclouds-app/unblockrace/components/SimpleBoard';
import { calculateCompletionPercentageFromState } from '@bubblyclouds-app/unblockrace/helpers/calculateCompletionPercentage';
import { isPuzzleCheated } from '@bubblyclouds-app/unblockrace/helpers/cheatDetection';
import { movesDisplayFromState } from '@bubblyclouds-app/unblockrace/helpers/calculateStatsDisplay';
import { starRatingFromState } from '@bubblyclouds-app/unblockrace/helpers/starRating';
import { lockedCollectionIndexes } from '@bubblyclouds-app/unblockrace/helpers/collectionLocks';
import { buildPuzzleUrlFromState } from '@bubblyclouds-app/unblockrace/helpers/buildPuzzleUrl';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';
import { RevenueCatContext } from '@bubblyclouds-app/template/providers/RevenueCatProvider';
import { APP_CONFIG } from '../../../app.config.js';

const SimpleStateWrapper = ({ state }: { state: ServerState }) => (
  <SimpleBoard state={state} />
);

export default function CollectionPage() {
  const router = useRouter();
  const context = useContext(UserContext);
  const { user, showLoginModal } = context || {};
  const {
    collectionData,
    isLoading: collectionLoading,
    error: collectionError,
    fetchCollectionData,
  } = useCollection();
  const {
    sessions,
    isLoading: sessionsLoading,
    refetchSessions,
    lazyLoadFriendSessions,
  } = useSessions<GameState>();
  const { parties } = useParties();
  const { isSubscribed, subscribeModal } = useContext(RevenueCatContext) || {};

  // Scroll to top functionality
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentMonth = new Date(new Date().toISOString()).toLocaleString(
    'en-US',
    {
      month: 'long',
      timeZone: 'UTC',
    }
  );

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        return;
      }

      // Fetch collection data and sessions
      await fetchCollectionData();
      await refetchSessions();
    };

    loadData();
  }, [user, fetchCollectionData, refetchSessions]);

  // Fetch friend sessions when parties are available
  useEffect(() => {
    if (parties && parties.length > 0) {
      lazyLoadFriendSessions(parties);
    }
  }, [parties, lazyLoadFriendSessions]);

  const getPuzzleSession = useCallback(
    (puzzle: { initial: string }) => {
      if (!sessions) return null;

      // The board string is the puzzle id (SPEC.md §4), so the sessionId is
      // the app prefix plus the initial board string
      const expectedSessionId = `${APP_CONFIG.app}-${puzzle.initial}`;

      return sessions.find(
        (session) => session.sessionId === expectedSessionId
      );
    },
    [sessions]
  );

  // Helper to convert collection puzzle to mock session for IntegratedSessionRow
  const createMockSessionFromPuzzle = useCallback(
    (puzzle: UnblockCollectionPuzzle, index: number) => {
      const session = getPuzzleSession(puzzle);

      // If we have a real session, use it
      if (session) {
        return session;
      }

      // Otherwise create a mock session with the same sessionId format
      const sessionId = `${APP_CONFIG.app}-${puzzle.initial}`;
      const mockSession = {
        sessionId,
        state: {
          initial: puzzle.initial,
          final: puzzle.final,
          answerStack: [puzzle.initial],
          metadata: {
            difficulty: puzzle.difficulty,
            movesRequired: String(puzzle.movesRequired),
            unblockCollectionPuzzleId: `${collectionData?.unblockCollectionId || 'unknown'}-puzzle-${index}`,
          },
        } as ServerState,
        updatedAt: new Date(),
      };

      return mockSession;
    },
    [collectionData?.unblockCollectionId, getPuzzleSession]
  );

  // Create mock sessions when collection data and sessions are available
  const mockSessions = useMemo<{
    [key: number]: ServerStateResult<ServerState>;
  }>(() => {
    if (!collectionData?.puzzles) return {};

    const newMockSessions: {
      [key: number]: ServerStateResult<ServerState>;
    } = {};

    collectionData.puzzles.forEach((puzzle, i) => {
      newMockSessions[i] = createMockSessionFromPuzzle(puzzle, i);
    });

    return newMockSessions;
  }, [collectionData, createMockSessionFromPuzzle]);

  const lockedIndexes = useMemo(
    () =>
      collectionData?.puzzles
        ? lockedCollectionIndexes(collectionData.puzzles)
        : new Set<number>(),
    [collectionData]
  );

  const isLoading = collectionLoading || sessionsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-t-theme-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-stone-200 dark:border-zinc-700"></div>
          <p className="text-stone-500 dark:text-zinc-400">
            {collectionLoading && sessionsLoading
              ? 'Loading puzzle collection...'
              : collectionLoading
                ? 'Loading puzzles...'
                : 'Loading your progress...'}
          </p>
        </div>
      </div>
    );
  }

  if (collectionError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <p className="text-stone-500 dark:text-zinc-400">{collectionError}</p>
          <button
            onClick={() => fetchCollectionData()}
            className="bg-theme-primary hover:bg-theme-primary-dark mr-2 mt-4 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-200"
          >
            Try again
          </button>
          <button
            onClick={() => router.push('/')}
            className="mt-4 cursor-pointer rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition-colors duration-200 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (!collectionData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          {!user ? (
            <>
              <p className="text-stone-500 dark:text-zinc-400">
                Sign in to access the puzzle collection.
              </p>
              <button
                onClick={() =>
                  showLoginModal?.(undefined, LoginContext.PUZZLE_BOOK)
                }
                className="bg-theme-primary hover:bg-theme-primary-dark mt-4 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-200"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              <p className="text-stone-500 dark:text-zinc-400">
                No puzzle collection data available.
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-theme-primary hover:bg-theme-primary-dark mt-4 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-200"
              >
                Back to home
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const collectionSessions =
    sessions?.filter((s) =>
      collectionData.puzzles.some((p) => p.initial === s.state.initial)
    ) || [];

  return (
    <>
      <div className="min-h-screen bg-stone-50 dark:bg-zinc-900">
        {/* Header */}
        <div className="pt-safe bg-zinc-900 px-6 dark:bg-zinc-950">
          <div className="container mx-auto max-w-6xl py-6 md:py-8">
            <div className="flex flex-col items-center gap-4 text-white md:flex-row md:items-center md:gap-6">
              <div className="shrink-0">
                <CollectionCover month={currentMonth} size="medium" />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold md:text-3xl">
                  {currentMonth} puzzle collection
                </h1>
                <p className="mt-1 text-white/70 md:text-base">
                  {collectionData.puzzles.length} puzzles from quick escapes to
                  expert gridlock
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                  <div className="rounded-lg border border-white/20 bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
                    {collectionSessions.filter((s) => s.state.completed).length}{' '}
                    completed
                  </div>
                  <div className="rounded-lg border border-white/20 bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
                    {
                      collectionSessions.filter(
                        (s) =>
                          !s.state.completed && s.state.answerStack.length > 1
                      ).length
                    }{' '}
                    in progress
                  </div>
                  {!isSubscribed && (
                    <div className="rounded-lg border border-amber-300/40 bg-amber-400/15 px-3 py-1.5 text-sm font-medium text-amber-100 backdrop-blur-sm">
                      {collectionData.puzzles.length - lockedIndexes.size} of{' '}
                      {collectionData.puzzles.length} free this month — Plus
                      unlocks all
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto max-w-6xl px-6 py-6">
          {/* Difficulty Jump Buttons */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400 dark:text-zinc-500">
              Jump to difficulty
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  difficulty: 'simple',
                  label: 'Beginner',
                  color: 'bg-green-500 text-white',
                },
                {
                  difficulty: 'easy',
                  label: 'Challenging',
                  color: 'bg-yellow-500 text-white',
                },
                {
                  difficulty: 'intermediate',
                  label: 'Hard',
                  color: 'bg-orange-500 text-white',
                },
                {
                  difficulty: 'expert',
                  label: 'Expert',
                  color: 'bg-red-500 text-white',
                },
              ].map((item) => {
                const jumpToDifficulty = () => {
                  const firstMatchingPuzzleIndex =
                    collectionData?.puzzles.findIndex(
                      (puzzle) => puzzle.difficulty === item.difficulty
                    );

                  if (
                    firstMatchingPuzzleIndex !== -1 &&
                    firstMatchingPuzzleIndex !== undefined
                  ) {
                    const element = document.getElementById(
                      `puzzle-${firstMatchingPuzzleIndex}`
                    );
                    if (element) {
                      element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    }
                  }
                };

                const hasThisDifficulty = collectionData?.puzzles.some(
                  (puzzle) => puzzle.difficulty === item.difficulty
                );

                if (!hasThisDifficulty) return null;

                return (
                  <button
                    key={item.difficulty}
                    onClick={jumpToDifficulty}
                    className={`${item.color} cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold opacity-90 transition-all duration-200 hover:opacity-100 active:scale-95`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Puzzles Grid */}
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {collectionData.puzzles.map((puzzle, index) => {
              const mockSession = mockSessions[index];

              // Don't render if session isn't ready yet
              if (!mockSession) {
                return (
                  <div
                    key={index}
                    id={`puzzle-${index}`}
                    className="h-32 animate-pulse rounded-lg bg-gray-200"
                  >
                    {/* Loading placeholder */}
                  </div>
                );
              }

              const isLocked = !isSubscribed && lockedIndexes.has(index);
              const navigateToPuzzle = () =>
                router.push(buildPuzzleUrlFromState(mockSession.state));

              return (
                <div key={index} id={`puzzle-${index}`}>
                  <IntegratedSessionRow<ServerState, UnblockCollectionPuzzle>
                    session={mockSession}
                    bookPuzzle={{
                      puzzle,
                      index,
                      sudokuBookId:
                        collectionData?.unblockCollectionId || 'unknown',
                    }}
                    getDifficultyDisplay={getDifficultyDisplay}
                    SimpleState={SimpleStateWrapper}
                    calculateCompletionPercentageFromState={
                      calculateCompletionPercentageFromState
                    }
                    isPuzzleCheated={isPuzzleCheated}
                    buildPuzzleUrlFromState={buildPuzzleUrlFromState}
                    getMovesDisplay={movesDisplayFromState}
                    getStarRating={starRatingFromState}
                    isLocked={isLocked}
                    onLockedClick={() =>
                      subscribeModal?.showModalIfRequired(
                        navigateToPuzzle,
                        () => {},
                        SubscriptionContext.COLLECTION_LOCKED
                      )
                    }
                  />
                </div>
              );
            })}
          </ul>
        </div>

        <div className="pb-24"></div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            right: '24px',
            bottom: 'max(20px, calc(var(--ion-safe-area-bottom, 0px) + 20px))',
          }}
          className="bg-theme-primary hover:bg-theme-primary-dark dark:bg-theme-primary-light dark:hover:bg-theme-primary z-50 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-110 active:scale-95"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
