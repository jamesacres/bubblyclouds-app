'use client';
import { useRouter } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import BookCover from '@bubblyclouds-app/sudoku/components/BookCover';
import { useContext, useEffect, useState, useCallback } from 'react';
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
import { buildPuzzleUrlFromState } from '@bubblyclouds-app/sudoku/helpers/buildPuzzleUrl';

const SimpleStateWrapper = ({ state }: { state: ServerState }) => (
  <SimpleSudoku state={state} />
);

export default function BookPage() {
  const router = useRouter();
  const context = useContext(UserContext);
  const { user, loginRedirect, showLoginModal } = context || {};
  const {
    bookData,
    isLoading: bookLoading,
    error: bookError,
    fetchBookData,
  } = useBook();
  const {
    sessions,
    isLoading: sessionsLoading,
    fetchSessions,
    lazyLoadFriendSessions,
  } = useSessions<GameState>();
  const { parties } = useParties();
  const { isOnline } = useOnline();

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

      // Fetch book data and sessions
      await fetchBookData();
      await fetchSessions();
    };

    loadData();
  }, [user, loginRedirect, router, fetchBookData, fetchSessions]);

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

  const isLoading = bookLoading || sessionsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-t-theme-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-stone-200 dark:border-zinc-700"></div>
          <p className="text-stone-500 dark:text-zinc-400">
            {bookLoading && sessionsLoading
              ? 'Loading puzzle book...'
              : bookLoading
                ? 'Loading puzzles...'
                : 'Loading your progress...'}
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
              className="bg-theme-primary hover:bg-theme-primary-dark mr-2 mt-4 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-200"
            >
              Try again
            </button>
          )}
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

  if (!bookData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          {!user ? (
            <>
              <p className="text-stone-500 dark:text-zinc-400">
                Sign in to access the puzzle book.
              </p>
              <button
                onClick={() => showLoginModal?.()}
                className="bg-theme-primary hover:bg-theme-primary-dark mt-4 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-200"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              <p className="text-stone-500 dark:text-zinc-400">
                No puzzle book data available.
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
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold md:text-3xl">
                  {currentMonth} puzzle book
                </h1>
                <p className="mt-1 text-white/70 md:text-base">
                  {bookData.puzzles.length} technique-focused puzzles
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                  <div className="rounded-lg border border-white/20 bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
                    {
                      (
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
                      ).length
                    }{' '}
                    completed
                  </div>
                  <div className="rounded-lg border border-white/20 bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
                    {
                      (
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
                      ).length
                    }{' '}
                    in progress
                  </div>
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
                  difficulty: '1-very-easy',
                  label: 'Very Easy',
                  color: 'bg-green-400 text-white',
                },
                {
                  difficulty: '2-easy',
                  label: 'Easy',
                  color: 'bg-green-500 text-white',
                },
                {
                  difficulty: '3-moderately-easy',
                  label: 'Moderately Easy',
                  color: 'bg-lime-600 text-white',
                },
                {
                  difficulty: '4-moderate',
                  label: 'Moderate',
                  color: 'bg-yellow-600 text-white',
                },
                {
                  difficulty: '5-moderately-hard',
                  label: 'Moderately Hard',
                  color: 'bg-orange-500 text-white',
                },
                {
                  difficulty: '6-hard',
                  label: 'Hard',
                  color: 'bg-red-500 text-white',
                },
                {
                  difficulty: '7-vicious',
                  label: 'Vicious',
                  color: 'bg-red-600 text-white',
                },
                {
                  difficulty: '8-fiendish',
                  label: 'Fiendish',
                  color: 'bg-red-700 text-white',
                },
                {
                  difficulty: '9-devilish',
                  label: 'Devilish',
                  color: 'bg-red-800 text-white',
                },
                {
                  difficulty: '10-hell',
                  label: 'Hell',
                  color: 'bg-red-900 text-white',
                },
                {
                  difficulty: '11-beyond-hell',
                  label: 'Beyond Hell',
                  color: 'bg-black text-white',
                },
              ].map((item) => {
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
                    getDifficultyDisplay={getDifficultyDisplay}
                    getTechniquesDisplay={getTechniquesDisplay}
                    SimpleState={SimpleStateWrapper}
                    calculateCompletionPercentageFromState={
                      calculateCompletionPercentageFromState
                    }
                    isPuzzleCheated={isPuzzleCheated}
                    buildPuzzleUrlFromState={buildPuzzleUrlFromState}
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
