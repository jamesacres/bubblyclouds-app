import { Notes } from './notes';
import { Puzzle } from './puzzle';
import {
  BaseGameState,
  BaseServerState,
  GameStateMetadata,
  SelectNumber,
  SetSelectedCell,
  BaseSetAnswer,
} from '@sudoku-web/template/types/gameState';
import { Timer } from '@sudoku-web/template/types/timer';

// Re-export generic types
export type { SelectNumber, SetSelectedCell, GameStateMetadata };

// Sudoku-specific type
export type SetAnswer = BaseSetAnswer<number | Notes>;

// Sudoku-specific GameState and ServerState
export interface GameState extends BaseGameState<Puzzle> {
  answerStack: Puzzle[];
  initial: Puzzle<number>;
  final: Puzzle<number>;
}

export interface ServerState extends BaseServerState<Puzzle> {
  timer?: Timer;
}
