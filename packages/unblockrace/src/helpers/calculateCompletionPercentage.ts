import { BaseState } from '@bubblyclouds-app/template/types/state';
import { parseBoardString } from './parseBoardString';
import { pieceCol } from './piece';

// Distance-based progress (SPEC.md §6, "Option 2: Distance-Based Progress"):
// how far along the board the primary piece physically is, not how many
// moves were spent getting there. `final` is unused — the exit is computed
// from the board itself — but the signature matches RaceTrack's
// calculateCompletionPercentage prop.
export const calculateCompletionPercentage = (
  initial: string,
  _final: string,
  latest: string | undefined
): number => {
  try {
    const board = parseBoardString(latest || initial);
    const primary = board.pieces[0];
    const maxColumn = board.width - primary.size;
    if (maxColumn === 0) {
      return 100;
    }
    return Math.round((pieceCol(primary, board.width) / maxColumn) * 100);
  } catch {
    return 0;
  }
};

export const calculateCompletionPercentageFromState = (
  state: BaseState<string, string>
): number => {
  const latest =
    state.answerStack.length > 0
      ? state.answerStack[state.answerStack.length - 1]
      : undefined;
  return calculateCompletionPercentage(state.initial, state.final, latest);
};
