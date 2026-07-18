import {
  addMonths,
  currentMonthId,
  isValidMonthId,
  monthIdToLabel,
  monthIdToLongLabel,
  monthsBetween,
  nextMonthId,
  previousMonthId,
} from './monthId';

describe('currentMonthId', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the current UTC year and month', () => {
    jest.useFakeTimers().setSystemTime(Date.parse('2026-07-17T12:00:00Z'));
    expect(currentMonthId()).toBe('2026-07');
  });

  it('uses UTC at month boundaries', () => {
    jest.useFakeTimers().setSystemTime(Date.parse('2026-01-31T23:59:59Z'));
    expect(currentMonthId()).toBe('2026-01');
    jest.setSystemTime(Date.parse('2026-02-01T00:00:00Z'));
    expect(currentMonthId()).toBe('2026-02');
  });
});

describe('isValidMonthId', () => {
  it('accepts valid month ids', () => {
    expect(isValidMonthId('2026-01')).toBe(true);
    expect(isValidMonthId('2026-12')).toBe(true);
    expect(isValidMonthId('1900-09')).toBe(true);
  });

  it('rejects invalid month ids', () => {
    expect(isValidMonthId('2026-00')).toBe(false);
    expect(isValidMonthId('2026-13')).toBe(false);
    expect(isValidMonthId('2026-1')).toBe(false);
    expect(isValidMonthId('26-01')).toBe(false);
    expect(isValidMonthId('profile')).toBe(false);
    expect(isValidMonthId('2026-01-01')).toBe(false);
    expect(isValidMonthId('')).toBe(false);
  });
});

describe('addMonths', () => {
  it('adds months within a year', () => {
    expect(addMonths('2026-03', 2)).toBe('2026-05');
  });

  it('crosses year boundaries forwards', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(addMonths('2026-01', 12)).toBe('2027-01');
  });

  it('crosses year boundaries backwards', () => {
    expect(addMonths('2026-02', -3)).toBe('2025-11');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-01', -13)).toBe('2024-12');
  });

  it('returns the same month for zero', () => {
    expect(addMonths('2026-07', 0)).toBe('2026-07');
  });
});

describe('previousMonthId and nextMonthId', () => {
  it('steps one month back', () => {
    expect(previousMonthId('2026-07')).toBe('2026-06');
    expect(previousMonthId('2026-01')).toBe('2025-12');
  });

  it('steps one month forward', () => {
    expect(nextMonthId('2026-07')).toBe('2026-08');
    expect(nextMonthId('2026-12')).toBe('2027-01');
  });
});

describe('monthsBetween', () => {
  it('counts months from one id to another', () => {
    expect(monthsBetween('2026-01', '2026-07')).toBe(6);
    expect(monthsBetween('2025-11', '2026-02')).toBe(3);
  });

  it('is negative when the second month is earlier', () => {
    expect(monthsBetween('2026-07', '2026-01')).toBe(-6);
  });

  it('is zero for the same month', () => {
    expect(monthsBetween('2026-07', '2026-07')).toBe(0);
  });
});

describe('monthIdToLabel', () => {
  it('formats as short month and year', () => {
    expect(monthIdToLabel('2026-07')).toBe('Jul 2026');
    expect(monthIdToLabel('2025-01')).toBe('Jan 2025');
    expect(monthIdToLabel('2024-12')).toBe('Dec 2024');
  });
});

describe('monthIdToLongLabel', () => {
  it('formats as full month and year', () => {
    expect(monthIdToLongLabel('2041-03')).toBe('March 2041');
    expect(monthIdToLongLabel('2026-07')).toBe('July 2026');
  });
});
