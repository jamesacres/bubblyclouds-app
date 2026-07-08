import { doMove, undoMove } from './doMove';
import { parseBoardString } from './parseBoardString';
import { boardToString } from './boardToString';

describe('doMove / undoMove', () => {
  const initial = [
    'oooooo',
    'oooooo',
    'oAAoBo',
    'ooooBo',
    'oooooo',
    'oooooo',
  ].join('');

  it('moves a horizontal piece by steps', () => {
    const board = doMove(parseBoardString(initial), { piece: 0, steps: -1 });
    expect(board.pieces[0].position).toBe(12);
  });

  it('moves a vertical piece by steps * width', () => {
    const board = doMove(parseBoardString(initial), { piece: 1, steps: 2 });
    expect(board.pieces[1].position).toBe(28);
  });

  it('does not mutate the input board', () => {
    const board = parseBoardString(initial);
    doMove(board, { piece: 1, steps: 1 });
    expect(boardToString(board)).toBe(initial);
  });

  it('undoMove inverts doMove', () => {
    const board = parseBoardString(initial);
    const move = { piece: 1, steps: 2 };
    expect(boardToString(undoMove(doMove(board, move), move))).toBe(initial);
  });
});
