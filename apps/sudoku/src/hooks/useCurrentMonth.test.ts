import { renderHook } from '@testing-library/react';
import { useCurrentMonth } from './useCurrentMonth';

describe('useCurrentMonth', () => {
  it('returns the English month name used as the cover lookup key', () => {
    const { result } = renderHook(() =>
      useCurrentMonth(new Date('2026-03-15T12:00:00Z'))
    );

    expect(result.current.englishMonth).toBe('March');
  });

  it('formats the localised month with the active language', () => {
    const { result } = renderHook(() =>
      useCurrentMonth(new Date('2026-03-15T12:00:00Z'))
    );

    expect(result.current.localizedMonth).toBe('March');
  });

  it('uses UTC so the month does not shift with the local timezone', () => {
    const { result } = renderHook(() =>
      useCurrentMonth(new Date('2026-04-01T00:30:00Z'))
    );

    expect(result.current.englishMonth).toBe('April');
  });
});
