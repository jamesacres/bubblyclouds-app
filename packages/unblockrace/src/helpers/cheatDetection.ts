import { ServerState } from '../types/state';

// Cheat detection (mirrors sudoku's): a legal move changes exactly one
// piece between consecutive board-string snapshots, so a completed puzzle
// whose last transition moved more than one piece jumped straight to the
// solved state.
export const isPuzzleCheated = (
  gameStateOrAnswerStack: ServerState | string[]
): boolean => {
  let answerStack: string[];

  if (Array.isArray(gameStateOrAnswerStack)) {
    answerStack = gameStateOrAnswerStack;
  } else {
    const gameState = gameStateOrAnswerStack;
    if (
      !gameState.completed ||
      !gameState.answerStack ||
      gameState.answerStack.length < 2
    ) {
      return false;
    }
    answerStack = gameState.answerStack;
  }

  if (!answerStack || answerStack.length < 2) {
    return false;
  }

  const lastAnswer = answerStack[answerStack.length - 1];
  const previousAnswer = answerStack[answerStack.length - 2];

  if (lastAnswer.length !== previousAnswer.length) {
    return true;
  }

  const changedPieces = new Set<string>();
  for (let i = 0; i < lastAnswer.length; i++) {
    if (lastAnswer[i] !== previousAnswer[i]) {
      for (const label of [lastAnswer[i], previousAnswer[i]]) {
        if (label !== 'o' && label !== '.' && label !== 'x') {
          changedPieces.add(label);
        }
      }
      if (changedPieces.size > 1) {
        return true;
      }
    }
  }

  return false;
};
