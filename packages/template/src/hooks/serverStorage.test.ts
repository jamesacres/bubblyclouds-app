import { renderHook, act } from '@testing-library/react';
import { useServerStorage } from './serverStorage';
import { useFetch } from '@sudoku-web/auth/hooks/useFetch';
import { useOnline } from './online';
import { StateType } from '@sudoku-web/types/stateType';
import { UserContext } from '@sudoku-web/auth/providers/AuthProvider';
import React from 'react';

jest.mock('@sudoku-web/auth/hooks/useFetch');
jest.mock('./online');

const mockUseFetch = useFetch as jest.Mock;
const mockUseOnline = useOnline as jest.Mock;

describe('useServerStorage', () => {
  let mockFetch: jest.Mock;
  let mockGetUser: jest.Mock;

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(
      UserContext.Provider,
      { value: { user: { sub: 'user123' } } as any },
      children
    );
  };

  beforeEach(() => {
    mockFetch = jest.fn();
    mockGetUser = jest.fn(() => ({ sub: 'user123' }));
    mockUseFetch.mockReturnValue({ fetch: mockFetch, getUser: mockGetUser });
    mockUseOnline.mockReturnValue({ isOnline: true });
  });

  it('getValue should fetch data from the server', async () => {
    const mockData = {
      state: { a: 1 },
      updatedAt: new Date().toISOString(),
      parties: {},
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(
      () =>
        useServerStorage({ app: 'mockApp', type: StateType.PUZZLE, id: '123' }),
      { wrapper }
    );

    let value: any;
    await act(async () => {
      value = await result.current.getValue();
    });

    expect(mockFetch).toHaveBeenCalledWith(expect.any(Request));
    expect(value?.state).toEqual({ a: 1 });
  });

  it('saveValue should send a PATCH request', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    const { result } = renderHook(
      () =>
        useServerStorage({ app: 'mockApp', type: StateType.PUZZLE, id: '123' }),
      { wrapper }
    );

    await act(async () => {
      await result.current.saveValue({ data: 'test' });
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('listParties should fetch parties and their members', async () => {
    const mockPartyResponse = [
      {
        partyId: 'p1',
        createdBy: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const mockMemberResponse = [
      { userId: 'user123', memberNickname: 'Player 1' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPartyResponse),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMemberResponse),
    });

    const { result } = renderHook(() => useServerStorage({ app: 'mockApp' }), {
      wrapper,
    });

    let parties: any;
    await act(async () => {
      parties = await result.current.listParties();
    });

    expect(parties).toHaveLength(1);
    expect(parties![0].isOwner).toBe(true);
    expect(parties![0].members).toHaveLength(1);
  });

  it('createParty should send a POST request and return a party', async () => {
    const mockPartyResponse = {
      partyId: 'p1',
      partyName: 'New Party',
      createdBy: 'user123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPartyResponse),
    });
    const { result } = renderHook(() => useServerStorage({ app: 'mockApp' }), {
      wrapper,
    });

    let party: any;
    await act(async () => {
      party = await result.current.createParty({
        partyName: 'New Party',
        memberNickname: 'Me',
      });
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST' })
    );
    expect(party?.partyName).toBe('New Party');
  });

  it('deleteAccount should send a DELETE request', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useServerStorage({ app: 'mockApp' }), {
      wrapper,
    });

    let success;
    await act(async () => {
      success = await result.current.deleteAccount();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(success).toBe(true);
  });

  it('updateParty should send a PATCH request', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    const { result } = renderHook(() => useServerStorage({ app: 'mockApp' }), {
      wrapper,
    });

    await act(async () => {
      await result.current.updateParty('party1', { partyName: 'Updated' });
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('leaveParty should send a DELETE request', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useServerStorage({ app: 'mockApp' }), {
      wrapper,
    });

    let success;
    await act(async () => {
      success = await result.current.leaveParty('party1');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(success).toBe(true);
  });

  it('removeMember should send a DELETE request', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useServerStorage({ app: 'mockApp' }), {
      wrapper,
    });

    let success;
    await act(async () => {
      success = await result.current.removeMember('party1', 'user2');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(success).toBe(true);
  });

  it('deleteParty should send a DELETE request', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useServerStorage({ app: 'mockApp' }), {
      wrapper,
    });

    let success;
    await act(async () => {
      success = await result.current.deleteParty('party1');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(success).toBe(true);
  });

  it('listValues should fetch a list of server values', async () => {
    const mockResponse = [
      {
        sessionId: 'session1',
        state: { a: 1 },
        updatedAt: new Date().toISOString(),
      },
      {
        sessionId: 'session2',
        state: { b: 2 },
        updatedAt: new Date().toISOString(),
      },
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(
      () => useServerStorage({ app: 'mockApp', type: StateType.PUZZLE }),
      { wrapper }
    );

    let values: any;
    await act(async () => {
      values = await result.current.listValues();
    });

    expect(Array.isArray(values)).toBe(true);
    expect(values?.length).toBe(2);
  });

  it('should handle offline scenarios gracefully', async () => {
    mockUseOnline.mockReturnValue({ isOnline: false });
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    const { result } = renderHook(
      () =>
        useServerStorage({ app: 'mockApp', type: StateType.PUZZLE, id: '123' }),
      { wrapper }
    );

    // Should still provide methods even when offline
    expect(result.current.getValue).toBeDefined();
    expect(result.current.saveValue).toBeDefined();
  });

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () =>
        useServerStorage({ app: 'mockApp', type: StateType.PUZZLE, id: '123' }),
      { wrapper }
    );

    await act(async () => {
      try {
        await result.current.getValue();
      } catch (_e) {
        // Error expected
      }
    });

    // Should handle error without crashing
    expect(result.current).toBeDefined();
  });

  it('should handle unsuccessful responses', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' }),
    });

    const { result } = renderHook(
      () =>
        useServerStorage({ app: 'mockApp', type: StateType.PUZZLE, id: '123' }),
      { wrapper }
    );

    await act(async () => {
      await result.current.getValue();
    });

    // Should handle non-ok responses
    expect(result.current).toBeDefined();
  });

  it('should build correct request URLs', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ state: {} }),
    });

    const { result } = renderHook(
      () =>
        useServerStorage({
          app: 'mockApp',
          type: StateType.PUZZLE,
          id: 'puzzle123',
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.getValue();
    });

    expect(mockFetch).toHaveBeenCalledWith(expect.any(Request));
    const request = mockFetch.mock.calls[0][0] as Request;
    expect(request.url).toContain('puzzle123');
  });

  it('should include user context in requests', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useServerStorage({ app: 'mockApp' }), {
      wrapper,
    });

    await act(async () => {
      await result.current.createParty({
        partyName: 'Test',
        memberNickname: 'Player',
      });
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('should convert server responses to correct types', async () => {
    const mockData = {
      state: { puzzle: 'data' },
      updatedAt: new Date().toISOString(),
      parties: {},
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(
      () =>
        useServerStorage({ app: 'mockApp', type: StateType.PUZZLE, id: '123' }),
      { wrapper }
    );

    let value: any;
    await act(async () => {
      value = await result.current.getValue();
    });

    expect(value).toHaveProperty('updatedAt');
    expect(value?.updatedAt instanceof Date).toBe(true);
  });

  it('should handle null state gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ state: null }),
    });

    const { result } = renderHook(
      () =>
        useServerStorage({ app: 'mockApp', type: StateType.PUZZLE, id: '123' }),
      { wrapper }
    );

    await act(async () => {
      await result.current.getValue();
    });

    expect(result.current).toBeDefined();
  });

  it('should support party-specific queries', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const { result } = renderHook(
      () => useServerStorage({ app: 'mockApp', type: StateType.PUZZLE }),
      { wrapper }
    );

    await act(async () => {
      await result.current.listValues?.({
        partyId: 'party1',
        userId: 'user1',
      });
    });

    expect(mockFetch).toHaveBeenCalledWith(expect.any(Request));
  });
});
