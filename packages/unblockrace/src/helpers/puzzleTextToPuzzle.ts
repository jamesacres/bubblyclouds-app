import { boardToString } from './boardToString';
import { parseBoardString } from './parseBoardString';

// The board string IS the puzzle text (SPEC.md §5): this normalizes user
// input (trims, converts '.' empties to 'o', relabels pieces canonically)
// and throws on anything that isn't a valid board.
export const puzzleTextToPuzzle = (input: string): string =>
  boardToString(parseBoardString(input.trim()));
