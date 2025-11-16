import { GameStateMetadata } from '@sudoku-web/sudoku/types/state';

export const buildPuzzleUrl = (
  initial: string,
  final: string,
  metadata?: Partial<GameStateMetadata>,
  alreadyCompleted?: boolean
) => {
  const redirectQuery = new URLSearchParams();
  redirectQuery.set('initial', initial);
  redirectQuery.set('final', final);
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      redirectQuery.set(key, value);
    });
  }
  if (alreadyCompleted !== undefined) {
    redirectQuery.set('alreadyCompleted', alreadyCompleted ? 'true' : 'false');
  }
  return `/puzzle?${redirectQuery.toString()}`;
};
