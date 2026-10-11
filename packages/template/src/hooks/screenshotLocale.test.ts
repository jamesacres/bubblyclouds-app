import { renderHook, act } from '@testing-library/react';
import { useLocale } from '@bubblyclouds-app/ui/providers/I18nProvider';
import { useScreenshotLocale } from './screenshotLocale';

jest.mock('@bubblyclouds-app/ui/providers/I18nProvider', () => ({
  useLocale: jest.fn(),
}));

const mockUseLocale = useLocale as jest.Mock;

describe('useScreenshotLocale', () => {
  const originalFetch = global.fetch;
  let setLocale: jest.Mock;
  let fetchMock: jest.Mock;

  const respondWith = (locale: string) => {
    fetchMock.mockResolvedValue({ json: async () => ({ locale }) });
  };

  const tick = async () => {
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    setLocale = jest.fn();
    mockUseLocale.mockReturnValue({ setLocale });
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    process.env.NEXT_PUBLIC_SCREENSHOT_SERVER = 'http://localhost:8787';
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
    delete process.env.NEXT_PUBLIC_SCREENSHOT_SERVER;
  });

  it('does nothing when no screenshot server is configured', async () => {
    delete process.env.NEXT_PUBLIC_SCREENSHOT_SERVER;
    respondWith('de');
    renderHook(() => useScreenshotLocale());
    await tick();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setLocale).not.toHaveBeenCalled();
  });

  it('applies the locale served by the screenshot server once per change', async () => {
    respondWith('de');
    renderHook(() => useScreenshotLocale());

    await tick();
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8787/locale');
    expect(setLocale).toHaveBeenCalledWith('de');

    await tick();
    expect(setLocale).toHaveBeenCalledTimes(1);

    respondWith('ja');
    await tick();
    expect(setLocale).toHaveBeenLastCalledWith('ja');
  });

  it('clears the preference when the server serves an empty locale', async () => {
    respondWith('');
    renderHook(() => useScreenshotLocale());
    await tick();
    expect(setLocale).toHaveBeenCalledWith(null);
  });

  it('ignores an unreachable server and malformed bodies', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    renderHook(() => useScreenshotLocale());
    await tick();

    fetchMock.mockResolvedValue({ json: async () => ({ other: true }) });
    await tick();

    expect(setLocale).not.toHaveBeenCalled();
  });

  it('stops polling on unmount', async () => {
    respondWith('de');
    const { unmount } = renderHook(() => useScreenshotLocale());
    unmount();
    await tick();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
