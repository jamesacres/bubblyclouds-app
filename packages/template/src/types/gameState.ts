import { Timer } from './timer';

export type SelectNumber = (_value: number, forceNotes?: boolean) => void;

export type SetSelectedCell = (_cell: string | null) => void;

export type BaseSetAnswer<TAnswer> = (_value: TAnswer) => void;

export interface BaseGameState<
  TAnswer = unknown,
  TStackItem = TAnswer,
  TMetadata = Record<string, string>,
> {
  answerStack: TStackItem[];
  initial: TAnswer;
  final: TAnswer;
  completed?: {
    at: string;
    seconds: number;
  };
  metadata?: Partial<TMetadata>;
}

export interface BaseServerState<
  TAnswer = unknown,
  TStackItem = TAnswer,
  TMetadata = Record<string, string>,
> extends BaseGameState<TAnswer, TStackItem, TMetadata> {
  timer?: Timer;
}
