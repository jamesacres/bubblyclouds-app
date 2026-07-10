import { render, screen, act } from '@testing-library/react';
import RaceCelebration, { RACE_CELEBRATION_MS } from './RaceCelebration';

const requestReview = jest.fn(() => Promise.resolve());
jest.mock('@capacitor-community/in-app-review', () => ({
  InAppReview: {
    requestReview: () => requestReview(),
  },
}));

describe('RaceCelebration', () => {
  beforeEach(() => {
    requestReview.mockClear();
  });

  it('renders nothing when not visible', () => {
    render(
      <RaceCelebration isVisible={false} totalSeconds={95} totalMoves={42} />
    );
    expect(screen.queryByTestId('race-celebration')).not.toBeInTheDocument();
  });

  it('shows the finish banner with the run totals', () => {
    render(<RaceCelebration isVisible totalSeconds={95} totalMoves={42} />);
    expect(screen.getByTestId('race-celebration')).toBeInTheDocument();
    expect(screen.getByText('Finish!')).toBeInTheDocument();
    expect(screen.getByText('Run complete')).toBeInTheDocument();
    expect(screen.getByTestId('race-celebration-totals')).toHaveTextContent(
      '1:35 · 42 moves'
    );
  });

  it('requests an app review at a milestone count once the celebration ends', () => {
    jest.useFakeTimers();
    try {
      render(
        <RaceCelebration
          isVisible
          totalSeconds={10}
          totalMoves={5}
          completedGamesCount={5}
          isCapacitor={() => true}
        />
      );
      expect(requestReview).not.toHaveBeenCalled();
      act(() => {
        jest.advanceTimersByTime(RACE_CELEBRATION_MS);
      });
      expect(requestReview).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not request a review off-milestone or outside the app', () => {
    jest.useFakeTimers();
    try {
      render(
        <RaceCelebration
          isVisible
          totalSeconds={10}
          totalMoves={5}
          completedGamesCount={3}
          isCapacitor={() => true}
        />
      );
      act(() => {
        jest.advanceTimersByTime(RACE_CELEBRATION_MS);
      });
      expect(requestReview).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});
