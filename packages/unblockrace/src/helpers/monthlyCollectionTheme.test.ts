import { getI18n } from 'react-i18next';
import { getMonthlyCollectionTheme } from './monthlyCollectionTheme';

const t = getI18n().getFixedT('en', 'unblockrace');

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
      (month) => getMonthlyCollectionTheme(month, t).background
    );
    expect(new Set(backgrounds).size).toBe(ALL_MONTHS.length);
  });

  it('never uses violet or fuchsia, which belong to Sudoku Race', () => {
    ALL_MONTHS.forEach((month) => {
      const theme = getMonthlyCollectionTheme(month, t);
      expect(theme.background.toLowerCase()).not.toMatch(
        /violet|fuchsia|#8b5cf6|#d946ef/
      );
    });
  });

  it('falls back to the default identity for an unrecognised month string', () => {
    const theme = getMonthlyCollectionTheme('July 2026', t);
    expect(theme.kicker).toBe('Monthly collection');
    expect(theme.icon).toBe('🧩');
  });

  it('gives every month a non-empty icon and animation class', () => {
    ALL_MONTHS.forEach((month) => {
      const theme = getMonthlyCollectionTheme(month, t);
      expect(theme.icon.length).toBeGreaterThan(0);
      expect(theme.animationClass.length).toBeGreaterThan(0);
    });
  });
});
