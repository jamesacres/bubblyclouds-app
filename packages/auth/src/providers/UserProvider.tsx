'use client';
import FetchProvider from './FetchProvider';
import AuthProvider from './AuthProvider';
import PlatformServicesProvider, {
  PlatformServices,
} from './PlatformServicesContext';
import React from 'react';

interface UserProviderProps {
  children: React.ReactNode;
  platformServices: PlatformServices;
  logoSrc: string;
  appName: string;
  termsUrl: string;
  privacyUrl: string;
}

/**
 * UserProvider - Unified auth provider wrapping both FetchProvider and AuthProvider
 *
 * This provider combines fetch state management and authentication logic.
 * Place it near the root of your app, after other data providers but before components.
 *
 * @param platformServices - Optional platform-specific services (capacitor, electron).
 *                          Required when using auth functionality.
 */
const UserProvider: React.FC<UserProviderProps> = ({
  children,
  platformServices,
  logoSrc,
  appName,
  termsUrl,
  privacyUrl,
}) => {
  if (!platformServices) {
    throw new Error('UserProvider requires platformServices to be provided');
  }

  return (
    <PlatformServicesProvider services={platformServices}>
      <FetchProvider>
        <AuthProvider
          scope={platformServices.scope}
          logoSrc={logoSrc}
          appName={appName}
          termsUrl={termsUrl}
          privacyUrl={privacyUrl}
        >
          {children}
        </AuthProvider>
      </FetchProvider>
    </PlatformServicesProvider>
  );
};

export default UserProvider;
