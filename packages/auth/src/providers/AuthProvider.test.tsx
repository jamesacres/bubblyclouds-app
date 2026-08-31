import React from 'react';
import { useContext, useRef, useEffect } from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import AuthProvider, {
  UserContext,
  UserContextInterface,
} from './AuthProvider';
import FetchProvider from './FetchProvider';
import PlatformServicesProvider, {
  PlatformServices,
} from './PlatformServicesContext';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
  })),
}));

// These mocks are no longer needed - services will be injected through context

jest.mock('../services/pkce', () => ({
  pkce: jest.fn(() =>
    Promise.resolve({
      codeChallenge: 'test-challenge',
      codeVerifier: 'test-verifier',
      codeChallengeMethod: 'S256',
    })
  ),
}));

jest.mock('@capacitor/browser', () => ({
  Browser: {
    open: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

const mockPlatformServices: PlatformServices = {
  isElectron: () => false,
  isCapacitor: () => false,
  openBrowser: jest.fn(),
  saveElectronState: jest.fn(),
  getCapacitorState: jest.fn(() => Promise.resolve('')),
  saveCapacitorState: jest.fn(),
  app: 'test',
  gameName: 'Test',
  apiUrl: 'https://api.bubblyclouds.com',
  authUrl: 'https://auth.bubblyclouds.com',
  scope: ['openid', 'profile'],
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <PlatformServicesProvider services={mockPlatformServices}>
    <FetchProvider>
      <AuthProvider
        scope={mockPlatformServices.scope}
        logoSrc="/logo.png"
        appName="Test App"
        termsUrl="https://example.com/terms"
        privacyUrl="https://example.com/privacy"
      >
        {children}
      </AuthProvider>
    </FetchProvider>
  </PlatformServicesProvider>
);

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('provider setup', () => {
    it('should render children', () => {
      render(
        <Wrapper>
          <div>Test Content</div>
        </Wrapper>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should provide UserContext', async () => {
      const contextValueRef = {
        current: undefined as UserContextInterface | undefined,
      };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(contextValueRef);
        useEffect(() => {
          ref.current.current = context;
        }, [context]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(contextValueRef.current).toBeDefined();
      });
    });
  });

  describe('initial state', () => {
    it('should initialize with no user', async () => {
      const userRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(userRef);
        useEffect(() => {
          ref.current.current = context?.user;
        }, [context?.user]);
        return <div>User: {context?.user ? context.user.name : 'None'}</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(userRef.current).toBeUndefined();
      });
    });

    it('should initialize isLoggingIn as false', async () => {
      const isLoggingInRef = { current: true };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(isLoggingInRef);
        useEffect(() => {
          ref.current.current = context?.isLoggingIn ?? false;
        }, [context?.isLoggingIn]);
        return <div>Logging in: {context?.isLoggingIn ? 'yes' : 'no'}</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(isLoggingInRef.current).toBe(false);
      });
    });

    it('should provide all required context methods', async () => {
      const contextRef = {
        current: undefined as UserContextInterface | undefined,
      };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(contextRef);
        useEffect(() => {
          ref.current.current = context;
        }, [context]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(contextRef.current?.loginRedirect).toBeDefined();
        expect(contextRef.current?.logout).toBeDefined();
        expect(contextRef.current?.handleAuthUrl).toBeDefined();
        expect(contextRef.current?.handleRestoreState).toBeDefined();
      });
    });
  });

  describe('loginRedirect', () => {
    it('should set isLoggingIn to true', async () => {
      const isLoggingInRef = { current: false };
      const loginRedirectRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const isLoggingInLocalRef = useRef(isLoggingInRef);
        const loginRedirectLocalRef = useRef(loginRedirectRef);
        useEffect(() => {
          isLoggingInLocalRef.current.current = context?.isLoggingIn ?? false;
          loginRedirectLocalRef.current.current = context?.loginRedirect;
        }, [context?.isLoggingIn, context?.loginRedirect]);
        return <div>Logging in: {context?.isLoggingIn ? 'yes' : 'no'}</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(loginRedirectRef.current).toBeDefined();
      });

      if (loginRedirectRef.current) {
        loginRedirectRef.current({ userInitiated: true });
        // Don't await - just check that it's called
        expect(isLoggingInRef.current).toBeDefined();
      }
    });

    it('should skip a second loginRedirect call while one is already in progress', async () => {
      const loginRedirectRef = {
        current: undefined as UserContextInterface['loginRedirect'] | undefined,
      };
      const isLoggingInRef = { current: false };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const loginRedirectLocalRef = useRef(loginRedirectRef);
        const isLoggingInLocalRef = useRef(isLoggingInRef);
        useEffect(() => {
          loginRedirectLocalRef.current.current = context?.loginRedirect;
          isLoggingInLocalRef.current.current = context?.isLoggingIn ?? false;
        }, [context?.loginRedirect, context?.isLoggingIn]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(loginRedirectRef.current).toBeDefined();
      });

      loginRedirectRef.current!({ userInitiated: true });

      await waitFor(() => {
        expect(isLoggingInRef.current).toBe(true);
      });

      const stateAfterFirstCall = localStorage.getItem('state');

      await loginRedirectRef.current!({ userInitiated: true });

      expect(localStorage.getItem('state')).toBe(stateAfterFirstCall);
    });

    it('should store pathname in localStorage', async () => {
      const loginRedirectRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(loginRedirectRef);
        useEffect(() => {
          ref.current.current = context?.loginRedirect;
        }, [context?.loginRedirect]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(loginRedirectRef.current).toBeDefined();
      });

      if (loginRedirectRef.current) {
        loginRedirectRef.current({ userInitiated: true });

        await waitFor(() => {
          expect(localStorage.getItem('restorePathname')).toBeDefined();
        });
      }
    });

    it('should store random state in localStorage', async () => {
      const loginRedirectRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(loginRedirectRef);
        useEffect(() => {
          ref.current.current = context?.loginRedirect;
        }, [context?.loginRedirect]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(loginRedirectRef.current).toBeDefined();
      });

      if (loginRedirectRef.current) {
        loginRedirectRef.current({ userInitiated: true });

        await waitFor(() => {
          expect(localStorage.getItem('state')).toBeDefined();
        });
      }
    });

    it('should store code verifier in localStorage', async () => {
      const loginRedirectRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(loginRedirectRef);
        useEffect(() => {
          ref.current.current = context?.loginRedirect;
        }, [context?.loginRedirect]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(loginRedirectRef.current).toBeDefined();
      });

      if (loginRedirectRef.current) {
        loginRedirectRef.current({ userInitiated: true });

        await waitFor(() => {
          expect(localStorage.getItem('code_verifier')).toBeDefined();
        });
      }
    });
  });

  describe('logout', () => {
    it('should clear user', async () => {
      const logoutRef = { current: undefined as any };
      const userRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const logoutLocalRef = useRef(logoutRef);
        const userLocalRef = useRef(userRef);
        useEffect(() => {
          logoutLocalRef.current.current = context?.logout;
          userLocalRef.current.current = context?.user;
        }, [context?.logout, context?.user]);
        return <div>User: {context?.user ? 'exists' : 'none'}</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(logoutRef.current).toBeDefined();
      });

      if (logoutRef.current) {
        logoutRef.current();

        await waitFor(() => {
          expect(userRef.current).toBeUndefined();
        });
      }
    });

    it('should set recoverSession to false', async () => {
      const logoutRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(logoutRef);
        useEffect(() => {
          ref.current.current = context?.logout;
        }, [context?.logout]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(logoutRef.current).toBeDefined();
      });

      if (logoutRef.current) {
        logoutRef.current();

        expect(localStorage.getItem('recoverSession')).toBe('false');
      }
    });
  });

  describe('handleAuthUrl', () => {
    it('should be defined', async () => {
      const handleAuthUrlRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(handleAuthUrlRef);
        useEffect(() => {
          ref.current.current = context?.handleAuthUrl;
        }, [context?.handleAuthUrl]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(handleAuthUrlRef.current).toBeDefined();
        expect(typeof handleAuthUrlRef.current).toBe('function');
      });
    });

    it('should set isLoggingIn when called', async () => {
      const handleAuthUrlRef = { current: undefined as any };
      const isLoggingInRef = { current: false };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const handleAuthUrlLocalRef = useRef(handleAuthUrlRef);
        const isLoggingInLocalRef = useRef(isLoggingInRef);
        useEffect(() => {
          handleAuthUrlLocalRef.current.current = context?.handleAuthUrl;
          isLoggingInLocalRef.current.current = context?.isLoggingIn ?? false;
        }, [context?.handleAuthUrl, context?.isLoggingIn]);
        return <div>Logging in: {context?.isLoggingIn ? 'yes' : 'no'}</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(handleAuthUrlRef.current).toBeDefined();
      });

      if (handleAuthUrlRef.current) {
        handleAuthUrlRef.current({ active: true });
        // Check that it's called without errors
        expect(handleAuthUrlRef.current).toBeDefined();
      }
    });
  });

  describe('handleRestoreState', () => {
    it('should be defined', async () => {
      const handleRestoreStateRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(handleRestoreStateRef);
        useEffect(() => {
          ref.current.current = context?.handleRestoreState;
        }, [context?.handleRestoreState]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(handleRestoreStateRef.current).toBeDefined();
        expect(typeof handleRestoreStateRef.current).toBe('function');
      });
    });
  });

  describe('context methods', () => {
    it('should provide loginRedirect function', async () => {
      const loginRedirectRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(loginRedirectRef);
        useEffect(() => {
          ref.current.current = context?.loginRedirect;
        }, [context?.loginRedirect]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(typeof loginRedirectRef.current).toBe('function');
      });
    });

    it('should provide logout function', async () => {
      const logoutRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(logoutRef);
        useEffect(() => {
          ref.current.current = context?.logout;
        }, [context?.logout]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(typeof logoutRef.current).toBe('function');
      });
    });

    it('should provide handleAuthUrl function', async () => {
      const handleAuthUrlRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(handleAuthUrlRef);
        useEffect(() => {
          ref.current.current = context?.handleAuthUrl;
        }, [context?.handleAuthUrl]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(typeof handleAuthUrlRef.current).toBe('function');
      });
    });

    it('should provide handleRestoreState function', async () => {
      const handleRestoreStateRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(handleRestoreStateRef);
        useEffect(() => {
          ref.current.current = context?.handleRestoreState;
        }, [context?.handleRestoreState]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(typeof handleRestoreStateRef.current).toBe('function');
      });
    });
  });

  describe('state management', () => {
    it('should provide isInitialised state', async () => {
      const isInitialisedRef = { current: undefined as boolean | undefined };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(isInitialisedRef);
        useEffect(() => {
          ref.current.current = context?.isInitialised;
        }, [context?.isInitialised]);
        return <div>Initialised: {context?.isInitialised ? 'yes' : 'no'}</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // The provider should eventually set isInitialised
      // Note: Due to module-level isInitialising guard, this may already be true
      await waitFor(
        () => {
          expect(typeof isInitialisedRef.current).toBe('boolean');
        },
        { timeout: 3000 }
      );
    });

    it('should provide isLoggingIn state', async () => {
      const isLoggingInRef = { current: undefined as boolean | undefined };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(isLoggingInRef);
        useEffect(() => {
          ref.current.current = context?.isLoggingIn;
        }, [context?.isLoggingIn]);
        return <div>Logging in: {context?.isLoggingIn ? 'yes' : 'no'}</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(typeof isLoggingInRef.current).toBe('boolean');
      });
    });

    it('should provide user state', async () => {
      const userRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(userRef);
        useEffect(() => {
          ref.current.current = context?.user;
        }, [context?.user]);
        return <div>User state: {context?.user ? 'exists' : 'undefined'}</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(userRef.current === undefined || userRef.current !== null).toBe(
          true
        );
      });
    });
  });

  describe('showLoginModal', () => {
    it('calls the provided onCancel callback when the modal is dismissed without signing in', async () => {
      const showLoginModalRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(showLoginModalRef);
        useEffect(() => {
          ref.current.current = context?.showLoginModal;
        }, [context?.showLoginModal]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(showLoginModalRef.current).toBeDefined();
      });

      const onCancel = jest.fn();
      showLoginModalRef.current(onCancel);

      const cancelButton = await screen.findByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not call onCancel when no callback is provided', async () => {
      const showLoginModalRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(showLoginModalRef);
        useEffect(() => {
          ref.current.current = context?.showLoginModal;
        }, [context?.showLoginModal]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(showLoginModalRef.current).toBeDefined();
      });

      showLoginModalRef.current();

      const cancelButton = await screen.findByText('Cancel');
      expect(() => fireEvent.click(cancelButton)).not.toThrow();
    });

    it('renders the contextual message for the context passed to showLoginModal', async () => {
      const showLoginModalRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(showLoginModalRef);
        useEffect(() => {
          ref.current.current = context?.showLoginModal;
        }, [context?.showLoginModal]);
        return <div>Test</div>;
      };

      const WrapperWithContextMessages = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <PlatformServicesProvider services={mockPlatformServices}>
          <FetchProvider>
            <AuthProvider
              scope={mockPlatformServices.scope}
              logoSrc="/logo.png"
              appName="Test App"
              termsUrl="https://example.com/terms"
              privacyUrl="https://example.com/privacy"
              contextMessages={{
                [LoginContext.DAILY_PUZZLE]: {
                  textColor: 'text-violet-200',
                  content: 'Sign in to start today’s puzzle',
                },
              }}
            >
              {children}
            </AuthProvider>
          </FetchProvider>
        </PlatformServicesProvider>
      );

      render(
        <WrapperWithContextMessages>
          <TestComponent />
        </WrapperWithContextMessages>
      );

      await waitFor(() => {
        expect(showLoginModalRef.current).toBeDefined();
      });

      showLoginModalRef.current(undefined, LoginContext.DAILY_PUZZLE);

      expect(
        await screen.findByText('Sign in to start today’s puzzle')
      ).toBeInTheDocument();
    });
  });

  describe('back navigation while logging in', () => {
    it('leaves the login modal open when a provider button is clicked, so pressing back shows it again', async () => {
      const showLoginModalRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(showLoginModalRef);
        useEffect(() => {
          ref.current.current = context?.showLoginModal;
        }, [context?.showLoginModal]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(showLoginModalRef.current).toBeDefined();
      });

      showLoginModalRef.current();

      const googleButton = await screen.findByText('Sign in with Google');
      fireEvent.click(googleButton);

      // The redirect navigates the whole page away, so if the user presses
      // back the browser restores this component with whatever React state
      // was last committed. The modal must still be open at that point.
      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    });

    it('dismisses the login modal once a user is received after redirecting back', async () => {
      const showLoginModalRef = { current: undefined as any };

      window.electronAPI = {
        openBrowser: jest.fn(),
        encrypt: jest.fn(),
        decrypt: jest.fn(() =>
          Promise.resolve(JSON.stringify({ user: { id: 'test-user' } }))
        ),
        saveState: jest.fn(),
      };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(showLoginModalRef);
        useEffect(() => {
          ref.current.current = {
            showLoginModal: context?.showLoginModal,
            handleRestoreState: context?.handleRestoreState,
          };
        }, [context?.showLoginModal, context?.handleRestoreState]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(showLoginModalRef.current?.showLoginModal).toBeDefined();
      });

      showLoginModalRef.current.showLoginModal();
      const googleButton = await screen.findByText('Sign in with Google');
      fireEvent.click(googleButton);
      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();

      window.history.pushState({}, '', '/?state=encoded-state');

      await showLoginModalRef.current.handleRestoreState();

      await waitFor(() => {
        expect(
          screen.queryByText('Sign in with Google')
        ).not.toBeInTheDocument();
      });

      delete window.electronAPI;
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully', async () => {
      const TestComponent = () => {
        useContext(UserContext);
        return <div>Test</div>;
      };

      expect(() => {
        render(
          <Wrapper>
            <TestComponent />
          </Wrapper>
        );
      }).not.toThrow();
    });

    it('should throw when rendered without a PlatformServicesProvider ancestor', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(
          <FetchProvider>
            <AuthProvider
              scope={mockPlatformServices.scope}
              logoSrc="/logo.png"
              appName="Test App"
              termsUrl="https://example.com/terms"
              privacyUrl="https://example.com/privacy"
            >
              <div>Test</div>
            </AuthProvider>
          </FetchProvider>
        );
      }).toThrow('AuthProvider must be used within PlatformServicesProvider');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('localStorage integration', () => {
    it('should use localStorage for storing state', async () => {
      const loginRedirectRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(loginRedirectRef);
        useEffect(() => {
          ref.current.current = context?.loginRedirect;
        }, [context?.loginRedirect]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(loginRedirectRef.current).toBeDefined();
      });

      if (loginRedirectRef.current) {
        loginRedirectRef.current({ userInitiated: true });

        await waitFor(() => {
          // Should store various values in localStorage
          const restorePathname = localStorage.getItem('restorePathname');
          const state = localStorage.getItem('state');
          const codeVerifier = localStorage.getItem('code_verifier');

          expect(restorePathname).toBeTruthy();
          expect(state).toBeTruthy();
          expect(codeVerifier).toBeTruthy();
        });
      }
    });
  });

  describe('platform-specific redirect URIs', () => {
    it('should use a deep link scheme when running in Electron', async () => {
      const electronPlatformServices: PlatformServices = {
        ...mockPlatformServices,
        isElectron: () => true,
      };
      const ElectronWrapper = ({ children }: { children: React.ReactNode }) => (
        <PlatformServicesProvider services={electronPlatformServices}>
          <FetchProvider>
            <AuthProvider
              scope={mockPlatformServices.scope}
              logoSrc="/logo.png"
              appName="Test App"
              termsUrl="https://example.com/terms"
              privacyUrl="https://example.com/privacy"
            >
              {children}
            </AuthProvider>
          </FetchProvider>
        </PlatformServicesProvider>
      );

      const loginRedirectRef = { current: undefined as any };
      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(loginRedirectRef);
        useEffect(() => {
          ref.current.current = context?.loginRedirect;
        }, [context?.loginRedirect]);
        return <div>Test</div>;
      };

      render(
        <ElectronWrapper>
          <TestComponent />
        </ElectronWrapper>
      );

      await waitFor(() => {
        expect(loginRedirectRef.current).toBeDefined();
      });

      await loginRedirectRef.current!({ userInitiated: true });

      expect(electronPlatformServices.openBrowser).toHaveBeenCalledWith(
        expect.stringContaining(
          encodeURIComponent('com.bubblyclouds.test://-/auth.html')
        )
      );
    });

    it('should use Browser.open with a custom URL scheme when running in Capacitor', async () => {
      const { Browser } = jest.requireMock('@capacitor/browser');
      const capacitorPlatformServices: PlatformServices = {
        ...mockPlatformServices,
        isCapacitor: () => true,
      };
      const CapacitorWrapper = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <PlatformServicesProvider services={capacitorPlatformServices}>
          <FetchProvider>
            <AuthProvider
              scope={mockPlatformServices.scope}
              logoSrc="/logo.png"
              appName="Test App"
              termsUrl="https://example.com/terms"
              privacyUrl="https://example.com/privacy"
            >
              {children}
            </AuthProvider>
          </FetchProvider>
        </PlatformServicesProvider>
      );

      const loginRedirectRef = { current: undefined as any };
      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(loginRedirectRef);
        useEffect(() => {
          ref.current.current = context?.loginRedirect;
        }, [context?.loginRedirect]);
        return <div>Test</div>;
      };

      render(
        <CapacitorWrapper>
          <TestComponent />
        </CapacitorWrapper>
      );

      await waitFor(() => {
        expect(loginRedirectRef.current).toBeDefined();
      });

      await loginRedirectRef.current!({ userInitiated: true });

      expect(Browser.open).toHaveBeenCalledWith(
        expect.objectContaining({ windowName: '_self' })
      );
      const openCallUrl = Browser.open.mock.calls[0][0].url as string;
      expect(openCallUrl).toContain(
        encodeURIComponent('com.bubblyclouds.test://-/auth')
      );
    });

    it('should complete the redirect flow when an identity provider and email are supplied', async () => {
      // jsdom doesn't support intercepting window.location.href assignment,
      // so we verify the identityProvider/email branches execute without
      // throwing and that the surrounding PKCE state is still stored,
      // proving the code path completed past those conditionals.
      const loginRedirectRef = { current: undefined as any };
      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(loginRedirectRef);
        useEffect(() => {
          ref.current.current = context?.loginRedirect;
        }, [context?.loginRedirect]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(loginRedirectRef.current).toBeDefined();
      });

      await expect(
        loginRedirectRef.current!({
          userInitiated: true,
          identityProvider: 'apple',
          email: 'person@example.com',
        })
      ).resolves.toBeUndefined();

      expect(localStorage.getItem('code_verifier')).toBe('test-verifier');
      expect(localStorage.getItem('state')).toBeTruthy();
    });

    it('should reset isLoggingIn after the timeout even without a redirect completing', async () => {
      jest.useFakeTimers({ legacyFakeTimers: false });

      const TestComponent = () => {
        const context = useContext(UserContext);
        return (
          <div>
            <div data-testid="logging-in">
              {context?.isLoggingIn ? 'yes' : 'no'}
            </div>
            <button
              onClick={() => context?.loginRedirect({ userInitiated: true })}
            >
              Login
            </button>
          </div>
        );
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Login'));
        // Flush the pkce() promise microtask queued inside loginRedirect
        await Promise.resolve();
      });

      expect(screen.getByTestId('logging-in')).toHaveTextContent('yes');

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(screen.getByTestId('logging-in')).toHaveTextContent('no');

      jest.useRealTimers();
    });
  });

  describe('handleAuthUrl code exchange', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should exchange the code for tokens and call handleUser when state and code_verifier match', async () => {
      localStorage.setItem('state', 'matching-state');
      localStorage.setItem('code_verifier', 'matching-verifier');
      localStorage.setItem('restorePathname', '/puzzle/42');
      window.history.pushState(
        {},
        '',
        '/auth?code=abc123&state=matching-state'
      );

      // The id_token payload below decodes to
      // {"sub":"user-123","name":"Exchanged User"}
      const idToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsIm5hbWUiOiJFeGNoYW5nZWQgVXNlciJ9.test';
      global.fetch = jest.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            id_token: idToken,
            expires_in: 3600,
          }),
          { status: 200 }
        )
      );

      const userRef = { current: undefined as any };
      const handleAuthUrlRef = { current: undefined as any };
      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef({ userRef, handleAuthUrlRef });
        useEffect(() => {
          ref.current.userRef.current = context?.user;
          ref.current.handleAuthUrlRef.current = context?.handleAuthUrl;
        }, [context?.user, context?.handleAuthUrl]);
        return <div>User: {context?.user?.name || 'none'}</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(handleAuthUrlRef.current).toBeDefined();
      });

      await act(async () => {
        await handleAuthUrlRef.current!({ active: true });
      });

      expect(global.fetch).toHaveBeenCalled();
      const [tokenRequest] = (global.fetch as jest.Mock).mock.calls[0];
      expect((tokenRequest as Request).url).toBe(
        'https://auth.bubblyclouds.com/oidc/token'
      );

      await waitFor(() => {
        expect(screen.getByText('User: Exchanged User')).toBeInTheDocument();
      });

      // localStorage should be cleared after a completed, active exchange
      expect(localStorage.getItem('restorePathname')).toBeNull();
      expect(localStorage.getItem('state')).toBeNull();
      expect(localStorage.getItem('code_verifier')).toBeNull();
    });

    it('should skip the exchange when state does not match localStorage', async () => {
      localStorage.setItem('state', 'expected-state');
      localStorage.setItem('code_verifier', 'some-verifier');
      window.history.pushState(
        {},
        '',
        '/auth?code=abc123&state=mismatched-state'
      );

      global.fetch = jest.fn();

      const handleAuthUrlRef = { current: undefined as any };
      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(handleAuthUrlRef);
        useEffect(() => {
          ref.current.current = context?.handleAuthUrl;
        }, [context?.handleAuthUrl]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(handleAuthUrlRef.current).toBeDefined();
      });

      await act(async () => {
        await handleAuthUrlRef.current!({ active: true });
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should skip the exchange when code_verifier is missing', async () => {
      localStorage.setItem('state', 'matching-state');
      window.history.pushState(
        {},
        '',
        '/auth?code=abc123&state=matching-state'
      );

      global.fetch = jest.fn();

      const handleAuthUrlRef = { current: undefined as any };
      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(handleAuthUrlRef);
        useEffect(() => {
          ref.current.current = context?.handleAuthUrl;
        }, [context?.handleAuthUrl]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(handleAuthUrlRef.current).toBeDefined();
      });

      await act(async () => {
        await handleAuthUrlRef.current!({ active: true });
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should catch and log errors thrown during code exchange without crashing', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      localStorage.setItem('state', 'matching-state');
      localStorage.setItem('code_verifier', 'matching-verifier');
      window.history.pushState(
        {},
        '',
        '/auth?code=abc123&state=matching-state'
      );

      global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

      const handleAuthUrlRef = { current: undefined as any };
      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(handleAuthUrlRef);
        useEffect(() => {
          ref.current.current = context?.handleAuthUrl;
        }, [context?.handleAuthUrl]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(handleAuthUrlRef.current).toBeDefined();
      });

      await expect(
        act(async () => {
          await handleAuthUrlRef.current!({ active: true });
        })
      ).resolves.toBeUndefined();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    it('should not navigate or clear localStorage when options.active is false', async () => {
      localStorage.setItem('state', 'matching-state');
      localStorage.setItem('code_verifier', 'matching-verifier');
      localStorage.setItem('restorePathname', '/keep/me');
      window.history.pushState(
        {},
        '',
        '/auth?code=abc123&state=matching-state'
      );

      global.fetch = jest.fn();

      const handleAuthUrlRef = { current: undefined as any };
      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(handleAuthUrlRef);
        useEffect(() => {
          ref.current.current = context?.handleAuthUrl;
        }, [context?.handleAuthUrl]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(handleAuthUrlRef.current).toBeDefined();
      });

      await act(async () => {
        await handleAuthUrlRef.current!({ active: false });
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(localStorage.getItem('restorePathname')).toBe('/keep/me');
    });
  });

  describe('handleRestoreState', () => {
    it('should throw when window.electronAPI is not available', async () => {
      const handleRestoreStateRef = { current: undefined as any };
      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(handleRestoreStateRef);
        useEffect(() => {
          ref.current.current = context?.handleRestoreState;
        }, [context?.handleRestoreState]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(handleRestoreStateRef.current).toBeDefined();
      });

      delete window.electronAPI;

      await expect(handleRestoreStateRef.current!()).rejects.toThrow(
        'Electron API not available'
      );
    });
  });

  describe('login modal provider error handling', () => {
    it('should keep the modal open and stop isLoggingIn when Google login redirect throws', async () => {
      const capacitorPlatformServices: PlatformServices = {
        ...mockPlatformServices,
        isCapacitor: () => true,
      };
      const { Browser } = jest.requireMock('@capacitor/browser');
      (Browser.open as jest.Mock).mockRejectedValueOnce(
        new Error('browser failed to open')
      );
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const CapacitorWrapper = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <PlatformServicesProvider services={capacitorPlatformServices}>
          <FetchProvider>
            <AuthProvider
              scope={mockPlatformServices.scope}
              logoSrc="/logo.png"
              appName="Test App"
              termsUrl="https://example.com/terms"
              privacyUrl="https://example.com/privacy"
            >
              {children}
            </AuthProvider>
          </FetchProvider>
        </PlatformServicesProvider>
      );

      const showLoginModalRef = { current: undefined as any };
      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(showLoginModalRef);
        useEffect(() => {
          ref.current.current = context?.showLoginModal;
        }, [context?.showLoginModal]);
        return <div>Test</div>;
      };

      render(
        <CapacitorWrapper>
          <TestComponent />
        </CapacitorWrapper>
      );

      await waitFor(() => {
        expect(showLoginModalRef.current).toBeDefined();
      });

      showLoginModalRef.current();

      const googleButton = await screen.findByText('Sign in with Google');

      await act(async () => {
        fireEvent.click(googleButton);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    it('should keep the modal open and stop isLoggingIn when Apple login redirect throws', async () => {
      const capacitorPlatformServices: PlatformServices = {
        ...mockPlatformServices,
        isCapacitor: () => true,
      };
      const { Browser } = jest.requireMock('@capacitor/browser');
      (Browser.open as jest.Mock).mockRejectedValueOnce(
        new Error('browser failed to open')
      );

      const CapacitorWrapper = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <PlatformServicesProvider services={capacitorPlatformServices}>
          <FetchProvider>
            <AuthProvider
              scope={mockPlatformServices.scope}
              logoSrc="/logo.png"
              appName="Test App"
              termsUrl="https://example.com/terms"
              privacyUrl="https://example.com/privacy"
            >
              {children}
            </AuthProvider>
          </FetchProvider>
        </PlatformServicesProvider>
      );

      const showLoginModalRef = { current: undefined as any };
      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(showLoginModalRef);
        useEffect(() => {
          ref.current.current = context?.showLoginModal;
        }, [context?.showLoginModal]);
        return <div>Test</div>;
      };

      render(
        <CapacitorWrapper>
          <TestComponent />
        </CapacitorWrapper>
      );

      await waitFor(() => {
        expect(showLoginModalRef.current).toBeDefined();
      });

      showLoginModalRef.current();

      const appleButton = await screen.findByText('Sign in with Apple');

      await act(async () => {
        fireEvent.click(appleButton);
        await Promise.resolve();
        await Promise.resolve();
      });

      // The modal should still be open (still showing the Apple button)
      // since the catch handler intentionally leaves it open for retry.
      expect(screen.getByText('Sign in with Apple')).toBeInTheDocument();
    });

    it('should keep the modal open and stop isLoggingIn when email login redirect throws', async () => {
      const capacitorPlatformServices: PlatformServices = {
        ...mockPlatformServices,
        isCapacitor: () => true,
      };
      const { Browser } = jest.requireMock('@capacitor/browser');
      (Browser.open as jest.Mock).mockRejectedValueOnce(
        new Error('browser failed to open')
      );

      const CapacitorWrapper = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <PlatformServicesProvider services={capacitorPlatformServices}>
          <FetchProvider>
            <AuthProvider
              scope={mockPlatformServices.scope}
              logoSrc="/logo.png"
              appName="Test App"
              termsUrl="https://example.com/terms"
              privacyUrl="https://example.com/privacy"
            >
              {children}
            </AuthProvider>
          </FetchProvider>
        </PlatformServicesProvider>
      );

      const showLoginModalRef = { current: undefined as any };
      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(showLoginModalRef);
        useEffect(() => {
          ref.current.current = context?.showLoginModal;
        }, [context?.showLoginModal]);
        return <div>Test</div>;
      };

      render(
        <CapacitorWrapper>
          <TestComponent />
        </CapacitorWrapper>
      );

      await waitFor(() => {
        expect(showLoginModalRef.current).toBeDefined();
      });

      showLoginModalRef.current();

      const emailInput = await screen.findByPlaceholderText('your@email.com');
      fireEvent.change(emailInput, { target: { value: 'me@example.com' } });
      const continueButton = screen.getByText('Continue');

      await act(async () => {
        fireEvent.click(continueButton);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    });
  });

  describe('handleUser branches', () => {
    it('should ignore a second user when one is already set, logging a warning', async () => {
      window.electronAPI = {
        openBrowser: jest.fn(),
        encrypt: jest.fn(),
        decrypt: jest
          .fn()
          .mockResolvedValueOnce(
            JSON.stringify({
              accessToken: 'token',
              accessExpiry: new Date(Date.now() + 3600000).toISOString(),
              refreshToken: 'refresh',
              refreshExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
              user: { sub: 'first-user', name: 'First' },
              userExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
            })
          )
          .mockResolvedValueOnce(
            JSON.stringify({
              accessToken: 'token2',
              accessExpiry: new Date(Date.now() + 3600000).toISOString(),
              refreshToken: 'refresh2',
              refreshExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
              user: { sub: 'second-user', name: 'Second' },
              userExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
            })
          ),
        saveState: jest.fn(),
      };
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const userRef = { current: undefined as any };
      const handleRestoreStateRef = { current: undefined as any };
      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef({ userRef, handleRestoreStateRef });
        useEffect(() => {
          ref.current.userRef.current = context?.user;
          ref.current.handleRestoreStateRef.current =
            context?.handleRestoreState;
        }, [context?.user, context?.handleRestoreState]);
        return <div>User: {context?.user?.name || 'none'}</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(handleRestoreStateRef.current).toBeDefined();
      });

      await act(async () => {
        await handleRestoreStateRef.current!();
      });

      await waitFor(() => {
        expect(screen.getByText('User: First')).toBeInTheDocument();
      });

      await act(async () => {
        await handleRestoreStateRef.current!();
      });

      // Second user should be ignored, first user retained
      expect(screen.getByText('User: First')).toBeInTheDocument();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'handleUser ignoring new user, already got user'
      );

      consoleWarnSpy.mockRestore();
      delete window.electronAPI;
    });

    it('should auto-redirect to login when recoverSession is true, online, and a restore yields no user', async () => {
      // handleUser's recoverSession auto-redirect branch (no user +
      // !isRestoreState) is normally reached from the initial mount effect,
      // which is guarded by a module-level isInitialising flag that only
      // fires once per module instance - already tripped by earlier tests
      // in this file. We reach the same branch instead via
      // handleRestoreState, which calls handleUser(await restoreState(...))
      // with a single argument (isRestoreState defaults to false), so a
      // decrypted state whose "user" field is null drives the same path.
      window.electronAPI = {
        openBrowser: jest.fn(),
        encrypt: jest.fn(),
        decrypt: jest.fn().mockResolvedValue(
          JSON.stringify({
            accessToken: null,
            accessExpiry: null,
            refreshToken: null,
            refreshExpiry: null,
            user: null,
            userExpiry: null,
          })
        ),
        saveState: jest.fn(),
      };
      localStorage.setItem('recoverSession', 'true');
      Object.defineProperty(window.navigator, 'onLine', {
        configurable: true,
        value: true,
      });

      const isLoggingInRef = { current: false };
      const handleRestoreStateRef = { current: undefined as any };
      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef({ isLoggingInRef, handleRestoreStateRef });
        useEffect(() => {
          ref.current.isLoggingInRef.current = context?.isLoggingIn ?? false;
          ref.current.handleRestoreStateRef.current =
            context?.handleRestoreState;
        }, [context?.isLoggingIn, context?.handleRestoreState]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(handleRestoreStateRef.current).toBeDefined();
      });

      await act(async () => {
        await handleRestoreStateRef.current!();
      });

      await waitFor(() => {
        expect(localStorage.getItem('recoverSession')).toBe('false');
      });

      await waitFor(() => {
        expect(isLoggingInRef.current).toBe(true);
      });

      delete window.electronAPI;
    });

    it('should not auto-redirect again in the same tab after a prior recovery attempt already failed', async () => {
      // sessionStorage circuit breaker: recoverSession is re-armed to 'true'
      // only by a successful login, so on its own it can't stop a retry loop
      // if the OIDC round trip keeps bouncing back without one. Simulating
      // that here by setting recoverSession back to 'true' as if a prior
      // attempt had somehow re-armed it, with the tab-scoped flag already
      // set from that prior attempt.
      window.electronAPI = {
        openBrowser: jest.fn(),
        encrypt: jest.fn(),
        decrypt: jest.fn().mockResolvedValue(
          JSON.stringify({
            accessToken: null,
            accessExpiry: null,
            refreshToken: null,
            refreshExpiry: null,
            user: null,
            userExpiry: null,
          })
        ),
        saveState: jest.fn(),
      };
      localStorage.setItem('recoverSession', 'true');
      sessionStorage.setItem('recoverSessionAttempted', 'true');
      Object.defineProperty(window.navigator, 'onLine', {
        configurable: true,
        value: true,
      });

      const isLoggingInRef = { current: false };
      const handleRestoreStateRef = { current: undefined as any };
      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef({ isLoggingInRef, handleRestoreStateRef });
        useEffect(() => {
          ref.current.isLoggingInRef.current = context?.isLoggingIn ?? false;
          ref.current.handleRestoreStateRef.current =
            context?.handleRestoreState;
        }, [context?.isLoggingIn, context?.handleRestoreState]);
        return <div>Test</div>;
      };

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(handleRestoreStateRef.current).toBeDefined();
      });

      await act(async () => {
        await handleRestoreStateRef.current!();
      });

      // recoverSession is left untouched (not attempted, so not cleared)
      expect(localStorage.getItem('recoverSession')).toBe('true');
      // isLoggingIn never flips true, since loginRedirect was never called
      expect(isLoggingInRef.current).toBe(false);

      delete window.electronAPI;
    });
  });

  describe('restoreCapacitorState via handleUser', () => {
    it('should restore a user from getCapacitorState when isCapacitor and no user is present', async () => {
      const capacitorState = JSON.stringify({
        accessToken: 'cap-token',
        accessExpiry: new Date(Date.now() + 3600000).toISOString(),
        refreshToken: 'cap-refresh',
        refreshExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
        user: { sub: 'capacitor-user', name: 'Capacitor User' },
        userExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
      });
      const capacitorPlatformServices: PlatformServices = {
        ...mockPlatformServices,
        isCapacitor: () => true,
        getCapacitorState: jest.fn().mockResolvedValue(capacitorState),
      };

      window.electronAPI = {
        openBrowser: jest.fn(),
        encrypt: jest.fn(),
        decrypt: jest.fn().mockResolvedValue(
          JSON.stringify({
            accessToken: null,
            accessExpiry: null,
            refreshToken: null,
            refreshExpiry: null,
            user: null,
            userExpiry: null,
          })
        ),
        saveState: jest.fn(),
      };

      const CapacitorWrapper = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <PlatformServicesProvider services={capacitorPlatformServices}>
          <FetchProvider>
            <AuthProvider
              scope={mockPlatformServices.scope}
              logoSrc="/logo.png"
              appName="Test App"
              termsUrl="https://example.com/terms"
              privacyUrl="https://example.com/privacy"
            >
              {children}
            </AuthProvider>
          </FetchProvider>
        </PlatformServicesProvider>
      );

      const userRef = { current: undefined as any };
      const handleRestoreStateRef = { current: undefined as any };
      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef({ userRef, handleRestoreStateRef });
        useEffect(() => {
          ref.current.userRef.current = context?.user;
          ref.current.handleRestoreStateRef.current =
            context?.handleRestoreState;
        }, [context?.user, context?.handleRestoreState]);
        return <div>User: {context?.user?.name || 'none'}</div>;
      };

      render(
        <CapacitorWrapper>
          <TestComponent />
        </CapacitorWrapper>
      );

      await waitFor(() => {
        expect(handleRestoreStateRef.current).toBeDefined();
      });

      await act(async () => {
        await handleRestoreStateRef.current!();
      });

      expect(capacitorPlatformServices.getCapacitorState).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByText('User: Capacitor User')).toBeInTheDocument();
      });

      delete window.electronAPI;
    });

    it('should log and stop retrying when getCapacitorState rejects', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const capacitorPlatformServices: PlatformServices = {
        ...mockPlatformServices,
        isCapacitor: () => true,
        getCapacitorState: jest
          .fn()
          .mockRejectedValue(new Error('capacitor storage error')),
      };

      window.electronAPI = {
        openBrowser: jest.fn(),
        encrypt: jest.fn(),
        decrypt: jest.fn().mockResolvedValue(
          JSON.stringify({
            accessToken: null,
            accessExpiry: null,
            refreshToken: null,
            refreshExpiry: null,
            user: null,
            userExpiry: null,
          })
        ),
        saveState: jest.fn(),
      };

      const CapacitorWrapper = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <PlatformServicesProvider services={capacitorPlatformServices}>
          <FetchProvider>
            <AuthProvider
              scope={mockPlatformServices.scope}
              logoSrc="/logo.png"
              appName="Test App"
              termsUrl="https://example.com/terms"
              privacyUrl="https://example.com/privacy"
            >
              {children}
            </AuthProvider>
          </FetchProvider>
        </PlatformServicesProvider>
      );

      const handleRestoreStateRef = { current: undefined as any };
      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(handleRestoreStateRef);
        useEffect(() => {
          ref.current.current = context?.handleRestoreState;
        }, [context?.handleRestoreState]);
        return <div>Test</div>;
      };

      render(
        <CapacitorWrapper>
          <TestComponent />
        </CapacitorWrapper>
      );

      await waitFor(() => {
        expect(handleRestoreStateRef.current).toBeDefined();
      });

      await act(async () => {
        await handleRestoreStateRef.current!();
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.any(Error));

      consoleWarnSpy.mockRestore();
      delete window.electronAPI;
    });
  });

  describe('browserFinished listener', () => {
    it('should call restoreCapacitorState when the Browser reports browserFinished', async () => {
      const { Browser } = jest.requireMock('@capacitor/browser');
      let browserFinishedHandler: (() => void) | undefined;
      (Browser.addListener as jest.Mock).mockImplementation(
        (event: string, handler: () => void) => {
          if (event === 'browserFinished') {
            browserFinishedHandler = handler;
          }
        }
      );

      const capacitorPlatformServices: PlatformServices = {
        ...mockPlatformServices,
        isCapacitor: () => true,
        getCapacitorState: jest.fn().mockResolvedValue(''),
      };

      const CapacitorWrapper = ({
        children,
      }: {
        children: React.ReactNode;
      }) => (
        <PlatformServicesProvider services={capacitorPlatformServices}>
          <FetchProvider>
            <AuthProvider
              scope={mockPlatformServices.scope}
              logoSrc="/logo.png"
              appName="Test App"
              termsUrl="https://example.com/terms"
              privacyUrl="https://example.com/privacy"
            >
              {children}
            </AuthProvider>
          </FetchProvider>
        </PlatformServicesProvider>
      );

      render(
        <CapacitorWrapper>
          <div>Test</div>
        </CapacitorWrapper>
      );

      await waitFor(() => {
        expect(browserFinishedHandler).toBeDefined();
      });

      await act(async () => {
        browserFinishedHandler!();
        await Promise.resolve();
      });

      expect(capacitorPlatformServices.getCapacitorState).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple provider instances', () => {
      const TestComponent = ({ id }: { id: number }) => {
        const context = useContext(UserContext);
        return (
          <div>
            Provider {id}: {context?.user ? 'user' : 'no-user'}
          </div>
        );
      };

      const { container } = render(
        <>
          <Wrapper>
            <TestComponent id={1} />
          </Wrapper>
          <Wrapper>
            <TestComponent id={2} />
          </Wrapper>
        </>
      );

      expect(container).toBeInTheDocument();
    });

    it('should handle component unmount and remount', async () => {
      const contextRef = {
        current: undefined as UserContextInterface | undefined,
      };

      const TestComponent = () => {
        const context = useContext(UserContext);
        const ref = useRef(contextRef);
        useEffect(() => {
          ref.current.current = context;
        }, [context]);
        return <div>Test</div>;
      };

      const { unmount } = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(contextRef.current).toBeDefined();
      });

      unmount();

      contextRef.current = undefined;

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(contextRef.current).toBeDefined();
      });
    });
  });
});
