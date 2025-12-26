// Sudoku cell types
export interface Cell {
  id: string; // Unique cell ID in grid
  row: number; // 0-8
  column: number; // 0-8
  boxIndex: number; // 0-8
  value?: number; // 1-9 or empty
  isGiven: boolean; // Whether this was part of puzzle
  candidates: Set<number>; // Possible values
}
