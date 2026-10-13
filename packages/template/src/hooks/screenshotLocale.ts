'use client';
import { useEffect } from 'react';
import { useLocale } from '@bubblyclouds-app/ui/providers/I18nProvider';
import { getScreenshotServer } from '../helpers/screenshotServer';

const POLL_INTERVAL_MS = 500;

function useScreenshotLocale() {
  const { setLocale } = useLocale();

  useEffect(() => {
    const server = getScreenshotServer();
    if (!server) {
      return;
    }

    let current: string | undefined;
    const poll = async () => {
      try {
        const response = await fetch(`${server}/locale`);
        const body: unknown = await response.json();
        if (
          typeof body === 'object' &&
          body !== null &&
          'locale' in body &&
          typeof body.locale === 'string' &&
          body.locale !== current
        ) {
          current = body.locale;
          setLocale(body.locale || null);
        }
      } catch {
        return;
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [setLocale]);
}

export { useScreenshotLocale };
