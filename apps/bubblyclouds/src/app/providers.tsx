'use client';

import { PlatformServices } from '@bubblyclouds-app/auth/providers/PlatformServicesContext';
import UserProvider from '@bubblyclouds-app/auth/providers/UserProvider';
import GlobalStateProvider from '@bubblyclouds-app/template/providers/GlobalStateProvider';
import { I18nProvider } from '@bubblyclouds-app/ui/providers/I18nProvider';
import { ThemeColorProvider } from '@bubblyclouds-app/ui/providers/ThemeColorProvider';
import { APP_CONFIG } from '../../app.config.js';
import { PropsWithChildren } from 'react';
import { ThemeProvider } from 'next-themes';
import { DEFAULT_LOCALE, resources, supportedLocales } from '../i18n';

const notImplemented = async () => {
  throw Error('not implemented');
};

const platformServices: PlatformServices = {
  isCapacitor: () => false,
  isElectron: () => false,
  openBrowser: notImplemented,
  saveCapacitorState: notImplemented,
  getCapacitorState: notImplemented,
  saveElectronState: notImplemented,
  app: APP_CONFIG.app,
  gameName: APP_CONFIG.gameName,
  apiUrl: APP_CONFIG.apiUrl,
  authUrl: APP_CONFIG.authUrl,
  scope: APP_CONFIG.scope,
};

export function Providers({ children }: PropsWithChildren) {
  return (
    <I18nProvider
      resources={resources}
      defaultLocale={DEFAULT_LOCALE}
      supportedLocales={supportedLocales}
    >
      <GlobalStateProvider>
        <UserProvider
          platformServices={platformServices}
          logoSrc="/bubbly-clouds.png"
          appName={APP_CONFIG.appName}
          termsUrl={APP_CONFIG.termsUrl}
          privacyUrl={APP_CONFIG.privacyUrl}
        >
          <ThemeProvider attribute="class">
            <ThemeColorProvider>{children}</ThemeColorProvider>
          </ThemeProvider>
        </UserProvider>
      </GlobalStateProvider>
    </I18nProvider>
  );
}
