'use client';

import FetchProvider from '@bubblyclouds-app/auth/providers/FetchProvider';
import CapacitorProvider from '@bubblyclouds-app/template/providers/CapacitorProvider';
import UserProvider from '@bubblyclouds-app/auth/providers/UserProvider';
import { PlatformServices } from '@bubblyclouds-app/auth/providers/PlatformServicesContext';
import GlobalStateProvider from '@bubblyclouds-app/template/providers/GlobalStateProvider';
import { ThemeColorProvider } from '@bubblyclouds-app/ui/providers/ThemeColorProvider';
import RevenueCatProvider from '@bubblyclouds-app/template/providers/RevenueCatProvider';
import { SessionsProvider } from '@bubblyclouds-app/template/providers/SessionsProvider';
import PartiesProvider from '@bubblyclouds-app/template/providers/PartiesProvider';
import { BookProvider } from '@bubblyclouds-app/sudoku/providers/BookProvider';
import {
  isCapacitor,
  saveCapacitorState,
  getCapacitorState,
} from '@bubblyclouds-app/template/helpers/capacitor';
import {
  isElectron,
  openBrowser,
  saveElectronState,
} from '@bubblyclouds-app/template/helpers/electron';
import { ThemeProvider } from 'next-themes';
import { PropsWithChildren } from 'react';
import { StateType } from '@bubblyclouds-app/types/stateType';
import { APP_CONFIG } from '../../app.config.js';

const platformServices: PlatformServices = {
  isCapacitor,
  isElectron,
  openBrowser,
  saveCapacitorState,
  getCapacitorState,
  saveElectronState,
  app: APP_CONFIG.app,
  apiUrl: APP_CONFIG.apiUrl,
  authUrl: APP_CONFIG.authUrl,
};

export function Providers({ children }: PropsWithChildren) {
  return (
    <GlobalStateProvider>
      <FetchProvider>
        <CapacitorProvider>
          <UserProvider platformServices={platformServices}>
            <RevenueCatProvider>
              <PartiesProvider app={APP_CONFIG.app} apiUrl={APP_CONFIG.apiUrl}>
                <SessionsProvider
                  stateType={StateType.PUZZLE}
                  app={APP_CONFIG.app}
                  apiUrl={APP_CONFIG.apiUrl}
                >
                  <BookProvider app={APP_CONFIG.app} apiUrl={APP_CONFIG.apiUrl}>
                    <ThemeProvider attribute="class">
                      <ThemeColorProvider>{children}</ThemeColorProvider>
                    </ThemeProvider>
                  </BookProvider>
                </SessionsProvider>
              </PartiesProvider>
            </RevenueCatProvider>
          </UserProvider>
        </CapacitorProvider>
      </FetchProvider>
    </GlobalStateProvider>
  );
}
