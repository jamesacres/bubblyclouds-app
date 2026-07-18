import React, { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import {
  DEFAULT_ASSUMPTIONS,
  MoneyBagsDataContext,
  MoneyBagsDataContextValue,
} from '../providers/MoneyBagsDataProvider';
import { useHousehold } from './useHousehold';

const contextValue: MoneyBagsDataContextValue = {
  household: {
    members: [],
    months: {},
    orderedMonths: [],
    effectiveAssumptions: DEFAULT_ASSUMPTIONS,
  },
  ownUserId: 'user-1',
  isLoading: false,
  isPartnerLoading: false,
  refresh: jest.fn(),
  saveOwnSnapshot: jest.fn(),
  saveOwnProfile: jest.fn(),
  saveSharedAssumptions: jest.fn(),
};

describe('useHousehold', () => {
  it('throws when used outside a MoneyBagsDataProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    expect(() => renderHook(() => useHousehold())).toThrow(
      'useHousehold must be used within a MoneyBagsDataProvider'
    );
    consoleError.mockRestore();
  });

  it('returns the context value inside the provider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MoneyBagsDataContext.Provider value={contextValue}>
        {children}
      </MoneyBagsDataContext.Provider>
    );
    const { result } = renderHook(() => useHousehold(), { wrapper });
    expect(result.current).toBe(contextValue);
  });
});
