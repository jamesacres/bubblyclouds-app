import { parseBoardString } from './parseBoardString';
import { boardToString } from './boardToString';
import puzzles from '../mockData/puzzles.json';

// Reference board from SPEC.md §1 (60 moves). Its labels skip C, so it is
// not canonical — boardToString relabels pieces consecutively.
const REFERENCE_BOARD = 'IBBxooIooLDDJAALooJoKEEMFFKooMGGHHHM';

describe('parseBoardString', () => {
  it('parses a 6x6 board', () => {
    const board = parseBoardString(REFERENCE_BOARD);
    expect(board.width).toBe(6);
    expect(board.height).toBe(6);
  });

  it('derives orientation and size from cell indices', () => {
    const board = parseBoardString(REFERENCE_BOARD);
    // A occupies indices 13,14 -> horizontal size 2
    expect(board.pieces[0]).toEqual({
      position: 13,
      size: 2,
      orientation: 'horizontal',
    });
    // I occupies indices 0,6 (stride = width) -> vertical size 2; sorted
    // labels are A,B,D,E,F,G,H,I,... so I is piece index 7
    const pieceI = board.pieces[7];
    expect(pieceI.orientation).toBe('vertical');
    expect(pieceI.position).toBe(0);
    expect(pieceI.size).toBe(2);
  });

  it('parses walls as fixed obstacles, not pieces', () => {
    const board = parseBoardString(REFERENCE_BOARD);
    expect(board.walls).toEqual([3]);
    expect(board.pieces).toHaveLength(12);
  });

  it('relabels non-canonical boards consecutively and is then stable', () => {
    const normalized = boardToString(parseBoardString(REFERENCE_BOARD));
    // Labels are now consecutive (D→C, E→D, ...) with the grid unchanged
    expect(normalized).toBe('HBBxooHooKCCIAAKooIoJDDLEEJooLFFGGGL');
    expect(boardToString(parseBoardString(normalized))).toBe(normalized);
  });

  it('treats . and o as empty', () => {
    const board = parseBoardString('AAooooooo');
    expect(board.pieces).toHaveLength(1);
    const withDots = parseBoardString('AA.......');
    expect(withDots.pieces).toHaveLength(1);
  });

  it('rejects non-square boards', () => {
    expect(() => parseBoardString('AAooo')).toThrow('board must be square');
  });

  it('rejects boards smaller than the minimum size', () => {
    expect(() => parseBoardString('AAoo')).toThrow('board width must be >= 3');
  });

  it('rejects pieces of size 1', () => {
    expect(() =>
      parseBoardString('AoooooooBBoooooooooooooooooooooooooo')
    ).toThrow('piece A length must be >= 2');
  });

  it('rejects a vertical primary piece', () => {
    const rows = ['Aooooo', 'Aooooo', 'oooooo', 'oooooo', 'oBBooo', 'oooooo'];
    expect(() => parseBoardString(rows.join(''))).toThrow(
      'primary piece must be horizontal'
    );
  });

  it('rejects diagonal / non-contiguous piece shapes', () => {
    // A at 0,1 then 8 — inconsistent stride
    expect(() =>
      parseBoardString('AAooooooAooooooooooooooooooooooooooo')
    ).toThrow('piece A has invalid shape');
  });

  it('rejects a second horizontal piece on the primary row', () => {
    const rows = ['oooooo', 'oooooo', 'AABBoo', 'oooooo', 'oooooo', 'oooooo'];
    expect(() => parseBoardString(rows.join(''))).toThrow(
      'no horizontal pieces can be on the primary row'
    );
  });

  it('allows vertical pieces crossing the primary row', () => {
    const rows = ['ooBooo', 'ooBooo', 'AABooo', 'oooooo', 'oooooo', 'oooooo'];
    const board = parseBoardString(rows.join(''));
    expect(board.pieces).toHaveLength(2);
    expect(board.pieces[1].orientation).toBe('vertical');
  });

  it('rejects invalid characters', () => {
    expect(() => parseBoardString('AA!oooooo')).toThrow(
      'invalid board character !'
    );
  });

  it('round-trips every seed puzzle', () => {
    for (const { boardString } of puzzles) {
      const board = parseBoardString(boardString);
      expect(boardToString(board)).toBe(boardString);
    }
  });
});
