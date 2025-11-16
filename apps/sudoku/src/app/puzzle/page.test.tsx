import React, { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PuzzlePage from './page';
import * as nextNavigation from 'next/navigation';
import { useWakeLock } from '@sudoku-web/template/hooks/useWakeLock';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@sudoku-web/template/hooks/useWakeLock', () => ({
  useWakeLock: jest.fn(() => ({
    requestWakeLock: jest.fn(),
  })),
}));

jest.mock('@sudoku-web/sudoku/components/Sudoku', () => {
  return function MockSudoku({
    alreadyCompleted,
    showRacingPrompt,
  }: {
    puzzle?: any;
    alreadyCompleted: boolean;
    showRacingPrompt: boolean;
  }) {
    return (
      <div data-testid="sudoku-component">
        <div data-testid="puzzle-status">
          {alreadyCompleted && <span>Already Completed</span>}
          {showRacingPrompt && <span>Show Racing Prompt</span>}
        </div>
      </div>
    );
  };
});

jest.mock('@sudoku-web/sudoku', () => ({
  ...jest.requireActual('@sudoku-web/sudoku'),
  puzzleTextToPuzzle: jest.fn((_text) => {
    return Array(9)
      .fill(null)
      .map(() => Array(9).fill(0));
  }),
}));

// useWakeLock is mocked as part of @sudoku-web/template mock

jest.mock('@sudoku-web/sudoku/helpers/buildPuzzleUrl', () => ({
  buildPuzzleUrl: jest.fn((initial, final, _metadata) => {
    return `/puzzle?initial=${initial}&final=${final}`;
  }),
}));

jest.mock('@sudoku-web/sudoku/helpers/sha256', () => ({
  sha256: jest.fn((text) => Promise.resolve('mocked-hash-' + text)),
}));

describe('Puzzle Page', () => {
  const mockUseSearchParams = nextNavigation.useSearchParams as jest.Mock;
  const mockUseRouter = nextNavigation.useRouter as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  const renderComponent = () =>
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <PuzzlePage />
      </Suspense>
    );

  describe('Loading behavior', () => {
    it('should not render Sudoku component without puzzle parameters', () => {
      renderComponent();
      expect(screen.queryByTestId('sudoku-component')).not.toBeInTheDocument();
    });

    it('should render Sudoku component when puzzle parameters are provided', async () => {
      const params = new URLSearchParams();
      params.set(
        'initial',
        '.1...3.942....5...7....82...67......1..4....6.4..81..5....72.....3....8.......1.3'
      );
      params.set(
        'final',
        '714293896235857914269461825678149532189346267453728961592634178816975423347182659'
      );
      mockUseSearchParams.mockReturnValue(params);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-component')).toBeInTheDocument();
      });
    });
  });

  describe('Puzzle metadata handling', () => {
    it('should handle difficulty metadata', async () => {
      const params = new URLSearchParams();
      params.set('initial', '1');
      params.set('final', '2');
      params.set('difficulty', 'EASY');
      mockUseSearchParams.mockReturnValue(params);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-component')).toBeInTheDocument();
      });
    });
  });

  describe('Already completed state', () => {
    it('should pass alreadyCompleted as true when query param is true', async () => {
      const params = new URLSearchParams();
      params.set('initial', '1');
      params.set('final', '2');
      params.set('alreadyCompleted', 'true');
      mockUseSearchParams.mockReturnValue(params);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Already Completed')).toBeInTheDocument();
      });
    });
  });

  describe('Racing prompt state', () => {
    it('should show racing prompt by default', async () => {
      const params = new URLSearchParams();
      params.set('initial', '1');
      params.set('final', '2');
      mockUseSearchParams.mockReturnValue(params);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Show Racing Prompt')).toBeInTheDocument();
      });
    });

    it('should hide racing prompt when explicitly disabled', async () => {
      const params = new URLSearchParams();
      params.set('initial', '1');
      params.set('final', '2');
      params.set('showRacingPrompt', 'false');
      mockUseSearchParams.mockReturnValue(params);

      renderComponent();

      await waitFor(() => {
        expect(
          screen.queryByText('Show Racing Prompt')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Wake lock functionality', () => {
    it('should request wake lock when puzzle loads', async () => {
      const mockRequestWakeLock = jest.fn();
      (useWakeLock as jest.Mock).mockReturnValue({
        requestWakeLock: mockRequestWakeLock,
      });

      const params = new URLSearchParams();
      params.set('initial', '1');
      params.set('final', '2');
      mockUseSearchParams.mockReturnValue(params);

      renderComponent();

      await waitFor(() => {
        expect(mockRequestWakeLock).toHaveBeenCalled();
      });
    });
  });
});
