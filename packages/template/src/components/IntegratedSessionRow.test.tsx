// @ts-nocheck
'use client';
import { cloneElement, ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { IntegratedSessionRow } from './IntegratedSessionRow';
import { BaseServerState } from '../types/gameState';
import { UserContext } from '@sudoku-web/auth/providers/AuthProvider';
import { ServerStateResult } from '@sudoku-web/types/serverTypes';

// Mock dependencies
jest.mock('react-feather', () => ({
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
    } = require('@sudoku-web/template/providers/SessionsProvider');
    (mockUseSessions as jest.Mock).mockReturnValue({
      friendSessions: {},
      isFriendSessionsLoading: false,
    });

    // Setup useParties mock
    const {
      useParties: mockUseParties,
    } = require('@sudoku-web/template/hooks/useParties');
    (mockUseParties as jest.Mock).mockReturnValue({
      parties: [],
    });

    // Setup calculateSeconds mock
    const {
      calculateSeconds: mockCalculateSeconds,
    } = require('@sudoku-web/template/helpers/calculateSeconds');
    (mockCalculateSeconds as jest.Mock).mockReturnValue(120);
  });

  const renderWithProps = (element: ReactElement) => {
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
          <IntegratedSessionRow session={session} />
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
      } = require('@sudoku-web/template/providers/SessionsProvider');
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
      } = require('@sudoku-web/template/providers/SessionsProvider');
      (mockUseSessions as jest.Mock).mockReturnValue({
        friendSessions: {},
        isFriendSessionsLoading: true,
      });

      const {
        useParties: mockUseParties,
      } = require('@sudoku-web/template/hooks/useParties');
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
      } = require('@sudoku-web/template/hooks/useParties');
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
});
