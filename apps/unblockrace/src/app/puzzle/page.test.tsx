import React from 'react';
import { render, screen } from '@testing-library/react';
import PuzzlePage from './page';
import * as nextNavigation from 'next/navigation';
import { useWakeLock } from '@bubblyclouds-app/template/hooks/useWakeLock';

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@bubblyclouds-app/template/hooks/useWakeLock', () => ({
  useWakeLock: jest.fn(() => ({
    requestWakeLock: jest.fn(),
  })),
}));

const mockUnblockRaceMount = jest.fn();
jest.mock('@bubblyclouds-app/unblockrace/components/UnblockRace', () => {
  const DummyUnblockRace = function DummyUnblockRace({
    run,
  }: {
    run: { stages: { boardString: string; movesRequired: number }[] };
  }) {
    // Mirrors UnblockRace's own useState(() => ...) initializers: only fires
    // once per mount, so a stale instance reused across a stage-count change
    // would not re-run this and the test would catch it via mount count.
    React.useState(() => mockUnblockRaceMount());
    return (
      <div data-testid="unblock-race">
        {run.stages
          .map((stage) => `${stage.boardString}:${stage.movesRequired}`)
          .join('|')}
      </div>
    );
  };
  return {
    __esModule: true,
    default: DummyUnblockRace,
  };
});

const BOARD_1 = [
  'oooooo',
  'oooooo',
  'AAoBoo',
  'oooBoo',
  'oooooo',
  'oooooo',
].join('');
const BOARD_2 = [
  'oooooo',
  'oooooo',
  'oAAoBo',
  'ooooBo',
  'oooooo',
  'oooooo',
].join('');

describe('Puzzle Page', () => {
  const mockUseSearchParams = nextNavigation.useSearchParams as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnblockRaceMount.mockClear();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  const renderComponent = () => render(<PuzzlePage />);

  it('should render nothing without puzzle parameters', () => {
    renderComponent();
    expect(screen.queryByTestId('unblock-race')).not.toBeInTheDocument();
  });

  it('should render the game and request wake lock for a single puzzle', async () => {
    const mockRequestWakeLock = jest.fn();
    (useWakeLock as jest.Mock).mockReturnValue({
      requestWakeLock: mockRequestWakeLock,
    });

    const params = new URLSearchParams();
    params.set('board', BOARD_1);
    params.set('moves', '3');
    mockUseSearchParams.mockReturnValue(params);

    renderComponent();

    expect(await screen.findByTestId('unblock-race')).toHaveTextContent(
      `${BOARD_1}:3`
    );
    expect(mockRequestWakeLock).toHaveBeenCalled();
  });

  it('should parse comma-separated chained runs positionally', async () => {
    const params = new URLSearchParams();
    params.set('board', `${BOARD_1},${BOARD_2}`);
    params.set('moves', '3,5');
    mockUseSearchParams.mockReturnValue(params);

    renderComponent();

    expect(await screen.findByTestId('unblock-race')).toHaveTextContent(
      `${BOARD_1}:3|${BOARD_2}:5`
    );
  });

  it('should render nothing for an invalid board', () => {
    const params = new URLSearchParams();
    params.set('board', 'garbage');
    params.set('moves', '3');
    mockUseSearchParams.mockReturnValue(params);

    renderComponent();

    expect(screen.queryByTestId('unblock-race')).not.toBeInTheDocument();
  });

  it('remounts UnblockRace when navigating to a different puzzle (e.g. continue-to-next-puzzle)', async () => {
    // Regression test: UnblockRace seeds currentStageIndex/completedStages
    // via useState(() => ...) initializers that only run once per mount. If
    // the component instance were reused across a "continue to next puzzle"
    // navigation — e.g. from a 5-stage daily run down to a 1-stage
    // collection puzzle — currentStageIndex could stay pointed past the end
    // of the new, shorter stages array and crash on stages[index].boardString.
    const dailyRunParams = new URLSearchParams();
    dailyRunParams.set('board', `${BOARD_1},${BOARD_2}`);
    dailyRunParams.set('moves', '3,5');
    dailyRunParams.set('runId', 'oftheday-20260808');
    mockUseSearchParams.mockReturnValue(dailyRunParams);

    const { rerender } = renderComponent();
    expect(await screen.findByTestId('unblock-race')).toHaveTextContent(
      `${BOARD_1}:3|${BOARD_2}:5`
    );
    expect(mockUnblockRaceMount).toHaveBeenCalledTimes(1);

    // Simulate router.push to a single-stage collection puzzle: same route,
    // new search params, no full page reload.
    const nextPuzzleParams = new URLSearchParams();
    nextPuzzleParams.set('board', BOARD_1);
    nextPuzzleParams.set('moves', '3');
    nextPuzzleParams.set(
      'unblockCollectionPuzzleId',
      'ofthemonth-202608-puzzle-0'
    );
    mockUseSearchParams.mockReturnValue(nextPuzzleParams);
    rerender(<PuzzlePage />);

    expect(await screen.findByTestId('unblock-race')).toHaveTextContent(
      `${BOARD_1}:3`
    );
    // A fresh mount (not a prop update on the same instance) proves
    // currentStageIndex/completedStages were reseeded for the new run.
    expect(mockUnblockRaceMount).toHaveBeenCalledTimes(2);
  });
});
