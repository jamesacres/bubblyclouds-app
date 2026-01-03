import { describe, it, expect } from '@jest/globals';
import {
  calculateCompletionPercentage,
  calculateCompletionPercentageFromState,
} from './calculateCompletionPercentage';
import { Puzzle } from '../types/puzzle';

// Helper to create empty puzzle
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

describe('calculateCompletionPercentage', () => {
  describe('basic functionality', () => {
    it('should return 0 when latest is undefined', () => {
      const initial = createEmptyPuzzle();
      const final = createEmptyPuzzle();
      expect(calculateCompletionPercentage(initial, final, undefined)).toBe(0);
    });

    it('should return 0 for empty puzzle with no changes', () => {
      const initial = createEmptyPuzzle();
      const final = createEmptyPuzzle();
      const latest = createEmptyPuzzle();

      expect(calculateCompletionPercentage(initial, final, latest)).toBe(0);
    });

    it('should return 100 for fully completed puzzle', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let latest = createEmptyPuzzle();

      // Set all cells to be filled
      for (let bx = 0; bx < 3; bx++) {
        for (let by = 0; by < 3; by++) {
          for (let cx = 0; cx < 3; cx++) {
            for (let cy = 0; cy < 3; cy++) {
              // @ts-expect-error
              if (!initial[bx][by][cx][cy]) {
                final = setCellValue(final, bx, by, cx, cy, 5);
                latest = setCellValue(latest, bx, by, cx, cy, 5);
              }
            }
          }
        }
      }

      expect(calculateCompletionPercentage(initial, final, latest)).toBe(100);
    });

    it('should return 100 when all empty cells are filled correctly', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let latest = createEmptyPuzzle();

      // Fill all cells with the same value
      for (let bx = 0; bx < 3; bx++) {
        for (let by = 0; by < 3; by++) {
          for (let cx = 0; cx < 3; cx++) {
            for (let cy = 0; cy < 3; cy++) {
              final = setCellValue(final, bx, by, cx, cy, 5);
              latest = setCellValue(latest, bx, by, cx, cy, 5);
            }
          }
        }
      }

      expect(calculateCompletionPercentage(initial, final, latest)).toBe(100);
    });
  });

  describe('percentage calculations', () => {
    it('should calculate 50% completion for half-filled puzzle', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let latest = createEmptyPuzzle();

      // Fill first half of cells with correct answers (40 out of 81 ≈ 49%)
      let cellCount = 0;
      for (let bx = 0; bx < 3; bx++) {
        for (let by = 0; by < 3; by++) {
          for (let cx = 0; cx < 3; cx++) {
            for (let cy = 0; cy < 3; cy++) {
              // @ts-expect-error
              if (!initial[bx][by][cx][cy]) {
                cellCount++;
                final = setCellValue(final, bx, by, cx, cy, 5);

                // Only fill first half
                if (cellCount <= 40) {
                  latest = setCellValue(latest, bx, by, cx, cy, 5);
                }
              }
            }
          }
        }
      }

      expect(calculateCompletionPercentage(initial, final, latest)).toBe(49);
    });

    it('should handle single cell completion', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let latest = createEmptyPuzzle();

      // Fill only one cell
      final = setCellValue(final, 0, 0, 0, 0, 5);
      latest = setCellValue(latest, 0, 0, 0, 0, 5);

      // 1 out of 81 cells = 1.23% ≈ 1%
      expect(calculateCompletionPercentage(initial, final, latest)).toBe(1);
    });

    it('should calculate percentage for partial fills', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let latest = createEmptyPuzzle();

      // Fill 10 cells correctly across multiple boxes
      let cellIndex = 0;
      for (let bx = 0; bx < 3 && cellIndex < 10; bx++) {
        for (let by = 0; by < 3 && cellIndex < 10; by++) {
          for (let cx = 0; cx < 3 && cellIndex < 10; cx++) {
            for (let cy = 0; cy < 3 && cellIndex < 10; cy++) {
              final = setCellValue(final, bx, by, cx, cy, cellIndex + 1);
              latest = setCellValue(latest, bx, by, cx, cy, cellIndex + 1);
              cellIndex++;
            }
          }
        }
      }

      // 10 out of 81 empty cells = ~12%
      expect(calculateCompletionPercentage(initial, final, latest)).toBe(12);
    });
  });

  describe('pre-filled cells', () => {
    it('should ignore pre-filled initial cells in calculation', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let latest = createEmptyPuzzle();

      // Pre-fill some cells
      initial = setCellValue(initial, 0, 0, 0, 0, 1);
      initial = setCellValue(initial, 0, 0, 1, 1, 2);

      // Fill one empty cell
      final = setCellValue(final, 0, 0, 0, 1, 5);
      latest = setCellValue(latest, 0, 0, 0, 1, 5);

      // Should only count the 1 filled empty cell vs 79 total empty cells
      expect(calculateCompletionPercentage(initial, final, latest)).toBe(1);
    });

    it('should only count empty cells as total', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let latest = createEmptyPuzzle();

      // Pre-fill half the puzzle
      for (let i = 0; i < 40; i++) {
        const bx = Math.floor(i / 27);
        const by = Math.floor((i % 27) / 9);
        const cx = Math.floor((i % 9) / 3);
        const cy = i % 3;
        initial = setCellValue(initial, bx, by, cx, cy, i + 1);
      }

      // Fill all remaining empty cells
      for (let bx = 0; bx < 3; bx++) {
        for (let by = 0; by < 3; by++) {
          for (let cx = 0; cx < 3; cx++) {
            for (let cy = 0; cy < 3; cy++) {
              // @ts-expect-error
              if (!initial[bx][by][cx][cy]) {
                final = setCellValue(final, bx, by, cx, cy, 5);
                latest = setCellValue(latest, bx, by, cx, cy, 5);
              }
            }
          }
        }
      }

      // All 41 empty cells filled = 100%
      expect(calculateCompletionPercentage(initial, final, latest)).toBe(100);
    });
  });

  describe('incorrect entries', () => {
    it('should not count incorrect cells as completed', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let latest = createEmptyPuzzle();

      final = setCellValue(final, 0, 0, 0, 0, 5);
      latest = setCellValue(latest, 0, 0, 0, 0, 3); // Wrong answer

      // 0 correct out of 81 = 0%
      expect(calculateCompletionPercentage(initial, final, latest)).toBe(0);
    });

    it('should only count cells matching final answer', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let latest = createEmptyPuzzle();

      // Set correct and incorrect answers
      final = setCellValue(final, 0, 0, 0, 0, 5);
      final = setCellValue(final, 0, 0, 0, 1, 7);

      latest = setCellValue(latest, 0, 0, 0, 0, 5); // Correct
      latest = setCellValue(latest, 0, 0, 0, 1, 3); // Incorrect

      // 1 correct out of 81 = 1%
      expect(calculateCompletionPercentage(initial, final, latest)).toBe(1);
    });

    it('should handle mixed correct and incorrect entries', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let latest = createEmptyPuzzle();

      // Fill 10 cells in final
      for (let i = 0; i < 10; i++) {
        final = setCellValue(final, 0, 0, i % 3, Math.floor(i / 3), i + 1);
      }

      // Fill 5 correctly and 5 incorrectly in latest
      for (let i = 0; i < 5; i++) {
        latest = setCellValue(latest, 0, 0, i % 3, Math.floor(i / 3), i + 1);
      }
      for (let i = 5; i < 10; i++) {
        latest = setCellValue(latest, 0, 0, i % 3, Math.floor(i / 3), 99);
      }

      // 5 correct out of 81 = 6%
      expect(calculateCompletionPercentage(initial, final, latest)).toBe(6);
    });
  });

  describe('edge cases', () => {
    it('should handle all pre-filled puzzle', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let latest = createEmptyPuzzle();

      // Pre-fill entire puzzle
      for (let bx = 0; bx < 3; bx++) {
        for (let by = 0; by < 3; by++) {
          for (let cx = 0; cx < 3; cx++) {
            for (let cy = 0; cy < 3; cy++) {
              initial = setCellValue(initial, bx, by, cx, cy, 1);
            }
          }
        }
      }

      // 0 empty cells = 100%
      expect(calculateCompletionPercentage(initial, final, latest)).toBe(100);
    });

    it('should round to nearest integer', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let latest = createEmptyPuzzle();

      // Fill 27 cells (27/81 = 33.33%)
      let cellIndex = 0;
      for (let bx = 0; bx < 3 && cellIndex < 27; bx++) {
        for (let by = 0; by < 3 && cellIndex < 27; by++) {
          for (let cx = 0; cx < 3 && cellIndex < 27; cx++) {
            for (let cy = 0; cy < 3 && cellIndex < 27; cy++) {
              final = setCellValue(final, bx, by, cx, cy, cellIndex + 1);
              latest = setCellValue(latest, bx, by, cx, cy, cellIndex + 1);
              cellIndex++;
            }
          }
        }
      }

      expect(calculateCompletionPercentage(initial, final, latest)).toBe(33);
    });

    it('should handle rounding up', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let latest = createEmptyPuzzle();

      // Fill 41 cells (41/81 = 50.617... rounds to 51%)
      let cellIndex = 0;
      for (let bx = 0; bx < 3 && cellIndex < 41; bx++) {
        for (let by = 0; by < 3 && cellIndex < 41; by++) {
          for (let cx = 0; cx < 3 && cellIndex < 41; cx++) {
            for (let cy = 0; cy < 3 && cellIndex < 41; cy++) {
              final = setCellValue(final, bx, by, cx, cy, cellIndex + 1);
              latest = setCellValue(latest, bx, by, cx, cy, cellIndex + 1);
              cellIndex++;
            }
          }
        }
      }

      expect(calculateCompletionPercentage(initial, final, latest)).toBe(51);
    });
  });

  describe('calculateCompletionPercentageFromState', () => {
    it('should work with state object', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let latest = createEmptyPuzzle();

      // Fill one cell
      final = setCellValue(final, 0, 0, 0, 0, 5);
      latest = setCellValue(latest, 0, 0, 0, 0, 5);

      const state = { initial, final, answerStack: [latest], metadata: {} };
      expect(calculateCompletionPercentageFromState(state)).toBe(1);
    });

    it('should return same result as direct function call', () => {
      let initial = createEmptyPuzzle();
      let final = createEmptyPuzzle();
      let latest = createEmptyPuzzle();

      // Fill multiple cells
      for (let i = 0; i < 10; i++) {
        final = setCellValue(final, 0, 0, i % 3, Math.floor(i / 3), i + 1);
        latest = setCellValue(latest, 0, 0, i % 3, Math.floor(i / 3), i + 1);
      }

      const directResult = calculateCompletionPercentage(
        initial,
        final,
        latest
      );
      const stateResult = calculateCompletionPercentageFromState({
        initial,
        final,
        answerStack: [latest],
        metadata: {},
      });

      expect(stateResult).toBe(directResult);
    });
  });
});
