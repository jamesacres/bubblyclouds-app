import { isPuzzleCheated } from './cheatDetection';
import { Puzzle } from '../types/puzzle';
import { ServerState } from '../types/state';

// Helper to create empty puzzle
const createEmptyPuzzle = (): Puzzle<number> => {
  const emptyRow = { 0: [0, 0, 0], 1: [0, 0, 0], 2: [0, 0, 0] };
  const emptyBox = { 0: emptyRow, 1: emptyRow, 2: emptyRow };
  return { 0: emptyBox, 1: emptyBox, 2: emptyBox };
};

// Helper to set a cell
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

describe('cheatDetection', () => {
  describe('isPuzzleCheated with Puzzle array input', () => {
    it('should return false for single puzzle state', () => {
      const answerStack = [createEmptyPuzzle()];
      expect(isPuzzleCheated(answerStack)).toBe(false);
    });

    it('should return false when only one cell changed between states', () => {
      const prev = createEmptyPuzzle();
      const current = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 5);

      const answerStack = [prev, current];
      expect(isPuzzleCheated(answerStack)).toBe(false);
    });

    it('should return true when two cells changed between consecutive states', () => {
      const prev = createEmptyPuzzle();
      let current = createEmptyPuzzle();
      current = setCellValue(current, 0, 0, 0, 0, 5);
      current = setCellValue(current, 0, 0, 0, 1, 7);

      const answerStack = [prev, current];
      expect(isPuzzleCheated(answerStack)).toBe(true);
    });

    it('should return true when three cells changed', () => {
      const prev = createEmptyPuzzle();
      let current = createEmptyPuzzle();
      current = setCellValue(current, 0, 0, 0, 0, 1);
      current = setCellValue(current, 0, 0, 0, 1, 2);
      current = setCellValue(current, 0, 0, 0, 2, 3);

      const answerStack = [prev, current];
      expect(isPuzzleCheated(answerStack)).toBe(true);
    });

    it('should only check last two states in stack', () => {
      // Create a history with multiple changes in earlier states
      let state1 = createEmptyPuzzle();
      state1 = setCellValue(state1, 0, 0, 0, 0, 1);
      state1 = setCellValue(state1, 0, 0, 1, 1, 2);
      state1 = setCellValue(state1, 0, 0, 2, 2, 3);

      // Transition to state 2 (only 1 cell changes)
      let state2 = createEmptyPuzzle();
      state2 = setCellValue(state2, 0, 0, 0, 0, 1);
      state2 = setCellValue(state2, 0, 0, 1, 1, 2);
      state2 = setCellValue(state2, 0, 0, 2, 2, 4); // Different from state1

      const answerStack = [state1, state2];
      expect(isPuzzleCheated(answerStack)).toBe(false); // Only 1 cell changed
    });

    it('should handle empty cells correctly', () => {
      const prev = createEmptyPuzzle();
      let current = createEmptyPuzzle();
      current = setCellValue(current, 0, 0, 0, 0, 0); // Explicitly zero

      const answerStack = [prev, current];
      expect(isPuzzleCheated(answerStack)).toBe(false);
    });
  });

  describe('isPuzzleCheated with ServerState input', () => {
    it('should return false if state is not completed', () => {
      const serverState: ServerState = {
        answerStack: [createEmptyPuzzle()],
        initial: createEmptyPuzzle(),
        final: createEmptyPuzzle(),
        completed: undefined,
      };

      expect(isPuzzleCheated(serverState)).toBe(false);
    });

    it('should return false if answerStack is missing', () => {
      const serverState: ServerState = {
        // @ts-expect-error - testing undefined answerStack
        answerStack: undefined,
        initial: createEmptyPuzzle(),
        final: createEmptyPuzzle(),
        completed: { at: '2024-01-01', seconds: 100 },
      };

      expect(isPuzzleCheated(serverState)).toBe(false);
    });

    it('should return false if answerStack has less than 2 states', () => {
      const serverState: ServerState = {
        answerStack: [createEmptyPuzzle()],
        initial: createEmptyPuzzle(),
        final: createEmptyPuzzle(),
        completed: { at: '2024-01-01', seconds: 100 },
      };

      expect(isPuzzleCheated(serverState)).toBe(false);
    });

    it('should detect cheat in valid ServerState', () => {
      const prev = createEmptyPuzzle();
      let current = createEmptyPuzzle();
      current = setCellValue(current, 0, 0, 0, 0, 1);
      current = setCellValue(current, 0, 0, 1, 1, 2);

      const serverState: ServerState = {
        answerStack: [prev, current],
        initial: createEmptyPuzzle(),
        final: createEmptyPuzzle(),
        completed: { at: '2024-01-01', seconds: 100 },
      };

      expect(isPuzzleCheated(serverState)).toBe(true);
    });

    it('should return false for legitimate state', () => {
      const prev = createEmptyPuzzle();
      let current = createEmptyPuzzle();
      current = setCellValue(current, 0, 0, 0, 0, 1);

      const serverState: ServerState = {
        answerStack: [prev, current],
        initial: createEmptyPuzzle(),
        final: createEmptyPuzzle(),
        completed: { at: '2024-01-01', seconds: 100 },
      };

      expect(isPuzzleCheated(serverState)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle changing from one value to another (different numbers)', () => {
      const prev = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 3);
      const current = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 5);

      const answerStack = [prev, current];
      expect(isPuzzleCheated(answerStack)).toBe(false); // Only 1 cell changed
    });

    it('should count cells changing from filled to empty', () => {
      const prev = setCellValue(createEmptyPuzzle(), 0, 0, 0, 0, 5);
      const current = createEmptyPuzzle();

      const answerStack = [prev, current];
      expect(isPuzzleCheated(answerStack)).toBe(false); // Only 1 cell changed
    });

    it('should handle many differences across entire puzzle', () => {
      const prev = createEmptyPuzzle();
      let current = createEmptyPuzzle();

      // Fill many cells
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          current = setCellValue(current, i, j, i % 3, j % 3, (i + j) % 9 || 1);
        }
      }

      const answerStack = [prev, current];
      expect(isPuzzleCheated(answerStack)).toBe(true); // Many cells changed
    });

    it('should handle cells with Notes (complex values)', () => {
      const prev = createEmptyPuzzle();
      let current: any = createEmptyPuzzle();
      // Simulate notes being set (though type system uses numbers in practice)
      current[0][0][0][0] = { 1: true, 2: true };
      current[0][0][0][1] = { 3: true };

      const answerStack = [prev, current];
      expect(isPuzzleCheated(answerStack)).toBe(true); // 2 cells changed
    });

    it('should handle exactly 2 cells changing (boundary case)', () => {
      const prev = createEmptyPuzzle();
      let current = createEmptyPuzzle();
      current = setCellValue(current, 0, 0, 0, 0, 1);
      current = setCellValue(current, 1, 1, 1, 1, 2);

      const answerStack = [prev, current];
      expect(isPuzzleCheated(answerStack)).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should handle legitimate game progression', () => {
      const initial = createEmptyPuzzle();
      let state1 = createEmptyPuzzle();
      state1 = setCellValue(state1, 0, 0, 0, 0, 1);

      let state2 = createEmptyPuzzle();
      state2 = setCellValue(state2, 0, 0, 0, 0, 1);
      state2 = setCellValue(state2, 0, 0, 0, 1, 2);

      let state3 = createEmptyPuzzle();
      state3 = setCellValue(state3, 0, 0, 0, 0, 1);
      state3 = setCellValue(state3, 0, 0, 0, 1, 2);
      state3 = setCellValue(state3, 0, 0, 0, 2, 3);

      // Check each transition
      expect(isPuzzleCheated([initial, state1])).toBe(false);
      expect(isPuzzleCheated([state1, state2])).toBe(false);
      expect(isPuzzleCheated([state2, state3])).toBe(false);

      // Full progression is legitimate
      expect(isPuzzleCheated([initial, state1, state2, state3])).toBe(false);
    });
  });
});
