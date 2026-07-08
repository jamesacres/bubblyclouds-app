import { BaseState } from '@bubblyclouds-app/template/types/state';
import { GameStateMetadata } from '../types/state';
import { parseBoardString } from './parseBoardString';
import { isSolved } from './isSolved';
import { pieceCol } from './piece';

// Fallback for sessions saved without a known-optimal move count: how far
// along the board the primary piece physically is (SPEC.md §6, "Option 2:
// Distance-Based Progress").
const distanceCompletionPercentage = (boardString: string): number => {
  const board = parseBoardString(boardString);
  const primary = board.pieces[0];
  const maxColumn = board.width - primary.size;
  if (maxColumn === 0) {
    return 100;
  }
  return Math.round((pieceCol(primary, board.width) / maxColumn) * 100);
};

// Moves-based progress (SPEC.md §6): moves spent versus the stage's
// known-optimal count. metadata.movesMade is the authoritative count —
// persisted answer stacks are truncated so the stack length under-counts.
// Only a solved board reads 100%: an unsolved board is capped at 99% no
// matter how many moves were made, so the final move fills the bar only
// when the primary piece reaches the exit.
export const calculateCompletionPercentageFromState = (
  state: BaseState<string, string, GameStateMetadata>
): number => {
  const latest =
    state.answerStack.length > 0
      ? state.answerStack[state.answerStack.length - 1]
      : state.initial;
  try {
    if (state.completed || isSolved(parseBoardString(latest))) {
      return 100;
    }
    const movesRequired = Number(state.metadata?.movesRequired);
    if (!Number.isFinite(movesRequired) || movesRequired <= 0) {
      return distanceCompletionPercentage(latest);
    }
    const stackMoves = Math.max(state.answerStack.length - 1, 0);
    const persistedMoves = Number(state.metadata?.movesMade);
    const movesMade = Number.isFinite(persistedMoves)
      ? Math.max(persistedMoves, stackMoves)
      : stackMoves;
    return Math.min(Math.round((movesMade / movesRequired) * 100), 99);
  } catch {
    return 0;
  }
};
