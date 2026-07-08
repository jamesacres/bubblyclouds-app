import { Board, Move } from '../types/board';
import { buildOccupied, pieceCol, pieceRow, pieceStride } from './piece';

// Port of the reference implementation's Board.Moves() (rush model.go):
// walk backward from the piece's start cell and forward from its end cell
// until hitting an occupied cell or the grid edge. Every intermediate
// integer step is a legal move (SPEC.md §3).
export const boardMoves = (board: Board): Move[] => {
  const moves: Move[] = [];
  const occupied = buildOccupied(board);
  board.pieces.forEach((piece, i) => {
    const stride = pieceStride(piece, board.width);
    let reverseSteps: number;
    let forwardSteps: number;
    if (piece.orientation === 'vertical') {
      const y = pieceRow(piece, board.width);
      reverseSteps = -y;
      forwardSteps = board.height - piece.size - y;
    } else {
      const x = pieceCol(piece, board.width);
      reverseSteps = -x;
      forwardSteps = board.width - piece.size - x;
    }
    let idx = piece.position - stride;
    for (let steps = -1; steps >= reverseSteps; steps--) {
      if (occupied[idx]) {
        break;
      }
      moves.push({ piece: i, steps });
      idx -= stride;
    }
    idx = piece.position + piece.size * stride;
    for (let steps = 1; steps <= forwardSteps; steps++) {
      if (occupied[idx]) {
        break;
      }
      moves.push({ piece: i, steps });
      idx += stride;
    }
  });
  return moves;
};

// Legal drag range for one piece: the most negative and most positive step
// counts it can move (both 0 when boxed in). Matches the reference
// implementation's dragMin/dragMax calculation (rush web/app.js).
export const pieceMoveRange = (
  board: Board,
  pieceIndex: number
): { min: number; max: number } => {
  let min = 0;
  let max = 0;
  for (const move of boardMoves(board)) {
    if (move.piece === pieceIndex) {
      min = Math.min(min, move.steps);
      max = Math.max(max, move.steps);
    }
  }
  return { min, max };
};

export const moveLabel = (move: Move): string =>
  `${String.fromCharCode(65 + move.piece)}${move.steps >= 0 ? '+' : ''}${move.steps}`;
