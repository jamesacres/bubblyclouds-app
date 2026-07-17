import { currentMonthStateId, isValidMonthStateId } from './monthStateId';

describe('currentMonthStateId', () => {
  it('formats the current UTC month as YYYY-MM', () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2026-07-17T12:00:00Z').getTime());
    expect(currentMonthStateId()).toBe('2026-07');
    jest.useRealTimers();
  });

  it('pads single-digit months', () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2026-01-05T00:00:00Z').getTime());
    expect(currentMonthStateId()).toBe('2026-01');
    jest.useRealTimers();
  });
});

describe('isValidMonthStateId', () => {
  it('accepts valid YYYY-MM ids', () => {
    expect(isValidMonthStateId('2026-07')).toBe(true);
    expect(isValidMonthStateId('2026-01')).toBe(true);
    expect(isValidMonthStateId('2026-12')).toBe(true);
  });

  it('rejects invalid ids', () => {
    expect(isValidMonthStateId('2026-13')).toBe(false);
    expect(isValidMonthStateId('2026-00')).toBe(false);
    expect(isValidMonthStateId('26-07')).toBe(false);
    expect(isValidMonthStateId('2026/07')).toBe(false);
    expect(isValidMonthStateId('not-a-month')).toBe(false);
    expect(isValidMonthStateId('')).toBe(false);
  });
});
