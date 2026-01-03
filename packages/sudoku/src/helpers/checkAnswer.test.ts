import { checkCell, checkGrid, isInitialCell } from './checkAnswer';
import { Puzzle } from '../types/puzzle';

// Helper to create a simple 3x3 empty puzzle
const createEmptyPuzzle = (): Puzzle<number> => {
  const emptyRow = { 0: [0, 0, 0], 1: [0, 0, 0], 2: [0, 0, 0] };
  const emptyBox = { 0: emptyRow, 1: emptyRow, 2: emptyRow };
  return { 0: emptyBox, 1: emptyBox, 2: emptyBox };
};

// Helper to set a cell value
const setCellValue = (
  puzzle: Puzzle<number>,
  boxX: number,
  boxY: number,
  cellX: number,
  cellY: number,
  value: number
): Puzzle<number> => {
  const result = JSON.parse(JSON.stringify(puzzle));
  result[boxX][boxY][cellX][cellY] = value;
  return result;
};

describe('checkAnswer helpers', () => {
  describe('checkGrid', () => {
    it('should mark all cells as complete when puzzle is solved correctly', () => {
      const initial = createEmptyPuzzle();
      const final = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 5);
      const answer = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 5);

      const { validation, isComplete } = checkGrid(initial, final, answer);

      expect(validation[0][0][0][0]).toBe(true);
      expect(isComplete).toBe(true);
    });

    it('should mark incorrect cells as invalid', () => {
      const initial = createEmptyPuzzle();
      const final = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 5);
      const answer = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 3);

      const { validation, isComplete } = checkGrid(initial, final, answer);

      expect(validation[0][0][0][0]).toBe(false);
      expect(isComplete).toBe(false);
    });

    it('should ignore pre-filled initial cells', () => {
      const initial = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 1);
      const final = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 1);
      const answer = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 5);

      const { validation } = checkGrid(initial, final, answer);

      // Initial cell should remain undefined (not validated)
      expect(validation[0][0][0][0]).toBeUndefined();
    });

    it('should handle multiple cell validation', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let answer = createEmptyPuzzle();

      // Set up multiple cells
      initial = setCellValue(initial, 0, 0, 0, 0, 1); // Pre-filled
      final = setCellValue(final, 0, 0, 0, 1, 2); // User filled (correct)
      final = setCellValue(final, 0, 0, 1, 0, 3); // User filled (wrong)
      answer = setCellValue(answer, 0, 0, 0, 1, 2); // Correct answer
      answer = setCellValue(answer, 0, 0, 1, 0, 5); // Correct answer

      const { validation, isComplete } = checkGrid(initial, final, answer);

      expect(validation[0][0][0][0]).toBeUndefined(); // Initial cell ignored
      expect(validation[0][0][0][1]).toBe(true); // Correct cell
      expect(validation[0][0][1][0]).toBe(false); // Incorrect cell
      expect(isComplete).toBe(false);
    });

    it('should return true for isComplete only when all non-initial cells are correct', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let answer = createEmptyPuzzle();

      // Fill one cell correctly
      final = setCellValue(final, 0, 0, 0, 0, 5);
      answer = setCellValue(answer, 0, 0, 0, 0, 5);

      const { isComplete } = checkGrid(initial, final, answer);
      expect(isComplete).toBe(true);
    });
  });

  describe('isInitialCell', () => {
    it('should return true for pre-filled cells', () => {
      const initial = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 5);
      expect(isInitialCell('box:0,0,cell:0,0', initial)).toBe(true);
    });

    it('should return false for empty cells', () => {
      const initial = createEmptyPuzzle();
      expect(isInitialCell('box:0,0,cell:0,0', initial)).toBe(false);
    });

    it('should handle multiple pre-filled cells', () => {
      let initial = createEmptyPuzzle();
      initial = setCellValue(initial, 0, 0, 0, 0, 1);
      initial = setCellValue(initial, 1, 1, 1, 1, 5);
      initial = setCellValue(initial, 2, 2, 2, 2, 9);

      expect(isInitialCell('box:0,0,cell:0,0', initial)).toBe(true);
      expect(isInitialCell('box:1,1,cell:1,1', initial)).toBe(true);
      expect(isInitialCell('box:2,2,cell:2,2', initial)).toBe(true);
      expect(isInitialCell('box:0,1,cell:0,0', initial)).toBe(false);
    });

    it('should handle invalid cell IDs gracefully', () => {
      const initial = createEmptyPuzzle();
      // splitCellId returns default (0,0) for invalid format
      expect(isInitialCell('invalid-format', initial)).toBe(false);
    });
  });

  describe('checkCell', () => {
    it('should validate a single cell correctly', () => {
      const initial = createEmptyPuzzle();
      const final = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 5);
      const answer = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 5);

      const validation = checkCell('box:0,0,cell:0,0', initial, final, answer);

      expect(validation[0][0][0][0]).toBe(true);
    });

    it('should mark incorrect cell as invalid', () => {
      const initial = createEmptyPuzzle();
      const final = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 5);
      const answer = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 3);

      const validation = checkCell('box:0,0,cell:0,0', initial, final, answer);

      expect(validation[0][0][0][0]).toBe(false);
    });

    it('should not validate pre-filled initial cells', () => {
      const initial = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 1);
      const final = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 1);
      const answer = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 5);

      const validation = checkCell('box:0,0,cell:0,0', initial, final, answer);

      expect(validation[0][0][0][0]).toBeUndefined();
    });

    it('should only validate the specified cell', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let answer = createEmptyPuzzle();

      final = setCellValue(final, 0, 0, 0, 0, 5);
      final = setCellValue(final, 0, 0, 1, 1, 9);
      answer = setCellValue(answer, 0, 0, 0, 0, 5);
      answer = setCellValue(answer, 0, 0, 1, 1, 3);

      const validation = checkCell('box:0,0,cell:0,0', initial, final, answer);

      expect(validation[0][0][0][0]).toBe(true); // Validated cell
      expect(validation[0][0][1][1]).toBeUndefined(); // Not validated
    });

    it('should handle different cells from different boxes', () => {
      const initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let answer = createEmptyPuzzle();

      final = setCellValue(final, 1, 1, 1, 1, 7);
      answer = setCellValue(answer, 1, 1, 1, 1, 7);

      const validation = checkCell('box:1,1,cell:1,1', initial, final, answer);

      expect(validation[1][1][1][1]).toBe(true);
    });
  });
});
