import { BaseState } from '@bubblyclouds-app/template/types/state';
import { GameStateMetadata } from '../types/state';

// Live "moves so far vs par" label for the race-track legend — the running
// count each racer is on, shown from move zero (unlike calculateStatsDisplay,
// which is the finished-line summary and hides until the first move). Mirrors
// the old Controls counter: "0/24 moves", flagged once over par.
export const calculateProgressStatsDisplayFromState = (
  state: BaseState<string, string, GameStateMetadata>
): string | undefined => {
  const movesRequired = Number(state.metadata?.movesRequired);
  if (!Number.isFinite(movesRequired) || movesRequired <= 0) {
    return undefined;
  }
  const persistedMoves = Number(state.metadata?.movesMade);
  const stackMoves = Math.max(state.answerStack.length - 1, 0);
  const movesMade = Number.isFinite(persistedMoves)
    ? Math.max(persistedMoves, stackMoves)
    : stackMoves;
  const overPar = movesMade > movesRequired ? ' · over par' : '';
  return `${movesMade}/${movesRequired} moves${overPar}`;
};
