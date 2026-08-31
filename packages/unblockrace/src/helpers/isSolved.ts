import { Board } from '../types/board';
import { pieceCol, pieceRow } from './piece';

// The primary piece always exits off the right edge of its row; the target
// is computed, never stored (SPEC.md §2).
export const getExitTarget = (board: Board): number => {
  const primary = board.pieces[0];
  return (pieceRow(primary, board.width) + 1) * board.width - primary.size;
};

export const isSolved = (board: Board): boolean => {
  const primary = board.pieces[0];
  return pieceCol(primary, board.width) + primary.size === board.width;
};
