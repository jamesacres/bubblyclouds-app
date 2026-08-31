import { getDailyLabel } from './dailyLabel';

describe('getDailyLabel', () => {
  it('formats the UTC calendar date', () => {
    expect(getDailyLabel(new Date('2026-07-01T12:00:00Z'))).toBe(
      'Daily · Jul 1'
    );
    expect(getDailyLabel(new Date('2026-08-08T23:59:00Z'))).toBe(
      'Daily · Aug 8'
    );
  });

  it('uses the UTC date even close to a local timezone boundary', () => {
    // 23:30 UTC on Dec 31 is still Dec 31 in UTC regardless of local offset.
    expect(getDailyLabel(new Date('2026-12-31T23:30:00Z'))).toBe(
      'Daily · Dec 31'
    );
  });
});
