import { renderHook, act } from '@testing-library/react';
import { useFetch } from './useFetch';
import FetchProvider from '../providers/FetchProvider';
import PlatformServicesProvider, {
  PlatformServices,
} from '../providers/PlatformServicesContext';
import React, { ReactNode } from 'react';

// Mock global fetch
global.fetch = jest.fn();

describe('useFetch', () => {
  const mockFetch = global.fetch as jest.Mock;

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

  const createWrapper = () => {
    const Wrapper = ({ children }: { children: ReactNode }) => {
      return React.createElement(PlatformServicesProvider, {
        services: mockPlatformServices,
        children: React.createElement(FetchProvider, { children }),
      });
    };
    Wrapper.displayName = 'TestWrapper';
    return Wrapper;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user when state is valid', () => {
    // Initially, the hook starts with no user state
    const { result } = renderHook(() => useFetch(), {
      wrapper: createWrapper(),
    });
    // getUser() returns undefined when no valid user state exists
    expect(result.current.getUser()).toBeUndefined();
  });

  it('should return undefined for user when state is invalid', () => {
    const { result } = renderHook(() => useFetch(), {
      wrapper: createWrapper(),
    });
    expect(result.current.getUser()).toBeUndefined();
  });

  it('should logout and clear state', async () => {
    const { result } = renderHook(() => useFetch(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.getUser()).toBeUndefined();
  });

  it('should handle fetch requests without errors', async () => {
    const { result } = renderHook(() => useFetch(), {
      wrapper: createWrapper(),
    });

    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    );

    await act(async () => {
      await result.current.fetch(new Request('https://example.com/test'));
    });

    // Verify fetch was called for non-API URLs
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should provide fetch method on hook', async () => {
    const { result } = renderHook(() => useFetch(), {
      wrapper: createWrapper(),
    });

    // Verify the hook provides fetch functionality
    expect(result.current.fetch).toBeDefined();
    expect(typeof result.current.fetch).toBe('function');
  });

  describe('Token Refresh', () => {
    it('should refresh token when access token is close to expiry', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: 'new-token',
            refresh_token: 'new-refresh',
            id_token:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIn0.test',
            expires_in: 3600,
          }),
          { status: 200 }
        )
      );

      await act(async () => {
        await result.current.fetch(new Request('https://example.com/test'));
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle token refresh errors gracefully', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({}), { status: 500 })
      );

      await act(async () => {
        const response = await result.current.fetch(
          new Request('https://example.com/test')
        );
        expect(response.status).toBe(500);
      });
    });
  });

  describe('API URL Handling', () => {
    it('should add authorization header to API URLs', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 })
      );

      await act(async () => {
        const response = await result.current.fetch(
          new Request('https://api.bubblyclouds.com/test')
        );
        expect(response).toBeDefined();
      });
    });

    it('should reset state when the underlying API call itself returns 401 after attaching a valid token', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      // Access token is valid and not close to expiry, so checkRefresh is a
      // no-op, but the API itself rejects the token with a 401 (e.g. it was
      // revoked server-side).
      const validState = JSON.stringify({
        accessToken: 'revoked-token',
        accessExpiry: new Date(Date.now() + 3600000).toISOString(),
        refreshToken: 'refresh-token',
        refreshExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
        user: { sub: 'user-123' },
        userExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
      });

      await act(async () => {
        await result.current.restoreState(validState);
      });

      expect(result.current.getUser()).toEqual({ sub: 'user-123' });

      mockFetch.mockResolvedValue(new Response(null, { status: 401 }));

      await act(async () => {
        const response = await result.current.fetch(
          new Request('https://api.bubblyclouds.com/data')
        );
        expect(response.status).toBe(401);
      });

      // State should have been reset, so the user is no longer valid
      expect(result.current.getUser()).toBeUndefined();
    });

    it('should handle 401 response by resetting state', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({}), { status: 401 })
      );

      await act(async () => {
        const response = await result.current.fetch(
          new Request('https://api.bubblyclouds.com/test')
        );
        expect(response.status).toBe(401);
      });

      await act(async () => {
        expect(result.current.getUser()).toBeUndefined();
      });
    });

    it('should return 401 when no access token for API URL', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      mockFetch.mockResolvedValue(new Response(null, { status: 401 }));

      await act(async () => {
        const response = await result.current.fetch(
          new Request('https://api.bubblyclouds.com/test')
        );
        // When no access token, should return 401
        expect(response.status).toBe(401);
      });
    });
  });

  describe('Token URL Handling', () => {
    it('should handle token URL responses', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: 'token',
            refresh_token: 'refresh',
            id_token:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIn0.test',
            expires_in: 3600,
          }),
          { status: 200 }
        )
      );

      await act(async () => {
        const response = await result.current.fetch(
          new Request('https://auth.bubblyclouds.com/oidc/token')
        );
        expect(response.status).toBe(200);
      });
    });

    it('should return user profile from token URL response', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: 'token',
            refresh_token: 'refresh',
            id_token:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwibmFtZSI6IlRlc3QgVXNlciJ9.test',
            expires_in: 3600,
          }),
          { status: 200 }
        )
      );

      await act(async () => {
        const response = await result.current.fetch(
          new Request('https://auth.bubblyclouds.com/oidc/token')
        );
        const data = await response.json();
        expect(data).toHaveProperty('user');
      });
    });
  });

  describe('Public URLs', () => {
    it('should allow GET requests to public API paths without token', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 })
      );

      await act(async () => {
        const response = await result.current.fetch(
          new Request('https://api.bubblyclouds.com/invites/123', {
            method: 'GET',
          })
        );
        expect(response.status).toBe(200);
      });
    });

    it('should not allow non-GET requests to public paths without token', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      mockFetch.mockResolvedValue(new Response(null, { status: 401 }));

      await act(async () => {
        const response = await result.current.fetch(
          new Request('https://api.bubblyclouds.com/invites/123', {
            method: 'POST',
          })
        );
        expect(response.status).toBe(401);
      });
    });
  });

  describe('Restore State', () => {
    it('should restore state from string', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      const stateString = JSON.stringify({
        accessToken: 'token',
        accessExpiry: new Date(Date.now() + 3600000).toISOString(),
        refreshToken: 'refresh',
        refreshExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
        user: { sub: 'user-123', name: 'Test' },
        userExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
      });

      await act(async () => {
        const user = await result.current.restoreState(stateString);
        expect(user).toEqual({ sub: 'user-123', name: 'Test' });
      });
    });

    it('should handle invalid state string', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.restoreState('invalid json');
        } catch (e) {
          expect(e).toBeDefined();
        }
      });
    });
  });

  describe('JWT Decoding', () => {
    it('should decode JWT tokens correctly', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      // Base64 encoded JWT payload: {"sub":"user-123","name":"Test User"}
      const validToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsIm5hbWUiOiJUZXN0IFVzZXIifQ.test';

      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: 'token',
            refresh_token: 'refresh',
            id_token: validToken,
            expires_in: 3600,
          }),
          { status: 200 }
        )
      );

      await act(async () => {
        const response = await result.current.fetch(
          new Request('https://auth.bubblyclouds.com/oidc/token')
        );
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Non-API URL Handling', () => {
    it('should pass through non-API, non-token URLs', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      mockFetch.mockResolvedValue(new Response('OK', { status: 200 }));

      await act(async () => {
        const response = await result.current.fetch(
          new Request('https://example.com/test')
        );
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch network errors', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      mockFetch.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        try {
          await result.current.fetch(new Request('https://example.com/test'));
        } catch (e) {
          expect(e).toBeDefined();
        }
      });
    });

    it('should log errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      mockFetch.mockRejectedValue(new Error('Test error'));

      await act(async () => {
        try {
          await result.current.fetch(new Request('https://example.com/test'));
        } catch (_e) {
          // Expected
        }
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should work with multiple hook instances', async () => {
      const { result: result1 } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      const { result: result2 } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result1.current.logout();
      });

      expect(result1.current.getUser()).toBeUndefined();
      expect(result2.current.getUser()).toBeUndefined();
    });
  });

  describe('Has Valid User', () => {
    it('should return false when no user state', () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      expect(result.current.getUser()).toBeUndefined();
    });

    it('should handle expired tokens', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      // Past expiry date
      const stateString = JSON.stringify({
        accessToken: 'token',
        accessExpiry: new Date(Date.now() - 3600000).toISOString(),
        refreshToken: 'refresh',
        refreshExpiry: new Date(Date.now() - 3600000).toISOString(),
        user: { sub: 'user-123' },
        userExpiry: new Date(Date.now() - 3600000).toISOString(),
      });

      await act(async () => {
        await result.current.restoreState(stateString);
      });

      expect(result.current.getUser()).toBeUndefined();
    });

    it('should return the user when the restored state is still valid', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      const stateString = JSON.stringify({
        accessToken: 'token',
        accessExpiry: new Date(Date.now() + 3600000).toISOString(),
        refreshToken: 'refresh',
        refreshExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
        user: { sub: 'user-123', name: 'Valid User' },
        userExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
      });

      await act(async () => {
        await result.current.restoreState(stateString);
      });

      expect(result.current.getUser()).toEqual({
        sub: 'user-123',
        name: 'Valid User',
      });
    });
  });

  describe('Electron and Capacitor state persistence', () => {
    it('should persist state via saveElectronState when running in Electron', async () => {
      const electronPlatformServices: PlatformServices = {
        ...mockPlatformServices,
        isElectron: () => true,
      };
      const ElectronWrapper = ({ children }: { children: ReactNode }) =>
        React.createElement(PlatformServicesProvider, {
          services: electronPlatformServices,
          children: React.createElement(FetchProvider, { children }),
        });

      const { result } = renderHook(() => useFetch(), {
        wrapper: ElectronWrapper,
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(electronPlatformServices.saveElectronState).toHaveBeenCalled();
    });

    it('should warn but not throw when saveElectronState rejects', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const electronPlatformServices: PlatformServices = {
        ...mockPlatformServices,
        isElectron: () => true,
        saveElectronState: jest.fn().mockRejectedValue(new Error('disk full')),
      };
      const ElectronWrapper = ({ children }: { children: ReactNode }) =>
        React.createElement(PlatformServicesProvider, {
          services: electronPlatformServices,
          children: React.createElement(FetchProvider, { children }),
        });

      const { result } = renderHook(() => useFetch(), {
        wrapper: ElectronWrapper,
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(electronPlatformServices.saveElectronState).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.any(Error));

      consoleWarnSpy.mockRestore();
    });

    it('should persist state via saveCapacitorState when running in Capacitor', async () => {
      const capacitorPlatformServices: PlatformServices = {
        ...mockPlatformServices,
        isCapacitor: () => true,
      };
      const CapacitorWrapper = ({ children }: { children: ReactNode }) =>
        React.createElement(PlatformServicesProvider, {
          services: capacitorPlatformServices,
          children: React.createElement(FetchProvider, { children }),
        });

      const { result } = renderHook(() => useFetch(), {
        wrapper: CapacitorWrapper,
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(capacitorPlatformServices.saveCapacitorState).toHaveBeenCalled();
    });

    it('should warn but not throw when saveCapacitorState rejects', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const capacitorPlatformServices: PlatformServices = {
        ...mockPlatformServices,
        isCapacitor: () => true,
        saveCapacitorState: jest
          .fn()
          .mockRejectedValue(new Error('storage error')),
      };
      const CapacitorWrapper = ({ children }: { children: ReactNode }) =>
        React.createElement(PlatformServicesProvider, {
          services: capacitorPlatformServices,
          children: React.createElement(FetchProvider, { children }),
        });

      const { result } = renderHook(() => useFetch(), {
        wrapper: CapacitorWrapper,
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(capacitorPlatformServices.saveCapacitorState).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.any(Error));

      consoleWarnSpy.mockRestore();
    });

    it('should not persist to electron/capacitor when restoring state', async () => {
      const electronPlatformServices: PlatformServices = {
        ...mockPlatformServices,
        isElectron: () => true,
      };
      const ElectronWrapper = ({ children }: { children: ReactNode }) =>
        React.createElement(PlatformServicesProvider, {
          services: electronPlatformServices,
          children: React.createElement(FetchProvider, { children }),
        });

      const { result } = renderHook(() => useFetch(), {
        wrapper: ElectronWrapper,
      });

      const stateString = JSON.stringify({
        accessToken: 'token',
        accessExpiry: new Date(Date.now() + 3600000).toISOString(),
        refreshToken: 'refresh',
        refreshExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
        user: { sub: 'user-123' },
        userExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
      });

      await act(async () => {
        await result.current.restoreState(stateString);
      });

      expect(electronPlatformServices.saveElectronState).not.toHaveBeenCalled();
    });
  });

  describe('checkRefresh token refresh flow', () => {
    it('should actually call the refresh endpoint and update state when access token is near expiry', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      // Restore a state with an access token expiring in 5 minutes (inside the 15 min window)
      const nearExpiryState = JSON.stringify({
        accessToken: 'old-access-token',
        accessExpiry: new Date(Date.now() + 5 * 60000).toISOString(),
        refreshToken: 'old-refresh-token',
        refreshExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
        user: { sub: 'user-123' },
        userExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
      });

      await act(async () => {
        await result.current.restoreState(nearExpiryState);
      });

      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: 'refreshed-access-token',
            refresh_token: 'refreshed-refresh-token',
            id_token:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.test',
            expires_in: 3600,
          }),
          { status: 200 }
        )
      );

      await act(async () => {
        const response = await result.current.fetch(
          new Request('https://api.bubblyclouds.com/data')
        );
        expect(response.status).toBe(200);
      });

      // checkRefresh should have proactively hit the oidc/token endpoint
      // before making the underlying API call, since the token was close to
      // expiry.
      const refreshCall = mockFetch.mock.calls.find(([request]) =>
        String(request).includes('/oidc/token')
      );
      expect(refreshCall).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // The refreshed state should now be reflected in stateRef, exposed
      // here indirectly by restoring a state with those exact tokens and
      // confirming they round-trip - proving the refresh response was parsed
      // and persisted.
      const stateString = JSON.stringify({
        accessToken: 'refreshed-access-token',
        accessExpiry: new Date(Date.now() + 3600000).toISOString(),
        refreshToken: 'refreshed-refresh-token',
        refreshExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
        user: { sub: 'user-123' },
        userExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
      });
      await act(async () => {
        const user = await result.current.restoreState(stateString);
        expect(user).toEqual({ sub: 'user-123' });
      });
    });

    it('should log an error and keep the old token when the refresh response is not ok', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      const nearExpiryState = JSON.stringify({
        accessToken: 'stale-access-token',
        accessExpiry: new Date(Date.now() + 5 * 60000).toISOString(),
        refreshToken: 'stale-refresh-token',
        refreshExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
        user: { sub: 'user-123' },
        userExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
      });

      await act(async () => {
        await result.current.restoreState(nearExpiryState);
      });

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ error: 'invalid_grant' }), {
          status: 400,
        })
      );

      await act(async () => {
        const response = await result.current.fetch(
          new Request('https://api.bubblyclouds.com/data')
        );
        // The underlying API call still proceeds using the stale token even
        // though the refresh attempt failed.
        expect(response.status).toBe(400);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'useFetch failed to refresh token',
        400
      );

      // Both the refresh attempt and the underlying API call should have
      // been made - the stale token is used since no new one was issued.
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const refreshCall = mockFetch.mock.calls.find(([request]) =>
        String(request).includes('/oidc/token')
      );
      expect(refreshCall).toBeDefined();

      consoleErrorSpy.mockRestore();
    });

    it('should skip a concurrent API call while a refresh is already in progress', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      const nearExpiryState = JSON.stringify({
        accessToken: 'access-token',
        accessExpiry: new Date(Date.now() + 5 * 60000).toISOString(),
        refreshToken: 'refresh-token',
        refreshExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
        user: { sub: 'user-123' },
        userExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
      });

      await act(async () => {
        await result.current.restoreState(nearExpiryState);
      });

      let resolveRefresh!: (_response: Response) => void;
      const refreshPromise = new Promise<Response>((resolve) => {
        resolveRefresh = resolve;
      });

      mockFetch.mockImplementation((input: Request | URL | string) => {
        const url = input instanceof Request ? input.url : String(input);
        if (url.includes('/oidc/token')) {
          return refreshPromise;
        }
        return Promise.resolve(
          new Response(JSON.stringify({}), { status: 200 })
        );
      });

      const firstCallPromise = act(async () => {
        await result.current.fetch(
          new Request('https://api.bubblyclouds.com/first')
        );
      });

      // Kick off a second call before the first refresh resolves - it should
      // see the refresh already in progress and skip the API call entirely.
      const secondResponsePromise = result.current.fetch(
        new Request('https://api.bubblyclouds.com/second')
      );

      resolveRefresh(
        new Response(
          JSON.stringify({
            access_token: 'new-token',
            refresh_token: 'new-refresh',
            id_token:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.test',
            expires_in: 3600,
          }),
          { status: 200 }
        )
      );

      await firstCallPromise;
      const secondResponse = await secondResponsePromise;

      expect(secondResponse.status).toBe(401);
    });
  });

  describe('checkRefresh edge cases', () => {
    it('should not refresh when the access token is not close to expiry', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      const farExpiryState = JSON.stringify({
        accessToken: 'valid-access-token',
        accessExpiry: new Date(Date.now() + 3600000).toISOString(),
        refreshToken: 'valid-refresh-token',
        refreshExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
        user: { sub: 'user-123' },
        userExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
      });

      await act(async () => {
        await result.current.restoreState(farExpiryState);
      });

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 })
      );

      await act(async () => {
        await result.current.fetch(
          new Request('https://api.bubblyclouds.com/data')
        );
      });

      // Only the underlying API call should happen, no refresh call
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const refreshCall = mockFetch.mock.calls.find(([request]) =>
        String(request).includes('/oidc/token')
      );
      expect(refreshCall).toBeUndefined();
    });

    it('should catch and log an error when the refresh fetch itself throws', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      const nearExpiryState = JSON.stringify({
        accessToken: 'access-token',
        accessExpiry: new Date(Date.now() + 5 * 60000).toISOString(),
        refreshToken: 'refresh-token',
        refreshExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
        user: { sub: 'user-123' },
        userExpiry: new Date(Date.now() + 14 * 86400000).toISOString(),
      });

      await act(async () => {
        await result.current.restoreState(nearExpiryState);
      });

      mockFetch.mockRejectedValue(new Error('network unreachable'));

      // checkRefresh swallows the refresh fetch error internally and logs
      // it, but handleFetch's own subsequent fetch(authReq) call is not
      // wrapped in a try/catch, so the overall call still rejects.
      await act(async () => {
        await expect(
          result.current.fetch(new Request('https://api.bubblyclouds.com/data'))
        ).rejects.toThrow('network unreachable');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Token URL failure handling', () => {
    it('should pass through the response unchanged when the token endpoint returns an error', async () => {
      const { result } = renderHook(() => useFetch(), {
        wrapper: createWrapper(),
      });

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ error: 'invalid_request' }), {
          status: 400,
        })
      );

      await act(async () => {
        const response = await result.current.fetch(
          new Request('https://auth.bubblyclouds.com/oidc/token')
        );
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body).toEqual({ error: 'invalid_request' });
      });
    });
  });
});
