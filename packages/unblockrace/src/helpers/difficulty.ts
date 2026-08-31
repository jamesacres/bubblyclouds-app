// Difficulty tiers by known-optimal move count, matching the API's own
// bands (UnblockRaceDifficulty): 1-15 beginner, 16-20 challenging, 21-30
// hard, 31-60 expert.
export const difficultyForMoves = (movesRequired: number): string => {
  if (movesRequired <= 15) {
    return 'beginner';
  }
  if (movesRequired <= 20) {
    return 'challenging';
  }
  if (movesRequired <= 30) {
    return 'hard';
  }
  return 'expert';
};
