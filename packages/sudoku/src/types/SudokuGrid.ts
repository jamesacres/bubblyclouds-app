import type { Cell } from './Cell';

// Sudoku grid types
export interface SudokuGrid {
  cells: Cell[]; // 81 cells
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

export interface SudokuState {
  puzzleId: string;
  grid: SudokuGrid;
  solution: SudokuGrid;
  isComplete: boolean;
  completedAt?: Date;
}
