import { render, screen } from '@testing-library/react';
import RaceHud from './RaceHud';
import { UnblockDifficultyDisplay } from '../helpers/difficultyDisplay';

const difficulty: UnblockDifficultyDisplay = {
  label: 'Challenging',
  chipClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
};

const baseProps = {
  onOpponentsClick: jest.fn(),
  currentStageIndex: 0,
  completedStageIndexes: new Set<number>(),
  difficulty,
};

describe('RaceHud', () => {
  it('shows the full difficulty label regardless of stage count', () => {
    render(<RaceHud {...baseProps} stageCount={1} />);
    expect(screen.getByText('Challenging')).toBeInTheDocument();
  });

  it('shows the full difficulty label once the stage filmstrip is on screen', () => {
    render(<RaceHud {...baseProps} stageCount={3} />);
    expect(screen.getByText('Challenging')).toBeInTheDocument();
  });
});
