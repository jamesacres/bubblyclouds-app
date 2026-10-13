import { getScreenshotServer } from './screenshotServer';

describe('getScreenshotServer', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SCREENSHOT_SERVER;
  });

  it('is undefined when the variable is not set', () => {
    expect(getScreenshotServer()).toBeUndefined();
  });

  it('is undefined when the variable is empty', () => {
    process.env.NEXT_PUBLIC_SCREENSHOT_SERVER = '';
    expect(getScreenshotServer()).toBeUndefined();
  });

  it('returns the configured server', () => {
    process.env.NEXT_PUBLIC_SCREENSHOT_SERVER = 'http://localhost:8787';
    expect(getScreenshotServer()).toBe('http://localhost:8787');
  });
});
