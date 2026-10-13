import { formatLatinNumber } from './latinNumber';

describe('formatLatinNumber', () => {
  it('formats with Latin digits for Arabic', () => {
    expect(formatLatinNumber(1234, 'ar')).toMatch(/^1.234$/);
    expect(formatLatinNumber(1234, 'ar-EG')).toMatch(/^[0-9]/);
  });

  it('formats with Latin digits for Urdu, Bengali and Marathi', () => {
    for (const locale of ['ur', 'bn', 'mr', 'fa']) {
      expect(formatLatinNumber(9876, locale)).toMatch(/^[0-9][^0-9]?[0-9]+$/);
    }
  });

  it('keeps locale grouping', () => {
    expect(formatLatinNumber(1234567, 'de')).toBe('1.234.567');
    expect(formatLatinNumber(1234567, 'en')).toBe('1,234,567');
  });

  it('respects an existing -u- extension', () => {
    expect(formatLatinNumber(12, 'ar-u-nu-arab')).not.toMatch(/[0-9]/);
  });

  it('passes options through', () => {
    expect(formatLatinNumber(5, 'ar', { minimumIntegerDigits: 2 })).toBe('05');
  });

  it('falls back for invalid locale tags', () => {
    expect(formatLatinNumber(1234, 'not a locale')).toBe('1,234');
  });
});
