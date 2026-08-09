import { ComponentProps } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StageResultPanel from './StageResultPanel';
import { RunStage, StageResult } from '../helpers/stageResults';

// A distinct valid 6x6 board per stage: piece A (horizontal, size 2) sits at a
// different column each time, so every stage has a unique board string (the
// board string doubles as the row key and testid seed).
const boardWithPieceAt = (col: number): string => {
  const middle = 'oooooo'.split('');
  middle[col] = 'A';
  middle[col + 1] = 'A';
  return [
    'oooooo',
    'oooooo',
    middle.join(''),
    'oooooo',
    'oooooo',
    'oooooo',
  ].join('');
};

const stagesOf = (count: number): RunStage[] =>
  Array.from({ length: count }, (_, i) => ({
    boardString: boardWithPieceAt(i),
    movesRequired: 5,
  }));

const results = (entries: [number, StageResult][]) =>
  new Map<number, StageResult>(entries);

const renderPanel = (props: Partial<ComponentProps<typeof StageResultPanel>>) =>
  render(
    <StageResultPanel
      results={results([])}
      stages={stagesOf(3)}
      currentStageIndex={0}
      goToStage={jest.fn()}
      isTransitioning={false}
      runComplete={false}
      onRetry={jest.fn()}
      isRetryDisabled={false}
      {...props}
    />
  );

describe('StageResultPanel', () => {
  it('renders nothing when there are no stages', () => {
    const { container } = renderPanel({ stages: [] });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a preview thumbnail for every stage before any complete', () => {
    renderPanel({ stages: stagesOf(3) });
    expect(screen.getByTestId('stage-preview-0')).toBeInTheDocument();
    expect(screen.getByTestId('stage-preview-1')).toBeInTheDocument();
    expect(screen.getByTestId('stage-preview-2')).toBeInTheDocument();
  });

  it('shows the difficulty next to every stage from its par', () => {
    renderPanel({
      stages: [
        { boardString: boardWithPieceAt(0), movesRequired: 5 },
        { boardString: boardWithPieceAt(1), movesRequired: 18 },
        { boardString: boardWithPieceAt(2), movesRequired: 25 },
      ],
    });
    // difficultyForMoves → unblockDifficultyDisplay: 5=Beginner,
    // 18=Challenging, 25=Hard. Shown even though no stage has completed yet.
    expect(screen.getByTestId('stage-difficulty-0')).toHaveTextContent(
      'Beginner'
    );
    expect(screen.getByTestId('stage-difficulty-1')).toHaveTextContent(
      'Challenging'
    );
    expect(screen.getByTestId('stage-difficulty-2')).toHaveTextContent('Hard');
  });

  it('lists completed stages with time and moves against par', () => {
    renderPanel({
      stages: stagesOf(3),
      currentStageIndex: 1,
      results: results([
        [0, { seconds: 30, movesMade: 4, movesRequired: 4 }],
        [1, { seconds: 45, movesMade: 7, movesRequired: 5 }],
      ]),
    });
    expect(screen.getByTestId('stage-result-0')).toHaveTextContent('0:30');
    expect(screen.getByTestId('stage-result-0')).toHaveTextContent('4/4');
    // A completed stage ticks off its thumbnail
    expect(screen.getByTestId('stage-preview-0-complete')).toBeInTheDocument();
    // A completed stage still shows its difficulty pill, not just the result
    expect(screen.getByTestId('stage-difficulty-0')).toHaveTextContent(
      'Beginner'
    );
    expect(screen.getByTestId('stage-difficulty-0')).not.toHaveClass(
      'invisible'
    );
    // Over par gets the amber warning treatment on its par chip
    expect(screen.getByTestId('stage-par-1')).toHaveTextContent('7/5 moves');
    expect(screen.getByTestId('stage-par-1')).toHaveClass('text-amber-600');
    // The final, not-yet-reached stage shows what's ahead and no tick
    expect(screen.getByTestId('stage-result-2')).toHaveTextContent('par 5');
    expect(
      screen.queryByTestId('stage-preview-2-complete')
    ).not.toBeInTheDocument();
  });

  it('navigates to a stage when its thumbnail is clicked', () => {
    const goToStage = jest.fn();
    renderPanel({ stages: stagesOf(3), currentStageIndex: 0, goToStage });
    fireEvent.click(screen.getByTestId('stage-preview-2'));
    expect(goToStage).toHaveBeenCalledWith(2, 'forward');
  });

  it('disables the thumbnails mid-transition', () => {
    renderPanel({ stages: stagesOf(3), isTransitioning: true });
    expect(screen.getByTestId('stage-preview-1')).toBeDisabled();
  });

  it('shows the opponent delta when provided', () => {
    renderPanel({
      stages: stagesOf(2),
      results: results([[0, { seconds: 30, movesMade: 4, movesRequired: 4 }]]),
      opponentDeltaSeconds: 3,
    });
    expect(screen.getByTestId('stage-result-opponent')).toHaveTextContent(
      'Beat opponent by 0:03'
    );
  });

  it('phrases a negative delta as behind the opponent', () => {
    renderPanel({
      stages: stagesOf(2),
      results: results([[0, { seconds: 30, movesMade: 4, movesRequired: 4 }]]),
      opponentDeltaSeconds: -3,
    });
    expect(screen.getByTestId('stage-result-opponent')).toHaveTextContent(
      '0:03 behind opponent'
    );
  });

  it('shows the run total once complete', () => {
    renderPanel({
      stages: stagesOf(2),
      currentStageIndex: 1,
      results: results([
        [0, { seconds: 30, movesMade: 4, movesRequired: 4 }],
        [1, { seconds: 40, movesMade: 6, movesRequired: 5 }],
      ]),
      runComplete: true,
    });
    // 30 + 40 = 70s = 1:10, 4 + 6 = 10 moves
    expect(screen.getByTestId('stage-result-total')).toHaveTextContent('1:10');
    expect(screen.getByTestId('stage-result-total')).toHaveTextContent(
      '10 moves'
    );
    expect(screen.getByText(/Run complete/)).toBeInTheDocument();
  });

  it('hides the retry button when the current stage has no result yet', () => {
    renderPanel({
      stages: stagesOf(3),
      currentStageIndex: 1,
      results: results([]),
    });
    expect(screen.queryByTestId('retry-stage-button')).not.toBeInTheDocument();
  });

  it('shows the retry button once the current stage has a result', () => {
    renderPanel({
      stages: stagesOf(3),
      currentStageIndex: 0,
      results: results([[0, { seconds: 30, movesMade: 4, movesRequired: 4 }]]),
    });
    expect(screen.getByTestId('retry-stage-button')).toBeInTheDocument();
  });

  it('calls onRetry when the retry button is clicked', () => {
    const onRetry = jest.fn();
    renderPanel({
      stages: stagesOf(3),
      currentStageIndex: 0,
      results: results([[0, { seconds: 30, movesMade: 4, movesRequired: 4 }]]),
      onRetry,
    });
    fireEvent.click(screen.getByTestId('retry-stage-button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('disables the retry button mid-transition', () => {
    renderPanel({
      stages: stagesOf(3),
      currentStageIndex: 0,
      results: results([[0, { seconds: 30, movesMade: 4, movesRequired: 4 }]]),
      isRetryDisabled: true,
    });
    expect(screen.getByTestId('retry-stage-button')).toBeDisabled();
  });

  it('merges adjacent upcoming stages that share the same difficulty into one fused pill', () => {
    // par 17 and par 20 are both "Challenging" (difficultyForMoves), par 5 is
    // "Beginner" and par 44 is "Expert" — only the middle pair should merge.
    renderPanel({
      stages: [
        { boardString: boardWithPieceAt(0), movesRequired: 5 },
        { boardString: boardWithPieceAt(1), movesRequired: 17 },
        { boardString: boardWithPieceAt(2), movesRequired: 20 },
        { boardString: boardWithPieceAt(3), movesRequired: 44 },
      ],
    });
    expect(screen.getByTestId('stage-difficulty-0')).toHaveTextContent(
      'Beginner'
    );
    // The first of the merged pair keeps the label and squares off its
    // trailing corner so it reads as fusing into the next pill.
    expect(screen.getByTestId('stage-difficulty-1')).toHaveTextContent(
      'Challenging'
    );
    expect(screen.getByTestId('stage-difficulty-1')).toHaveClass(
      'rounded-r-none'
    );
    // The second of the merged pair renders no label — its pill is just the
    // fused colour block, still in normal flow so its own par caption below
    // never shifts.
    expect(screen.getByTestId('stage-difficulty-2')).toHaveTextContent('');
    expect(screen.getByTestId('stage-difficulty-2')).toHaveClass(
      'rounded-l-none'
    );
    expect(screen.getByTestId('stage-difficulty-3')).toHaveTextContent(
      'Expert'
    );
  });

  it('does not merge a stage that already has a result with an upcoming one of the same difficulty', () => {
    renderPanel({
      stages: [
        { boardString: boardWithPieceAt(0), movesRequired: 17 },
        { boardString: boardWithPieceAt(1), movesRequired: 17 },
      ],
      results: results([[0, { seconds: 30, movesMade: 4, movesRequired: 4 }]]),
    });
    expect(screen.getByTestId('stage-difficulty-1')).toHaveTextContent(
      'Challenging'
    );
    expect(screen.getByTestId('stage-difficulty-1')).not.toHaveClass(
      'rounded-l-none'
    );
  });

  it('squares off both corners of a middle pill in a run of 3+ same-difficulty stages', () => {
    renderPanel({
      stages: [
        { boardString: boardWithPieceAt(0), movesRequired: 17 },
        { boardString: boardWithPieceAt(1), movesRequired: 17 },
        { boardString: boardWithPieceAt(2), movesRequired: 17 },
      ],
    });
    expect(screen.getByTestId('stage-difficulty-0')).toHaveClass(
      'rounded-r-none'
    );
    expect(screen.getByTestId('stage-difficulty-0')).not.toHaveClass(
      'rounded-l-none'
    );
    expect(screen.getByTestId('stage-difficulty-1')).toHaveClass(
      'rounded-l-none',
      'rounded-r-none'
    );
    expect(screen.getByTestId('stage-difficulty-1')).toHaveTextContent('');
    expect(screen.getByTestId('stage-difficulty-2')).toHaveClass(
      'rounded-l-none'
    );
    expect(screen.getByTestId('stage-difficulty-2')).not.toHaveClass(
      'rounded-r-none'
    );
    expect(screen.getByTestId('stage-difficulty-2')).toHaveTextContent('');
  });
});
