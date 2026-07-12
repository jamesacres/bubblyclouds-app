import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RateAppButton } from './RateAppButton';

jest.mock('../helpers/capacitor', () => ({
  isCapacitor: jest.fn(() => false),
  isIOS: jest.fn(() => false),
  isAndroid: jest.fn(() => false),
}));

const { isCapacitor, isIOS, isAndroid } = require('../helpers/capacitor');

const setUserAgent = (value: string) => {
  Object.defineProperty(window.navigator, 'userAgent', {
    value,
    writable: true,
  });
};

const mockProps = {
  appName: 'Test App',
  appStoreUrl: 'https://apps.apple.com/app/test-app/id123456',
  googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.test.app',
};

const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
const IOS_UA =
  'Mozilla/5.0 (iPad; CPU OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36';

describe('RateAppButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isCapacitor.mockReturnValue(false);
    isIOS.mockReturnValue(false);
    isAndroid.mockReturnValue(false);
    setUserAgent(DESKTOP_UA);
  });

  describe('on Capacitor (native)', () => {
    it('opens the App Store write-review deep link on iOS', () => {
      isCapacitor.mockReturnValue(true);
      isIOS.mockReturnValue(true);
      const open = jest.fn();
      window.open = open;
      render(<RateAppButton {...mockProps} />);
      fireEvent.click(screen.getByRole('button'));
      expect(open).toHaveBeenCalledWith(
        `${mockProps.appStoreUrl}?action=write-review`,
        '_blank',
        'noopener'
      );
    });

    it('opens the Google Play URL on Android', () => {
      isCapacitor.mockReturnValue(true);
      isAndroid.mockReturnValue(true);
      const open = jest.fn();
      window.open = open;
      render(<RateAppButton {...mockProps} />);
      fireEvent.click(screen.getByRole('button'));
      expect(open).toHaveBeenCalledWith(
        mockProps.googlePlayUrl,
        '_blank',
        'noopener'
      );
    });
  });

  describe('on mobile web', () => {
    it('shows the enjoying prompt copy', () => {
      setUserAgent(IOS_UA);
      render(<RateAppButton {...mockProps} />);
      expect(screen.getByText(/Enjoying Test App\?/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Rate it/i).length).toBeGreaterThan(0);
    });

    it('opens the App Store URL with noopener on iOS', () => {
      setUserAgent(IOS_UA);
      const open = jest.fn();
      window.open = open;
      render(<RateAppButton {...mockProps} />);
      fireEvent.click(screen.getByRole('button'));
      expect(open).toHaveBeenCalledWith(
        mockProps.appStoreUrl,
        '_blank',
        'noopener'
      );
    });

    it('opens the Google Play URL with noopener on Android', () => {
      setUserAgent(ANDROID_UA);
      const open = jest.fn();
      window.open = open;
      render(<RateAppButton {...mockProps} />);
      fireEvent.click(screen.getByRole('button'));
      expect(open).toHaveBeenCalledWith(
        mockProps.googlePlayUrl,
        '_blank',
        'noopener'
      );
    });
  });

  describe('on desktop web', () => {
    it('renders nothing', () => {
      const { container } = render(<RateAppButton {...mockProps} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing for the inline variant', () => {
      const { container } = render(
        <RateAppButton {...mockProps} variant="inline" />
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('inline variant', () => {
    it('opens the matching store on mobile web', () => {
      setUserAgent(ANDROID_UA);
      const open = jest.fn();
      window.open = open;
      render(<RateAppButton {...mockProps} variant="inline" />);
      fireEvent.click(screen.getByRole('button'));
      expect(open).toHaveBeenCalledWith(
        mockProps.googlePlayUrl,
        '_blank',
        'noopener'
      );
    });
  });
});
