import { BaseState } from '@bubblyclouds-app/template/types/state';
import { GameStateMetadata } from '../types/state';
import { movesMadeFromState } from './calculateStatsDisplay';
import { isPuzzleCheated } from './cheatDetection';

// Star grade for a solved puzzle vs par (movesRequired):
// 3★ at or under par, 2★ within a generous band above par, 1★ any other
// solve. The 2★ band widens with par so a longer puzzle isn't held to the
// same absolute tolerance as a short one.
export const starRatingForMoves = (
  movesMade: number,
  movesRequired: number
): 1 | 2 | 3 => {
  if (movesMade <= movesRequired) {
    return 3;
  }
  const twoStarTolerance = Math.max(2, Math.ceil(movesRequired * 0.25));
  if (movesMade <= movesRequired + twoStarTolerance) {
    return 2;
  }
  return 1;
};

// Star rating for a session's state, or undefined when it can't be graded:
// not completed, par unknown, or the solve was cheated.
export const starRatingFromState = (
  state: BaseState<string, string, GameStateMetadata>
): number | undefined => {
  if (!state.completed) {
    return undefined;
  }
  const movesRequired = Number(state.metadata?.movesRequired);
  if (!Number.isFinite(movesRequired) || movesRequired <= 0) {
    return undefined;
  }
  if (isPuzzleCheated(state.answerStack)) {
    return undefined;
  }
  return starRatingForMoves(movesMadeFromState(state), movesRequired);
};
