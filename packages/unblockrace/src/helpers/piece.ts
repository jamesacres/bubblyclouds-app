import { Board, Piece } from '../types/board';

export const pieceStride = (piece: Piece, width: number): number =>
  piece.orientation === 'horizontal' ? 1 : width;

export const pieceRow = (piece: Piece, width: number): number =>
  Math.floor(piece.position / width);

export const pieceCol = (piece: Piece, width: number): number =>
  piece.position % width;

export const pieceCells = (piece: Piece, width: number): number[] => {
  const stride = pieceStride(piece, width);
  return Array.from(
    { length: piece.size },
    (_, i) => piece.position + i * stride
  );
};

export const buildOccupied = (board: Board): boolean[] => {
  const occupied = new Array<boolean>(board.width * board.height).fill(false);
  for (const wall of board.walls) {
    occupied[wall] = true;
  }
  for (const piece of board.pieces) {
    for (const cell of pieceCells(piece, board.width)) {
      occupied[cell] = true;
    }
  }
  return occupied;
};
