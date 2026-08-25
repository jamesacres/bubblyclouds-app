import { render, screen, fireEvent } from '@testing-library/react';
import CompletionSummary from './CompletionSummary';

const movesStatCell = (movesMade: number, movesRequired: number) => {
  const delta = movesMade - movesRequired;
  const colorClass =
    delta > 0
      ? 'text-amber-600'
      : delta < 0
        ? 'text-emerald-600'
        : 'text-stone-900';
  return (
    <>
      <div>
        <span>Time</span>
        <span>2:05</span>
      </div>
      <div>
        <span>Moves</span>
        <span className={colorClass}>
          {movesMade}/{movesRequired}
        </span>
      </div>
    </>
  );
};

describe('CompletionSummary', () => {
  it('renders stars and the caller-supplied stat cells', () => {
    render(<CompletionSummary stars={2} statCells={movesStatCell(10, 10)} />);

    expect(screen.getByTestId('completion-summary')).toBeInTheDocument();
    expect(screen.getByLabelText('2 of 3 stars')).toBeInTheDocument();
    expect(screen.getByText('2:05')).toBeInTheDocument();
    expect(screen.getByText('10/10')).toBeInTheDocument();
  });

  it('omits the label when not supplied', () => {
    render(<CompletionSummary stars={1} statCells={movesStatCell(5, 5)} />);

    expect(screen.getByTestId('completion-summary')).not.toHaveTextContent(
      'complete'
    );
  });

  it('shows the label suffixed with "complete" when supplied', () => {
    render(
      <CompletionSummary
        stars={3}
        statCells={movesStatCell(5, 5)}
        label="Daily · Aug 8"
      />
    );

    expect(screen.getByText('Daily · Aug 8 · complete')).toBeInTheDocument();
  });

  it('omits points when not supplied', () => {
    render(<CompletionSummary stars={3} statCells={movesStatCell(5, 5)} />);

    expect(screen.queryByText('Leaderboard points')).not.toBeInTheDocument();
  });

  it('shows points when supplied, including zero', () => {
    render(
      <CompletionSummary stars={3} statCells={movesStatCell(5, 5)} points={0} />
    );

    expect(screen.getByText('+0 pts')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard points')).toBeInTheDocument();
  });

  it('omits the retry button when onRetry is not supplied', () => {
    render(<CompletionSummary stars={3} statCells={movesStatCell(5, 5)} />);

    expect(screen.queryByTestId('retry-stage-button')).not.toBeInTheDocument();
  });

  it('shows the retry button and calls onRetry when clicked', () => {
    const onRetry = jest.fn();
    render(
      <CompletionSummary
        stars={3}
        statCells={movesStatCell(5, 5)}
        onRetry={onRetry}
      />
    );

    fireEvent.click(screen.getByTestId('retry-stage-button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders caller-supplied over-par styling', () => {
    render(<CompletionSummary stars={1} statCells={movesStatCell(8, 5)} />);

    expect(screen.getByText('8/5')).toHaveClass('text-amber-600');
  });

  it('renders caller-supplied under-par styling', () => {
    render(<CompletionSummary stars={3} statCells={movesStatCell(3, 5)} />);

    expect(screen.getByText('3/5')).toHaveClass('text-emerald-600');
  });
});
