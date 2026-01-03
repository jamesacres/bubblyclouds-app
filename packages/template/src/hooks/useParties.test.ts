import { renderHook, act } from '@testing-library/react';
import { useParties } from './useParties';
import { PartiesContext } from '../providers/PartiesProvider';
import React from 'react';

describe('useParties', () => {
  const mockContextValue: any = {
    parties: [],
    isLoading: false,
    showCreateParty: false,
    setShowCreateParty: jest.fn(),
    isSaving: false,
    memberNickname: '',
    setMemberNickname: jest.fn(),
    partyName: '',
    setPartyName: jest.fn(),
    saveParty: jest.fn(),
    updateParty: jest.fn(),
    getNicknameByUserId: jest.fn(),
    refreshParties: jest.fn(),
    lazyLoadParties: jest.fn(),
    leaveParty: jest.fn(),
    removeMember: jest.fn(),
    deleteParty: jest.fn(),
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(
      PartiesContext.Provider,
      {
        value: mockContextValue,
      },
      children
    );
  };

  it('should return all values and functions from PartiesContext', () => {
    const { result } = renderHook(() => useParties(), { wrapper });

    expect(result.current.parties).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.saveParty).toBe(mockContextValue.saveParty);
  });

  it('should throw an error if used outside of a PartiesProvider', () => {
    // Suppress console.error for this test
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    expect(() => renderHook(() => useParties())).toThrow(
      'useParties must be used within a PartiesProvider'
    );
    consoleErrorSpy.mockRestore();
  });

  it('should call lazyLoadParties on mount', () => {
    renderHook(() => useParties(), { wrapper });
    expect(mockContextValue.lazyLoadParties).toHaveBeenCalled();
  });

  it('refreshParties should call the context refresh function', async () => {
    const { result } = renderHook(() => useParties(), { wrapper });
    await act(async () => {
      await result.current.refreshParties();
    });
    expect(mockContextValue.refreshParties).toHaveBeenCalled();
  });
});
