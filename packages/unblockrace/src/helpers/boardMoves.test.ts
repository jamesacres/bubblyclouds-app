import { boardMoves, moveLabel, pieceMoveRange } from './boardMoves';
import { parseBoardString } from './parseBoardString';

describe('boardMoves', () => {
  it('allows a lone primary piece to slide the full row', () => {
    const board = parseBoardString(
      ['oooooo', 'oooooo', 'AAoooo', 'oooooo', 'oooooo', 'oooooo'].join('')
    );
    const moves = boardMoves(board);
    expect(moves).toEqual([
      { piece: 0, steps: 1 },
      { piece: 0, steps: 2 },
      { piece: 0, steps: 3 },
      { piece: 0, steps: 4 },
    ]);
  });

  it('stops at another piece', () => {
    const board = parseBoardString(
      ['oooooo', 'oooooo', 'AAoBoo', 'oooBoo', 'oooooo', 'oooooo'].join('')
    );
    // A can only move 1 step right before hitting B's column
    expect(pieceMoveRange(board, 0)).toEqual({ min: 0, max: 1 });
  });

  it('stops at walls', () => {
    const board = parseBoardString(
      ['oooooo', 'oooooo', 'AAoxoo', 'oooooo', 'oooooo', 'oooooo'].join('')
    );
    expect(pieceMoveRange(board, 0)).toEqual({ min: 0, max: 1 });
  });

  it('reports zero range for a boxed-in piece', () => {
    const board = parseBoardString(
      ['oooooo', 'oooooo', 'xAAxoo', 'oooooo', 'oooooo', 'oooooo'].join('')
    );
    expect(pieceMoveRange(board, 0)).toEqual({ min: 0, max: 0 });
  });

  it('computes vertical ranges against grid edges', () => {
    const board = parseBoardString(
      ['ooBooo', 'ooBooo', 'AABooo', 'oooooo', 'oooooo', 'oooooo'].join('')
    );
    // B is a size-3 vertical piece at the top: it can move down up to 3
    expect(pieceMoveRange(board, 1)).toEqual({ min: 0, max: 3 });
  });

  it('includes every intermediate step as a distinct move', () => {
    const board = parseBoardString(
      ['ooBooo', 'ooBooo', 'AABooo', 'oooooo', 'oooooo', 'oooooo'].join('')
    );
    const bMoves = boardMoves(board).filter((move) => move.piece === 1);
    expect(bMoves.map((move) => move.steps).sort()).toEqual([1, 2, 3]);
  });

  it('labels moves in the reference notation', () => {
    expect(moveLabel({ piece: 0, steps: 3 })).toBe('A+3');
    expect(moveLabel({ piece: 5, steps: -1 })).toBe('F-1');
  });
});
