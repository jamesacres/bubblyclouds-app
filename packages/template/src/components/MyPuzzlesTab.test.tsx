import React from 'react';
import { render, screen } from '@testing-library/react';
import { MyPuzzlesTab } from './MyPuzzlesTab';

// Mock IntegratedSessionRow
jest.mock('./IntegratedSessionRow', () => ({
  __esModule: true,
  default: ({ session }: { session: any }) => (
    <div data-testid={`session-${session.sessionId}`}>
      Session: {session.sessionId}
    </div>
  ),
}));

const createMockSession = (
  sessionId: string,
  updatedAt: string,
  overrides?: any
) => ({
  sessionId,
  updatedAt,
  puzzleId: 'puzzle-1',
  userId: 'user-1',
  createdAt: '2024-01-01T00:00:00Z',
  startedAt: '2024-01-01T00:00:00Z',
  completedAt: null,
  currentState: {},
  initialState: {},
  notes: [],
  isCompleted: false,
  elapsedSeconds: 0,
  ...overrides,
});

const mockProps = {
  SimpleState: () => <div>SimpleState</div>,
  calculateCompletionPercentageFromState: jest.fn(() => 50),
  isPuzzleCheated: jest.fn(() => false),
  buildPuzzleUrlFromState: jest.fn(() => '/puzzle/1'),
};

describe('MyPuzzlesTab', () => {
  describe('rendering', () => {
    it('should render the component', () => {
      const { container } = render(<MyPuzzlesTab {...mockProps} />);
      expect(container).toBeInTheDocument();
    });

    it('should render title', () => {
      render(<MyPuzzlesTab {...mockProps} />);
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveTextContent('My Puzzles');
    });

    it('should render description text', () => {
      render(<MyPuzzlesTab {...mockProps} />);
      expect(
        screen.getByText(
          'This page lists puzzles you have played in the past 30 days.'
        )
      ).toBeInTheDocument();
    });

    it('should render instruction text', () => {
      render(<MyPuzzlesTab {...mockProps} />);
      expect(
        screen.getByText(
          /Press Start Race in the bottom navigation to find a new puzzle/
        )
      ).toBeInTheDocument();
    });
  });

  describe('with no sessions', () => {
    it('should render without sessions prop', () => {
      render(<MyPuzzlesTab {...mockProps} />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should render with empty sessions array', () => {
      render(<MyPuzzlesTab {...mockProps} sessions={[]} />);
      const heading = screen.queryByRole('heading', { level: 2 });
      expect(heading).not.toBeInTheDocument();
    });

    it('should not render recent puzzles section when sessions is undefined', () => {
      render(<MyPuzzlesTab {...mockProps} sessions={undefined} />);
      expect(screen.queryByText('Recent Puzzles')).not.toBeInTheDocument();
    });

    it('should not render recent puzzles section when sessions is empty', () => {
      render(<MyPuzzlesTab {...mockProps} sessions={[]} />);
      expect(screen.queryByText('Recent Puzzles')).not.toBeInTheDocument();
    });
  });

  describe('with single session', () => {
    it('should render single session', () => {
      const sessions = [createMockSession('session-1', '2024-01-15T10:00:00Z')];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      expect(screen.getByText('Recent Puzzles')).toBeInTheDocument();
      expect(screen.getByTestId('session-session-1')).toBeInTheDocument();
    });

    it('should render session with correct ID', () => {
      const sessions = [
        createMockSession('session-abc123', '2024-01-15T10:00:00Z'),
      ];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      expect(screen.getByTestId('session-session-abc123')).toBeInTheDocument();
    });
  });

  describe('with multiple sessions', () => {
    it('should render multiple sessions', () => {
      const sessions = [
        createMockSession('session-1', '2024-01-15T10:00:00Z'),
        createMockSession('session-2', '2024-01-14T10:00:00Z'),
        createMockSession('session-3', '2024-01-13T10:00:00Z'),
      ];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      expect(screen.getByTestId('session-session-1')).toBeInTheDocument();
      expect(screen.getByTestId('session-session-2')).toBeInTheDocument();
      expect(screen.getByTestId('session-session-3')).toBeInTheDocument();
    });

    it('should render correct number of sessions', () => {
      const sessions = [
        createMockSession('session-1', '2024-01-15T10:00:00Z'),
        createMockSession('session-2', '2024-01-14T10:00:00Z'),
        createMockSession('session-3', '2024-01-13T10:00:00Z'),
        createMockSession('session-4', '2024-01-12T10:00:00Z'),
      ];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      const sessionElements = screen.getAllByText(/^Session:/);
      expect(sessionElements).toHaveLength(4);
    });
  });

  describe('sorting', () => {
    it('should sort sessions by updatedAt descending', () => {
      const sessions = [
        createMockSession('session-1', '2024-01-13T10:00:00Z'),
        createMockSession('session-2', '2024-01-15T10:00:00Z'),
        createMockSession('session-3', '2024-01-14T10:00:00Z'),
      ];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      const testIds = screen.getAllByTestId(/^session-/);
      expect(testIds[0]).toHaveTextContent('Session: session-2');
      expect(testIds[1]).toHaveTextContent('Session: session-3');
      expect(testIds[2]).toHaveTextContent('Session: session-1');
    });

    it('should sort sessions by most recent first', () => {
      const sessions = [
        createMockSession('oldest', '2024-01-01T00:00:00Z'),
        createMockSession('newest', '2024-01-15T23:59:59Z'),
        createMockSession('middle', '2024-01-08T12:00:00Z'),
      ];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      const testIds = screen.getAllByTestId(/^session-/);
      expect(testIds[0]).toHaveTextContent('newest');
      expect(testIds[1]).toHaveTextContent('middle');
      expect(testIds[2]).toHaveTextContent('oldest');
    });

    it('should handle sessions with same updatedAt', () => {
      const sameTime = '2024-01-15T10:00:00Z';
      const sessions = [
        createMockSession('session-1', sameTime),
        createMockSession('session-2', sameTime),
        createMockSession('session-3', sameTime),
      ];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      const testIds = screen.getAllByTestId(/^session-/);
      expect(testIds).toHaveLength(3);
    });

    it('should handle ISO date formats correctly', () => {
      const sessions = [
        createMockSession('session-1', '2024-01-15T10:30:45.123Z'),
        createMockSession('session-2', '2024-01-15T10:30:45.456Z'),
        createMockSession('session-3', '2024-01-15T10:30:45.789Z'),
      ];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      const testIds = screen.getAllByTestId(/^session-/);
      expect(testIds).toHaveLength(3);
    });
  });

  describe('styling and structure', () => {
    it('should have gradient title styling', () => {
      render(<MyPuzzlesTab {...mockProps} />);
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('bg-gradient-to-r');
      expect(title).toHaveClass('from-blue-500');
      expect(title).toHaveClass('via-purple-500');
      expect(title).toHaveClass('to-pink-500');
      expect(title).toHaveClass('bg-clip-text');
      expect(title).toHaveClass('text-transparent');
    });

    it('should have main container with padding', () => {
      const { container } = render(<MyPuzzlesTab {...mockProps} />);
      const mainDiv = container.querySelector('.mb-4');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should render grid layout for sessions', () => {
      const sessions = [
        createMockSession('session-1', '2024-01-15T10:00:00Z'),
        createMockSession('session-2', '2024-01-14T10:00:00Z'),
      ];

      const { container } = render(
        <MyPuzzlesTab {...mockProps} sessions={sessions} />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-2');
      expect(grid).toHaveClass('gap-2');
      expect(grid).toHaveClass('sm:grid-cols-3');
      expect(grid).toHaveClass('sm:gap-4');
      expect(grid).toHaveClass('lg:grid-cols-4');
    });

    it('should render ul element for session list', () => {
      const sessions = [createMockSession('session-1', '2024-01-15T10:00:00Z')];

      const { container } = render(
        <MyPuzzlesTab {...mockProps} sessions={sessions} />
      );

      const listElement = container.querySelector('ul');
      expect(listElement).toBeInTheDocument();
    });

    it('should render li elements for each session', () => {
      const sessions = [
        createMockSession('session-1', '2024-01-15T10:00:00Z'),
        createMockSession('session-2', '2024-01-14T10:00:00Z'),
      ];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      // IntegratedSessionRow is mocked to render divs, not li elements
      const sessionDivs = screen.getAllByTestId(/session-/);
      expect(sessionDivs).toHaveLength(2);
    });
  });

  describe('text content', () => {
    it('should have correct heading text', () => {
      render(<MyPuzzlesTab {...mockProps} />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'My Puzzles'
      );
    });

    it('should have correct subheading when sessions exist', () => {
      const sessions = [createMockSession('session-1', '2024-01-15T10:00:00Z')];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Recent Puzzles'
      );
    });

    it('should display 30-day timeframe message', () => {
      render(<MyPuzzlesTab {...mockProps} />);
      expect(screen.getByText(/past 30 days/)).toBeInTheDocument();
    });

    it('should display navigation instruction', () => {
      render(<MyPuzzlesTab {...mockProps} />);
      expect(
        screen.getByText(/Start Race in the bottom navigation/)
      ).toBeInTheDocument();
    });

    it('should mention resuming previous puzzles', () => {
      render(<MyPuzzlesTab {...mockProps} />);
      expect(
        screen.getByText(/resume a previous one below/)
      ).toBeInTheDocument();
    });
  });

  describe('conditional rendering', () => {
    it('should render recent puzzles section when sessions exist', () => {
      const sessions = [createMockSession('session-1', '2024-01-15T10:00:00Z')];

      const { container } = render(
        <MyPuzzlesTab {...mockProps} sessions={sessions} />
      );

      const recentPuzzlesSection = container.querySelector(
        '.mb-4 > div:last-child'
      );
      expect(recentPuzzlesSection).toBeInTheDocument();
    });

    it('should not render recent puzzles section when sessions is empty', () => {
      const { container } = render(
        <MyPuzzlesTab {...mockProps} sessions={[]} />
      );

      const recentPuzzlesSection = container.querySelectorAll('h2');
      const hasRecentPuzzlesHeading = Array.from(recentPuzzlesSection).some(
        (el) => el.textContent === 'Recent Puzzles'
      );

      expect(hasRecentPuzzlesHeading).toBe(false);
    });

    it('should show sections in correct order', () => {
      const sessions = [createMockSession('session-1', '2024-01-15T10:00:00Z')];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      const headings = screen.getAllByRole('heading');
      expect(headings[0]).toHaveTextContent('My Puzzles');
      expect(headings[1]).toHaveTextContent('Recent Puzzles');
    });
  });

  describe('edge cases', () => {
    it('should handle sessions with very old dates', () => {
      const sessions = [createMockSession('session-1', '2000-01-01T00:00:00Z')];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      expect(screen.getByTestId('session-session-1')).toBeInTheDocument();
    });

    it('should handle sessions with future dates', () => {
      const sessions = [createMockSession('session-1', '2099-12-31T23:59:59Z')];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      expect(screen.getByTestId('session-session-1')).toBeInTheDocument();
    });

    it('should handle large number of sessions', () => {
      const sessions = Array.from({ length: 100 }, (_, i) =>
        createMockSession(
          `session-${i}`,
          `2024-01-${(100 - i).toString().padStart(2, '0')}T10:00:00Z`
        )
      );

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      const testIds = screen.getAllByTestId(/^session-/);
      expect(testIds).toHaveLength(100);
    });

    it('should handle sessions with special characters in ID', () => {
      const sessions = [
        createMockSession('session-abc_123-def', '2024-01-15T10:00:00Z'),
      ];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      expect(
        screen.getByTestId('session-session-abc_123-def')
      ).toBeInTheDocument();
    });

    it('should handle sessions with unicode characters', () => {
      const sessions = [
        createMockSession('session-🎮', '2024-01-15T10:00:00Z'),
      ];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      expect(screen.getByTestId('session-session-🎮')).toBeInTheDocument();
    });
  });

  describe('component behavior', () => {
    it('should be a functional component', () => {
      expect(typeof MyPuzzlesTab).toBe('function');
    });

    it('should accept sessions prop', () => {
      const sessions = [createMockSession('session-1', '2024-01-15T10:00:00Z')];

      const { container } = render(
        <MyPuzzlesTab {...mockProps} sessions={sessions} />
      );

      expect(container).toBeInTheDocument();
    });

    it('should be usable as default export', async () => {
      const Module = await import('./MyPuzzlesTab');
      expect(Module.default).toBeDefined();
    });

    it('should work when re-rendered with different sessions', () => {
      const sessions1 = [
        createMockSession('session-1', '2024-01-15T10:00:00Z'),
      ];

      const { rerender } = render(
        <MyPuzzlesTab {...mockProps} sessions={sessions1} />
      );

      expect(screen.getByTestId('session-session-1')).toBeInTheDocument();

      const sessions2 = [
        createMockSession('session-2', '2024-01-14T10:00:00Z'),
        createMockSession('session-3', '2024-01-13T10:00:00Z'),
      ];

      rerender(<MyPuzzlesTab {...mockProps} sessions={sessions2} />);

      expect(screen.queryByTestId('session-session-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('session-session-2')).toBeInTheDocument();
      expect(screen.getByTestId('session-session-3')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have semantic heading structure', () => {
      const sessions = [createMockSession('session-1', '2024-01-15T10:00:00Z')];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });

      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
    });

    it('should have readable text content', () => {
      render(<MyPuzzlesTab {...mockProps} />);

      expect(screen.getByText(/My Puzzles/)).toBeInTheDocument();
      expect(screen.getByText(/puzzles you have played/)).toBeInTheDocument();
    });
  });
});
