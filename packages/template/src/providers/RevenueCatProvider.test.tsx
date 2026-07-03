import React, { useContext, useRef, useEffect } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import RevenueCatProvider, {
  RevenueCatContext,
  RevenueCatContextInterface,
} from './RevenueCatProvider';
import {
  UserContext,
  UserContextInterface,
} from '@bubblyclouds-app/auth/providers/AuthProvider';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';
import {
  Purchases,
  PurchasesPackage as CapacitorPackage,
} from '@revenuecat/purchases-capacitor';

jest.mock('../helpers/capacitor', () => ({
  isCapacitor: () => true,
  isAndroid: () => false,
  isIOS: () => true,
}));
jest.mock('../helpers/electron', () => ({ isElectron: () => false }));
jest.mock('@revenuecat/purchases-capacitor');

const mockPurchases = Purchases as jest.Mocked<typeof Purchases>;

type CustomerInfoResult = Awaited<
  ReturnType<typeof mockPurchases.getCustomerInfo>
>;
type OfferingsResult = Awaited<ReturnType<typeof mockPurchases.getOfferings>>;
type PurchaseResult = Awaited<ReturnType<typeof mockPurchases.purchasePackage>>;

const TestConsumer = () => {
  const context = useContext(RevenueCatContext);
  return <div>{context?.isSubscribed ? 'Subscribed' : 'Not Subscribed'}</div>;
};

describe('RevenueCatProvider', () => {
  const mockUser: UserContextInterface['user'] = { sub: 'user1', name: 'Test' };

  const renderWithUser = (
    user: UserContextInterface['user'] | null,
    showLoginModal?: jest.Mock
  ) => {
    return render(
      <UserContext.Provider
        value={{ user, showLoginModal } as unknown as UserContextInterface}
      >
        <RevenueCatProvider>
          <TestConsumer />
        </RevenueCatProvider>
      </UserContext.Provider>
    );
  };

  const captureContext = () => {
    const contextRef = {
      current: undefined as RevenueCatContextInterface | undefined,
    };
    const Consumer = () => {
      const context = useContext(RevenueCatContext);
      const ref = useRef(contextRef);
      useEffect(() => {
        ref.current.current = context;
      }, [context]);
      return null;
    };
    return { contextRef, Consumer };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPurchases.configure.mockResolvedValue(undefined);
    mockPurchases.getCustomerInfo.mockResolvedValue({
      customerInfo: { entitlements: { active: {} } },
    } as unknown as CustomerInfoResult);
    mockPurchases.getOfferings.mockResolvedValue({
      all: { default: { availablePackages: [] } },
    } as unknown as OfferingsResult);
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
    } as unknown as CustomerInfoResult);
    renderWithUser(mockUser);
    await waitFor(() => {
      expect(screen.getByText('Subscribed')).toBeInTheDocument();
    });
  });

  it('provides a function to purchase a package', async () => {
    mockPurchases.purchasePackage.mockResolvedValue(
      {} as unknown as PurchaseResult
    );
    const { contextRef, Consumer } = captureContext();
    render(
      <UserContext.Provider
        value={{ user: mockUser } as unknown as UserContextInterface}
      >
        <RevenueCatProvider>
          <Consumer />
        </RevenueCatProvider>
      </UserContext.Provider>
    );

    await waitFor(() => {
      expect(contextRef.current?.purchasePackage).toBeDefined();
    });

    await act(async () => {
      await contextRef.current?.purchasePackage(
        'test_package' as unknown as CapacitorPackage
      );
    });

    expect(mockPurchases.purchasePackage).toHaveBeenCalledWith({
      aPackage: 'test_package',
    });
  });

  describe('showModalIfRequired', () => {
    it('calls showLoginModal from context when user is not logged in', async () => {
      const mockShowLoginModal = jest.fn();
      const { contextRef, Consumer } = captureContext();
      render(
        <UserContext.Provider
          value={
            {
              user: undefined,
              showLoginModal: mockShowLoginModal,
            } as unknown as UserContextInterface
          }
        >
          <RevenueCatProvider>
            <Consumer />
          </RevenueCatProvider>
        </UserContext.Provider>
      );

      await waitFor(() => {
        expect(
          contextRef.current?.subscribeModal.showModalIfRequired
        ).toBeDefined();
      });

      act(() => {
        contextRef.current?.subscribeModal.showModalIfRequired(jest.fn());
      });

      expect(mockShowLoginModal).toHaveBeenCalledWith(
        expect.any(Function),
        LoginContext.SUBSCRIBE
      );
    });

    it('calls callback directly when user is subscribed', async () => {
      mockPurchases.getCustomerInfo.mockResolvedValue({
        customerInfo: { entitlements: { active: { Plus: {} } } },
      } as unknown as CustomerInfoResult);
      const mockCallback = jest.fn();
      const { contextRef, Consumer } = captureContext();
      render(
        <UserContext.Provider
          value={{ user: mockUser } as unknown as UserContextInterface}
        >
          <RevenueCatProvider>
            <Consumer />
          </RevenueCatProvider>
        </UserContext.Provider>
      );

      await waitFor(() => {
        expect(contextRef.current?.isSubscribed).toBe(true);
      });

      act(() => {
        contextRef.current?.subscribeModal.showModalIfRequired(mockCallback);
      });

      expect(mockCallback).toHaveBeenCalled();
    });

    it('opens subscription modal when user is logged in but not subscribed', async () => {
      const { contextRef, Consumer } = captureContext();
      render(
        <UserContext.Provider
          value={{ user: mockUser } as unknown as UserContextInterface}
        >
          <RevenueCatProvider>
            <Consumer />
          </RevenueCatProvider>
        </UserContext.Provider>
      );

      await waitFor(() => {
        expect(
          contextRef.current?.subscribeModal.showModalIfRequired
        ).toBeDefined();
      });

      act(() => {
        contextRef.current?.subscribeModal.showModalIfRequired(jest.fn());
      });

      await waitFor(() => {
        expect(contextRef.current?.subscribeModal.isOpen).toBe(true);
      });
    });
  });
});
