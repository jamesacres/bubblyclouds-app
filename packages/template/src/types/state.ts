import { Timer } from './timer';

export type BaseSetAnswer<TAnswer> = (_value: TAnswer) => void;

export interface BaseState<
  TState = unknown,
  TStackItem = TState,
  TMetadata = Record<string, string>,
> {
  answerStack: TStackItem[];
  initial: TState;
  final: TState;
  completed?: {
    at: string;
    seconds: number;
  };
  metadata?: Partial<TMetadata>;
}

export interface BaseServerState<
  TState = unknown,
  TStackItem = TState,
  TMetadata = Record<string, string>,
> extends BaseState<TState, TStackItem, TMetadata> {
  timer?: Timer;
}
