import { localizedMonthName } from './localizedMonthName';

describe('localizedMonthName', () => {
  it('formats an English month name in the active language', () => {
    expect(localizedMonthName('August', 'en')).toBe('August');
    expect(localizedMonthName('August', 'fr')).toBe('août');
  });

  it('returns unrecognised values unchanged', () => {
    expect(localizedMonthName('July 2026', 'en')).toBe('July 2026');
  });
});
