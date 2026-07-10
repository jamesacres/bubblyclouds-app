import { formatSecondsShort } from './formatSecondsShort';

describe('formatSecondsShort', () => {
  it('formats sub-minute times as m:ss', () => {
    expect(formatSecondsShort(30)).toBe('0:30');
  });

  it('formats minutes without a leading zero', () => {
    expect(formatSecondsShort(630)).toBe('10:30');
  });

  it('includes hours only when needed', () => {
    expect(formatSecondsShort(3729)).toBe('1:02:09');
  });

  it('floors fractional seconds', () => {
    expect(formatSecondsShort(59.9)).toBe('0:59');
  });
});
