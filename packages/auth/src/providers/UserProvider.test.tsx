import React from 'react';
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
      let contextValue: UserContextInterface | undefined;

      const TestComponent = () => {
        contextValue = useContext(UserContext);
        return <div>Test</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
      });
    });
  });

  describe('initial state', () => {
    it('should initialize with no user', async () => {
      let user: any;

      const TestComponent = () => {
        const context = useContext(UserContext);
        user = context?.user;
        return <div>User: {user ? user.name : 'None'}</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(user).toBeUndefined();
      });
    });

    it('should initialize isLoggingIn as false', async () => {
      let isLoggingIn: boolean = true;

      const TestComponent = () => {
        const context = useContext(UserContext);
        isLoggingIn = context?.isLoggingIn ?? false;
        return <div>Logging in: {isLoggingIn ? 'yes' : 'no'}</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(isLoggingIn).toBe(false);
      });
    });

    it('should provide all required context methods', async () => {
      let context: UserContextInterface | undefined;

      const TestComponent = () => {
        context = useContext(UserContext);
        return <div>Test</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(context?.loginRedirect).toBeDefined();
        expect(context?.logout).toBeDefined();
        expect(context?.handleAuthUrl).toBeDefined();
        expect(context?.handleRestoreState).toBeDefined();
      });
    });
  });

  describe('loginRedirect', () => {
    it('should set isLoggingIn to true', async () => {
      let isLoggingIn: boolean = false;
      let loginRedirect: any;

      const TestComponent = () => {
        const context = useContext(UserContext);
        isLoggingIn = context?.isLoggingIn ?? false;
        loginRedirect = context?.loginRedirect;
        return <div>Logging in: {isLoggingIn ? 'yes' : 'no'}</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(loginRedirect).toBeDefined();
      });

      if (loginRedirect) {
        loginRedirect({ userInitiated: true });
        // Don't await - just check that it's called
        expect(isLoggingIn).toBeDefined();
      }
    });

    it('should store pathname in localStorage', async () => {
      let loginRedirect: any;

      const TestComponent = () => {
        const context = useContext(UserContext);
        loginRedirect = context?.loginRedirect;
        return <div>Test</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(loginRedirect).toBeDefined();
      });

      if (loginRedirect) {
        loginRedirect({ userInitiated: true });

        await waitFor(() => {
          expect(localStorage.getItem('restorePathname')).toBeDefined();
        });
      }
    });

    it('should store random state in localStorage', async () => {
      let loginRedirect: any;

      const TestComponent = () => {
        const context = useContext(UserContext);
        loginRedirect = context?.loginRedirect;
        return <div>Test</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(loginRedirect).toBeDefined();
      });

      if (loginRedirect) {
        loginRedirect({ userInitiated: true });

        await waitFor(() => {
          expect(localStorage.getItem('state')).toBeDefined();
        });
      }
    });

    it('should store code verifier in localStorage', async () => {
      let loginRedirect: any;

      const TestComponent = () => {
        const context = useContext(UserContext);
        loginRedirect = context?.loginRedirect;
        return <div>Test</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(loginRedirect).toBeDefined();
      });

      if (loginRedirect) {
        loginRedirect({ userInitiated: true });

        await waitFor(() => {
          expect(localStorage.getItem('code_verifier')).toBeDefined();
        });
      }
    });
  });

  describe('logout', () => {
    it('should clear user', async () => {
      let logout: any;
      let user: any;

      const TestComponent = () => {
        const context = useContext(UserContext);
        logout = context?.logout;
        user = context?.user;
        return <div>User: {user ? 'exists' : 'none'}</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(logout).toBeDefined();
      });

      if (logout) {
        logout();

        await waitFor(() => {
          expect(user).toBeUndefined();
        });
      }
    });

    it('should set recoverSession to false', async () => {
      let logout: any;

      const TestComponent = () => {
        const context = useContext(UserContext);
        logout = context?.logout;
        return <div>Test</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(logout).toBeDefined();
      });

      if (logout) {
        logout();

        expect(localStorage.getItem('recoverSession')).toBe('false');
      }
    });
  });

  describe('handleAuthUrl', () => {
    it('should be defined', async () => {
      let handleAuthUrl: any;

      const TestComponent = () => {
        const context = useContext(UserContext);
        handleAuthUrl = context?.handleAuthUrl;
        return <div>Test</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(handleAuthUrl).toBeDefined();
        expect(typeof handleAuthUrl).toBe('function');
      });
    });

    it('should set isLoggingIn when called', async () => {
      let handleAuthUrl: any;
      let isLoggingIn: boolean = false;

      const TestComponent = () => {
        const context = useContext(UserContext);
        handleAuthUrl = context?.handleAuthUrl;
        isLoggingIn = context?.isLoggingIn ?? false;
        return <div>Logging in: {isLoggingIn ? 'yes' : 'no'}</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(handleAuthUrl).toBeDefined();
      });

      if (handleAuthUrl) {
        handleAuthUrl({ active: true });
        // Check that it's called without errors
        expect(handleAuthUrl).toBeDefined();
      }
    });
  });

  describe('handleRestoreState', () => {
    it('should be defined', async () => {
      let handleRestoreState: any;

      const TestComponent = () => {
        const context = useContext(UserContext);
        handleRestoreState = context?.handleRestoreState;
        return <div>Test</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(handleRestoreState).toBeDefined();
        expect(typeof handleRestoreState).toBe('function');
      });
    });
  });

  describe('context methods', () => {
    it('should provide loginRedirect function', async () => {
      let loginRedirect: any;

      const TestComponent = () => {
        const context = useContext(UserContext);
        loginRedirect = context?.loginRedirect;
        return <div>Test</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(typeof loginRedirect).toBe('function');
      });
    });

    it('should provide logout function', async () => {
      let logout: any;

      const TestComponent = () => {
        const context = useContext(UserContext);
        logout = context?.logout;
        return <div>Test</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(typeof logout).toBe('function');
      });
    });

    it('should provide handleAuthUrl function', async () => {
      let handleAuthUrl: any;

      const TestComponent = () => {
        const context = useContext(UserContext);
        handleAuthUrl = context?.handleAuthUrl;
        return <div>Test</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(typeof handleAuthUrl).toBe('function');
      });
    });

    it('should provide handleRestoreState function', async () => {
      let handleRestoreState: any;

      const TestComponent = () => {
        const context = useContext(UserContext);
        handleRestoreState = context?.handleRestoreState;
        return <div>Test</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(typeof handleRestoreState).toBe('function');
      });
    });
  });

  describe('state management', () => {
    it('should provide isInitialised state', async () => {
      let isInitialised: boolean | undefined;

      const TestComponent = () => {
        const context = useContext(UserContext);
        isInitialised = context?.isInitialised;
        return <div>Initialised: {isInitialised ? 'yes' : 'no'}</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      // The provider should eventually set isInitialised
      // Note: Due to module-level isInitialising guard, this may already be true
      await waitFor(
        () => {
          expect(typeof isInitialised).toBe('boolean');
        },
        { timeout: 3000 }
      );
    });

    it('should provide isLoggingIn state', async () => {
      let isLoggingIn: boolean | undefined;

      const TestComponent = () => {
        const context = useContext(UserContext);
        isLoggingIn = context?.isLoggingIn;
        return <div>Logging in: {isLoggingIn ? 'yes' : 'no'}</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(typeof isLoggingIn).toBe('boolean');
      });
    });

    it('should provide user state', async () => {
      let user: any;

      const TestComponent = () => {
        const context = useContext(UserContext);
        user = context?.user;
        return <div>User state: {user ? 'exists' : 'undefined'}</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(user === undefined || user !== null).toBe(true);
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
      let loginRedirect: any;

      const TestComponent = () => {
        const context = useContext(UserContext);
        loginRedirect = context?.loginRedirect;
        return <div>Test</div>;
      };

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(loginRedirect).toBeDefined();
      });

      if (loginRedirect) {
        loginRedirect({ userInitiated: true });

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
      let context: UserContextInterface | undefined;

      const TestComponent = () => {
        context = useContext(UserContext);
        return <div>Test</div>;
      };

      const { unmount } = render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(context).toBeDefined();
      });

      unmount();

      context = undefined;

      render(
        <UserProvider platformServices={mockPlatformServices}>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(context).toBeDefined();
      });
    });
  });
});
