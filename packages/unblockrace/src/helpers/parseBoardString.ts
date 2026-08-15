import { Board, Orientation, Piece } from '../types/board';
import { pieceCells, pieceCol, pieceRow } from './piece';

// Constants matching the reference implementation (rush config.go)
export const MAX_PIECES = 18;
export const MIN_PIECE_SIZE = 2;
export const MIN_BOARD_SIZE = MIN_PIECE_SIZE + 1;
export const MAX_BOARD_SIZE = 16;

export const validateBoard = (board: Board): void => {
  const { width, height, pieces, walls } = board;

  if (width < MIN_BOARD_SIZE) {
    throw new Error(`board width must be >= ${MIN_BOARD_SIZE}`);
  }
  if (height < MIN_BOARD_SIZE) {
    throw new Error(`board height must be >= ${MIN_BOARD_SIZE}`);
  }
  if (width > MAX_BOARD_SIZE) {
    throw new Error(`board width must be <= ${MAX_BOARD_SIZE}`);
  }
  if (height > MAX_BOARD_SIZE) {
    throw new Error(`board height must be <= ${MAX_BOARD_SIZE}`);
  }
  if (pieces.length < 1) {
    throw new Error('board must have at least one piece');
  }
  if (pieces.length > MAX_PIECES) {
    throw new Error(`board must have <= ${MAX_PIECES} pieces`);
  }
  if (pieces[0].orientation !== 'horizontal') {
    throw new Error('primary piece must be horizontal');
  }

  const occupied = new Array<boolean>(width * height).fill(false);
  for (const wall of walls) {
    if (wall < 0 || wall >= width * height) {
      throw new Error('a wall is outside of the grid');
    }
    if (occupied[wall]) {
      throw new Error('a wall intersects another wall');
    }
    occupied[wall] = true;
  }

  const primaryRow = pieceRow(pieces[0], width);
  pieces.forEach((piece, i) => {
    const label = String.fromCharCode(65 + i);
    const row = pieceRow(piece, width);
    const col = pieceCol(piece, width);

    if (piece.size < MIN_PIECE_SIZE) {
      throw new Error(`piece ${label} must have size >= ${MIN_PIECE_SIZE}`);
    }
    if (i > 0 && piece.orientation === 'horizontal' && row === primaryRow) {
      throw new Error('no horizontal pieces can be on the primary row');
    }
    if (piece.orientation === 'horizontal') {
      if (row < 0 || row >= height || col < 0 || col + piece.size > width) {
        throw new Error(`piece ${label} is outside of the grid`);
      }
    } else {
      if (col < 0 || col >= width || row < 0 || row + piece.size > height) {
        throw new Error(`piece ${label} is outside of the grid`);
      }
    }
    for (const cell of pieceCells(piece, width)) {
      if (occupied[cell]) {
        throw new Error(`piece ${label} intersects with another piece`);
      }
      occupied[cell] = true;
    }
  });
};

// Port of the reference implementation's NewBoardFromString/NewBoard
// (rush model.go): piece orientation and size are derived from each label's
// cell indices, not stored (SPEC.md §2).
export const parseBoardString = (boardString: string): Board => {
  const size = Math.round(Math.sqrt(boardString.length));
  if (size * size !== boardString.length) {
    throw new Error('board must be square');
  }
  const width = size;
  const height = size;

  const positions = new Map<string, number[]>();
  const walls: number[] = [];
  for (let i = 0; i < boardString.length; i++) {
    const label = boardString[i];
    if (label === 'o' || label === '.') {
      continue;
    }
    if (label === 'x') {
      walls.push(i);
      continue;
    }
    if (!/^[A-Z]$/.test(label)) {
      throw new Error(`invalid board character ${label}`);
    }
    positions.set(label, [...(positions.get(label) || []), i]);
  }

  const labels = Array.from(positions.keys()).sort();
  const pieces: Piece[] = labels.map((label) => {
    const cells = positions.get(label) || [];
    if (cells.length < MIN_PIECE_SIZE) {
      throw new Error(`piece ${label} length must be >= ${MIN_PIECE_SIZE}`);
    }
    const stride = cells[1] - cells[0];
    if (stride !== 1 && stride !== width) {
      throw new Error(`piece ${label} has invalid shape`);
    }
    for (let i = 2; i < cells.length; i++) {
      if (cells[i] - cells[i - 1] !== stride) {
        throw new Error(`piece ${label} has invalid shape`);
      }
    }
    const orientation: Orientation = stride === 1 ? 'horizontal' : 'vertical';
    return { position: cells[0], size: cells.length, orientation };
  });

  const board: Board = { width, height, pieces, walls };
  validateBoard(board);
  return board;
};
