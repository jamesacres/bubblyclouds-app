import {
  UnblockCollectionPuzzle,
  UnblockRacePuzzleDto,
} from '../types/serverTypes';
import { solvedBoardString } from './boardToString';
import { puzzleTextToPuzzle } from './puzzleTextToPuzzle';

// Canonicalize the API's board string (piece letters relabeled by first-cell
// index, same as puzzleTextToPuzzle) so it matches what the puzzle page
// produces when parsing the URL's `board` param. Without this, a board the
// API sends in a non-canonical labeling would never string-equal its own
// canonicalized form once round-tripped through the URL — silently breaking
// every board-string identity check downstream (continue-to-next-puzzle,
// "already completed" lookups, deep-link locks, etc).
export const mapPuzzleDto = (
  puzzle: UnblockRacePuzzleDto
): UnblockCollectionPuzzle => {
  const initial = puzzleTextToPuzzle(puzzle.board);
  return {
    initial,
    final: solvedBoardString(initial),
    movesRequired: puzzle.moves,
    difficulty: puzzle.difficulty,
  };
};
