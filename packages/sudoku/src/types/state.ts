import { Notes } from './notes';
import { Puzzle } from './puzzle';
import {
  BaseState,
  BaseServerState,
  BaseSetAnswer,
} from '@sudoku-web/template/types/state';
import { Timer } from '@sudoku-web/template/types/timer';

export type SelectNumber = (_value: number, forceNotes?: boolean) => void;

export type SetSelectedCell = (_cell: string | null) => void;

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
export interface GameState extends BaseState<
  Puzzle<number>,
  Puzzle,
  GameStateMetadata
> {
  answerStack: Puzzle[];
  initial: Puzzle<number>;
  final: Puzzle<number>;
}

export interface ServerState extends BaseServerState<
  Puzzle<number>,
  Puzzle,
  GameStateMetadata
> {
  timer?: Timer;
}
