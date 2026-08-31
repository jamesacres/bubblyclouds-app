import { buildPuzzleUrl, buildPuzzleUrlFromState } from './buildPuzzleUrl';

describe('buildPuzzleUrl', () => {
  it('builds a single-puzzle url', () => {
    expect(buildPuzzleUrl(['AAooooooo'], [7])).toBe(
      '/puzzle?board=AAooooooo&moves=7'
    );
  });

  it('builds a chained run url with comma-separated pairs', () => {
    const url = buildPuzzleUrl(['AAooooooo', 'oAAoooooo'], [7, 9], {
      runId: 'oftheday-20260708',
    });
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('board')).toBe('AAooooooo,oAAoooooo');
    expect(params.get('moves')).toBe('7,9');
    expect(params.get('runId')).toBe('oftheday-20260708');
  });

  it('includes the collection puzzle id when present', () => {
    const url = buildPuzzleUrl(['AAooooooo'], [7], {
      unblockCollectionPuzzleId: 'ofthemonth-202607-puzzle-3',
    });
    expect(url).toContain(
      'unblockCollectionPuzzleId=ofthemonth-202607-puzzle-3'
    );
  });

  it('appends alreadyCompleted when specified', () => {
    expect(buildPuzzleUrl(['AAooooooo'], [7], undefined, true)).toContain(
      'alreadyCompleted=true'
    );
  });
});

describe('buildPuzzleUrlFromState', () => {
  it('builds a 1-puzzle run from a session state', () => {
    const url = buildPuzzleUrlFromState({
      initial: 'AAooooooo',
      final: 'oooooooAA',
      answerStack: ['AAooooooo'],
      metadata: { movesRequired: '7' },
    });
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('board')).toBe('AAooooooo');
    expect(params.get('moves')).toBe('7');
  });
});
