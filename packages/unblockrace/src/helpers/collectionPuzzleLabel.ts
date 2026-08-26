// Puzzle-number label for a collection puzzle, e.g. "Collection puzzle 4".
// unblockCollectionPuzzleId is `${unblockCollectionId}-puzzle-${index}` with
// a 0-based index (apps/unblockrace/src/app/collection/page.tsx), so the
// trailing segment needs +1 to read as a 1-based puzzle number.
export const getCollectionPuzzleLabel = (
  unblockCollectionPuzzleId: string
): string => {
  const index = Number(unblockCollectionPuzzleId.split('-').pop());
  return `Collection puzzle ${index + 1}`;
};
