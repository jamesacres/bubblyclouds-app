import { act, renderHook, waitFor } from '@testing-library/react';
import { useDarkMode } from './useDarkMode';

describe('useDarkMode', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('reflects an initial dark class on the document element', () => {
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() => useDarkMode());
    expect(result.current).toBe(true);
  });

  it('starts light and follows class mutations in both directions', async () => {
    const { result } = renderHook(() => useDarkMode());
    expect(result.current).toBe(false);

    act(() => {
      document.documentElement.classList.add('dark');
    });
    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    act(() => {
      document.documentElement.classList.remove('dark');
    });
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('disconnects the observer on unmount', async () => {
    const { result, unmount } = renderHook(() => useDarkMode());
    unmount();
    document.documentElement.classList.add('dark');
    // No update after unmount; last observed value stays false.
    expect(result.current).toBe(false);
  });
});
