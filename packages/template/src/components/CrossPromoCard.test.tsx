import React from 'react';
import { render, screen } from '@testing-library/react';
import { CrossPromoCard } from './CrossPromoCard';

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
  gameName: 'Sudoku Race',
  tagline: 'Share a Sudoku with friends and race to solve it fastest.',
  preview: <div data-testid="preview">Preview</div>,
  appUrl: 'https://sudoku.bubblyclouds.com',
  appStoreUrl: 'https://apps.apple.com/app/sudoku-race/id6517357180',
  googlePlayUrl:
    'https://play.google.com/store/apps/details?id=com.bubblyclouds.sudoku',
};

const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
const IOS_UA =
  'Mozilla/5.0 (iPad; CPU OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36';

describe('CrossPromoCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isCapacitor.mockReturnValue(false);
    isIOS.mockReturnValue(false);
    isAndroid.mockReturnValue(false);
    setUserAgent(DESKTOP_UA);
  });

  it('renders the game name, tagline and preview', () => {
    render(<CrossPromoCard {...mockProps} />);
    expect(screen.getByText('Sudoku Race')).toBeInTheDocument();
    expect(screen.getByText(mockProps.tagline)).toBeInTheDocument();
    expect(screen.getByTestId('preview')).toBeInTheDocument();
  });

  it('links to the web app on desktop', () => {
    render(<CrossPromoCard {...mockProps} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', mockProps.appUrl);
  });

  it('links to the web app on iOS web (not the native app store)', () => {
    setUserAgent(IOS_UA);
    render(<CrossPromoCard {...mockProps} />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      mockProps.appStoreUrl
    );
  });

  it('links to the Google Play URL on Android web', () => {
    setUserAgent(ANDROID_UA);
    render(<CrossPromoCard {...mockProps} />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      mockProps.googlePlayUrl
    );
  });

  it('links to the App Store when running inside a native iOS app', () => {
    isCapacitor.mockReturnValue(true);
    isIOS.mockReturnValue(true);
    render(<CrossPromoCard {...mockProps} />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      mockProps.appStoreUrl
    );
  });

  it('links to Google Play when running inside a native Android app', () => {
    isCapacitor.mockReturnValue(true);
    isAndroid.mockReturnValue(true);
    render(<CrossPromoCard {...mockProps} />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      mockProps.googlePlayUrl
    );
  });

  it('opens the link in a new tab safely', () => {
    render(<CrossPromoCard {...mockProps} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
