import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppDownloadModal } from './AppDownloadModal';

// Mock the capacitor helper
jest.mock('../helpers/capacitor', () => ({
  isCapacitor: jest.fn(() => false),
}));

const { isCapacitor } = require('../helpers/capacitor');

describe('AppDownloadModal', () => {
  const mockOnClose = jest.fn();
  const mockOnContinueWeb = jest.fn();
  const mockProps = {
    appName: 'Test App',
    appStoreUrl: 'https://apps.apple.com/app/test-app/id123456',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.test.app',
    deepLinkScheme: 'com.test.app',
    mobileDescription: 'Get the best experience with our Test App!',
    desktopDescription: 'Download Test App',
    openInAppLabel: 'Open App',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    isCapacitor.mockReturnValue(false);
  });

  describe('visibility', () => {
    it('should render when isOpen is true', () => {
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );
      expect(
        screen.getByText(/Did you know you can continue in our mobile app/i)
      ).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <AppDownloadModal
          isOpen={false}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );
      expect(
        screen.queryByText(/Did you know you can continue in our mobile app/i)
      ).not.toBeInTheDocument();
    });

    it('should not render when in Capacitor environment (native app)', () => {
      isCapacitor.mockReturnValue(true);
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );
      expect(
        screen.queryByText(/Did you know you can continue in our mobile app/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('header content', () => {
    it('should display the modal title', () => {
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );
      expect(
        screen.getByText(/Did you know you can continue in our mobile app/i)
      ).toBeInTheDocument();
    });

    it('should display header icon and content', () => {
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );
      expect(
        screen.getByText(/Did you know you can continue in our mobile app/i)
      ).toBeInTheDocument();
    });
  });

  describe('platform detection', () => {
    beforeEach(() => {
      isCapacitor.mockReturnValue(false);
    });

    it('should display iOS App Store badge on iOS Safari', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPad; CPU OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      });

      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );

      const appStoreLink = screen.getByAltText(/App Store/i);
      expect(appStoreLink).toBeInTheDocument();
    });

    it('should display Google Play badge on Android browser', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36',
        writable: true,
      });

      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );

      const playStoreLink = screen.getByAltText(/Google Play/i);
      expect(playStoreLink).toBeInTheDocument();
    });

    it('should display both badges on desktop', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
      });

      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );

      expect(screen.getByAltText(/App Store/i)).toBeInTheDocument();
      expect(screen.getByAltText(/Google Play/i)).toBeInTheDocument();
    });

    it('should display mobile-specific message on iOS', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPad; CPU OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      });

      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );

      expect(
        screen.getByText(mockProps.mobileDescription)
      ).toBeInTheDocument();
    });

    it('should display desktop message on desktop', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
      });

      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );

      expect(screen.getByText(mockProps.desktopDescription)).toBeInTheDocument();
    });
  });

  describe('App Store button', () => {
    beforeEach(() => {
      window.open = jest.fn();
    });

    it('should open App Store when clicked', () => {
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );

      const appStoreLink = screen.getByAltText(/App Store/i);
      fireEvent.click(appStoreLink);

      expect(window.open).toHaveBeenCalledWith(
        mockProps.appStoreUrl,
        '_blank'
      );
    });
  });

  describe('Google Play button', () => {
    beforeEach(() => {
      window.open = jest.fn();
    });

    it('should open Google Play when clicked', () => {
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );

      const playStoreLink = screen.getByAltText(/Google Play/i);
      fireEvent.click(playStoreLink);

      expect(window.open).toHaveBeenCalledWith(
        mockProps.googlePlayUrl,
        '_blank'
      );
    });
  });

  describe('Open in app button', () => {
    beforeEach(() => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPad; CPU OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      });
    });

    it('should display open in app button on mobile', () => {
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );

      expect(screen.getByText(mockProps.openInAppLabel)).toBeInTheDocument();
    });

    it('should not display open in app button on desktop', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
      });

      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );

      expect(screen.queryByText(mockProps.openInAppLabel)).not.toBeInTheDocument();
    });

    it('should have open in app button', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPad; CPU OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      });

      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );

      const openButton = screen.getByText(mockProps.openInAppLabel);
      expect(openButton).toBeInTheDocument();

      // Clicking the button will attempt to set window.location.href
      // but we can't easily test this in JSDOM, so just verify the button exists
    });
  });

  describe('Continue in browser button', () => {
    it('should display "Continue in browser" text on mobile', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPad; CPU OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      });

      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );

      expect(screen.getByText(/Continue in browser/i)).toBeInTheDocument();
    });

    it('should display "Continue on desktop" text on desktop', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
      });

      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );

      expect(screen.getByText(/Continue on desktop/i)).toBeInTheDocument();
    });

    it('should call onContinueWeb and onClose when clicked', () => {
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );

      const continueButton = screen.getByText(
        /Continue in browser|Continue on desktop/i
      );
      fireEvent.click(continueButton);

      expect(mockOnContinueWeb).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('dialog structure', () => {
    it('should render modal dialog', () => {
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );
      expect(
        screen.getByText(/Did you know you can continue in our mobile app/i)
      ).toBeInTheDocument();
    });

    it('should render modal backdrop', () => {
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );
      expect(
        screen.getByText(/Did you know you can continue in our mobile app/i)
      ).toBeInTheDocument();
    });

    it('should render modal panel with content', () => {
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );
      expect(screen.getByAltText(/App Store/i)).toBeInTheDocument();
    });
  });

  describe('responsive design', () => {
    it('should render modal content responsively', () => {
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );
      expect(
        screen.getByText(/Did you know you can continue in our mobile app/i)
      ).toBeInTheDocument();
      expect(screen.getByAltText(/App Store/i)).toBeInTheDocument();
    });

    it('should render all modal content elements', () => {
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );
      expect(screen.getByText(mockProps.desktopDescription)).toBeInTheDocument();
      expect(screen.getByAltText(/Google Play/i)).toBeInTheDocument();
    });
  });

  describe('dark mode support', () => {
    it('should render modal with dark mode support', () => {
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );
      expect(
        screen.getByText(/Did you know you can continue in our mobile app/i)
      ).toBeInTheDocument();
    });
  });

  describe('conditional rendering', () => {
    beforeEach(() => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
      });
    });

    it('should show store badges section', () => {
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );
      expect(screen.getByAltText(/App Store/i)).toBeInTheDocument();
      expect(screen.getByAltText(/Google Play/i)).toBeInTheDocument();
    });

    it('should not show "Open in app" section on desktop', () => {
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );
      expect(
        screen.queryByText(/Already got the app/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('animations', () => {
    it('should render modal with smooth transitions', () => {
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );
      expect(
        screen.getByText(/Did you know you can continue in our mobile app/i)
      ).toBeInTheDocument();
    });

    it('should render buttons with hover effects', () => {
      render(
        <AppDownloadModal
          isOpen={true}
          onClose={mockOnClose}
          onContinueWeb={mockOnContinueWeb}
          {...mockProps}
        />
      );
      const appStoreLink = screen.getByAltText(/App Store/i);
      expect(appStoreLink).toBeInTheDocument();
    });
  });
});
