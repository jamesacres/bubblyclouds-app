import { Board, Move } from '../types/board';
import { pieceStride } from './piece';

export const doMove = (board: Board, move: Move): Board => {
  const piece = board.pieces[move.piece];
  const stride = pieceStride(piece, board.width);
  return {
    ...board,
    pieces: board.pieces.map((p, i) =>
      i === move.piece
        ? { ...p, position: p.position + stride * move.steps }
        : p
    ),
  };
};

export const undoMove = (board: Board, move: Move): Board =>
  doMove(board, { piece: move.piece, steps: -move.steps });
