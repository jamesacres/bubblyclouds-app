import { Notes } from './notes';
import { Puzzle } from './puzzle';
import { Timer } from './timer';

export type SelectNumber = (_value: number, forceNotes?: boolean) => void;

export type SetSelectedCell = (_cell: string | null) => void;

export type SetAnswer = (_value: number | Notes) => void;

export interface GameStateMetadata {
  difficulty: string;
  sudokuId: string;
  sudokuBookPuzzleId: string;
  scannedAt: string;
}

export interface GameState {
  answerStack: Puzzle[];
  initial: Puzzle<number>;
  final: Puzzle<number>;
  completed?: {
    at: string;
    seconds: number;
  };
  metadata?: Partial<GameStateMetadata>;
}

export interface ServerState extends GameState {
  timer?: Timer;
}
