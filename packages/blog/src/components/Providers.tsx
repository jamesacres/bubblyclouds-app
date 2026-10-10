'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import ui from '@bubblyclouds-app/ui/locales/en';
import { I18nProvider } from '@bubblyclouds-app/ui/providers/I18nProvider';

const DEFAULT_LOCALE = 'en';
const resources = { en: { ui } };

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider
      resources={resources}
      defaultLocale={DEFAULT_LOCALE}
      supportedLocales={[DEFAULT_LOCALE]}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </I18nProvider>
  );
}
