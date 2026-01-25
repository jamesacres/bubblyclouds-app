import { formatDate, formatDateWithDay } from './dateUtils';

describe('formatDate', () => {
  it('should format a date string to "Month Day, Year" by default', () => {
    const date = '2025-01-25';
    expect(formatDate(date)).toBe('January 25, 2025');
  });

  it('should format a date string with a different locale', () => {
    const date = '2025-01-25';
    expect(formatDate(date, 'en-GB')).toBe('25 January 2025');
  });

  it('should handle invalid date strings gracefully (returns "Invalid Date" for some locales)', () => {
    const date = 'invalid-date';
    // The exact output for "Invalid Date" can vary by locale, so we check for presence
    expect(formatDate(date)).toMatch(/Invalid Date/);
  });
});

describe('formatDateWithDay', () => {
  it('should format a date string to "Weekday, Month Day, Year" by default', () => {
    const date = '2025-01-25'; // A Saturday
    expect(formatDateWithDay(date)).toBe('Saturday, January 25, 2025');
  });

  it('should format a date string with a different locale', () => {
    const date = '2025-01-25'; // A Saturday
    expect(formatDateWithDay(date, 'en-GB')).toBe('Saturday, 25 January 2025');
  });

  it('should handle invalid date strings gracefully (returns "Invalid Date" for some locales)', () => {
    const date = 'invalid-date';
    expect(formatDateWithDay(date)).toMatch(/Invalid Date/);
  });
});
