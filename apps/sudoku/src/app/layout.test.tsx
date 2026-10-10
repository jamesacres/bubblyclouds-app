import { generateMetadata } from './layout';

jest.mock('next/font/google', () => ({
  Outfit: () => ({ variable: 'outfit', className: 'outfit' }),
  Orbitron: () => ({ variable: 'orbitron' }),
  Pacifico: () => ({ variable: 'pacifico' }),
}));
jest.mock('./globals.css', () => ({}));
jest.mock('./providers', () => ({ Providers: () => null }));
jest.mock(
  '@bubblyclouds-app/template/components/ErrorBoundary',
  () => () => null
);
jest.mock(
  '@bubblyclouds-app/template/components/GlobalErrorHandler',
  () => () => null
);
jest.mock('../components/AppHeader', () => () => null);
jest.mock('../components/SudokuPlusModal', () => () => null);

describe('generateMetadata', () => {
  it('reads the title and description from the translation file', () => {
    const metadata = generateMetadata();

    expect(metadata.title).toBe('Sudoku Race');
    expect(metadata.description).toBe(
      'Play and share to race sudoku with friends. Daily challenges & cross-device!'
    );
  });

  it('keeps the icons', () => {
    const metadata = generateMetadata();

    expect(Array.isArray(metadata.icons)).toBe(true);
    expect(metadata.icons).toHaveLength(7);
  });
});
