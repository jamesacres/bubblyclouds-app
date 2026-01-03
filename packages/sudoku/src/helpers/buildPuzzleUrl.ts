import { BaseState } from '@bubblyclouds-app/template/types/state';
import { Puzzle } from '../types/puzzle';
import { GameStateMetadata } from '../types/state';
import { puzzleToPuzzleText } from './puzzleTextToPuzzle';

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

export const buildPuzzleUrlFromState = (
  state: BaseState<Puzzle>,
  isCompleted?: boolean
): string => {
  const initial = puzzleToPuzzleText(state.initial);
  const final = puzzleToPuzzleText(state.final);
  return buildPuzzleUrl(initial, final, state.metadata, isCompleted);
};
