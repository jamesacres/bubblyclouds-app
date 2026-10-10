'use client';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowUp, Sparkles } from 'lucide-react';
import BookCover from '@bubblyclouds-app/sudoku/components/BookCover';
import { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { useOnline } from '@bubblyclouds-app/template/hooks/online';
import { useSessions } from '@bubblyclouds-app/template/providers/SessionsProvider';
import { ServerStateResult } from '@bubblyclouds-app/types/serverTypes';
import { SudokuBookPuzzle } from '@bubblyclouds-app/sudoku/types/serverTypes';
import {
  puzzleTextToPuzzle,
  puzzleToPuzzleText,
} from '@bubblyclouds-app/sudoku/helpers/puzzleTextToPuzzle';
import { GameState, ServerState } from '@bubblyclouds-app/sudoku/types/state';
import { useParties } from '@bubblyclouds-app/template/hooks/useParties';
import { useBook } from '@bubblyclouds-app/sudoku/providers/BookProvider';
import IntegratedSessionRow from '@bubblyclouds-app/template/components/IntegratedSessionRow';
import { getDifficultyDisplay } from '@bubblyclouds-app/games/helpers/getDifficultyDisplay';
import {
  getTechniquesDisplay,
  Techniques,
} from '@bubblyclouds-app/games/helpers/getTechniquesDisplay';
import { sha256 } from '@bubblyclouds-app/template/helpers/sha256';
import SimpleSudoku from '@bubblyclouds-app/sudoku/components/SimpleSudoku';
import { calculateCompletionPercentageFromState } from '@bubblyclouds-app/sudoku/helpers/calculateCompletionPercentage';
import { isPuzzleCheated } from '@bubblyclouds-app/sudoku/helpers/cheatDetection';
import { lockedBookIndexes } from '@bubblyclouds-app/sudoku/helpers/bookLocks';
import { buildPuzzleUrlFromState } from '@bubblyclouds-app/sudoku/helpers/buildPuzzleUrl';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';
import { RevenueCatContext } from '@bubblyclouds-app/template/providers/RevenueCatProvider';
import { useCurrentMonth } from '../../hooks/useCurrentMonth';

const SimpleStateWrapper = ({ state }: { state: ServerState }) => (
  <SimpleSudoku state={state} />
);

export default function BookPage() {
  const { t } = useTranslation('app');
  const { t: tGames } = useTranslation('games');
  const { englishMonth: currentMonth, localizedMonth } = useCurrentMonth();
  const router = useRouter();
  const context = useContext(UserContext);
  const { user, showLoginModal } = context || {};
  const {
    bookData,
    isLoading: bookLoading,
    error: bookError,
    fetchBookData,
  } = useBook();
  const {
    sessions,
    isLoading: sessionsLoading,
    refetchSessions,
    lazyLoadFriendSessions,
  } = useSessions<GameState>();
  const { parties } = useParties();
  const { isOnline } = useOnline();
  const { isSubscribed, subscribeModal } = useContext(RevenueCatContext) || {};

  // State for mock sessions
  const [mockSessions, setMockSessions] = useState<{
    [key: number]: ServerStateResult<ServerState>;
  }>({});

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

  const difficultyDisplay = useCallback(
    (difficulty: string) => getDifficultyDisplay(difficulty, tGames),
    [tGames]
  );

  const techniquesDisplay = useCallback(
    (techniques?: Techniques) => getTechniquesDisplay(techniques, tGames),
    [tGames]
  );

  const jumpToDifficultyItems = [
    {
      difficulty: '1-very-easy',
      label: t('book.difficulty.veryEasy'),
      color: 'bg-green-400 text-white',
    },
    {
      difficulty: '2-easy',
      label: t('book.difficulty.easy'),
      color: 'bg-green-500 text-white',
    },
    {
      difficulty: '3-moderately-easy',
      label: t('book.difficulty.moderatelyEasy'),
      color: 'bg-lime-600 text-white',
    },
    {
      difficulty: '4-moderate',
      label: t('book.difficulty.moderate'),
      color: 'bg-yellow-600 text-white',
    },
    {
      difficulty: '5-moderately-hard',
      label: t('book.difficulty.moderatelyHard'),
      color: 'bg-orange-500 text-white',
    },
    {
      difficulty: '6-hard',
      label: t('book.difficulty.hard'),
      color: 'bg-red-500 text-white',
    },
    {
      difficulty: '7-vicious',
      label: t('book.difficulty.vicious'),
      color: 'bg-red-600 text-white',
    },
    {
      difficulty: '8-fiendish',
      label: t('book.difficulty.fiendish'),
      color: 'bg-red-700 text-white',
    },
    {
      difficulty: '9-devilish',
      label: t('book.difficulty.devilish'),
      color: 'bg-red-800 text-white',
    },
    {
      difficulty: '10-hell',
      label: t('book.difficulty.hell'),
      color: 'bg-red-900 text-white',
    },
    {
      difficulty: '11-beyond-hell',
      label: t('book.difficulty.beyondHell'),
      color: 'bg-black text-white',
    },
  ];

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        return;
      }

      // Fetch book data and sessions
      await fetchBookData();
      await refetchSessions();
    };

    loadData();
  }, [user, fetchBookData, refetchSessions]);

  // Fetch friend sessions when parties are available
  useEffect(() => {
    if (parties && parties.length > 0) {
      lazyLoadFriendSessions(parties);
    }
  }, [parties, lazyLoadFriendSessions]);

  const getPuzzleSession = useCallback(
    async (puzzle: { initial: string; final: string }) => {
      if (!sessions) return null;

      // Generate the expected sessionId using sha256 of the initial puzzle
      const expectedSessionId = `sudoku-${await sha256(puzzle.initial)}`;

      return sessions.find(
        (session) => session.sessionId === expectedSessionId
      );
    },
    [sessions]
  );

  // Helper to convert book puzzle to mock session for IntegratedSessionRow
  const createMockSessionFromPuzzle = useCallback(
    async (puzzle: SudokuBookPuzzle, index: number) => {
      const session = await getPuzzleSession(puzzle);

      // If we have a real session, use it
      if (session) {
        return session;
      }

      // Otherwise create a mock session with the same sessionId format
      const sessionId = `sudoku-${await sha256(puzzle.initial)}`;
      const mockSession = {
        sessionId,
        state: {
          initial: puzzleTextToPuzzle(puzzle.initial),
          final: puzzleTextToPuzzle(puzzle.final),
          answerStack: [puzzleTextToPuzzle(puzzle.initial)],
          metadata: {
            difficulty: puzzle.difficulty.coach,
            sudokuBookPuzzleId: `${bookData?.sudokuBookId || 'unknown'}-puzzle-${index}`,
          },
        } as ServerState,
        updatedAt: new Date(),
      };

      return mockSession;
    },
    [bookData?.sudokuBookId, getPuzzleSession]
  );

  // Create mock sessions when book data and sessions are available
  useEffect(() => {
    const createAllMockSessions = async () => {
      if (!bookData?.puzzles) return;

      const newMockSessions: { [key: number]: any } = {};

      for (let i = 0; i < bookData.puzzles.length; i++) {
        const puzzle = bookData.puzzles[i];
        newMockSessions[i] = await createMockSessionFromPuzzle(puzzle, i);
      }

      setMockSessions(newMockSessions);
    };

    createAllMockSessions();
  }, [bookData, createMockSessionFromPuzzle]);

  const lockedIndexes = useMemo(
    () =>
      bookData?.puzzles
        ? lockedBookIndexes(bookData.puzzles)
        : new Set<number>(),
    [bookData]
  );

  const isLoading = bookLoading || sessionsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-t-theme-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-stone-200 dark:border-zinc-700"></div>
          <p className="text-stone-500 dark:text-zinc-400">
            {bookLoading && sessionsLoading
              ? t('book.loading.book')
              : bookLoading
                ? t('book.loading.puzzles')
                : t('book.loading.progress')}
          </p>
        </div>
      </div>
    );
  }

  if (bookError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <p className="text-stone-500 dark:text-zinc-400">{bookError}</p>
          {isOnline && (
            <button
              onClick={() => fetchBookData()}
              className="bg-theme-primary hover:bg-theme-primary-dark me-2 mt-4 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-200"
            >
              {t('book.tryAgain')}
            </button>
          )}
          <button
            onClick={() => router.push('/')}
            className="mt-4 cursor-pointer rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition-colors duration-200 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {t('book.backHome')}
          </button>
        </div>
      </div>
    );
  }

  if (!bookData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          {!user ? (
            <>
              <p className="text-stone-500 dark:text-zinc-400">
                {t('book.signInPrompt')}
              </p>
              <button
                onClick={() =>
                  showLoginModal?.(undefined, LoginContext.PUZZLE_BOOK)
                }
                className="bg-theme-primary hover:bg-theme-primary-dark mt-4 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-200"
              >
                {t('book.signIn')}
              </button>
            </>
          ) : (
            <>
              <p className="text-stone-500 dark:text-zinc-400">
                {t('book.noData')}
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-theme-primary hover:bg-theme-primary-dark mt-4 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-200"
              >
                {t('book.backHome')}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-stone-50 dark:bg-zinc-900">
        {/* Header */}
        <div className="pt-safe bg-zinc-900 px-6 dark:bg-zinc-950">
          <div className="container mx-auto max-w-6xl py-6 md:py-8">
            <div className="flex flex-col items-center gap-4 text-white md:flex-row md:items-center md:gap-6">
              <div className="shrink-0">
                <BookCover month={currentMonth} size="medium" />
              </div>
              <div className="text-center md:text-start">
                <h1 className="text-2xl font-bold md:text-3xl">
                  {t('book.title', { month: localizedMonth })}
                </h1>
                <p className="mt-1 text-white/70 md:text-base">
                  {t('book.puzzleCount', { count: bookData.puzzles.length })}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                  <div className="rounded-lg border border-white/20 bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
                    {t('book.completed', {
                      count: (
                        sessions
                          ?.filter((s) =>
                            bookData.puzzles.some(
                              (p) =>
                                puzzleToPuzzleText(s.state.initial) ===
                                puzzleToPuzzleText(
                                  puzzleTextToPuzzle(p.initial)
                                )
                            )
                          )
                          .filter((s) => s.state.completed) || []
                      ).length,
                    })}
                  </div>
                  <div className="rounded-lg border border-white/20 bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
                    {t('book.inProgress', {
                      count: (
                        sessions
                          ?.filter((s) =>
                            bookData.puzzles.some(
                              (p) =>
                                puzzleToPuzzleText(s.state.initial) ===
                                puzzleToPuzzleText(
                                  puzzleTextToPuzzle(p.initial)
                                )
                            )
                          )
                          .filter(
                            (s) =>
                              !s.state.completed &&
                              s.state.answerStack.length > 1
                          ) || []
                      ).length,
                    })}
                  </div>
                  {!isSubscribed && (
                    <button
                      type="button"
                      onClick={() =>
                        subscribeModal?.showModalIfRequired(
                          () => {},
                          () => {},
                          SubscriptionContext.COLLECTION_LOCKED
                        )
                      }
                      className="group inline-flex cursor-pointer items-center gap-2 rounded-lg border border-amber-300/50 bg-gradient-to-r from-amber-400/20 to-amber-500/10 px-3 py-1.5 text-sm font-semibold text-amber-100 backdrop-blur-sm transition-all duration-200 hover:from-amber-400/30 hover:to-amber-500/20 active:scale-[0.98]"
                    >
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('book.unlockWithPlus')}
                      <span className="opacity-60 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5">
                        →
                      </span>
                    </button>
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
              {t('book.jumpToDifficulty')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {jumpToDifficultyItems.map((item) => {
                const jumpToDifficulty = () => {
                  const firstMatchingPuzzleIndex = bookData?.puzzles.findIndex(
                    (puzzle) => puzzle.difficulty.coach === item.difficulty
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

                const hasThisDifficulty = bookData?.puzzles.some(
                  (puzzle) => puzzle.difficulty.coach === item.difficulty
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
            {bookData.puzzles.map((puzzle, index) => {
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
                  <IntegratedSessionRow<
                    ServerState,
                    SudokuBookPuzzle,
                    Techniques
                  >
                    session={mockSession}
                    bookPuzzle={{
                      puzzle,
                      index,
                      sudokuBookId: bookData?.sudokuBookId || 'unknown',
                    }}
                    getDifficultyDisplay={difficultyDisplay}
                    getTechniquesDisplay={techniquesDisplay}
                    SimpleState={SimpleStateWrapper}
                    calculateCompletionPercentageFromState={
                      calculateCompletionPercentageFromState
                    }
                    isPuzzleCheated={isPuzzleCheated}
                    buildPuzzleUrlFromState={buildPuzzleUrlFromState}
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
            insetInlineEnd: '24px',
            bottom: 'max(20px, calc(var(--ion-safe-area-bottom, 0px) + 20px))',
          }}
          className="bg-theme-primary hover:bg-theme-primary-dark dark:bg-theme-primary-light dark:hover:bg-theme-primary z-50 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-110 active:scale-95"
          aria-label={t('book.scrollToTop')}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
