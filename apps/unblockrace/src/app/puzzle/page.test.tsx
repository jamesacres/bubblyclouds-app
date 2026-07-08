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

jest.mock('@bubblyclouds-app/unblockrace/components/UnblockRace', () => {
  const DummyUnblockRace = function DummyUnblockRace({
    run,
  }: {
    run: { stages: { boardString: string; movesRequired: number }[] };
  }) {
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
});
