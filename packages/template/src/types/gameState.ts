import { Timer } from './timer';

export type SelectNumber = (_value: number, forceNotes?: boolean) => void;

export type SetSelectedCell = (_cell: string | null) => void;

export type BaseSetAnswer<TAnswer> = (_value: TAnswer) => void;

export interface GameStateMetadata {
  difficulty?: string;
  sudokuId?: string;
  sudokuBookPuzzleId?: string;
  scannedAt?: string;
}

export interface BaseGameState<TAnswer = unknown, TStackItem = TAnswer> {
  answerStack: TStackItem[];
  initial: TAnswer;
  final: TAnswer;
  completed?: {
    at: string;
    seconds: number;
  };
  metadata?: Partial<GameStateMetadata>;
}

export interface BaseServerState<TAnswer = unknown, TStackItem = TAnswer>
  extends BaseGameState<TAnswer, TStackItem> {
  timer?: Timer;
}
