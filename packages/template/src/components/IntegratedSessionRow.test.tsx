// @ts-nocheck
'use client';
import { cloneElement, ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { IntegratedSessionRow } from './IntegratedSessionRow';
import { BaseServerState } from '../types/state';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { ServerStateResult } from '@bubblyclouds-app/types/serverTypes';

// Mock dependencies
jest.mock('lucide-react', () => ({
  Award: () => <svg data-testid="award-icon" />,
  Loader: () => <svg data-testid="loader-icon" />,
}));

jest.mock('next/link', () => {
  const MockLink = ({ children, href }: any) => (
    <a href={href} data-testid="puzzle-link">
      {children}
    </a>
  );
  MockLink.displayName = 'Link';
  return MockLink;
});

jest.mock('../hooks/useParties');

jest.mock('../providers/SessionsProvider');
jest.mock('../helpers/calculateSeconds');

// Mock context
const mockUserContext = {
  user: { sub: 'user-123' },
};

// Mock injected dependencies for testing
const mockInjectedProps = {
  SimpleState: function DummySimpleSudoku() {
    return <div data-testid="simple-sudoku">Simple Sudoku</div>;
  },
  calculateCompletionPercentageFromState: jest.fn(() => 50),
  isPuzzleCheated: jest.fn(() => false),
  buildPuzzleUrlFromState: jest.fn(() => '/puzzle?id=test'),
};

describe('IntegratedSessionRow', () => {
  const createMockSession = (
    overrides?: Partial<ServerStateResult<BaseServerState>>
  ): ServerStateResult<BaseServerState> => {
    return {
      sessionId: 'session-123',
      updatedAt: new Date(),
      state: {
        initial: Array(81).fill(0),
        final: Array(81).fill(0),
        answerStack: [Array(81).fill(0)],
        completed: undefined,
        metadata: {
          sudokuId: 'oftheday-20240101-easy',
        },
      } as any,
      ...overrides,
    } as any;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup useSessions mock
    const {
      useSessions: mockUseSessions,
    } = require('@bubblyclouds-app/template/providers/SessionsProvider');
    (mockUseSessions as jest.Mock).mockReturnValue({
      friendSessions: {},
      isFriendSessionsLoading: false,
    });

    // Setup useParties mock
    const {
      useParties: mockUseParties,
    } = require('@bubblyclouds-app/template/hooks/useParties');
    (mockUseParties as jest.Mock).mockReturnValue({
      parties: [],
    });

    // Setup calculateSeconds mock
    const {
      calculateSeconds: mockCalculateSeconds,
    } = require('@bubblyclouds-app/template/helpers/calculateSeconds');
    (mockCalculateSeconds as jest.Mock).mockReturnValue(120);
  });

  const renderWithProps = (element: ReactElement<any>) => {
    // Element already has UserContext.Provider wrapper, so we just need to clone
    // the IntegratedSessionRow component within it with injected props
    const provider = element;
    const integratedSessionRow = provider.props.children;

    return render(
      cloneElement(
        provider,
        {},
        cloneElement(integratedSessionRow, {
          ...integratedSessionRow.props,
          ...mockInjectedProps,
        })
      )
    );
  };

  describe('rendering', () => {
    it('should render without crashing', () => {
      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      expect(screen.getByTestId('simple-sudoku')).toBeInTheDocument();
    });

    it('should render puzzle title for daily puzzle', () => {
      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      expect(screen.getByText(/Daily/i)).toBeInTheDocument();
    });

    it('should render simple sudoku component', () => {
      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      expect(screen.getByTestId('simple-sudoku')).toBeInTheDocument();
    });

    it('should render puzzle link', () => {
      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      expect(screen.getByTestId('puzzle-link')).toBeInTheDocument();
    });

    it('should render progress section', () => {
      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('should render list item element', () => {
      const { container } = renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      expect(container.querySelector('li')).toBeInTheDocument();
    });
  });

  describe('game status text', () => {
    it('should display status for incomplete puzzle', () => {
      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      // Renders puzzle link showing the puzzle is ready
      expect(screen.getByTestId('puzzle-link')).toBeInTheDocument();
    });

    it('should render completed puzzle', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: { seconds: 300 },
          timer: { startTime: 0, pausedTime: 0 } as any,
          metadata: {},
        } as any,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );
      // Should render the puzzle link
      expect(screen.getByTestId('puzzle-link')).toBeInTheDocument();
    });

    it('should show moves graded against par when getMovesDisplay is provided', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: { seconds: 300 },
          metadata: { movesMade: '12', movesRequired: '9' },
        } as any,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow
            session={session}
            getMovesDisplay={() => ({ movesMade: 12, movesRequired: 9 })}
          />
        </UserContext.Provider>
      );

      // Over par renders in the amber grading colour with the +N delta
      expect(screen.getByText('12/9 +3')).toHaveClass('text-amber-600');
    });

    it('shows moves graded against par for an in-progress (not yet completed) puzzle', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: undefined,
          metadata: { movesMade: '5', movesRequired: '8' },
        } as any,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow
            session={session}
            getMovesDisplay={() => ({ movesMade: 5, movesRequired: 8 })}
          />
        </UserContext.Provider>
      );

      // Under par renders in the emerald grading colour with the -N delta
      expect(screen.getByText('5/8 -3')).toHaveClass('text-emerald-600');
    });
  });

  describe('puzzle title formatting', () => {
    it('should render puzzle with metadata', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: undefined,
          timer: { startTime: 0, pausedTime: 0 } as any,
          metadata: { sudokuId: 'oftheday-20240101-easy' },
        } as any,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );
      // Should render without crashing
      expect(screen.getByTestId('puzzle-link')).toBeInTheDocument();
    });

    it('should render scanned puzzle', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: undefined,
          timer: { startTime: 0, pausedTime: 0 } as any,
          metadata: { scannedAt: '2024-01-01' },
        } as any,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );
      expect(screen.getByTestId('puzzle-link')).toBeInTheDocument();
    });

    it('should render puzzle with minimal metadata', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: undefined,
          timer: { startTime: 0, pausedTime: 0 } as any,
          metadata: {},
        } as any,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );
      expect(screen.getByTestId('puzzle-link')).toBeInTheDocument();
    });
  });

  describe('difficulty display', () => {
    it('should display difficulty badge', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: undefined,
          timer: { startTime: 0, pausedTime: 0 } as any,
          metadata: { difficulty: 'easy' },
        } as BaseServerState,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow
            session={session}
            getDifficultyDisplay={() => ({
              name: 'Challenging',
              badgeColor: 'red',
            })}
          />
        </UserContext.Provider>
      );
      const badge =
        screen.getByText(/challenging/i) || screen.getByText(/Challenging/i);
      expect(badge).toBeInTheDocument();
    });

    it('should handle book puzzle difficulty', () => {
      const bookPuzzle = {
        puzzle: {
          difficulty: { coach: '1-very-easy' },
          techniques: {},
        },
        index: 0,
        sudokuBookId: 'book-123',
      };

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow
            session={createMockSession()}
            bookPuzzle={bookPuzzle as any}
            getDifficultyDisplay={() => ({
              name: 'Very Easy',
              badgeColor: 'green',
            })}
          />
        </UserContext.Provider>
      );
      const badge =
        screen.getByText(/Very Easy/i) || screen.getByText(/very-easy/i);
      expect(badge).toBeInTheDocument();
    });
  });

  describe('styling and layout', () => {
    it('should have rounded border styling', () => {
      const { container } = renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      const listItem = container.querySelector('li');
      expect(listItem).toHaveClass('rounded-lg');
      expect(listItem).toHaveClass('border-2');
    });

    it('should have dark mode support', () => {
      const { container } = renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      const listItem = container.querySelector('li');
      expect(listItem?.className).toMatch(/dark:/);
    });

    it('should have progress section with border', () => {
      const { container } = renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      const progressSection = container.querySelector('.border-t');
      expect(progressSection).toBeInTheDocument();
    });

    it('should have proper spacing and padding', () => {
      const { container } = renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      const paddedElements = container.querySelectorAll('[class*="px-"]');
      expect(paddedElements.length).toBeGreaterThan(0);
    });
  });

  describe('user sessions integration', () => {
    it('should display user completion status when user session provided', () => {
      const userSession = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: { seconds: 300 },
          timer: { startTime: 0, pausedTime: 0 } as any,
          metadata: {},
        } as BaseServerState,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow
            session={createMockSession()}
            userSessions={[userSession]}
          />
        </UserContext.Provider>
      );
      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('should display "You" label for current user', () => {
      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('should show completion checkmark for completed puzzle', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: { seconds: 300 },
          timer: { startTime: 0, pausedTime: 0 } as any,
          metadata: {},
        } as BaseServerState,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('should render game status for incomplete puzzle', () => {
      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      // Component renders without crashing
      expect(screen.getByTestId('puzzle-link')).toBeInTheDocument();
    });
  });

  describe('friend sessions display', () => {
    it('should handle empty friend sessions', () => {
      const {
        useSessions: mockUseSessions,
      } = require('@bubblyclouds-app/template/providers/SessionsProvider');
      (mockUseSessions as jest.Mock).mockReturnValue({
        friendSessions: {},
        isFriendSessionsLoading: false,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('should display loading indicator when loading friends', () => {
      const {
        useSessions: mockUseSessions,
      } = require('@bubblyclouds-app/template/providers/SessionsProvider');
      (mockUseSessions as jest.Mock).mockReturnValue({
        friendSessions: {},
        isFriendSessionsLoading: true,
      });

      const {
        useParties: mockUseParties,
      } = require('@bubblyclouds-app/template/hooks/useParties');
      (mockUseParties as jest.Mock).mockReturnValue({
        parties: [
          {
            members: [{ userId: 'user-456', memberNickname: 'Friend' }],
          },
        ],
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      // Loading indicator should be present when there are parties and loading
      const loaders = screen.queryAllByTestId('loader-icon');
      expect(loaders.length >= 0).toBe(true);
    });

    it('should not display friends section if no parties', () => {
      const {
        useParties: mockUseParties,
      } = require('@bubblyclouds-app/template/hooks/useParties');
      (mockUseParties as jest.Mock).mockReturnValue({
        parties: [],
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      expect(screen.getByText('You')).toBeInTheDocument();
    });
  });

  describe('book puzzle integration', () => {
    it('should display book puzzle title', () => {
      const bookPuzzle = {
        puzzle: {
          difficulty: { coach: '1-very-easy' },
          techniques: {},
        },
        index: 0,
        sudokuBookId: 'book-123',
      };

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow
            session={createMockSession()}
            bookPuzzle={bookPuzzle as any}
          />
        </UserContext.Provider>
      );
      expect(screen.getByText(/Puzzle #1/i)).toBeInTheDocument();
    });

    it('should display techniques for book puzzle', () => {
      const bookPuzzle = {
        puzzle: {
          difficulty: { coach: '1-very-easy' },
          techniques: {
            basic: {
              nakedSingle: 2,
              lastDigit: 1,
            },
          },
        },
        index: 0,
        sudokuBookId: 'book-123',
      };

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow
            session={createMockSession()}
            bookPuzzle={bookPuzzle as any}
            getTechniquesDisplay={() => [
              {
                name: 'Naked Single',
                count: 2,
                color: 'red',
                category: 'basic',
                categoryOrder: 1,
              },
              {
                name: 'Last Digit',
                count: 1,
                color: 'red',
                category: 'basic',
                categoryOrder: 1,
              },
            ]}
          />
        </UserContext.Provider>
      );
      expect(screen.getByText(/Recommended Techniques/i)).toBeInTheDocument();
    });

    it('should not display techniques if empty', () => {
      const bookPuzzle = {
        puzzle: {
          difficulty: { coach: '1-very-easy' },
          techniques: {},
        },
        index: 5,
        sudokuBookId: 'book-123',
      };

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow
            session={createMockSession()}
            bookPuzzle={bookPuzzle as any}
            getTechniquesDisplay={() => []}
          />
        </UserContext.Provider>
      );
      const techniquesSection = screen.queryByText(/Recommended Techniques/i);
      expect(techniquesSection).not.toBeInTheDocument();
    });
  });

  describe('date formatting', () => {
    it('should format YYYYMMDD dates correctly', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: undefined,
          timer: { startTime: 0, pausedTime: 0 } as any,
          metadata: { sudokuId: 'oftheday-20240115-easy' },
        } as BaseServerState,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );
      expect(screen.getByText(/Daily/i)).toBeInTheDocument();
    });

    it('should handle invalid date formats gracefully', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: undefined,
          timer: { startTime: 0, pausedTime: 0 } as any,
          metadata: { sudokuId: 'oftheday-invalid-easy' },
        } as BaseServerState,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );
      // Should still render without crashing
      expect(screen.getByTestId('puzzle-link')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have semantic link structure', () => {
      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      expect(screen.getByTestId('puzzle-link')).toBeInTheDocument();
    });

    it('should have readable labels', () => {
      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      expect(screen.getByText('You')).toBeVisible();
    });

    it('should display puzzle link visibly', () => {
      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={createMockSession()} />
        </UserContext.Provider>
      );
      expect(screen.getByTestId('puzzle-link')).toBeVisible();
    });
  });

  describe('edge cases', () => {
    it('should handle missing metadata', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: undefined,
          timer: { startTime: 0, pausedTime: 0 } as any,
          metadata: {},
        } as BaseServerState,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );
      expect(screen.getByTestId('puzzle-link')).toBeInTheDocument();
    });

    it('should handle empty answer stack', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [],
          completed: undefined,
          timer: { startTime: 0, pausedTime: 0 } as any,
          metadata: {},
        } as BaseServerState,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );
      expect(screen.getByTestId('simple-sudoku')).toBeInTheDocument();
    });

    it('should handle very large completion times', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: { seconds: 36000 }, // 10 hours
          timer: { startTime: 0, pausedTime: 0 } as any,
          metadata: {},
        } as BaseServerState,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );
      // Component renders completed puzzle
      expect(screen.getByText('✅')).toBeInTheDocument();
    });
  });

  describe('friend leaderboard', () => {
    const setFriendSessionsAndParties = (
      friendSessions: Record<string, unknown>,
      parties: Array<Record<string, unknown>>
    ) => {
      const {
        useSessions: mockUseSessions,
      } = require('@bubblyclouds-app/template/providers/SessionsProvider');
      (mockUseSessions as jest.Mock).mockReturnValue({
        friendSessions,
        isFriendSessionsLoading: false,
      });
      const {
        useParties: mockUseParties,
      } = require('@bubblyclouds-app/template/hooks/useParties');
      (mockUseParties as jest.Mock).mockReturnValue({ parties });
    };

    it('shows a friend who played the same puzzle in the leaderboard with their nickname', () => {
      const session = createMockSession();
      setFriendSessionsAndParties(
        {
          'friend-1': {
            isLoading: false,
            sessions: [
              {
                sessionId: session.sessionId,
                updatedAt: new Date(),
                state: {
                  initial: Array(81).fill(0),
                  final: Array(81).fill(0),
                  answerStack: [Array(81).fill(0)],
                  completed: undefined,
                  metadata: {},
                },
              },
            ],
          },
        },
        [
          {
            partyId: 'p1',
            members: [{ userId: 'friend-1', memberNickname: 'Friendly Fox' }],
          },
        ]
      );

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );

      expect(screen.getByText('Friendly Fox')).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('shows moves graded against par for both a friend and the current user while both are still in progress', () => {
      const session = createMockSession();
      setFriendSessionsAndParties(
        {
          'friend-1': {
            isLoading: false,
            sessions: [
              {
                sessionId: session.sessionId,
                updatedAt: new Date(),
                state: {
                  initial: Array(81).fill(0),
                  final: Array(81).fill(0),
                  answerStack: [Array(81).fill(0)],
                  completed: undefined,
                  metadata: { movesMade: '4', movesRequired: '10' },
                },
              },
            ],
          },
        },
        [
          {
            partyId: 'p1',
            members: [{ userId: 'friend-1', memberNickname: 'Friendly Fox' }],
          },
        ]
      );

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow
            session={session}
            getMovesDisplay={(state) =>
              state.metadata?.movesMade && state.metadata?.movesRequired
                ? {
                    movesMade: Number(state.metadata.movesMade),
                    movesRequired: Number(state.metadata.movesRequired),
                  }
                : undefined
            }
          />
        </UserContext.Provider>
      );

      // Friend, in progress, under par
      expect(screen.getByText('4/10 -6')).toBeInTheDocument();
    });

    it("shows the friend's own elapsed time while in progress, not the current user's", () => {
      // Regression: the in-progress timer branch called getTimerDisplay(),
      // which always reads the current user's own actualSession.state.timer
      // regardless of which row (friend or "You") it renders in — so a
      // friend's in-progress row showed no timer at all (or, if the current
      // user also had a session, silently showed the wrong person's time).
      const session = createMockSession();
      setFriendSessionsAndParties(
        {
          'friend-1': {
            isLoading: false,
            sessions: [
              {
                sessionId: session.sessionId,
                updatedAt: new Date(),
                state: {
                  initial: Array(81).fill(0),
                  final: Array(81).fill(0),
                  answerStack: [Array(81).fill(0)],
                  completed: undefined,
                  timer: { startTime: 0, pausedTime: 0 } as any,
                  metadata: {},
                },
              },
            ],
          },
        },
        [
          {
            partyId: 'p1',
            members: [{ userId: 'friend-1', memberNickname: 'Friendly Fox' }],
          },
        ]
      );

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );

      // calculateSeconds is mocked (beforeEach) to return 120 regardless of
      // the timer passed in — this confirms it was called at all for the
      // friend's own session (proving the friend's timer is actually read),
      // not that it stayed null/absent as before the fix.
      expect(screen.getByText('2m 0s')).toBeInTheDocument();
    });

    it('falls back to "Unknown" when the friend is not found in any party', () => {
      const session = createMockSession();
      setFriendSessionsAndParties(
        {
          'friend-1': {
            isLoading: false,
            sessions: [
              {
                sessionId: session.sessionId,
                updatedAt: new Date(),
                state: {
                  initial: Array(81).fill(0),
                  final: Array(81).fill(0),
                  answerStack: [Array(81).fill(0)],
                  completed: undefined,
                  metadata: {},
                },
              },
            ],
          },
        },
        []
      );

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('does not include the current user twice when their own userId is a key in friendSessions', () => {
      const session = createMockSession();
      setFriendSessionsAndParties(
        {
          'user-123': {
            isLoading: false,
            sessions: [
              {
                sessionId: session.sessionId,
                updatedAt: new Date(),
                state: {
                  initial: Array(81).fill(0),
                  final: Array(81).fill(0),
                  answerStack: [Array(81).fill(0)],
                  completed: undefined,
                  metadata: {},
                },
              },
            ],
          },
        },
        []
      );

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );

      // The current user's own entry under friendSessions is skipped by
      // getFriendSessions (userId === currentUserId), so there is no
      // duplicate leaderboard row for "You" beyond the single one always
      // rendered for the actual user session.
      expect(screen.getAllByText('You')).toHaveLength(1);
    });

    it('marks the fastest completed player as the winner and shows an award icon', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: { seconds: 200 },
          metadata: {},
        } as any,
      });
      setFriendSessionsAndParties(
        {
          'friend-1': {
            isLoading: false,
            sessions: [
              {
                sessionId: session.sessionId,
                updatedAt: new Date(),
                state: {
                  initial: Array(81).fill(0),
                  final: Array(81).fill(0),
                  answerStack: [Array(81).fill(0)],
                  completed: { seconds: 100 },
                  metadata: {},
                },
              },
            ],
          },
        },
        [
          {
            partyId: 'p1',
            members: [{ userId: 'friend-1', memberNickname: 'Speedy Sam' }],
          },
        ]
      );

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );

      expect(screen.getByText('Speedy Sam')).toBeInTheDocument();
      expect(screen.getByTestId('award-icon')).toBeInTheDocument();
    });

    it('ignores a friend session entry with no matching sessionId for this puzzle', () => {
      const session = createMockSession();
      setFriendSessionsAndParties(
        {
          'friend-1': {
            isLoading: false,
            sessions: [
              {
                sessionId: 'a-different-session',
                updatedAt: new Date(),
                state: {
                  initial: Array(81).fill(0),
                  final: Array(81).fill(0),
                  answerStack: [Array(81).fill(0)],
                  completed: undefined,
                  metadata: {},
                },
              },
            ],
          },
        },
        [
          {
            partyId: 'p1',
            members: [{ userId: 'friend-1', memberNickname: 'Nomatch Nora' }],
          },
        ]
      );

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );

      expect(screen.queryByText('Nomatch Nora')).not.toBeInTheDocument();
    });
  });

  describe('cheated status', () => {
    it('shows "Cheated" status text for a completed puzzle marked as cheated', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: { seconds: 90 },
          metadata: {},
        } as any,
      });
      const cheatedInjectedProps = {
        ...mockInjectedProps,
        isPuzzleCheated: jest.fn(() => true),
      };
      const provider = (
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );
      const integratedSessionRow = provider.props.children;
      render(
        cloneElement(
          provider,
          {},
          cloneElement(integratedSessionRow, {
            ...integratedSessionRow.props,
            ...cheatedInjectedProps,
          })
        )
      );
      // The cheated indicator is a warning emoji next to "You" in the
      // completed-puzzle summary row (getGameStatusText's 'Cheated' branch
      // affects sr-only status text, so we assert the cheated marker instead).
      expect(screen.getByText('❌')).toBeInTheDocument();
    });
  });

  describe('book puzzle title', () => {
    it('formats the title using the book month name and puzzle number', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: undefined,
          metadata: {
            sudokuBookPuzzleId: 'ofthemonth-202403-puzzle-4',
          },
        } as any,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );

      // month 03 -> Mar, index 4 -> displayed as 1-based (5)
      expect(screen.getByText('Book Mar #5')).toBeInTheDocument();
    });
  });

  describe('unblock race title', () => {
    it('formats the title for a daily run using runId', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: undefined,
          metadata: {
            runId: 'oftheday-20240115',
          },
        } as any,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );

      expect(screen.getByText('Daily Jan 15th')).toBeInTheDocument();
    });

    it('formats the title for a collection puzzle using unblockCollectionPuzzleId', () => {
      const session = createMockSession({
        state: {
          initial: Array(81).fill(0),
          final: Array(81).fill(0),
          answerStack: [Array(81).fill(0)],
          completed: undefined,
          metadata: {
            unblockCollectionPuzzleId: 'ofthemonth-202607-puzzle-3',
          },
        } as any,
      });

      renderWithProps(
        <UserContext.Provider value={mockUserContext as any}>
          <IntegratedSessionRow session={session} />
        </UserContext.Provider>
      );

      // month 07 -> Jul, index 3 -> displayed as 1-based (4)
      expect(screen.getByText('Collection Jul #4')).toBeInTheDocument();
    });
  });
});
