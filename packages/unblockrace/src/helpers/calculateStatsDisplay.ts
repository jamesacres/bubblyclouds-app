import { BaseState } from '@bubblyclouds-app/template/types/state';
import { GameStateMetadata } from '../types/state';

// Short "N moves" stats string for the leaderboard (SPEC.md §7's move-count
// line, surfaced per-racer alongside their finish time). metadata.movesMade
// is the authoritative count — persisted answer stacks are truncated so the
// stack length under-counts (see useGameState's movesOffsetFromRestoredState).
export const calculateStatsDisplayFromState = (
  state: BaseState<string, string, GameStateMetadata>
): string | undefined => {
  const persistedMoves = Number(state.metadata?.movesMade);
  const stackMoves = Math.max(state.answerStack.length - 1, 0);
  const movesMade = Number.isFinite(persistedMoves)
    ? Math.max(persistedMoves, stackMoves)
    : stackMoves;
  if (movesMade <= 0) {
    return undefined;
  }
  const movesRequired = Number(state.metadata?.movesRequired);
  const parLabel =
    Number.isFinite(movesRequired) && movesRequired > 0
      ? movesMade > movesRequired
        ? ' · over par'
        : movesMade === movesRequired
          ? ' · par'
          : ' · under par'
      : '';
  return `${movesMade} move${movesMade === 1 ? '' : 's'}${parLabel}`;
};
