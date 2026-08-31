import { render, screen, fireEvent } from '@testing-library/react';
import NextPuzzlePanel from './NextPuzzlePanel';

describe('NextPuzzlePanel', () => {
  it('renders the continue CTA and progress label', () => {
    render(
      <NextPuzzlePanel
        isLocked={false}
        progressLabel="3 of 8 Hard complete"
        onContinue={jest.fn()}
      />
    );

    expect(screen.getByTestId('next-puzzle-panel')).toBeInTheDocument();
    expect(
      screen.queryByTestId('next-puzzle-difficulty')
    ).not.toBeInTheDocument();
    expect(screen.getByText('3 of 8 Hard complete')).toBeInTheDocument();
    expect(screen.getByTestId('next-puzzle-continue')).toHaveTextContent(
      'Continue — next puzzle'
    );
  });

  it('fires onContinue when the CTA is tapped', () => {
    const onContinue = jest.fn();
    render(
      <NextPuzzlePanel
        isLocked={false}
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
        isLocked
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
        isLocked
        progressLabel="progress"
        onContinue={onContinue}
      />
    );

    fireEvent.click(screen.getByTestId('next-puzzle-continue'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
