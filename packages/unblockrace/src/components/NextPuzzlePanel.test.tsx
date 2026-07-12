import { render, screen, fireEvent } from '@testing-library/react';
import NextPuzzlePanel from './NextPuzzlePanel';
import { NextCollectionPuzzle } from '../helpers/nextCollectionPuzzle';

const makeNext = (
  overrides: Partial<NextCollectionPuzzle> = {}
): NextCollectionPuzzle => ({
  puzzle: {
    initial: 'oooooo',
    final: 'oooooo',
    movesRequired: 5,
    difficulty: 'intermediate',
  },
  index: 3,
  unblockCollectionPuzzleId: 'ofthemonth-202607-puzzle-3',
  isLocked: false,
  ...overrides,
});

describe('NextPuzzlePanel', () => {
  it('renders the continue CTA, difficulty badge and progress label', () => {
    render(
      <NextPuzzlePanel
        next={makeNext()}
        progressLabel="3 of 8 Hard complete"
        onContinue={jest.fn()}
      />
    );

    expect(screen.getByTestId('next-puzzle-panel')).toBeInTheDocument();
    expect(screen.getByTestId('next-puzzle-difficulty')).toHaveTextContent(
      'Hard'
    );
    expect(screen.getByText('3 of 8 Hard complete')).toBeInTheDocument();
    expect(screen.getByTestId('next-puzzle-continue')).toHaveTextContent(
      'Continue — next puzzle'
    );
  });

  it('fires onContinue when the CTA is tapped', () => {
    const onContinue = jest.fn();
    render(
      <NextPuzzlePanel
        next={makeNext()}
        progressLabel="progress"
        onContinue={onContinue}
      />
    );

    fireEvent.click(screen.getByTestId('next-puzzle-continue'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('shows the Plus-locked label when the next puzzle is locked', () => {
    render(
      <NextPuzzlePanel
        next={makeNext({ isLocked: true })}
        progressLabel="progress"
        onContinue={jest.fn()}
      />
    );

    const cta = screen.getByTestId('next-puzzle-continue');
    expect(cta).toHaveTextContent('Continue (Plus)');
    expect(cta).not.toHaveTextContent('next puzzle');
  });

  it('still fires onContinue when locked (the deep-link gate catches it)', () => {
    const onContinue = jest.fn();
    render(
      <NextPuzzlePanel
        next={makeNext({ isLocked: true })}
        progressLabel="progress"
        onContinue={onContinue}
      />
    );

    fireEvent.click(screen.getByTestId('next-puzzle-continue'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
