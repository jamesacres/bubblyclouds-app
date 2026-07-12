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
import { Purchases as WebPurchases } from '@revenuecat/purchases-js';

const mockIsCapacitor = jest.fn(() => true);
const mockIsAndroid = jest.fn(() => false);
const mockIsIOS = jest.fn(() => true);
jest.mock('../helpers/capacitor', () => ({
  isCapacitor: () => mockIsCapacitor(),
  isAndroid: () => mockIsAndroid(),
  isIOS: () => mockIsIOS(),
}));
const mockIsElectron = jest.fn(() => false);
jest.mock('../helpers/electron', () => ({
  isElectron: () => mockIsElectron(),
}));
jest.mock('@revenuecat/purchases-capacitor');
jest.mock('@revenuecat/purchases-js');

const mockPurchases = Purchases as jest.Mocked<typeof Purchases>;
const mockWebPurchases = WebPurchases as jest.Mocked<typeof WebPurchases>;

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
  const mockApiKeys = {
    ios: 'appl_test',
    android: 'goog_test',
    web: 'rcb_test',
  };

  const renderWithUser = (
    user: UserContextInterface['user'] | null,
    showLoginModal?: jest.Mock
  ) => {
    return render(
      <UserContext.Provider
        value={{ user, showLoginModal } as unknown as UserContextInterface}
      >
        <RevenueCatProvider apiKeys={mockApiKeys}>
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
    mockIsCapacitor.mockReturnValue(true);
    mockIsAndroid.mockReturnValue(false);
    mockIsIOS.mockReturnValue(true);
    mockIsElectron.mockReturnValue(false);
    mockPurchases.configure.mockResolvedValue(undefined);
    mockPurchases.getCustomerInfo.mockResolvedValue({
      customerInfo: { entitlements: { active: {} } },
    } as unknown as CustomerInfoResult);
    mockPurchases.getOfferings.mockResolvedValue({
      all: { default: { availablePackages: [] } },
    } as unknown as OfferingsResult);
    if (!mockPurchases.restorePurchases) {
      (mockPurchases as unknown as Record<string, unknown>).restorePurchases =
        jest.fn();
    }
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
        <RevenueCatProvider apiKeys={mockApiKeys}>
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
          <RevenueCatProvider apiKeys={mockApiKeys}>
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
          <RevenueCatProvider apiKeys={mockApiKeys}>
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
          <RevenueCatProvider apiKeys={mockApiKeys}>
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

    it('calls the cancel callback and hides the modal', async () => {
      const mockCallback = jest.fn();
      const mockCancelCallback = jest.fn();
      const { contextRef, Consumer } = captureContext();
      render(
        <UserContext.Provider
          value={{ user: mockUser } as unknown as UserContextInterface}
        >
          <RevenueCatProvider apiKeys={mockApiKeys}>
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
        contextRef.current?.subscribeModal.showModalIfRequired(
          mockCallback,
          mockCancelCallback
        );
      });

      await waitFor(() => {
        expect(contextRef.current?.subscribeModal.isOpen).toBe(true);
      });

      act(() => {
        contextRef.current?.subscribeModal.hideModal();
      });

      await waitFor(() => {
        expect(contextRef.current?.subscribeModal.isOpen).toBe(false);
      });
    });
  });

  describe('Android platform', () => {
    it('configures with the Android API key when not iOS', async () => {
      mockIsAndroid.mockReturnValue(true);
      mockIsIOS.mockReturnValue(false);
      renderWithUser(mockUser);
      await waitFor(() => {
        expect(mockPurchases.configure).toHaveBeenCalledWith({
          appUserID: 'user1',
          apiKey: mockApiKeys.android,
        });
      });
    });
  });

  describe('Electron platform', () => {
    it('skips purchases configuration and stops loading immediately', async () => {
      mockIsCapacitor.mockReturnValue(false);
      mockIsElectron.mockReturnValue(true);
      const { contextRef, Consumer } = captureContext();
      render(
        <UserContext.Provider
          value={{ user: mockUser } as unknown as UserContextInterface}
        >
          <RevenueCatProvider apiKeys={mockApiKeys}>
            <Consumer />
          </RevenueCatProvider>
        </UserContext.Provider>
      );
      await waitFor(() => {
        expect(contextRef.current?.isLoading).toBe(false);
      });
      expect(mockPurchases.configure).not.toHaveBeenCalled();
      expect(mockWebPurchases.configure).not.toHaveBeenCalled();
    });

    it('does nothing when purchasePackage is called on Electron', async () => {
      mockIsCapacitor.mockReturnValue(false);
      mockIsElectron.mockReturnValue(true);
      const { contextRef, Consumer } = captureContext();
      render(
        <UserContext.Provider
          value={{ user: mockUser } as unknown as UserContextInterface}
        >
          <RevenueCatProvider apiKeys={mockApiKeys}>
            <Consumer />
          </RevenueCatProvider>
        </UserContext.Provider>
      );
      await waitFor(() => {
        expect(contextRef.current?.purchasePackage).toBeDefined();
      });
      const result = await act(async () =>
        contextRef.current?.purchasePackage(
          'test_package' as unknown as CapacitorPackage
        )
      );
      expect(result).toBeUndefined();
    });
  });

  describe('Web platform', () => {
    const mockWebInstance = {
      getOfferings: jest.fn(),
      getCustomerInfo: jest.fn(),
      purchase: jest.fn(),
    };

    beforeEach(() => {
      mockIsCapacitor.mockReturnValue(false);
      mockIsElectron.mockReturnValue(false);
      mockWebInstance.getOfferings.mockReset().mockResolvedValue({
        all: { default: { availablePackages: [] } },
      });
      mockWebInstance.getCustomerInfo.mockReset().mockResolvedValue({
        entitlements: { active: {} },
      });
      mockWebInstance.purchase.mockReset();
      (
        mockWebPurchases.getSharedInstance as unknown as jest.Mock
      ).mockReturnValue(mockWebInstance);
    });

    it('configures the web SDK with the web API key and fetches offerings/customer info', async () => {
      renderWithUser(mockUser);
      await waitFor(() => {
        expect(mockWebPurchases.configure).toHaveBeenCalledWith({
          appUserId: 'user1',
          apiKey: mockApiKeys.web,
        });
        expect(mockWebInstance.getOfferings).toHaveBeenCalled();
        expect(mockWebInstance.getCustomerInfo).toHaveBeenCalled();
      });
    });

    it('sets isSubscribed to true when the web customer info has an active Plus entitlement', async () => {
      mockWebInstance.getCustomerInfo.mockResolvedValue({
        entitlements: { active: { Plus: {} } },
      });
      renderWithUser(mockUser);
      await waitFor(() => {
        expect(screen.getByText('Subscribed')).toBeInTheDocument();
      });
    });

    it('logs an error and stops loading when fetching web offerings fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockWebInstance.getOfferings.mockRejectedValue(new Error('boom'));
      const { contextRef, Consumer } = captureContext();
      render(
        <UserContext.Provider
          value={{ user: mockUser } as unknown as UserContextInterface}
        >
          <RevenueCatProvider apiKeys={mockApiKeys}>
            <Consumer />
          </RevenueCatProvider>
        </UserContext.Provider>
      );
      await waitFor(() => {
        expect(contextRef.current?.isLoading).toBe(false);
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching customer info:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('purchases a package on the web and restores subscription state', async () => {
      mockWebInstance.purchase.mockResolvedValue({
        customerInfo: { entitlements: { active: { Plus: {} } } },
      });
      const { contextRef, Consumer } = captureContext();
      render(
        <UserContext.Provider
          value={{ user: mockUser } as unknown as UserContextInterface}
        >
          <RevenueCatProvider apiKeys={mockApiKeys}>
            <Consumer />
          </RevenueCatProvider>
        </UserContext.Provider>
      );
      await waitFor(() => {
        expect(contextRef.current?.purchasePackage).toBeDefined();
      });

      const result = await act(async () =>
        contextRef.current?.purchasePackage(
          'web_package' as unknown as CapacitorPackage
        )
      );

      expect(mockWebInstance.purchase).toHaveBeenCalledWith({
        rcPackage: 'web_package',
      });
      expect(result).toBe(true);
    });

    it('refreshEntitlements re-fetches web customer info', async () => {
      const { contextRef, Consumer } = captureContext();
      render(
        <UserContext.Provider
          value={{ user: mockUser } as unknown as UserContextInterface}
        >
          <RevenueCatProvider apiKeys={mockApiKeys}>
            <Consumer />
          </RevenueCatProvider>
        </UserContext.Provider>
      );
      await waitFor(() => {
        expect(contextRef.current?.refreshEntitlements).toBeDefined();
      });
      mockWebInstance.getCustomerInfo.mockClear();

      await act(async () => {
        await contextRef.current?.refreshEntitlements();
      });

      expect(mockWebInstance.getCustomerInfo).toHaveBeenCalledTimes(1);
    });

    it('does not call refreshCustomerInfo when there is no user', async () => {
      const { contextRef, Consumer } = captureContext();
      render(
        <UserContext.Provider
          value={{ user: undefined } as unknown as UserContextInterface}
        >
          <RevenueCatProvider apiKeys={mockApiKeys}>
            <Consumer />
          </RevenueCatProvider>
        </UserContext.Provider>
      );
      await waitFor(() => {
        expect(contextRef.current?.refreshEntitlements).toBeDefined();
      });

      await act(async () => {
        await contextRef.current?.refreshEntitlements();
      });

      expect(mockWebInstance.getCustomerInfo).not.toHaveBeenCalled();
    });
  });

  describe('restorePurchases', () => {
    it('restores purchases via Capacitor and returns whether Plus is active', async () => {
      mockPurchases.restorePurchases.mockResolvedValue({
        customerInfo: { entitlements: { active: { Plus: {} } } },
      } as unknown as CustomerInfoResult);
      const { contextRef, Consumer } = captureContext();
      render(
        <UserContext.Provider
          value={{ user: mockUser } as unknown as UserContextInterface}
        >
          <RevenueCatProvider apiKeys={mockApiKeys}>
            <Consumer />
          </RevenueCatProvider>
        </UserContext.Provider>
      );
      await waitFor(() => {
        expect(contextRef.current?.restorePurchases).toBeDefined();
      });

      const result = await act(async () =>
        contextRef.current?.restorePurchases()
      );

      expect(result).toBe(true);
    });

    it('logs a warning and does not throw when restorePurchases fails', async () => {
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      mockPurchases.restorePurchases.mockRejectedValue(new Error('fail'));
      const { contextRef, Consumer } = captureContext();
      render(
        <UserContext.Provider
          value={{ user: mockUser } as unknown as UserContextInterface}
        >
          <RevenueCatProvider apiKeys={mockApiKeys}>
            <Consumer />
          </RevenueCatProvider>
        </UserContext.Provider>
      );
      await waitFor(() => {
        expect(contextRef.current?.restorePurchases).toBeDefined();
      });

      await act(async () => {
        await contextRef.current?.restorePurchases();
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.any(Error));
      consoleWarnSpy.mockRestore();
    });
  });

  describe('purchasePackage error handling and DOM restoration', () => {
    it('restores original html/body style and class attributes after purchasing', async () => {
      const html = document.querySelector('html');
      const body = document.querySelector('body');
      html?.setAttribute('style', 'color: red;');
      html?.setAttribute('class', 'original-html-class');
      body?.setAttribute('style', 'margin: 0;');
      body?.setAttribute('class', 'original-body-class');

      mockPurchases.purchasePackage.mockResolvedValue({
        customerInfo: { entitlements: { active: {} } },
      } as unknown as PurchaseResult);

      const { contextRef, Consumer } = captureContext();
      render(
        <UserContext.Provider
          value={{ user: mockUser } as unknown as UserContextInterface}
        >
          <RevenueCatProvider apiKeys={mockApiKeys}>
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

      expect(html?.getAttribute('style')).toBe('color: red;');
      expect(html?.getAttribute('class')).toBe('original-html-class');
      expect(body?.getAttribute('style')).toBe('margin: 0;');
      expect(body?.getAttribute('class')).toBe('original-body-class');

      html?.removeAttribute('style');
      html?.removeAttribute('class');
      body?.removeAttribute('style');
      body?.removeAttribute('class');
    });

    it('logs a warning and does not throw when purchasePackage fails', async () => {
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      mockPurchases.purchasePackage.mockRejectedValue(new Error('declined'));
      const { contextRef, Consumer } = captureContext();
      render(
        <UserContext.Provider
          value={{ user: mockUser } as unknown as UserContextInterface}
        >
          <RevenueCatProvider apiKeys={mockApiKeys}>
            <Consumer />
          </RevenueCatProvider>
        </UserContext.Provider>
      );
      await waitFor(() => {
        expect(contextRef.current?.purchasePackage).toBeDefined();
      });

      const result = await act(async () =>
        contextRef.current?.purchasePackage(
          'test_package' as unknown as CapacitorPackage
        )
      );

      expect(result).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.any(Error));
      consoleWarnSpy.mockRestore();
    });
  });

  it('logs an error and stops loading when fetching Capacitor customer info fails', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockPurchases.getOfferings.mockRejectedValue(new Error('network error'));
    const { contextRef, Consumer } = captureContext();
    render(
      <UserContext.Provider
        value={{ user: mockUser } as unknown as UserContextInterface}
      >
        <RevenueCatProvider apiKeys={mockApiKeys}>
          <Consumer />
        </RevenueCatProvider>
      </UserContext.Provider>
    );
    await waitFor(() => {
      expect(contextRef.current?.isLoading).toBe(false);
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching customer info:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });
});
