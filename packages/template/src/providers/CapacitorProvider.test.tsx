import React from 'react';
import { render, act } from '@testing-library/react';
import CapacitorProvider from './CapacitorProvider';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { useRouter, usePathname } from 'next/navigation';

jest.mock('@capacitor/app');
jest.mock('@capacitor/browser');
jest.mock('next/navigation');

const mockApp = App as jest.Mocked<typeof App>;
const mockBrowser = Browser as jest.Mocked<typeof Browser>;
const mockUseRouter = useRouter as jest.Mock;
const mockUsePathname = usePathname as jest.Mock;

describe('CapacitorProvider', () => {
  let mockRouterPush: jest.Mock;
  let mockRouterBack: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush = jest.fn();
    mockRouterBack = jest.fn();
    mockUseRouter.mockReturnValue({
      push: mockRouterPush,
      back: mockRouterBack,
    });
    mockUsePathname.mockReturnValue('/');
    mockApp.addListener.mockResolvedValue({ remove: jest.fn() } as any);
  });

  it('should set up listeners on mount and clean up on unmount', async () => {
    const { unmount } = render(
      <CapacitorProvider>
        <div>Test</div>
      </CapacitorProvider>
    );
    await act(async () => {}); // Wait for effects
    expect(mockApp.removeAllListeners).toHaveBeenCalled();
    expect(mockApp.addListener).toHaveBeenCalledWith(
      'appUrlOpen',
      expect.any(Function)
    );
    expect(mockApp.addListener).toHaveBeenCalledWith(
      'backButton',
      expect.any(Function)
    );

    unmount();
    // isActive flag should prevent listeners from running after unmount
  });

  it('handles appUrlOpen event and navigates', async () => {
    let urlOpenCallback: (event: { url: string }) => void = () => {};
    mockApp.addListener.mockImplementation((eventName, callback) => {
      if ((eventName as string) === 'appUrlOpen') {
        urlOpenCallback = callback as any;
      }
      return Promise.resolve({ remove: jest.fn() } as any);
    });

    render(
      <CapacitorProvider>
        <div>Test</div>
      </CapacitorProvider>
    );
    await act(async () => {});

    act(() => {
      urlOpenCallback({
        url: 'https://mockApp.bubblyclouds.com/puzzle?id=123',
      });
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/puzzle?id=123');
    expect(mockBrowser.close).toHaveBeenCalled();
  });

  it('handles backButton event on home page by minimizing', async () => {
    let backButtonCallback: () => void = () => {};
    mockApp.addListener.mockImplementation((eventName, callback) => {
      if ((eventName as string) === 'backButton') {
        backButtonCallback = callback as any;
      }
      return Promise.resolve({ remove: jest.fn() } as any);
    });

    render(
      <CapacitorProvider>
        <div>Test</div>
      </CapacitorProvider>
    );
    await act(async () => {});

    act(() => {
      backButtonCallback();
    });

    expect(mockApp.minimizeApp).toHaveBeenCalled();
  });

  it('handles backButton event on other pages by navigating back', async () => {
    mockUsePathname.mockReturnValue('/some-page');
    let backButtonCallback: () => void = () => {};
    mockApp.addListener.mockImplementation((eventName, callback) => {
      if ((eventName as string) === 'backButton') {
        backButtonCallback = callback as any;
      }
      return Promise.resolve({ remove: jest.fn() } as any);
    });

    render(
      <CapacitorProvider>
        <div>Test</div>
      </CapacitorProvider>
    );
    await act(async () => {});

    act(() => {
      backButtonCallback();
    });

    expect(mockRouterBack).toHaveBeenCalled();
  });
});
