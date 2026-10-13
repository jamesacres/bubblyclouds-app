import { getI18n } from 'react-i18next';
import { getDailyLabel } from './dailyLabel';

const t = getI18n().getFixedT('en', 'unblockrace');

describe('getDailyLabel', () => {
  it('formats the UTC calendar date', () => {
    expect(getDailyLabel(t, 'en', new Date('2026-07-01T12:00:00Z'))).toBe(
      'Daily · Jul 1'
    );
    expect(getDailyLabel(t, 'en', new Date('2026-08-08T23:59:00Z'))).toBe(
      'Daily · Aug 8'
    );
  });

  it('formats the date in the given language', () => {
    expect(getDailyLabel(t, 'fr', new Date('2026-08-08T12:00:00Z'))).toBe(
      'Daily · 8 août'
    );
  });

  it('uses the UTC date even close to a local timezone boundary', () => {
    // 23:30 UTC on Dec 31 is still Dec 31 in UTC regardless of local offset.
    expect(getDailyLabel(t, 'en', new Date('2026-12-31T23:30:00Z'))).toBe(
      'Daily · Dec 31'
    );
  });
});
