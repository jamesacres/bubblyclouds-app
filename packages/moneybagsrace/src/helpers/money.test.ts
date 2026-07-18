import { formatPence, parsePoundsToPence } from './money';

describe('formatPence', () => {
  it('formats small values with two decimal places', () => {
    expect(formatPence(0)).toBe('£0.00');
    expect(formatPence(1)).toBe('£0.01');
    expect(formatPence(123456)).toBe('£1,234.56');
    expect(formatPence(999999)).toBe('£9,999.99');
  });

  it('formats values of £10,000 or more as whole pounds', () => {
    expect(formatPence(1_000_000)).toBe('£10,000');
    expect(formatPence(1_234_567)).toBe('£12,346');
    expect(formatPence(123_456_789)).toBe('£1,234,568');
  });

  it('formats negative values', () => {
    expect(formatPence(-123456)).toBe('-£1,234.56');
    expect(formatPence(-1_000_000)).toBe('-£10,000');
  });
});

describe('parsePoundsToPence', () => {
  it('parses plain pound amounts', () => {
    expect(parsePoundsToPence('1234')).toBe(123400);
    expect(parsePoundsToPence('0')).toBe(0);
  });

  it('parses formatted currency strings', () => {
    expect(parsePoundsToPence('£1,234.56')).toBe(123456);
    expect(parsePoundsToPence('£10,000')).toBe(1000000);
    expect(parsePoundsToPence(' £ 1,234.56 ')).toBe(123456);
  });

  it('parses one or two decimal places', () => {
    expect(parsePoundsToPence('1.5')).toBe(150);
    expect(parsePoundsToPence('1.05')).toBe(105);
  });

  it('parses negative amounts', () => {
    expect(parsePoundsToPence('-£12.34')).toBe(-1234);
  });

  it('avoids floating point rounding errors', () => {
    expect(parsePoundsToPence('0.29')).toBe(29);
    expect(parsePoundsToPence('1234567.89')).toBe(123456789);
  });

  it('rejects garbage', () => {
    expect(parsePoundsToPence('')).toBeUndefined();
    expect(parsePoundsToPence('abc')).toBeUndefined();
    expect(parsePoundsToPence('£')).toBeUndefined();
    expect(parsePoundsToPence('1.234')).toBeUndefined();
    expect(parsePoundsToPence('1.2.3')).toBeUndefined();
    expect(parsePoundsToPence('12abc')).toBeUndefined();
    expect(parsePoundsToPence('.')).toBeUndefined();
    expect(parsePoundsToPence('-')).toBeUndefined();
  });
});
