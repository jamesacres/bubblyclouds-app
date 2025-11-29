import { Notes } from './notes';
import { Puzzle } from './puzzle';
import {
  BaseGameState,
  BaseServerState,
  SelectNumber,
  SetSelectedCell,
  BaseSetAnswer,
} from '@sudoku-web/template/types/gameState';
import { Timer } from '@sudoku-web/template/types/timer';

// Re-export generic types
export type { SelectNumber, SetSelectedCell };

// Sudoku-specific metadata type
export interface GameStateMetadata {
  difficulty?: string;
  sudokuId?: string;
  sudokuBookPuzzleId?: string;
  scannedAt?: string;
}

// Sudoku-specific type
export type SetAnswer = BaseSetAnswer<number | Notes>;

// Sudoku-specific GameState and ServerState
export interface GameState
  extends BaseGameState<Puzzle<number>, Puzzle, GameStateMetadata> {
  answerStack: Puzzle[];
  initial: Puzzle<number>;
  final: Puzzle<number>;
}

export interface ServerState
  extends BaseServerState<Puzzle<number>, Puzzle, GameStateMetadata> {
  timer?: Timer;
}
