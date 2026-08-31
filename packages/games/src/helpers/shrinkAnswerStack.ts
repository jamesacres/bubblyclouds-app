function shrinkAnswerStack<Answer>(answerStack: Answer[]): Answer[] {
  // Only store the last 3 answer snapshots on the server
  return answerStack.slice(-3);
}

function shrinkAnswerStackLocal<Answer>(
  answerStack: Answer[],
  completed?: unknown
): Answer[] {
  // For completed puzzles, only store the last 2 states (needed for cheat detection)
  if (completed) {
    return answerStack.slice(-2);
  }
  // For in-progress puzzles, store last 10 moves to support undo/redo
  // while preventing excessive storage usage
  return answerStack.slice(-10);
}

export { shrinkAnswerStack, shrinkAnswerStackLocal };
