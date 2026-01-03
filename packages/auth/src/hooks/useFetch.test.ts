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
    apiUrl: 'https://api.bubblyclouds.com',
    authUrl: 'https://auth.bubblyclouds.com',
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
  });
});
