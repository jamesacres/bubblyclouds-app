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
        { boardString: boardWithPieceAt(1), movesRequired: 15 },
        { boardString: boardWithPieceAt(2), movesRequired: 25 },
      ],
    });
    // difficultyForMoves → getDifficultyDisplay: 5=Tricky, 15=Challenging,
    // 25=Hard. Shown even though no stage has completed yet.
    expect(screen.getByTestId('stage-difficulty-0')).toHaveTextContent(
      'Tricky'
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
    expect(screen.getByTestId('stage-result-0')).toHaveTextContent('00:00:30');
    expect(screen.getByTestId('stage-result-0')).toHaveTextContent('4/4');
    // A completed stage ticks off its thumbnail
    expect(screen.getByTestId('stage-preview-0-complete')).toBeInTheDocument();
    // Over par gets the warning marker
    expect(screen.getByTestId('stage-result-1')).toHaveTextContent('7/5');
    expect(screen.getByTestId('stage-result-1')).toHaveTextContent('⚠️');
    // The final, not-yet-reached stage shows a placeholder and no tick
    expect(screen.getByTestId('stage-result-2')).toHaveTextContent('—');
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
      'Beat opponent by 00:00:03'
    );
  });

  it('phrases a negative delta as behind the opponent', () => {
    renderPanel({
      stages: stagesOf(2),
      results: results([[0, { seconds: 30, movesMade: 4, movesRequired: 4 }]]),
      opponentDeltaSeconds: -3,
    });
    expect(screen.getByTestId('stage-result-opponent')).toHaveTextContent(
      '00:00:03 behind opponent'
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
    // 30 + 40 = 70s = 00:01:10, 4 + 6 = 10 moves
    expect(screen.getByTestId('stage-result-total')).toHaveTextContent(
      '00:01:10'
    );
    expect(screen.getByTestId('stage-result-total')).toHaveTextContent(
      '10 moves'
    );
    expect(screen.getByText(/Run complete/)).toBeInTheDocument();
  });
});
