import { getI18n } from 'react-i18next';
import { getCollectionPuzzleLabel } from './collectionPuzzleLabel';

const t = getI18n().getFixedT('en', 'unblockrace');

describe('getCollectionPuzzleLabel', () => {
  it('converts the 0-based trailing index to a 1-based puzzle number', () => {
    expect(getCollectionPuzzleLabel('ofthemonth-202607-puzzle-0', t)).toBe(
      'Collection puzzle 1'
    );
    expect(getCollectionPuzzleLabel('ofthemonth-202607-puzzle-3', t)).toBe(
      'Collection puzzle 4'
    );
  });
});
