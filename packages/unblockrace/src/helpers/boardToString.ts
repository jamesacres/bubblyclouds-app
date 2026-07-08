import { Board } from '../types/board';
import { pieceCells, pieceRow } from './piece';
import { parseBoardString } from './parseBoardString';

export const boardToString = (board: Board): string => {
  const grid = new Array<string>(board.width * board.height).fill('o');
  for (const wall of board.walls) {
    grid[wall] = 'x';
  }
  board.pieces.forEach((piece, i) => {
    const label = String.fromCharCode(65 + i);
    for (const cell of pieceCells(piece, board.width)) {
      grid[cell] = label;
    }
  });
  return grid.join('');
};

// Goal representation used as the `final` state: the primary piece at the
// exit target on its row, walls kept, all other pieces omitted (their final
// positions depend on the solution path taken).
export const solvedBoardString = (initialBoardString: string): string => {
  const board = parseBoardString(initialBoardString);
  const primary = board.pieces[0];
  const target =
    (pieceRow(primary, board.width) + 1) * board.width - primary.size;
  return boardToString({
    ...board,
    pieces: [{ ...primary, position: target }],
    walls: board.walls.filter(
      (wall) => wall < target || wall >= target + primary.size
    ),
  });
};
