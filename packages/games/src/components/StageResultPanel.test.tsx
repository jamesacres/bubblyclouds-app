import { ComponentProps } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StageResultPanel from './StageResultPanel';
import { RunStage } from '../types/runTypes';
import { PlayerStageResult } from '../types/scoringTypes';
import { DifficultyDisplay } from '../types/difficultyDisplay';

interface TestStage extends RunStage {
  movesRequired: number;
}

interface TestScore {
  movesMade: number;
  movesRequired: number;
}

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

const stagesOf = (count: number): TestStage[] =>
  Array.from({ length: count }, (_, i) => ({
    stageId: boardWithPieceAt(i),
    movesRequired: 5,
  }));

const results = (entries: [number, PlayerStageResult<TestScore>][]) =>
  new Map<number, PlayerStageResult<TestScore>>(entries);

const DIFFICULTY_DISPLAYS: { [key: string]: DifficultyDisplay } = {
  beginner: { label: 'Beginner', chipClass: 'bg-emerald-500/15' },
  challenging: { label: 'Challenging', chipClass: 'bg-amber-500/15' },
  hard: { label: 'Hard', chipClass: 'bg-orange-500/15' },
  expert: { label: 'Expert', chipClass: 'bg-rose-500/15' },
};

const difficultyForMoves = (moves: number): string => {
  if (moves <= 15) return 'beginner';
  if (moves <= 20) return 'challenging';
  if (moves <= 30) return 'hard';
  return 'expert';
};

const getDifficultyDisplay = (stage: TestStage): DifficultyDisplay =>
  DIFFICULTY_DISPLAYS[difficultyForMoves(stage.movesRequired)];

const formatSeconds = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${`${seconds}`.padStart(2, '0')}`;
};

const renderResult = (result: PlayerStageResult<TestScore>) => {
  const { movesMade, movesRequired } = result.score;
  const parState =
    movesMade > movesRequired
      ? ('over' as const)
      : movesMade < movesRequired
        ? ('under' as const)
        : ('met' as const);
  return { content: `${movesMade}/${movesRequired} moves`, parState };
};

const renderUpcoming = (stage: TestStage) => `par ${stage.movesRequired}`;

const renderTotal = (results: PlayerStageResult<TestScore>[]) => {
  const totalMoves = results.reduce((sum, r) => sum + r.score.movesMade, 0);
  return `${totalMoves} moves`;
};

const renderThumbnail = (stage: TestStage) => (
  <div data-testid={`thumbnail-${stage.stageId}`} />
);

const renderPanel = (
  props: Partial<ComponentProps<typeof StageResultPanel<TestStage, TestScore>>>
) =>
  render(
    <StageResultPanel<TestStage, TestScore>
      results={results([])}
      stages={stagesOf(3)}
      currentStageIndex={0}
      goToStage={jest.fn()}
      isTransitioning={false}
      runComplete={false}
      onRetry={jest.fn()}
      isRetryDisabled={false}
      formatSeconds={formatSeconds}
      renderThumbnail={renderThumbnail}
      getDifficultyDisplay={getDifficultyDisplay}
      renderResult={renderResult}
      renderUpcoming={renderUpcoming}
      renderTotal={renderTotal}
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
        { stageId: boardWithPieceAt(0), movesRequired: 5 },
        { stageId: boardWithPieceAt(1), movesRequired: 18 },
        { stageId: boardWithPieceAt(2), movesRequired: 25 },
      ],
    });
    expect(screen.getByTestId('stage-difficulty-0')).toHaveTextContent(
      'Beginner'
    );
    expect(screen.getByTestId('stage-difficulty-1')).toHaveTextContent(
      'Challenging'
    );
    expect(screen.getByTestId('stage-difficulty-2')).toHaveTextContent('Hard');
  });

  it('lists completed stages with time and score against par', () => {
    renderPanel({
      stages: stagesOf(3),
      currentStageIndex: 1,
      results: results([
        [0, { seconds: 30, score: { movesMade: 4, movesRequired: 4 } }],
        [1, { seconds: 45, score: { movesMade: 7, movesRequired: 5 } }],
      ]),
    });
    expect(screen.getByTestId('stage-result-0')).toHaveTextContent('0:30');
    expect(screen.getByTestId('stage-result-0')).toHaveTextContent('4/4');
    expect(screen.getByTestId('stage-preview-0-complete')).toBeInTheDocument();
    expect(screen.getByTestId('stage-difficulty-0')).toHaveTextContent(
      'Beginner'
    );
    expect(screen.getByTestId('stage-difficulty-0')).not.toHaveClass(
      'invisible'
    );
    expect(screen.getByTestId('stage-par-1')).toHaveTextContent('7/5 moves');
    expect(screen.getByTestId('stage-par-1')).toHaveClass('text-amber-600');
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

  it('shows a "View racing stats" button once the current stage has a result, when onViewStats is provided', () => {
    const onViewStats = jest.fn();
    renderPanel({
      stages: stagesOf(2),
      results: results([
        [0, { seconds: 30, score: { movesMade: 4, movesRequired: 4 } }],
      ]),
      onViewStats,
    });
    fireEvent.click(screen.getByTestId('stage-result-view-stats'));
    expect(onViewStats).toHaveBeenCalledTimes(1);
  });

  it('omits the "View racing stats" button when onViewStats is not provided', () => {
    renderPanel({
      stages: stagesOf(2),
      results: results([
        [0, { seconds: 30, score: { movesMade: 4, movesRequired: 4 } }],
      ]),
    });
    expect(
      screen.queryByTestId('stage-result-view-stats')
    ).not.toBeInTheDocument();
  });

  it('omits the "View racing stats" button before the current stage has a result', () => {
    renderPanel({
      stages: stagesOf(2),
      results: results([]),
      onViewStats: jest.fn(),
    });
    expect(
      screen.queryByTestId('stage-result-view-stats')
    ).not.toBeInTheDocument();
  });

  it('shows the run total once complete', () => {
    renderPanel({
      stages: stagesOf(2),
      currentStageIndex: 1,
      results: results([
        [0, { seconds: 30, score: { movesMade: 4, movesRequired: 4 } }],
        [1, { seconds: 40, score: { movesMade: 6, movesRequired: 5 } }],
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
      results: results([
        [0, { seconds: 30, score: { movesMade: 4, movesRequired: 4 } }],
      ]),
    });
    expect(screen.getByTestId('retry-stage-button')).toBeInTheDocument();
  });

  it('calls onRetry when the retry button is clicked', () => {
    const onRetry = jest.fn();
    renderPanel({
      stages: stagesOf(3),
      currentStageIndex: 0,
      results: results([
        [0, { seconds: 30, score: { movesMade: 4, movesRequired: 4 } }],
      ]),
      onRetry,
    });
    fireEvent.click(screen.getByTestId('retry-stage-button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('disables the retry button mid-transition', () => {
    renderPanel({
      stages: stagesOf(3),
      currentStageIndex: 0,
      results: results([
        [0, { seconds: 30, score: { movesMade: 4, movesRequired: 4 } }],
      ]),
      isRetryDisabled: true,
    });
    expect(screen.getByTestId('retry-stage-button')).toBeDisabled();
  });

  it('merges adjacent upcoming stages that share the same difficulty into one fused pill', () => {
    renderPanel({
      stages: [
        { stageId: boardWithPieceAt(0), movesRequired: 5 },
        { stageId: boardWithPieceAt(1), movesRequired: 17 },
        { stageId: boardWithPieceAt(2), movesRequired: 20 },
        { stageId: boardWithPieceAt(3), movesRequired: 44 },
      ],
    });
    expect(screen.getByTestId('stage-difficulty-0')).toHaveTextContent(
      'Beginner'
    );
    expect(screen.getByTestId('stage-difficulty-1')).toHaveTextContent(
      'Challenging'
    );
    expect(screen.getByTestId('stage-difficulty-1')).toHaveClass(
      'rounded-r-none'
    );
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
        { stageId: boardWithPieceAt(0), movesRequired: 17 },
        { stageId: boardWithPieceAt(1), movesRequired: 17 },
      ],
      results: results([
        [0, { seconds: 30, score: { movesMade: 4, movesRequired: 4 } }],
      ]),
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
        { stageId: boardWithPieceAt(0), movesRequired: 17 },
        { stageId: boardWithPieceAt(1), movesRequired: 17 },
        { stageId: boardWithPieceAt(2), movesRequired: 17 },
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
