import { BaseState } from '@bubblyclouds-app/template/types/state';
import { GameStateMetadata } from '../types/state';

// A player's move count from a synced session. metadata.movesMade is the
// authoritative count — persisted answer stacks are truncated so the stack
// length under-counts (see useGameState's movesOffsetFromRestoredState).
export const movesMadeFromState = (
  state: BaseState<string, string, GameStateMetadata>
): number => {
  const persistedMoves = Number(state.metadata?.movesMade);
  const stackMoves = Math.max(state.answerStack.length - 1, 0);
  return Number.isFinite(persistedMoves)
    ? Math.max(persistedMoves, stackMoves)
    : stackMoves;
};

// Structured moves-vs-par for a session tile, graded by the renderer the
// same way as the run leaderboard (par comes from the movesRequired stage
// metadata persisted with the session).
export const movesDisplayFromState = (
  state: BaseState<string, string, GameStateMetadata>
): { movesMade: number; movesRequired: number } | undefined => {
  const movesMade = movesMadeFromState(state);
  const movesRequired = Number(state.metadata?.movesRequired);
  if (movesMade <= 0 || !Number.isFinite(movesRequired) || movesRequired <= 0) {
    return undefined;
  }
  return { movesMade, movesRequired };
};

// Short "N moves" stats string for the leaderboard (SPEC.md §7's move-count
// line, surfaced per-racer alongside their finish time). The par verdict
// names the difference ("2 over par"), not just the direction — "12 moves ·
// over par" read as if all 12 were over.
export const calculateStatsDisplayFromState = (
  state: BaseState<string, string, GameStateMetadata>
): string | undefined => {
  const movesMade = movesMadeFromState(state);
  if (movesMade <= 0) {
    return undefined;
  }
  const movesRequired = Number(state.metadata?.movesRequired);
  const movesDelta = movesMade - movesRequired;
  const parLabel =
    Number.isFinite(movesRequired) && movesRequired > 0
      ? movesDelta === 0
        ? ' · par'
        : ` · ${Math.abs(movesDelta)} ${movesDelta > 0 ? 'over' : 'under'} par`
      : '';
  return `${movesMade} move${movesMade === 1 ? '' : 's'}${parLabel}`;
};
