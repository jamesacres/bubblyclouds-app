import { getMonthlyCollectionTheme } from './monthlyCollectionTheme';

const ALL_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

describe('getMonthlyCollectionTheme', () => {
  it('returns a distinct background for every calendar month', () => {
    const backgrounds = ALL_MONTHS.map(
      (month) => getMonthlyCollectionTheme(month).background
    );
    expect(new Set(backgrounds).size).toBe(ALL_MONTHS.length);
  });

  it('never uses violet or fuchsia, which belong to Sudoku Race', () => {
    ALL_MONTHS.forEach((month) => {
      const theme = getMonthlyCollectionTheme(month);
      expect(theme.background.toLowerCase()).not.toMatch(
        /violet|fuchsia|#8b5cf6|#d946ef/
      );
    });
  });

  it('falls back to the default identity for an unrecognised month string', () => {
    const theme = getMonthlyCollectionTheme('July 2026');
    expect(theme.kicker).toBe('Monthly collection');
    expect(theme.icon).toBe('🧩');
  });

  it('gives every month a non-empty icon and animation class', () => {
    ALL_MONTHS.forEach((month) => {
      const theme = getMonthlyCollectionTheme(month);
      expect(theme.icon.length).toBeGreaterThan(0);
      expect(theme.animationClass.length).toBeGreaterThan(0);
    });
  });
});
