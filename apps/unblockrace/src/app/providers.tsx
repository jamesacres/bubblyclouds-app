'use client';

import FetchProvider from '@bubblyclouds-app/auth/providers/FetchProvider';
import CapacitorProvider from '@bubblyclouds-app/template/providers/CapacitorProvider';
import UserProvider from '@bubblyclouds-app/auth/providers/UserProvider';
import { PlatformServices } from '@bubblyclouds-app/auth/providers/PlatformServicesContext';
import GlobalStateProvider from '@bubblyclouds-app/template/providers/GlobalStateProvider';
import ErrorBoundary from '@bubblyclouds-app/template/components/ErrorBoundary';
import GlobalErrorHandler from '@bubblyclouds-app/template/components/GlobalErrorHandler';
import { I18nProvider } from '@bubblyclouds-app/ui/providers/I18nProvider';
import { ThemeColorProvider } from '@bubblyclouds-app/ui/providers/ThemeColorProvider';
import RevenueCatProvider from '@bubblyclouds-app/template/providers/RevenueCatProvider';
import { SessionsProvider } from '@bubblyclouds-app/template/providers/SessionsProvider';
import PartiesProvider from '@bubblyclouds-app/template/providers/PartiesProvider';
import { CollectionProvider } from '@bubblyclouds-app/unblockrace/providers/CollectionProvider';
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
import { PropsWithChildren, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StateType } from '@bubblyclouds-app/types/stateType';
import { APP_CONFIG } from '../../app.config.js';
import {
  getLoginContextMessages,
  getLoginValueProps,
} from '../config/loginMessages';
import { DEFAULT_LOCALE, resources, supportedLocales } from '../i18n';

function AppProviders({ children }: PropsWithChildren) {
  const { t } = useTranslation('app');
  const gameName = t('brand.gameName');
  const platformServices = useMemo<PlatformServices>(
    () => ({
      isCapacitor,
      isElectron,
      openBrowser,
      saveCapacitorState,
      getCapacitorState,
      saveElectronState,
      app: APP_CONFIG.app,
      gameName,
      apiUrl: APP_CONFIG.apiUrl,
      authUrl: APP_CONFIG.authUrl,
      scope: APP_CONFIG.scope,
    }),
    [gameName]
  );
  const loginContextMessages = useMemo(() => getLoginContextMessages(t), [t]);
  const loginValueProps = useMemo(() => getLoginValueProps(t), [t]);

  return (
    <GlobalStateProvider>
      <FetchProvider>
        <CapacitorProvider>
          <UserProvider
            platformServices={platformServices}
            logoSrc="/bubbly-clouds.png"
            appName={t('brand.appName')}
            termsUrl={APP_CONFIG.termsUrl}
            privacyUrl={APP_CONFIG.privacyUrl}
            loginContextMessages={loginContextMessages}
            loginValueProps={loginValueProps}
          >
            <RevenueCatProvider apiKeys={APP_CONFIG.revenueCatApiKeys}>
              <PartiesProvider app={APP_CONFIG.app} apiUrl={APP_CONFIG.apiUrl}>
                <SessionsProvider
                  stateType={StateType.PUZZLE}
                  app={APP_CONFIG.app}
                  apiUrl={APP_CONFIG.apiUrl}
                >
                  <CollectionProvider
                    app={APP_CONFIG.app}
                    apiUrl={APP_CONFIG.apiUrl}
                  >
                    <ThemeProvider attribute="class">
                      <ThemeColorProvider>{children}</ThemeColorProvider>
                    </ThemeProvider>
                  </CollectionProvider>
                </SessionsProvider>
              </PartiesProvider>
            </RevenueCatProvider>
          </UserProvider>
        </CapacitorProvider>
      </FetchProvider>
    </GlobalStateProvider>
  );
}

export function Providers({ children }: PropsWithChildren) {
  return (
    <I18nProvider
      resources={resources}
      defaultLocale={DEFAULT_LOCALE}
      supportedLocales={supportedLocales}
    >
      <GlobalErrorHandler />
      <ErrorBoundary>
        <AppProviders>{children}</AppProviders>
      </ErrorBoundary>
    </I18nProvider>
  );
}
