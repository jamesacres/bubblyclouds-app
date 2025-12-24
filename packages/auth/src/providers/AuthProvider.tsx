'use client';
import { pkce } from '../services/pkce';
import { useFetch } from '../hooks/useFetch';
import { PlatformServicesContext } from './PlatformServicesContext';
import { UserProfile } from '../types/UserProfile';
import { useRouter } from 'next/navigation';
import React, { useContext, useEffect } from 'react';
import { Browser } from '@capacitor/browser';

export interface UserContextInterface {
  user?: UserProfile;
  loginRedirect: (config: { userInitiated: boolean }) => Promise<void>;
  isLoggingIn: boolean;
  isInitialised: boolean;
  logout: () => void;
  handleAuthUrl: (options: { active: boolean }) => void;
  handleRestoreState: () => void;
  app: string;
}

export const UserContext = React.createContext<
  UserContextInterface | undefined
>(undefined);

// Hook interface for auth-related fetch operations
export interface AuthFetchHook {
  fetch: (request: Request) => Promise<Response>;
  getUser: () => UserProfile | undefined;
  logout: () => Promise<void>;
  restoreState: (stateString: string) => Promise<UserProfile | undefined>;
}

const buildRedirectUri = (
  isElectron: () => boolean,
  isCapacitor: () => boolean,
  app: string
) => {
  if (isElectron()) {
    // Deep link
    const scheme = `com.bubblyclouds.${app}`;
    return `${scheme}://-/auth.html`;
  } else if (isCapacitor()) {
    // iOS/Android needs custom URL scheme to be able to redirect from our browser back
    const scheme = `com.bubblyclouds.${app}`;
    return `${scheme}://-/auth`;
  }
  return `${window.location.origin}/auth`;
};

let isExhanging = false;
let isInitialising = false;

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = React.useState<UserProfile | undefined>(undefined);
  const platformServices = useContext(PlatformServicesContext);

  if (!platformServices) {
    throw new Error(
      'AuthProvider must be used within PlatformServicesProvider'
    );
  }

  const { fetch, getUser, logout, restoreState } = useFetch();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [isInitialised, setIsInitialised] = React.useState(false);
  const router = useRouter();

  const {
    isElectron,
    isCapacitor,
    openBrowser,
    getCapacitorState,
    app,
    authUrl,
    apiUrl,
  } = platformServices;
  const iss = authUrl;
  const clientId =
    isElectron() || isCapacitor() ? `bubbly-${app}-native` : `bubbly-${app}`;

  const restoreCapacitorState = React.useCallback(
    async (
      handleUser: (
        user?: UserProfile,
        isRestoreState?: boolean
      ) => Promise<void>,
      restoreState: (stateString: string) => Promise<UserProfile | undefined>,
      attempt = 0
    ) => {
      if (user) {
        console.info('restoreCapacitorState already got user skipping');
        return;
      }
      try {
        console.info(
          `restoreCapacitorState getCapacitorState attempt ${attempt}`
        );
        const capacitorState = await getCapacitorState();
        if (capacitorState) {
          console.info('restoreCapacitorState getCapacitorState restoring..');
          const newUser = await restoreState(capacitorState);
          if (newUser) {
            console.info(
              'restoreCapacitorState calling handleUser with newUser'
            );
            await handleUser(newUser, true);
            return;
          } else {
            console.info('restoreCapacitorState getCapacitorState no user');
          }
        } else {
          console.info('restoreCapacitorState getCapacitorState none');
        }
        if (attempt < 5) {
          // Firefox mobile launches a new instance which processed login
          // We need to check to see if it handled it when we launch..
          console.info(
            'restoreCapacitorState try again shortly for firefox mobile..'
          );
          new Promise((res) => {
            setTimeout(async () => {
              await restoreCapacitorState(
                handleUser,
                restoreState,
                attempt + 1
              );
              res(undefined);
            }, 1000);
          });
        }
      } catch (e) {
        console.warn(e);
      }
    },
    [user, getCapacitorState]
  );

  const loginRedirect = React.useCallback(
    async ({ userInitiated }: { userInitiated: boolean }) => {
      console.info('loginRedirect..');
      setIsLoggingIn(true);
      // We use localStorage instead of sessionStorage as Firefox Mobile redirects with a new instance
      localStorage.setItem(
        'restorePathname',
        `${window.location.pathname}${window.location.search}`
      );

      const state = window.crypto.randomUUID();
      localStorage.setItem('state', state);

      const { codeChallenge, codeVerifier, codeChallengeMethod } = await pkce();
      localStorage.setItem('code_verifier', codeVerifier);

      const redirectUri = buildRedirectUri(isElectron, isCapacitor, app);
      const scope = [
        'openid',
        'profile',
        'offline_access',
        'parties.write',
        'members.write',
        'invites.write',
        'sessions.write',
      ];
      const resource = apiUrl;

      const params = new URLSearchParams();
      params.set('state', state);
      params.set('redirect_uri', redirectUri);
      params.set('client_id', clientId);
      params.set('response_type', 'code');
      params.set('scope', scope.join(' '));
      params.set('code_challenge', codeChallenge);
      params.set('code_challenge_method', codeChallengeMethod);
      params.set('resource', resource);
      if (userInitiated) {
        params.set('prompt', 'consent');
      }

      const url = `${iss}/oidc/auth?${params.toString()}`;
      if (isElectron()) {
        await openBrowser(url);
      } else if (isCapacitor()) {
        // Note browserFinished listener added below!!
        await Browser.open({ url, windowName: '_self' });
      } else {
        window.location.href = url;
      }

      // Remove is logging in after 10 seconds in case of error
      setTimeout(() => {
        setIsLoggingIn(false);
      }, 10000);
    },
    [clientId, isElectron, isCapacitor, openBrowser, app, iss, apiUrl]
  );

  const handleUser = React.useCallback(
    async (user?: UserProfile, isRestoreState: boolean = false) => {
      console.info('user received', user);
      if (user) {
        console.info('handleUser', user);
        setUser((currentUser) => {
          if (currentUser) {
            console.warn('handleUser ignoring new user, already got user');
          }
          return currentUser || user;
        });
        if (!isElectron() && !isCapacitor()) {
          // Indicate that if browser closes, next reopen we can try to recover our session
          localStorage.setItem('recoverSession', 'true');
        }
      } else if (!isRestoreState) {
        if (isCapacitor()) {
          await restoreCapacitorState(handleUser, restoreState);
        }
        if (
          localStorage.getItem('recoverSession') === 'true' &&
          window.navigator.onLine // only when we're online
        ) {
          localStorage.setItem('recoverSession', 'false');
          // Redirect to login (hopefully automatically recover auth session)
          console.warn('no user, redirecting to login');
          await loginRedirect({ userInitiated: false });
        }
      }
    },
    [
      loginRedirect,
      restoreState,
      restoreCapacitorState,
      isCapacitor,
      isElectron,
    ]
  );

  const handleAuthUrl = React.useCallback(
    async (options: { active: boolean }) => {
      console.info('handleAuthUrl');
      setIsLoggingIn(true);

      const codeExchange = async () => {
        try {
          if (!isExhanging && options.active) {
            isExhanging = true;
            const query = new URLSearchParams(window.location.search);
            const code = query.get('code') || '';
            const state = query.get('state') || '';
            const redirectUri = buildRedirectUri(isElectron, isCapacitor, app);

            const codeVerifier = localStorage.getItem('code_verifier');
            if (state === localStorage.getItem('state') && codeVerifier) {
              console.info('handleAuthUrl requesting code exchange');
              const params = new URLSearchParams();
              params.set('grant_type', 'authorization_code');
              params.set('client_id', clientId);
              params.set('code_verifier', codeVerifier);
              params.set('code', code);
              params.set('redirect_uri', redirectUri);
              const response = await fetch(
                new Request(`${iss}/oidc/token`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: params.toString(),
                })
              );
              if (response.ok && options.active) {
                // Modified response from public/user-provider-worker.js
                const { user } = await response.json();
                console.info(
                  'handleAuthUrl user received from code exchange',
                  user
                );
                if (user && options.active) {
                  await handleUser(user);
                }
              }
            } else {
              console.info(
                `handleAuthUrl skipping as state ${state} !== localStorage ${localStorage.getItem('state')} or codeVerifier ${codeVerifier} missing`
              );
            }
          } else {
            console.info('handleAuthUrl skipping as isExhanging');
          }
        } catch (e) {
          console.error(e);
        }

        if (options.active) {
          setIsLoggingIn(false);
          isExhanging = false;

          // Navigate back to previous location
          const restorePathname = localStorage.getItem('restorePathname');
          console.info('restorePathname', restorePathname);

          // Clear values from local storage
          localStorage.removeItem('restorePathname');
          localStorage.removeItem('state');
          localStorage.removeItem('code_verifier');

          router.replace(
            restorePathname && restorePathname !== '/auth'
              ? restorePathname
              : '/'
          );
        }
      };
      await codeExchange();
    },
    [clientId, router, handleUser, fetch, isElectron, isCapacitor, app, iss]
  );

  const handleRestoreState = React.useCallback(async () => {
    console.info('restoreState');
    // Request the worker restores the persisted state from electron
    const query = new URLSearchParams(window.location.search);
    const encryptedState = query.get('state') || '';
    const state = await (window as any).electronAPI.decrypt(encryptedState);
    await handleUser(await restoreState(state));
    // Redirect to root of app
    router.replace('/');
  }, [router, restoreState, handleUser]);

  React.useEffect(() => {
    // Really we should unmount service worker and intervals
    // However, tricky to unmount, so to avoid strict mode issues, ensure this only runs once
    if (isInitialising) {
      console.warn('isInitialising, exiting early');
      return;
    }
    isInitialising = true;

    const asyncEffect = async () => {
      if (
        !['/auth', '/restoreState'].includes(
          window.location.pathname.replace('.html', '')
        )
      ) {
        // Request the worker sends us a user result
        handleUser(getUser());
      }

      setIsInitialised(true);
    };
    asyncEffect();
  }, [getUser, handleUser]);

  const handleLogout = async () => {
    console.warn('handleLogout');
    localStorage.setItem('recoverSession', 'false');
    setUser(undefined);
    await logout();
    router.replace('/');
  };

  useEffect(() => {
    let isActive = true;
    // When browser closes, hopefully we will handle the success
    // However, firefox mobile handles it in a new instance
    // Therefore, restore capacitor state if we find we now have one..
    Browser.addListener('browserFinished', () => {
      if (isActive) {
        console.info('browserFinished');
        restoreCapacitorState(handleUser, restoreState);
      }
    });

    return () => {
      isActive = false;
      Browser.removeAllListeners();
    };
  }, [handleUser, restoreState, restoreCapacitorState]);

  return (
    <UserContext.Provider
      value={{
        isInitialised,
        isLoggingIn,
        loginRedirect,
        user,
        handleAuthUrl,
        handleRestoreState,
        logout: handleLogout,
        app,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default AuthProvider;
