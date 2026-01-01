import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HeaderOnline from './HeaderOnline';

// Mock react-feather icons
jest.mock('react-feather', () => ({
  Wifi: ({ className }: any) => (
    <div data-testid="wifi-icon" className={className} />
  ),
  WifiOff: ({ className }: any) => (
    <div data-testid="wifi-off-icon" className={className} />
  ),
}));

describe('HeaderOnline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('rendering when online', () => {
    it('should render button when online', () => {
      render(<HeaderOnline isOnline={true} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render WiFi icon when online', () => {
      render(<HeaderOnline isOnline={true} />);
      const wifiIcon = screen.getByTestId('wifi-icon');
      expect(wifiIcon).toBeInTheDocument();
    });

    it('should not render WiFi off icon when online', () => {
      render(<HeaderOnline isOnline={true} />);
      const wifiOffIcon = screen.queryByTestId('wifi-off-icon');
      expect(wifiOffIcon).not.toBeInTheDocument();
    });

    it('should have correct styling when online', () => {
      render(<HeaderOnline isOnline={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('cursor-pointer ml-1');
    });
  });

  describe('rendering when offline', () => {
    it('should render button when offline', () => {
      render(<HeaderOnline isOnline={false} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render WiFi off icon when offline', () => {
      render(<HeaderOnline isOnline={false} />);
      const wifiOffIcon = screen.getByTestId('wifi-off-icon');
      expect(wifiOffIcon).toBeInTheDocument();
    });

    it('should not render WiFi icon when offline', () => {
      render(<HeaderOnline isOnline={false} />);
      const wifiIcon = screen.queryByTestId('wifi-icon');
      expect(wifiIcon).not.toBeInTheDocument();
    });

    it('should have same styling when offline as when online', () => {
      render(<HeaderOnline isOnline={false} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('cursor-pointer ml-1');
    });
  });

  describe('button click behavior', () => {
    it('should show alert when button is clicked and online', async () => {
      const alertSpy = jest.spyOn(window, 'alert');

      render(<HeaderOnline isOnline={true} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(alertSpy).toHaveBeenCalledWith('You are online!');
    });

    it('should show alert when button is clicked and offline', async () => {
      const alertSpy = jest.spyOn(window, 'alert');

      render(<HeaderOnline isOnline={false} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(alertSpy).toHaveBeenCalledWith('You are offline!');
    });

    it('should call window.alert exactly once per click', async () => {
      const alertSpy = jest.spyOn(window, 'alert');

      render(<HeaderOnline isOnline={true} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      expect(alertSpy).toHaveBeenCalledTimes(1);

      fireEvent.click(button);
      expect(alertSpy).toHaveBeenCalledTimes(2);
    });

    it('should call alert with correct message on multiple clicks', async () => {
      const alertSpy = jest.spyOn(window, 'alert');

      render(<HeaderOnline isOnline={true} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      fireEvent.click(button);

      expect(alertSpy).toHaveBeenNthCalledWith(1, 'You are online!');
      expect(alertSpy).toHaveBeenNthCalledWith(2, 'You are online!');
    });
  });

  describe('state changes', () => {
    it('should update icon when online status changes', () => {
      const { rerender } = render(<HeaderOnline isOnline={true} />);

      expect(screen.getByTestId('wifi-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('wifi-off-icon')).not.toBeInTheDocument();

      rerender(<HeaderOnline isOnline={false} />);

      expect(screen.queryByTestId('wifi-icon')).not.toBeInTheDocument();
      expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
    });

    it('should update alert message when online status changes', async () => {
      const alertSpy = jest.spyOn(window, 'alert');
      const { rerender } = render(<HeaderOnline isOnline={true} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(alertSpy).toHaveBeenCalledWith('You are online!');

      rerender(<HeaderOnline isOnline={false} />);

      fireEvent.click(button);
      expect(alertSpy).toHaveBeenCalledWith('You are offline!');
    });
  });

  describe('button styling', () => {
    it('should have cursor-pointer class', () => {
      render(<HeaderOnline isOnline={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('cursor-pointer');
    });

    it('should have margin left class', () => {
      render(<HeaderOnline isOnline={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('ml-1');
    });

    it('should have correct size dimensions', () => {
      render(<HeaderOnline isOnline={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8 w-8');
    });

    it('should have padding on button', () => {
      render(<HeaderOnline isOnline={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('p-1.5');
    });

    it('should have transition effect', () => {
      render(<HeaderOnline isOnline={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-colors');
    });

    it('should have active state opacity', () => {
      render(<HeaderOnline isOnline={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('active:opacity-70');
    });
  });

  describe('accessibility', () => {
    it('should have button role', () => {
      render(<HeaderOnline isOnline={true} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should be clickable via keyboard', async () => {
      const alertSpy = jest.spyOn(window, 'alert');
      render(<HeaderOnline isOnline={true} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      expect(alertSpy).toHaveBeenCalledWith('You are online!');
    });
  });

  describe('rendering client component', () => {
    it('should render without crashing', () => {
      expect(() => render(<HeaderOnline isOnline={true} />)).not.toThrow();
    });

    it('should render button as first element', () => {
      const { container } = render(<HeaderOnline isOnline={true} />);
      const firstChild = container.firstChild;
      expect(firstChild).toHaveProperty('tagName', 'BUTTON');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid clicking', async () => {
      const alertSpy = jest.spyOn(window, 'alert');

      render(<HeaderOnline isOnline={true} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(alertSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle alert being called multiple times', async () => {
      const alertSpy = jest.spyOn(window, 'alert');

      render(<HeaderOnline isOnline={false} />);
      const button = screen.getByRole('button');

      for (let i = 0; i < 5; i++) {
        fireEvent.click(button);
      }

      expect(alertSpy).toHaveBeenCalledTimes(5);
      expect(alertSpy).toHaveBeenCalledWith('You are offline!');
    });

    it('should correctly identify online status in alert message', async () => {
      const alertSpy = jest.spyOn(window, 'alert');

      const { rerender } = render(<HeaderOnline isOnline={true} />);
      fireEvent.click(screen.getByRole('button'));
      expect(alertSpy).toHaveBeenLastCalledWith('You are online!');

      rerender(<HeaderOnline isOnline={false} />);
      fireEvent.click(screen.getByRole('button'));
      expect(alertSpy).toHaveBeenLastCalledWith('You are offline!');
    });
  });

  describe('conditional rendering', () => {
    it('should only render one icon at a time', () => {
      render(<HeaderOnline isOnline={true} />);

      const wifiIcons = screen.queryAllByTestId('wifi-icon');
      const wifiOffIcons = screen.queryAllByTestId('wifi-off-icon');

      expect(wifiIcons).toHaveLength(1);
      expect(wifiOffIcons).toHaveLength(0);
    });

    it('should not render both WiFi and WiFi off icons', () => {
      render(<HeaderOnline isOnline={false} />);

      const wifiIcon = screen.queryByTestId('wifi-icon');
      const wifiOffIcon = screen.queryByTestId('wifi-off-icon');

      expect(wifiIcon).not.toBeInTheDocument();
      expect(wifiOffIcon).toBeInTheDocument();
    });
  });

  describe('default props', () => {
    it('should default to online when no prop provided', () => {
      render(<HeaderOnline />);
      const wifiIcon = screen.getByTestId('wifi-icon');
      expect(wifiIcon).toBeInTheDocument();
    });

    it('should show online alert when no prop provided', () => {
      const alertSpy = jest.spyOn(window, 'alert');
      render(<HeaderOnline />);

      fireEvent.click(screen.getByRole('button'));
      expect(alertSpy).toHaveBeenCalledWith('You are online!');
    });
  });
});
