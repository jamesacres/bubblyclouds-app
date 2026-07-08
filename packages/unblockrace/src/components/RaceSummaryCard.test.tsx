import { render, screen, fireEvent } from '@testing-library/react';
import RaceSummaryCard from './RaceSummaryCard';

const defaultProps = {
  seconds: 47,
  movesMade: 12,
  movesRequired: 11,
  stageIndex: 0,
  stageCount: 5,
};

describe('RaceSummaryCard', () => {
  it('shows the escape time', () => {
    render(<RaceSummaryCard {...defaultProps} />);
    expect(screen.getByTestId('summary-time')).toHaveTextContent(
      'Escaped in 00:00:47'
    );
  });

  it('shows the daily number when provided', () => {
    render(<RaceSummaryCard {...defaultProps} dailyNumber={127} />);
    expect(screen.getByText(/Daily #127/)).toBeInTheDocument();
  });

  it('shows moves vs optimal with a warning when over par', () => {
    render(<RaceSummaryCard {...defaultProps} />);
    expect(screen.getByTestId('summary-moves')).toHaveTextContent(
      '⚠️ 12 moves (optimal: 11)'
    );
  });

  it('celebrates under-par solves', () => {
    render(<RaceSummaryCard {...defaultProps} movesMade={10} />);
    expect(screen.getByTestId('summary-moves')).toHaveTextContent(
      '🌟 10 moves (optimal: 11)'
    );
  });

  it('phrases a losing comparison instead of hiding it', () => {
    render(<RaceSummaryCard {...defaultProps} opponentDeltaSeconds={-3} />);
    expect(screen.getByTestId('summary-opponent')).toHaveTextContent(
      '00:00:03 behind opponent'
    );
  });

  it('shows a winning comparison', () => {
    render(<RaceSummaryCard {...defaultProps} opponentDeltaSeconds={3} />);
    expect(screen.getByTestId('summary-opponent')).toHaveTextContent(
      'Beat opponent by 00:00:03'
    );
  });

  it('omits the opponent line when no friend has completed', () => {
    render(<RaceSummaryCard {...defaultProps} />);
    expect(screen.queryByTestId('summary-opponent')).not.toBeInTheDocument();
  });

  it('shows run totals on the final stage', () => {
    render(
      <RaceSummaryCard
        {...defaultProps}
        stageIndex={4}
        runTotals={{ seconds: 300, moves: 60 }}
      />
    );
    expect(screen.getByTestId('summary-run-totals')).toHaveTextContent(
      'Run complete: 00:05:00, 60 moves total'
    );
  });

  it('advances via the next button', () => {
    const onNextStage = jest.fn();
    render(<RaceSummaryCard {...defaultProps} onNextStage={onNextStage} />);
    fireEvent.click(screen.getByRole('button', { name: /next puzzle/i }));
    expect(onNextStage).toHaveBeenCalled();
  });

  it('hides the next button on the final stage', () => {
    render(
      <RaceSummaryCard
        {...defaultProps}
        stageIndex={4}
        onNextStage={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(
      screen.queryByRole('button', { name: /next puzzle/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });
});
