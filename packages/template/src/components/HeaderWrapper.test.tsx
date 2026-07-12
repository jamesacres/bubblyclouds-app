import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HeaderWrapper from './HeaderWrapper';
import {
  RevenueCatContext,
  RevenueCatContextInterface,
} from '../providers/RevenueCatProvider';

jest.mock('../hooks/online', () => ({
  useOnline: jest.fn(() => ({ isOnline: true, forceOffline: jest.fn() })),
}));

const mockDeleteAccount = jest.fn().mockResolvedValue(true);
jest.mock('../hooks/serverStorage', () => ({
  useServerStorage: jest.fn(() => ({
    deleteAccount: mockDeleteAccount,
  })),
}));

jest.mock('../helpers/capacitor', () => ({
  isCapacitor: jest.fn(() => false),
}));

jest.mock('@bubblyclouds-app/ui/components/Header', () => ({
  __esModule: true,
  default: ({
    isOnline,
    isSubscribed,
    appName,
    HeaderUser,
    headerUserProps,
    onPremiumColorClick,
  }: {
    isOnline: boolean;
    isSubscribed: boolean;
    appName: string;
    HeaderUser?: React.ComponentType<Record<string, unknown>>;
    headerUserProps?: Record<string, unknown>;
    onPremiumColorClick: (_colorName: string, _onSuccess: () => void) => void;
  }) => (
    <div>
      <span data-testid="is-online">{String(isOnline)}</span>
      <span data-testid="is-subscribed">{String(isSubscribed)}</span>
      <span data-testid="app-name">{appName}</span>
      {HeaderUser && headerUserProps && <HeaderUser {...headerUserProps} />}
      <button onClick={() => onPremiumColorClick('blue', jest.fn())}>
        premium-color
      </button>
    </div>
  ),
}));

jest.mock('@bubblyclouds-app/auth/components/HeaderUser', () => ({
  __esModule: true,
  default: ({
    showSubscribeModal,
    deleteAccount,
  }: {
    showSubscribeModal?: (_onSuccess: () => void) => void;
    deleteAccount?: () => Promise<boolean>;
  }) => (
    <div>
      {showSubscribeModal && (
        <button onClick={() => showSubscribeModal(jest.fn())}>subscribe</button>
      )}
      <button onClick={() => deleteAccount?.()}>delete-account</button>
    </div>
  ),
}));

describe('HeaderWrapper', () => {
  const defaultProps = {
    app: 'mockApp',
    appName: 'MockApp',
    apiUrl: 'https://api.example.com',
    privacyUrl: '/privacy',
    termsUrl: '/terms',
    companyUrl: '/company',
    companyName: 'MockCompany',
  };

  const renderComponent = (
    revenueCatValue: Partial<RevenueCatContextInterface> | undefined
  ) =>
    render(
      <RevenueCatContext.Provider
        value={revenueCatValue as RevenueCatContextInterface | undefined}
      >
        <HeaderWrapper {...defaultProps} />
      </RevenueCatContext.Provider>
    );

  it('renders with online status and app name when no RevenueCat context', () => {
    renderComponent(undefined);
    expect(screen.getByTestId('is-online')).toHaveTextContent('true');
    expect(screen.getByTestId('app-name')).toHaveTextContent('MockApp');
    expect(screen.getByTestId('is-subscribed')).toHaveTextContent('false');
  });

  it('passes isSubscribed through from RevenueCat context', () => {
    renderComponent({ isSubscribed: true });
    expect(screen.getByTestId('is-subscribed')).toHaveTextContent('true');
  });

  it('does not render subscribe button when showModalIfRequired is unavailable', () => {
    renderComponent({ isSubscribed: false });
    expect(screen.queryByText('subscribe')).not.toBeInTheDocument();
  });

  it('calls showModalIfRequired when subscribe button is clicked', () => {
    const showModalIfRequired = jest.fn();
    renderComponent({
      isSubscribed: false,
      subscribeModal: {
        isOpen: false,
        callback: jest.fn(),
        cancelCallback: jest.fn(),
        showModalIfRequired,
        hideModal: jest.fn(),
      },
    });
    fireEvent.click(screen.getByText('subscribe'));
    expect(showModalIfRequired).toHaveBeenCalledTimes(1);
  });

  it('calls showModalIfRequired when a premium color is clicked', () => {
    const showModalIfRequired = jest.fn();
    renderComponent({
      subscribeModal: {
        isOpen: false,
        callback: jest.fn(),
        cancelCallback: jest.fn(),
        showModalIfRequired,
        hideModal: jest.fn(),
      },
    });
    fireEvent.click(screen.getByText('premium-color'));
    expect(showModalIfRequired).toHaveBeenCalledTimes(1);
  });

  it('does not throw when a premium color is clicked with no RevenueCat context', () => {
    renderComponent(undefined);
    expect(() =>
      fireEvent.click(screen.getByText('premium-color'))
    ).not.toThrow();
  });

  it('calls deleteAccount from useServerStorage when triggered', async () => {
    renderComponent(undefined);
    fireEvent.click(screen.getByText('delete-account'));
    expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
  });
});
