'use client';
import { useRouter } from 'next/navigation';
import { ArrowUp } from 'react-feather';
import BookCover from '@sudoku-web/sudoku/components/BookCover';
import { useContext, useEffect, useState, useCallback } from 'react';
import {
  UserContext,
  UserContextInterface,
} from '@sudoku-web/auth/providers/AuthProvider';
import { useOnline } from '@sudoku-web/template/hooks/online';
import { useSessions } from '@sudoku-web/template/providers/SessionsProvider';
import {
  SudokuBookPuzzle,
  ServerStateResult,
} from '@sudoku-web/types/serverTypes';
import {
  puzzleTextToPuzzle,
  puzzleToPuzzleText,
} from '@sudoku-web/sudoku/helpers/puzzleTextToPuzzle';
import { GameState, ServerState } from '@sudoku-web/sudoku/types/state';
import { useParties } from '@sudoku-web/template/hooks/useParties';
import { useBook } from '@sudoku-web/sudoku/providers/BookProvider';
import IntegratedSessionRow from '@sudoku-web/template/components/IntegratedSessionRow';
import { sha256 } from '@sudoku-web/template/helpers/sha256';

export default function BookPage() {
  const router = useRouter();
  const context = useContext(UserContext) as UserContextInterface | undefined;
  const { user, loginRedirect } = context || {};
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
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">{bookError}</p>
          {isOnline && (
            <button
              onClick={() => fetchBookData()}
              className="mt-4 mr-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => router.push('/')}
            className="mt-4 rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!bookData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No puzzle book data available.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <div className="pt-safe bg-gradient-to-r from-blue-600 to-purple-600 px-6">
          <div className="container mx-auto max-w-6xl py-6 md:py-8">
            <div className="flex flex-col items-center text-white md:flex-row md:items-center">
              <div className="mb-4 md:mr-6 md:mb-0">
                <BookCover month={currentMonth} size="large" />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold md:text-4xl">
                  {currentMonth} Puzzle Book
                </h1>
                <p className="text-white/80 md:text-lg">
                  {bookData.puzzles.length} technique-focused puzzles to
                  challenge your skills
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                  {/* Progress Stats */}
                  <div className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
                    📊{' '}
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
                  <div className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
                    🎯{' '}
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
        <div className="container mx-auto max-w-6xl px-6 py-8">
          {/* Difficulty Jump Buttons */}
          <div className="mb-8">
            <h3 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-white">
              Jump to Difficulty
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { difficulty: '1-very-easy', label: '🟢 Very Easy' },
                { difficulty: '2-easy', label: '🟢 Easy' },
                {
                  difficulty: '3-moderately-easy',
                  label: '🟡 Moderately Easy',
                },
                { difficulty: '4-moderate', label: '🟡 Moderate' },
                {
                  difficulty: '5-moderately-hard',
                  label: '🟠 Moderately Hard',
                },
                { difficulty: '6-hard', label: '🔴 Hard' },
                { difficulty: '7-vicious', label: '🔥 Vicious' },
                { difficulty: '8-fiendish', label: '🔥 Fiendish' },
                { difficulty: '9-devilish', label: '🔥 Devilish' },
                { difficulty: '10-hell', label: '🔥🔥 Hell' },
                { difficulty: '11-beyond-hell', label: '🔥🔥🔥 Beyond Hell' },
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

                // Check if this difficulty exists in the book
                const hasThisDifficulty = bookData?.puzzles.some(
                  (puzzle) => puzzle.difficulty.coach === item.difficulty
                );

                if (!hasThisDifficulty) return null;

                return (
                  <button
                    key={item.difficulty}
                    onClick={jumpToDifficulty}
                    className="cursor-pointer rounded-full bg-white/20 px-3 py-2 text-xs font-medium text-gray-800 backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/30 dark:text-gray-200"
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
                  <IntegratedSessionRow
                    session={mockSession}
                    bookPuzzle={{
                      puzzle,
                      index,
                      sudokuBookId: bookData?.sudokuBookId || 'unknown',
                    }}
                  />
                </div>
              );
            })}
          </ul>
        </div>

        <div className="pb-24"></div>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="bg-theme-primary hover:bg-theme-primary-dark dark:bg-theme-primary-light dark:hover:bg-theme-primary fixed right-6 bottom-20 z-50 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-110 active:scale-95"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}
      </div>
    </>
  );
}
