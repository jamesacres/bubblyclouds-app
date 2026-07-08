import { render, screen, act } from '@testing-library/react';
import StageTransition from './StageTransition';

const FROM = ['oooooo', 'oooooo', 'ooooAA', 'oooooo', 'oooooo', 'oooooo'].join(
  ''
);

describe('StageTransition', () => {
  it('renders the outgoing board and the incoming children side by side', () => {
    render(
      <StageTransition
        fromBoardString={FROM}
        direction="forward"
        onDone={jest.fn()}
      >
        <div data-testid="incoming" />
      </StageTransition>
    );
    // Outgoing board is a real (static) board; the incoming stage is the
    // passed-in child. Both are mounted at once for the slide.
    expect(screen.getByTestId('unblock-board')).toBeInTheDocument();
    expect(screen.getByTestId('incoming')).toBeInTheDocument();
    expect(screen.getByTestId('stage-transition-track')).toBeInTheDocument();
  });

  it('calls onDone once the slide duration elapses', () => {
    jest.useFakeTimers();
    try {
      const onDone = jest.fn();
      render(
        <StageTransition
          fromBoardString={FROM}
          direction="forward"
          onDone={onDone}
        >
          <div data-testid="incoming" />
        </StageTransition>
      );

      expect(onDone).not.toHaveBeenCalled();
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(onDone).toHaveBeenCalledTimes(1);
    } finally {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });
});
