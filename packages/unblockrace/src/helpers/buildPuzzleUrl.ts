import { BaseState } from '@bubblyclouds-app/template/types/state';
import { GameStateMetadata } from '../types/state';

// URL format (SPEC.md §4): everything in query params on /puzzle. A chained
// run is comma-separated lists in both params, positionally paired.
export const buildPuzzleUrl = (
  boards: string[],
  moves: number[],
  metadata?: Partial<GameStateMetadata>,
  alreadyCompleted?: boolean
): string => {
  const redirectQuery = new URLSearchParams();
  redirectQuery.set('board', boards.join(','));
  redirectQuery.set('moves', moves.join(','));
  if (metadata?.runId) {
    redirectQuery.set('runId', metadata.runId);
  }
  if (metadata?.unblockCollectionPuzzleId) {
    redirectQuery.set(
      'unblockCollectionPuzzleId',
      metadata.unblockCollectionPuzzleId
    );
  }
  if (alreadyCompleted !== undefined) {
    redirectQuery.set('alreadyCompleted', alreadyCompleted ? 'true' : 'false');
  }
  return `/puzzle?${redirectQuery.toString()}`;
};

export const buildPuzzleUrlFromState = (
  state: BaseState<string, string, GameStateMetadata>,
  isCompleted?: boolean
): string =>
  buildPuzzleUrl(
    [state.initial],
    [Number(state.metadata?.movesRequired) || 0],
    state.metadata,
    isCompleted
  );
