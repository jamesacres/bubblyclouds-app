import React, { useContext, useRef, useEffect } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import RevenueCatProvider, { RevenueCatContext } from './RevenueCatProvider';
import {
  UserContext,
  UserContextInterface,
} from '@bubblyclouds-app/auth/providers/AuthProvider';
import { Purchases } from '@revenuecat/purchases-capacitor';

jest.mock('../helpers/capacitor', () => ({
  isCapacitor: () => true,
  isAndroid: () => false,
  isIOS: () => true,
}));
jest.mock('../helpers/electron', () => ({ isElectron: () => false }));
jest.mock('@revenuecat/purchases-capacitor');

const mockPurchases = Purchases as jest.Mocked<typeof Purchases>;

const TestConsumer = () => {
  const context = useContext(RevenueCatContext);
  return <div>{context?.isSubscribed ? 'Subscribed' : 'Not Subscribed'}</div>;
};

describe('RevenueCatProvider', () => {
  const mockUser: UserContextInterface['user'] = { sub: 'user1', name: 'Test' };

  const renderWithUser = (user: UserContextInterface['user'] | null) => {
    return render(
      <UserContext.Provider value={{ user } as any}>
        <RevenueCatProvider>
          <TestConsumer />
        </RevenueCatProvider>
      </UserContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPurchases.configure.mockResolvedValue(undefined);
    mockPurchases.getCustomerInfo.mockResolvedValue({
      customerInfo: { entitlements: { active: {} } },
    } as any);
    mockPurchases.getOfferings.mockResolvedValue({
      all: { default: { availablePackages: [] } },
    } as any);
  });

  it('initializes and checks subscription status for a logged-in user', async () => {
    renderWithUser(mockUser);
    await waitFor(() => {
      expect(mockPurchases.configure).toHaveBeenCalled();
      expect(mockPurchases.getCustomerInfo).toHaveBeenCalled();
    });
  });

  it('does not initialize for a logged-out user', () => {
    renderWithUser(null);
    expect(mockPurchases.configure).not.toHaveBeenCalled();
  });

  it('sets isSubscribed to true if the user has active entitlements', async () => {
    mockPurchases.getCustomerInfo.mockResolvedValue({
      customerInfo: { entitlements: { active: { Plus: {} } } },
    } as any);
    renderWithUser(mockUser);
    await waitFor(() => {
      expect(screen.getByText('Subscribed')).toBeInTheDocument();
    });
  });

  it('provides a function to purchase a package', async () => {
    mockPurchases.purchasePackage.mockResolvedValue({} as any);
    const contextRef = { current: undefined as any };
    const Consumer = () => {
      const context = useContext(RevenueCatContext);
      const ref = useRef(contextRef);
      useEffect(() => {
        ref.current.current = context;
      }, [context]);
      return null;
    };
    render(
      <UserContext.Provider value={{ user: mockUser } as any}>
        <RevenueCatProvider>
          <Consumer />
        </RevenueCatProvider>
      </UserContext.Provider>
    );

    await waitFor(() => {
      expect(contextRef.current.purchasePackage).toBeDefined();
    });

    await act(async () => {
      await contextRef.current.purchasePackage('test_package');
    });

    expect(mockPurchases.purchasePackage).toHaveBeenCalledWith({
      aPackage: 'test_package',
    });
  });
});
