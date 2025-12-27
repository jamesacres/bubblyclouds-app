'use client';

import FetchProvider from '@sudoku-web/auth/providers/FetchProvider';
import CapacitorProvider from '@sudoku-web/template/providers/CapacitorProvider';
import UserProvider from '@sudoku-web/auth/providers/UserProvider';
import { PlatformServices } from '@sudoku-web/auth/providers/PlatformServicesContext';
import GlobalStateProvider from '@sudoku-web/template/providers/GlobalStateProvider';
import { ThemeColorProvider } from '@sudoku-web/ui/providers/ThemeColorProvider';
import RevenueCatProvider from '@sudoku-web/template/providers/RevenueCatProvider';
import { SessionsProvider } from '@sudoku-web/template/providers/SessionsProvider';
import PartiesProvider from '@sudoku-web/template/providers/PartiesProvider';
import { BookProvider } from '@sudoku-web/sudoku/providers/BookProvider';
import {
  isCapacitor,
  saveCapacitorState,
  getCapacitorState,
} from '@sudoku-web/template/helpers/capacitor';
import {
  isElectron,
  openBrowser,
  saveElectronState,
} from '@sudoku-web/template/helpers/electron';
import { ThemeProvider } from 'next-themes';
import { PropsWithChildren } from 'react';
import { StateType } from '@sudoku-web/types/stateType';
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
