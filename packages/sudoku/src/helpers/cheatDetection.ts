import { Puzzle } from '../types/puzzle';
import { ServerState } from '../types/state';

// Cheat detection: Check if more than one cell changed between two puzzle states
export const isPuzzleCheated = (
  gameStateOrAnswerStack: ServerState | Puzzle[]
): boolean => {
  let answerStack: Puzzle[];
  let completed: boolean;

  // Handle both ServerState and direct answerStack input
  if (Array.isArray(gameStateOrAnswerStack)) {
    answerStack = gameStateOrAnswerStack;
    completed = true; // Assume completed if we're just checking answer stack
  } else {
    const gameState = gameStateOrAnswerStack as ServerState;
    if (
      !gameState.completed ||
      !gameState.answerStack ||
      gameState.answerStack.length < 2
    ) {
      return false;
    }
    answerStack = gameState.answerStack;
    completed = gameState.completed !== undefined;
  }

  if (!completed || !answerStack || answerStack.length < 2) {
    return false;
  }

  const lastAnswer = answerStack[answerStack.length - 1];
  const previousAnswer = answerStack[answerStack.length - 2];

  let changedCells = 0;

  // Compare each cell between the last two states
  for (let boxX = 0; boxX < 3; boxX++) {
    for (let boxY = 0; boxY < 3; boxY++) {
      for (let cellX = 0; cellX < 3; cellX++) {
        for (let cellY = 0; cellY < 3; cellY++) {
          const lastCell =
            lastAnswer[boxX as 0 | 1 | 2][boxY as 0 | 1 | 2][
              cellX as 0 | 1 | 2
            ][cellY as 0 | 1 | 2];
          const prevCell =
            previousAnswer[boxX as 0 | 1 | 2][boxY as 0 | 1 | 2][
              cellX as 0 | 1 | 2
            ][cellY as 0 | 1 | 2];

          // Compare the cell values (handle both numbers and Notes)
          if (JSON.stringify(lastCell) !== JSON.stringify(prevCell)) {
            changedCells++;

            // If more than one cell changed, it's likely cheating
            if (changedCells > 1) {
              return true;
            }
          }
        }
      }
    }
  }

  return false;
};
