import { Board, Piece } from '../types/board';
import {
  PRIMARY_PIECE_COLOR,
  assignPieceColors,
  getPieceColor,
} from './pieceColors';

const horizontal = (position: number, size = 2): Piece => ({
  position,
  size,
  orientation: 'horizontal',
});

const vertical = (position: number, size = 2): Piece => ({
  position,
  size,
  orientation: 'vertical',
});

const boardOf = (pieces: Piece[]): Board => ({
  width: 6,
  height: 6,
  pieces,
  walls: [],
});

describe('getPieceColor', () => {
  it('gives the primary piece the theme colour', () => {
    expect(getPieceColor(0)).toBe(PRIMARY_PIECE_COLOR);
  });

  it('skips palette entries that clash with the theme', () => {
    // magenta clashes with the fuchsia theme, so piece B falls through to
    // the next non-clashing entry
    expect(getPieceColor(1, 'fuchsia')).toBe('#06b6d4');
  });
});

describe('assignPieceColors', () => {
  it('keeps the primary piece on the theme colour', () => {
    const board = boardOf([horizontal(12), vertical(0)]);
    expect(assignPieceColors(board)[0]).toBe(PRIMARY_PIECE_COLOR);
  });

  it('moves a look-alike hue off a touching piece', () => {
    // Index cycling alone would give piece B magenta and piece F violet —
    // two purples side by side. F touches B, so it must advance to the next
    // family (rose).
    const board = boardOf([
      horizontal(12), // A: hero, row 2
      vertical(0), // B: rows 0-1, col 0 → magenta (purple family)
      horizontal(4), // C: row 0, cols 4-5 → cyan
      horizontal(28), // D: row 4, cols 4-5 → amber
      vertical(24, 2), // E: rows 4-5, col 0 → lime
      vertical(1), // F: rows 0-1, col 1, touching B
    ]);
    const colors = assignPieceColors(board);
    expect(colors[1]).toBe('#d946ef');
    expect(colors[5]).toBe('#f43f5e');
  });

  it('keeps the default cycle for pieces that touch nothing similar', () => {
    const board = boardOf([horizontal(12), vertical(0), horizontal(4)]);
    const colors = assignPieceColors(board);
    expect(colors[1]).toBe('#d946ef');
    expect(colors[2]).toBe('#06b6d4');
  });

  it('never hands the hero hue to a rival under a theme', () => {
    const board = boardOf([horizontal(12), vertical(0), vertical(1)]);
    const colors = assignPieceColors(board, 'blue');
    expect(colors).not.toContain('#3b82f6');
  });
});
