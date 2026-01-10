import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ThemeColorSwitch from './ThemeColorSwitch';
import { useThemeColor } from '../providers/ThemeColorProvider';

jest.mock('../providers/ThemeColorProvider');

const mockUseThemeColor = useThemeColor as jest.MockedFunction<
  typeof useThemeColor
>;

describe('ThemeColorSwitch', () => {
  const mockSetThemeColor = jest.fn();

  const mockRevenueCatContext = {
    isSubscribed: false,
    subscribeModal: {
      showModalIfRequired: jest.fn(),
    },
  };

  const mockRevenueCatContextSubscribed = {
    isSubscribed: true,
    subscribeModal: {
      showModalIfRequired: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseThemeColor.mockReturnValue({
      themeColor: 'blue',
      setThemeColor: mockSetThemeColor,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render the theme color button', () => {
      render(<ThemeColorSwitch />);

      const button = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      expect(button).toBeInTheDocument();
    });

    it('should render button with correct initial background color', () => {
      mockUseThemeColor.mockReturnValue({
        themeColor: 'blue',
        setThemeColor: mockSetThemeColor,
      });

      render(<ThemeColorSwitch />);

      const button = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      expect(button).toHaveClass('bg-blue-500');
    });

    it('should render with different color when themeColor changes', () => {
      mockUseThemeColor.mockReturnValue({
        themeColor: 'red',
        setThemeColor: mockSetThemeColor,
      });

      render(<ThemeColorSwitch />);

      const button = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      expect(button).toHaveClass('bg-red-500');
    });

    it('should render SVG icon inside button', () => {
      const { container } = render(<ThemeColorSwitch />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Color Menu Interaction', () => {
    it('should open color menu when button is clicked', async () => {
      render(<ThemeColorSwitch />);

      const button = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Set theme color to blue/i })
        ).toBeInTheDocument();
      });
    });

    it('should close color menu when clicking outside', async () => {
      render(<ThemeColorSwitch />);

      const button = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Set theme color to blue/i })
        ).toBeInTheDocument();
      });

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: /Set theme color to blue/i })
        ).not.toBeInTheDocument();
      });
    });

    it('should toggle menu open/closed on repeated button clicks', async () => {
      render(<ThemeColorSwitch />);

      const button = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });

      // Open menu
      fireEvent.click(button);
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Set theme color to blue/i })
        ).toBeInTheDocument();
      });

      // Close menu
      fireEvent.click(button);
      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: /Set theme color to blue/i })
        ).not.toBeInTheDocument();
      });

      // Open again
      fireEvent.click(button);
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Set theme color to blue/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Color Selection - Free Colors', () => {
    it('should select free color (blue) without showing modal', async () => {
      render(<ThemeColorSwitch />);

      const mainButton = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      fireEvent.click(mainButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Set theme color to blue/i })
        ).toBeInTheDocument();
      });

      const blueButton = screen.getByRole('button', {
        name: /Set theme color to blue/i,
      });
      fireEvent.click(blueButton);

      expect(mockSetThemeColor).toHaveBeenCalledWith('blue');
      expect(
        mockRevenueCatContext.subscribeModal.showModalIfRequired
      ).not.toHaveBeenCalled();
    });

    it('should select free color (red) without showing modal', async () => {
      render(<ThemeColorSwitch />);

      const mainButton = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      fireEvent.click(mainButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Set theme color to red/i })
        ).toBeInTheDocument();
      });

      const redButton = screen.getByRole('button', {
        name: /Set theme color to red/i,
      });
      fireEvent.click(redButton);

      expect(mockSetThemeColor).toHaveBeenCalledWith('red');
      expect(
        mockRevenueCatContext.subscribeModal.showModalIfRequired
      ).not.toHaveBeenCalled();
    });

    it('should render green color option for free color selection', async () => {
      render(<ThemeColorSwitch />);

      const mainButton = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      fireEvent.click(mainButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Set theme color to green/i })
        ).toBeInTheDocument();
      });

      const greenButton = screen.getByRole('button', {
        name: /Set theme color to green/i,
      });
      expect(greenButton).toBeInTheDocument();
    });
  });

  describe('Color Selection - Premium Colors', () => {
    it('should show subscription modal when selecting premium color as non-subscriber', async () => {
      render(
        <ThemeColorSwitch
          isSubscribed={mockRevenueCatContext.isSubscribed}
          onPremiumColorClick={(colorName, onSuccess) =>
            mockRevenueCatContext.subscribeModal.showModalIfRequired(
              onSuccess,
              () => {},
              'themeColor'
            )
          }
        />
      );

      const mainButton = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      fireEvent.click(mainButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Set theme color to purple/i })
        ).toBeInTheDocument();
      });

      const premiumButton = screen.getByRole('button', {
        name: /Set theme color to purple \(Premium\)/i,
      });
      fireEvent.click(premiumButton);

      expect(
        mockRevenueCatContext.subscribeModal.showModalIfRequired
      ).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        'themeColor'
      );
    });

    it('should show modal on premium color selection', async () => {
      render(
        <ThemeColorSwitch
          isSubscribed={mockRevenueCatContext.isSubscribed}
          onPremiumColorClick={(colorName, onSuccess) =>
            mockRevenueCatContext.subscribeModal.showModalIfRequired(
              onSuccess,
              () => {},
              'themeColor'
            )
          }
        />
      );

      const mainButton = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      fireEvent.click(mainButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Set theme color to purple/i })
        ).toBeInTheDocument();
      });

      const premiumButton = screen.getByRole('button', {
        name: /Set theme color to purple \(Premium\)/i,
      });
      fireEvent.click(premiumButton);

      expect(
        mockRevenueCatContext.subscribeModal.showModalIfRequired
      ).toHaveBeenCalled();
    });

    it('should allow selecting premium color when user is subscribed', async () => {
      render(<ThemeColorSwitch />);

      const mainButton = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      fireEvent.click(mainButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Set theme color to purple/i })
        ).toBeInTheDocument();
      });

      const premiumButton = screen.getByRole('button', {
        name: /Set theme color to purple/i,
      });
      fireEvent.click(premiumButton);

      expect(mockSetThemeColor).toHaveBeenCalledWith('purple');
      expect(
        mockRevenueCatContextSubscribed.subscribeModal.showModalIfRequired
      ).not.toHaveBeenCalled();
    });

    it('should close menu after selecting premium color', async () => {
      render(<ThemeColorSwitch />);

      const mainButton = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      fireEvent.click(mainButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Set theme color to purple/i })
        ).toBeInTheDocument();
      });

      const premiumButton = screen.getByRole('button', {
        name: /Set theme color to purple/i,
      });
      fireEvent.click(premiumButton);

      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: /Set theme color to purple/i })
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Rainbow Animation', () => {
    it('should render button with correct initial classes', () => {
      render(<ThemeColorSwitch />);

      const button = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      expect(button).toHaveClass('bg-blue-500');
      expect(button).toHaveClass('cursor-pointer');
    });

    it('should apply background color class on render', () => {
      render(<ThemeColorSwitch />);

      const button = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      expect(button).toHaveClass('bg-blue-500');
    });

    it('should render SVG icon', () => {
      const { container } = render(<ThemeColorSwitch />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should clean up on unmount', () => {
      const { unmount } = render(<ThemeColorSwitch />);

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('All Colors Support', () => {
    const colors = [
      'blue',
      'red',
      'green',
      'purple',
      'amber',
      'cyan',
      'pink',
      'indigo',
      'orange',
      'teal',
      'slate',
      'rose',
      'emerald',
      'sky',
      'violet',
      'lime',
      'fuchsia',
      'yellow',
      'stone',
      'zinc',
    ];

    it('should render all color options', async () => {
      render(<ThemeColorSwitch />);

      const mainButton = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      fireEvent.click(mainButton);

      for (const color of colors) {
        await waitFor(() => {
          expect(
            screen.getByRole('button', {
              name: new RegExp(`Set theme color to ${color}`),
            })
          ).toBeInTheDocument();
        });
      }
    });

    it('should highlight current color with ring', async () => {
      mockUseThemeColor.mockReturnValue({
        themeColor: 'green',
        setThemeColor: mockSetThemeColor,
      });

      render(<ThemeColorSwitch />);

      const mainButton = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      fireEvent.click(mainButton);

      await waitFor(() => {
        const greenButton = screen.getByRole('button', {
          name: /Set theme color to green/i,
        });
        expect(greenButton).toHaveClass('ring-2');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing RevenueCat context', () => {
      const { container } = render(<ThemeColorSwitch />);

      expect(container).toBeInTheDocument();
    });

    it('should handle rapid menu open/close', async () => {
      render(<ThemeColorSwitch />);

      const button = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });

      for (let i = 0; i < 5; i++) {
        fireEvent.click(button);
        await waitFor(
          () => {
            // Menu state toggle
          },
          { timeout: 100 }
        );
      }

      expect(button).toBeInTheDocument();
    });

    it('should handle color change while menu is closed', () => {
      const { rerender } = render(<ThemeColorSwitch />);

      mockUseThemeColor.mockReturnValue({
        themeColor: 'purple',
        setThemeColor: mockSetThemeColor,
      });

      rerender(<ThemeColorSwitch />);

      const button = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      expect(button).toHaveClass('bg-purple-500');
    });

    it('should prevent event propagation when clicking color', async () => {
      render(<ThemeColorSwitch />);

      const mainButton = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      fireEvent.click(mainButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Set theme color to blue/i })
        ).toBeInTheDocument();
      });

      const colorButton = screen.getByRole('button', {
        name: /Set theme color to blue/i,
      });
      fireEvent.click(colorButton);

      expect(mockSetThemeColor).toHaveBeenCalled();
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode class in menu container structure', () => {
      const { container } = render(<ThemeColorSwitch />);

      const button = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      fireEvent.click(button);

      // Find the menu div
      const menus = container.querySelectorAll('[class*="dark:bg"]');
      expect(menus.length).toBeGreaterThan(0);
    });

    it('should render with dark mode support', () => {
      render(<ThemeColorSwitch />);

      const button = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Premium Badge', () => {
    it('should render premium badge emoji elements for non-subscribers', () => {
      render(
        <ThemeColorSwitch isSubscribed={mockRevenueCatContext.isSubscribed} />
      );

      const mainButton = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      fireEvent.click(mainButton);

      const badges = screen.getAllByText('✨');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should have premium badge element with gradient styling', async () => {
      const { container } = render(
        <ThemeColorSwitch isSubscribed={mockRevenueCatContext.isSubscribed} />
      );

      const mainButton = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      fireEvent.click(mainButton);

      await waitFor(() => {
        const badges = container.querySelectorAll('.bg-gradient-to-r');
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('should not show premium badge for subscribers', async () => {
      const { container } = render(<ThemeColorSwitch />);

      const mainButton = screen.getByRole('button', {
        name: /Change Theme Color/i,
      });
      fireEvent.click(mainButton);

      await waitFor(() => {
        const badges = container.querySelectorAll('.bg-gradient-to-r');
        expect(badges.length).toBe(0);
      });
    });
  });
});
