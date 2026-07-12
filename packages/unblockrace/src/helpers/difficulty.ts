// Difficulty tiers by known-optimal move count (SPEC.md §8's difficulty-tier
// idea). Values match the standard difficulties that
// @bubblyclouds-app/games' getDifficultyDisplay already maps:
// simple = Beginner, easy = Challenging, intermediate = Hard, expert = Expert.
export const difficultyForMoves = (movesRequired: number): string => {
  if (movesRequired <= 10) {
    return 'simple';
  }
  if (movesRequired <= 18) {
    return 'easy';
  }
  if (movesRequired <= 28) {
    return 'intermediate';
  }
  return 'expert';
};
