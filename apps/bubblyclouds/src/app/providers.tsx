'use client';

import { PlatformServices } from '@bubblyclouds-app/auth/providers/PlatformServicesContext';
import UserProvider from '@bubblyclouds-app/auth/providers/UserProvider';
import GlobalStateProvider from '@bubblyclouds-app/template/providers/GlobalStateProvider';
import { ThemeColorProvider } from '@bubblyclouds-app/ui/providers/ThemeColorProvider';
import { APP_CONFIG } from 'app.config';
import { PropsWithChildren } from 'react';
import { ThemeProvider } from 'next-themes';

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
  apiUrl: APP_CONFIG.apiUrl,
  authUrl: APP_CONFIG.authUrl,
  scope: APP_CONFIG.scope,
};

export function Providers({ children }: PropsWithChildren) {
  return (
    <GlobalStateProvider>
      <UserProvider platformServices={platformServices}>
        <ThemeProvider attribute="class">
          <ThemeColorProvider>{children}</ThemeColorProvider>
        </ThemeProvider>
      </UserProvider>
    </GlobalStateProvider>
  );
}
