function getScreenshotServer(): string | undefined {
  return process.env.NEXT_PUBLIC_SCREENSHOT_SERVER || undefined;
}

export { getScreenshotServer };
