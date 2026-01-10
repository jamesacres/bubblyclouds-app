import { Timer } from './timer';

export type BaseSetAnswer<Answer> = (_value: Answer) => void;

export interface BaseState<
  State = unknown,
  StackItem = State,
  Metadata = Record<string, string>,
> {
  answerStack: StackItem[];
  initial: State;
  final: State;
  completed?: {
    at: string;
    seconds: number;
  };
  metadata?: Partial<Metadata>;
}

export interface BaseServerState<
  State = unknown,
  StackItem = State,
  Metadata = Record<string, string>,
> extends BaseState<State, StackItem, Metadata> {
  timer?: Timer;
}
