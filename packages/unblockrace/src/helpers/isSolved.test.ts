import { getExitTarget, isSolved } from './isSolved';
import { doMove } from './doMove';
import { parseBoardString } from './parseBoardString';
import { solvedBoardString } from './boardToString';

describe('isSolved', () => {
  it('is false while the primary piece is away from the right edge', () => {
    const board = parseBoardString(
      ['oooooo', 'oooooo', 'AAoooo', 'oooooo', 'oooooo', 'oooooo'].join('')
    );
    expect(isSolved(board)).toBe(false);
  });

  it('is true when the primary piece is flush with the right edge', () => {
    const board = parseBoardString(
      ['oooooo', 'oooooo', 'ooooAA', 'oooooo', 'oooooo', 'oooooo'].join('')
    );
    expect(isSolved(board)).toBe(true);
  });

  it('becomes true after moving the primary piece to the exit', () => {
    const board = parseBoardString(
      ['oooooo', 'oooooo', 'AAoooo', 'oooooo', 'oooooo', 'oooooo'].join('')
    );
    expect(isSolved(doMove(board, { piece: 0, steps: 4 }))).toBe(true);
  });

  it('computes the exit target as the right edge of the primary row', () => {
    const board = parseBoardString(
      ['oooooo', 'oooooo', 'AAoooo', 'oooooo', 'oooooo', 'oooooo'].join('')
    );
    // (row 2 + 1) * 6 - size 2 = 16
    expect(getExitTarget(board)).toBe(16);
  });
});

describe('solvedBoardString', () => {
  it('places only the primary piece at the exit target', () => {
    const initial = [
      'oooooo',
      'oooooo',
      'AABooo',
      'ooBooo',
      'oooooo',
      'oooooo',
    ].join('');
    expect(solvedBoardString(initial)).toBe(
      ['oooooo', 'oooooo', 'ooooAA', 'oooooo', 'oooooo', 'oooooo'].join('')
    );
  });
});
