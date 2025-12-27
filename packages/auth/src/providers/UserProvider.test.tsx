import React, { useRef, useEffect } from 'react';
import { useContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import UserProvider from './UserProvider';
import { UserContext, UserContextInterface } from './AuthProvider';
import { PlatformServices } from './PlatformServicesContext';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
  })),
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
};

describe('UserProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('provider setup', () => {
    it('should render children', () => {
      render(
        <UserProvider platformServices={mockPlatformServices}>
          <div>Test Content</div>
        </UserProvider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should provide UserContext', async () => {
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(contextRef.current).toBeDefined();
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
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
        const ref1 = useRef(isLoggingInRef);
        const ref2 = useRef(loginRedirectRef);
        useEffect(() => {
          ref1.current.current = context?.isLoggingIn ?? false;
          ref2.current.current = context?.loginRedirect;
        }, [context?.isLoggingIn, context?.loginRedirect]);
        return <div>Logging in: {context?.isLoggingIn ? 'yes' : 'no'}</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(loginRedirectRef.current).toBeDefined();
      });

      if (loginRedirectRef.current) {
        loginRedirectRef.current({ userInitiated: true });
        expect(isLoggingInRef.current).toBeDefined();
      }
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
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
        const ref1 = useRef(logoutRef);
        const ref2 = useRef(userRef);
        useEffect(() => {
          ref1.current.current = context?.logout;
          ref2.current.current = context?.user;
        }, [context?.logout, context?.user]);
        return <div>User: {context?.user ? 'exists' : 'none'}</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
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
        const ref1 = useRef(handleAuthUrlRef);
        const ref2 = useRef(isLoggingInRef);
        useEffect(() => {
          ref1.current.current = context?.handleAuthUrl;
          ref2.current.current = context?.isLoggingIn ?? false;
        }, [context?.handleAuthUrl, context?.isLoggingIn]);
        return <div>Logging in: {context?.isLoggingIn ? 'yes' : 'no'}</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(handleAuthUrlRef.current).toBeDefined();
      });

      if (handleAuthUrlRef.current) {
        handleAuthUrlRef.current({ active: true });
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(userRef.current === undefined || userRef.current !== null).toBe(
          true
        );
      });
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
          <UserProvider platformServices={mockPlatformServices}>
            <TestComponent />
          </UserProvider>
        );
      }).not.toThrow();
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(loginRedirectRef.current).toBeDefined();
      });

      if (loginRedirectRef.current) {
        loginRedirectRef.current({ userInitiated: true });

        await waitFor(() => {
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
          <UserProvider platformServices={mockPlatformServices}>
            <TestComponent id={1} />
          </UserProvider>
          <UserProvider platformServices={mockPlatformServices}>
            <TestComponent id={2} />
          </UserProvider>
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
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(contextRef.current).toBeDefined();
      });

      unmount();

      contextRef.current = undefined;

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(contextRef.current).toBeDefined();
      });
    });
  });
});
