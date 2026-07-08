import {
  BaseState,
  BaseServerState,
} from '@bubblyclouds-app/template/types/state';
import { Timer } from '@bubblyclouds-app/template/types/timer';

// Unblock Race metadata. The board string itself is the puzzle identifier
// (SPEC.md §4), so there is no separate id field here.
export interface GameStateMetadata {
  difficulty?: string;
  unblockCollectionPuzzleId?: string;
  runId?: string;
  stageIndex?: string;
  movesRequired?: string;
  movesMade?: string;
}

// State is the board string (SPEC.md §2): every move produces a new board
// string, so the answer stack is a stack of board-string snapshots.
export interface GameState extends BaseState<
  string,
  string,
  GameStateMetadata
> {
  answerStack: string[];
  initial: string;
  final: string;
}

export interface ServerState extends BaseServerState<
  string,
  string,
  GameStateMetadata
> {
  timer?: Timer;
}
