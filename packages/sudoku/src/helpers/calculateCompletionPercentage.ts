import { Notes } from '../types/notes';
import { Puzzle, PuzzleRowOrColumn } from '../types/puzzle';
import { BaseState } from '@bubblyclouds-app/template/types/state';

export const calculateCompletionPercentage = (
  initial: Puzzle<number | Notes>,
  final: Puzzle<number | Notes>,
  latest: Puzzle<number | Notes> | undefined
): number => {
  if (!latest) return 0;

  const rowOrColumn: PuzzleRowOrColumn[] = [0, 1, 2];
  let totalEmptyCells = 0;
  let correctlySolvedCells = 0;

  for (const boxX of rowOrColumn) {
    for (const boxY of rowOrColumn) {
      for (const cellX of rowOrColumn) {
        for (const cellY of rowOrColumn) {
          // Check if this is a cell the user needs to fill (not provided initially)
          if (!initial[boxX][boxY][cellX][cellY]) {
            totalEmptyCells++;

            // Check if the cell has been filled correctly (must not be 0)
            if (
              latest[boxX][boxY][cellX][cellY] ===
                final[boxX][boxY][cellX][cellY] &&
              latest[boxX][boxY][cellX][cellY] !== 0
            ) {
              correctlySolvedCells++;
            }
          }
        }
      }
    }
  }

  // Return the percentage completed (avoid division by zero)
  if (totalEmptyCells === 0) return 100;
  return Math.round((correctlySolvedCells / totalEmptyCells) * 100);
};

export const calculateCompletionPercentageFromState = (
  state: BaseState<Puzzle<number | Notes>>
): number => {
  const latest =
    state.answerStack.length > 0
      ? state.answerStack[state.answerStack.length - 1]
      : undefined;
  return calculateCompletionPercentage(state.initial, state.final, latest);
};
