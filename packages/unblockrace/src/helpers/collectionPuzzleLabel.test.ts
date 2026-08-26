import { getCollectionPuzzleLabel } from './collectionPuzzleLabel';

describe('getCollectionPuzzleLabel', () => {
  it('converts the 0-based trailing index to a 1-based puzzle number', () => {
    expect(getCollectionPuzzleLabel('ofthemonth-202607-puzzle-0')).toBe(
      'Collection puzzle 1'
    );
    expect(getCollectionPuzzleLabel('ofthemonth-202607-puzzle-3')).toBe(
      'Collection puzzle 4'
    );
  });
});
