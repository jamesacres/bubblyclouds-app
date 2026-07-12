import { puzzleTextToPuzzle } from './puzzleTextToPuzzle';

// Same reference board used by parseBoardString.test.ts / boardToString: its
// labels skip C, so round-tripping it proves the canonical-relabel behavior.
const REFERENCE_BOARD = 'IBBxooIooLDDJAALooJoKEEMFFKooMGGHHHM';

describe('puzzleTextToPuzzle', () => {
  it('relabels pieces canonically starting from A', () => {
    const result = puzzleTextToPuzzle(REFERENCE_BOARD);
    // Piece "A" in the reference board occupies indices 13,14; after
    // canonical relabeling (sorted by first index) it becomes piece "A".
    expect(result[13]).toBe('A');
    expect(result[14]).toBe('A');
  });

  it('is idempotent on an already-canonical board', () => {
    const once = puzzleTextToPuzzle(REFERENCE_BOARD);
    const twice = puzzleTextToPuzzle(once);
    expect(twice).toBe(once);
  });

  it('trims surrounding whitespace before parsing', () => {
    const withWhitespace = `  ${REFERENCE_BOARD}  \n`;
    expect(puzzleTextToPuzzle(withWhitespace)).toBe(
      puzzleTextToPuzzle(REFERENCE_BOARD)
    );
  });

  it('converts "." empties to "o"', () => {
    const dotted = REFERENCE_BOARD.replaceAll('o', '.');
    expect(puzzleTextToPuzzle(dotted)).toBe(
      puzzleTextToPuzzle(REFERENCE_BOARD)
    );
  });

  it('preserves walls', () => {
    const result = puzzleTextToPuzzle(REFERENCE_BOARD);
    expect(result[3]).toBe('x');
  });

  it('throws on an invalid board', () => {
    expect(() => puzzleTextToPuzzle('not-a-board')).toThrow();
  });
});
