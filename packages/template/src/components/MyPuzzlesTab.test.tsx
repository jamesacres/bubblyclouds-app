import React from 'react';
import { render, screen } from '@testing-library/react';
import { BaseServerState } from '../types/state';
import { ServerStateResult } from '@bubblyclouds-app/types/serverTypes';
import { MyPuzzlesTab } from './MyPuzzlesTab';

jest.mock('./IntegratedSessionRow', () => ({
  __esModule: true,
  default: ({ session }: { session: { sessionId: string } }) => (
    <div data-testid={`session-${session.sessionId}`}>
      Session: {session.sessionId}
    </div>
  ),
}));

const createMockSession = (
  sessionId: string,
  updatedAt: string,
  overrides?: Partial<ServerStateResult<BaseServerState>>
): ServerStateResult<BaseServerState> => ({
  sessionId,
  updatedAt: new Date(updatedAt),
  state: {} as BaseServerState,
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

    it('should render empty state when no sessions', () => {
      render(<MyPuzzlesTab {...mockProps} />);
      expect(screen.getByText('No puzzles yet')).toBeInTheDocument();
    });

    it('should render empty state instruction text', () => {
      render(<MyPuzzlesTab {...mockProps} />);
      expect(
        screen.getByText('Head to Start Race to solve your first puzzle')
      ).toBeInTheDocument();
    });
  });

  describe('with no sessions', () => {
    it('should render without sessions prop', () => {
      render(<MyPuzzlesTab {...mockProps} />);
      expect(screen.getByText('No puzzles yet')).toBeInTheDocument();
    });

    it('should render with empty sessions array', () => {
      render(<MyPuzzlesTab {...mockProps} sessions={[]} />);
      expect(screen.getByText('No puzzles yet')).toBeInTheDocument();
    });

    it('should not render session grid when sessions is undefined', () => {
      const { container } = render(
        <MyPuzzlesTab {...mockProps} sessions={undefined} />
      );
      expect(container.querySelector('ul')).not.toBeInTheDocument();
    });

    it('should not render session grid when sessions is empty', () => {
      const { container } = render(
        <MyPuzzlesTab {...mockProps} sessions={[]} />
      );
      expect(container.querySelector('ul')).not.toBeInTheDocument();
    });
  });

  describe('with single session', () => {
    it('should render single session', () => {
      const sessions = [createMockSession('session-1', '2024-01-15T10:00:00Z')];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

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
    it('should have main container with mb-4', () => {
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

    it('should render session divs for each session', () => {
      const sessions = [
        createMockSession('session-1', '2024-01-15T10:00:00Z'),
        createMockSession('session-2', '2024-01-14T10:00:00Z'),
      ];

      render(<MyPuzzlesTab {...mockProps} sessions={sessions} />);

      const sessionDivs = screen.getAllByTestId(/session-/);
      expect(sessionDivs).toHaveLength(2);
    });
  });

  describe('empty state', () => {
    it('should not render session grid when no sessions', () => {
      const { container } = render(
        <MyPuzzlesTab {...mockProps} sessions={[]} />
      );

      expect(container.querySelectorAll('ul')).toHaveLength(0);
    });

    it('should show empty state placeholder when sessions is empty', () => {
      render(<MyPuzzlesTab {...mockProps} sessions={[]} />);
      expect(screen.getByText('No puzzles yet')).toBeInTheDocument();
    });
  });

  describe('conditional rendering', () => {
    it('should render session list when sessions exist', () => {
      const sessions = [createMockSession('session-1', '2024-01-15T10:00:00Z')];

      const { container } = render(
        <MyPuzzlesTab {...mockProps} sessions={sessions} />
      );

      expect(container.querySelector('ul')).toBeInTheDocument();
    });

    it('should not render session list when sessions is empty', () => {
      const { container } = render(
        <MyPuzzlesTab {...mockProps} sessions={[]} />
      );

      expect(container.querySelector('ul')).not.toBeInTheDocument();
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
    it('should have empty state text content', () => {
      render(<MyPuzzlesTab {...mockProps} />);

      expect(screen.getByText('No puzzles yet')).toBeInTheDocument();
      expect(
        screen.getByText('Head to Start Race to solve your first puzzle')
      ).toBeInTheDocument();
    });
  });
});
