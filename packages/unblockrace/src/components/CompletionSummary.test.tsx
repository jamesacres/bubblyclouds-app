import { render, screen, fireEvent } from '@testing-library/react';
import CompletionSummary from './CompletionSummary';

describe('CompletionSummary', () => {
  it('renders stars, time, and moves', () => {
    render(
      <CompletionSummary
        stars={2}
        seconds={125}
        movesMade={10}
        movesRequired={10}
      />
    );

    expect(screen.getByTestId('completion-summary')).toBeInTheDocument();
    expect(screen.getByLabelText('2 of 3 stars')).toBeInTheDocument();
    expect(screen.getByText('2:05')).toBeInTheDocument();
    expect(screen.getByText('10/10')).toBeInTheDocument();
  });

  it('omits the label when not supplied', () => {
    render(
      <CompletionSummary
        stars={1}
        seconds={10}
        movesMade={5}
        movesRequired={5}
      />
    );

    expect(screen.getByTestId('completion-summary')).not.toHaveTextContent(
      'complete'
    );
  });

  it('shows the label suffixed with "complete" when supplied', () => {
    render(
      <CompletionSummary
        stars={3}
        seconds={10}
        movesMade={5}
        movesRequired={5}
        label="Daily · Aug 8"
      />
    );

    expect(screen.getByText('Daily · Aug 8 · complete')).toBeInTheDocument();
  });

  it('omits points when not supplied', () => {
    render(
      <CompletionSummary
        stars={3}
        seconds={10}
        movesMade={5}
        movesRequired={5}
      />
    );

    expect(screen.queryByText('Leaderboard points')).not.toBeInTheDocument();
  });

  it('shows points when supplied, including zero', () => {
    render(
      <CompletionSummary
        stars={3}
        seconds={10}
        movesMade={5}
        movesRequired={5}
        points={0}
      />
    );

    expect(screen.getByText('+0 pts')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard points')).toBeInTheDocument();
  });

  it('omits the retry button when onRetry is not supplied', () => {
    render(
      <CompletionSummary
        stars={3}
        seconds={10}
        movesMade={5}
        movesRequired={5}
      />
    );

    expect(screen.queryByTestId('retry-stage-button')).not.toBeInTheDocument();
  });

  it('shows the retry button and calls onRetry when clicked', () => {
    const onRetry = jest.fn();
    render(
      <CompletionSummary
        stars={3}
        seconds={10}
        movesMade={5}
        movesRequired={5}
        onRetry={onRetry}
      />
    );

    fireEvent.click(screen.getByTestId('retry-stage-button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('colors the moves count amber when over par', () => {
    render(
      <CompletionSummary
        stars={1}
        seconds={10}
        movesMade={8}
        movesRequired={5}
      />
    );

    expect(screen.getByText('8/5')).toHaveClass('text-amber-600');
  });

  it('colors the moves count emerald when under par', () => {
    render(
      <CompletionSummary
        stars={3}
        seconds={10}
        movesMade={3}
        movesRequired={5}
      />
    );

    expect(screen.getByText('3/5')).toHaveClass('text-emerald-600');
  });

  it('colors the moves count neutral when exactly at par', () => {
    render(
      <CompletionSummary
        stars={3}
        seconds={10}
        movesMade={5}
        movesRequired={5}
      />
    );

    const moves = screen.getByText('5/5');
    expect(moves).not.toHaveClass('text-amber-600');
    expect(moves).not.toHaveClass('text-emerald-600');
    expect(moves).toHaveClass('text-stone-900');
  });
});
