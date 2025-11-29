import React from 'react';
import { render, screen } from '@testing-library/react';
import SimpleSudoku from './SimpleSudoku';
import { Puzzle } from '../types/puzzle';

const createPuzzle = (value: number = 0): Puzzle<number> => {
  const createBox = () => ({
    '0': [value, value, value],
    '1': [value, value, value],
    '2': [value, value, value],
  });

  return {
    '0': {
      '0': createBox(),
      '1': createBox(),
      '2': createBox(),
    },
    '1': {
      '0': createBox(),
      '1': createBox(),
      '2': createBox(),
    },
    '2': {
      '0': createBox(),
      '1': createBox(),
      '2': createBox(),
    },
  };
};

describe('SimpleSudoku', () => {
  const emptyPuzzle = createPuzzle();

  it('renders a 9x9 grid', () => {
    const { container } = render(
      <SimpleSudoku
        initial={emptyPuzzle}
        final={emptyPuzzle}
        latest={emptyPuzzle}
      />
    );
    const cells = container.querySelectorAll('.flex.aspect-square');
    expect(cells.length).toBe(81);
  });

  it('displays initial values', () => {
    const puzzle = createPuzzle();
    puzzle[0][0][0][0] = 5;
    render(
      <SimpleSudoku initial={puzzle} final={emptyPuzzle} latest={emptyPuzzle} />
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('highlights correct guesses in green', () => {
    const initial = createPuzzle();
    const final = createPuzzle();
    const latest = createPuzzle();
    final[0][0][0][0] = 5;
    latest[0][0][0][0] = 5;

    const { container } = render(
      <SimpleSudoku initial={initial} final={final} latest={latest} />
    );
    const cell = container.querySelector('.bg-green-500');
    expect(cell).toBeInTheDocument();
  });

  it('highlights incorrect guesses in red', () => {
    const initial = createPuzzle();
    const final = createPuzzle();
    const latest = createPuzzle();
    final[0][0][0][0] = 5;
    latest[0][0][0][0] = 3;

    const { container } = render(
      <SimpleSudoku initial={initial} final={final} latest={latest} />
    );
    const cell = container.querySelector('.bg-red-500');
    expect(cell).toBeInTheDocument();
  });

  it('works with state prop', () => {
    const initial = createPuzzle();
    const final = createPuzzle();
    const latest = createPuzzle();
    initial[0][0][0][0] = 5;

    const { container } = render(
      <SimpleSudoku
        state={{
          initial,
          final,
          answerStack: [latest],
          metadata: {},
        }}
      />
    );
    const cells = container.querySelectorAll('.flex.aspect-square');
    expect(cells.length).toBe(81);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
