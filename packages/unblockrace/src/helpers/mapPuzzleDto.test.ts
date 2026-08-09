import { mapPuzzleDto } from './mapPuzzleDto';
import { solvedBoardString } from './boardToString';
import { puzzleTextToPuzzle } from './puzzleTextToPuzzle';
import { UnblockRacePuzzleDto } from '../types/serverTypes';
import puzzles from '../fixtures/puzzles.json';

const board = puzzles[0].boardString;

describe('mapPuzzleDto', () => {
  it('maps the API board/moves fields onto the app puzzle shape', () => {
    const dto: UnblockRacePuzzleDto = {
      board,
      moves: 7,
      difficulty: 'hard',
    };

    expect(mapPuzzleDto(dto)).toEqual({
      initial: board,
      final: solvedBoardString(board),
      movesRequired: 7,
      difficulty: 'hard',
    });
  });

  it.each(['beginner', 'challenging', 'hard', 'expert'] as const)(
    'passes the API difficulty %s straight through unchanged',
    (difficulty) => {
      expect(mapPuzzleDto({ board, moves: 1, difficulty }).difficulty).toBe(
        difficulty
      );
    }
  );

  it('canonicalizes a non-canonically-labeled API board to match the puzzle page', () => {
    // Regression test: this board is the same shape as an in-fixture board
    // but with its piece letters reordered (K/J/I used ahead of where their
    // first-cell index would canonically place them) — the kind of board a
    // real API response might hand back, and the exact bug that broke
    // continue-to-next-puzzle by making a collection puzzle's `initial`
    // never string-equal the same board string parsed off the /puzzle URL.
    const nonCanonicalBoard = 'ooBBoxoDDDoKooAAoKoEEJFFooIJooooIGGx';
    const mapped = mapPuzzleDto({
      board: nonCanonicalBoard,
      moves: 7,
      difficulty: 'hard',
    });

    // The mapped puzzle's initial must equal what the /puzzle page produces
    // when it canonicalizes the same raw board string off the URL — this is
    // the exact identity check getNextCollectionPuzzle relies on.
    expect(mapped.initial).toBe(puzzleTextToPuzzle(nonCanonicalBoard));
    expect(mapped.initial).not.toBe(nonCanonicalBoard);
  });
});
