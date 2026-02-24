import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HeaderOnline from './HeaderOnline';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  WifiOff: ({ className }: any) => (
    <div data-testid="wifi-off-icon" className={className} />
  ),
}));

describe('HeaderOnline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering when online', () => {
    it('should render nothing when online', () => {
      const { container } = render(<HeaderOnline isOnline={true} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render any button when online', () => {
      render(<HeaderOnline isOnline={true} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
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
  });

  describe('button click behavior', () => {
    it('should not call window.alert when offline button is clicked', async () => {
      const alertSpy = jest.spyOn(window, 'alert');

      render(<HeaderOnline isOnline={false} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(alertSpy).not.toHaveBeenCalled();
    });
  });

  describe('state changes', () => {
    it('should show offline icon when transitioning from online to offline', () => {
      const { rerender } = render(<HeaderOnline isOnline={true} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();

      rerender(<HeaderOnline isOnline={false} />);

      expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
    });

    it('should hide when transitioning from offline to online', () => {
      const { rerender } = render(<HeaderOnline isOnline={false} />);

      expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();

      rerender(<HeaderOnline isOnline={true} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('button styling', () => {
    it('should have correct touch target size when offline', () => {
      render(<HeaderOnline isOnline={false} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11 w-11');
    });

    it('should have transition effect when offline', () => {
      render(<HeaderOnline isOnline={false} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all');
    });
  });

  describe('accessibility', () => {
    it('should have aria-label Offline when offline', () => {
      render(<HeaderOnline isOnline={false} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Offline');
    });
  });

  describe('rendering client component', () => {
    it('should render without crashing when online', () => {
      expect(() => render(<HeaderOnline isOnline={true} />)).not.toThrow();
    });

    it('should render without crashing when offline', () => {
      expect(() => render(<HeaderOnline isOnline={false} />)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid clicking without errors when offline', async () => {
      render(<HeaderOnline isOnline={false} />);
      const button = screen.getByRole('button');

      expect(() => {
        fireEvent.click(button);
        fireEvent.click(button);
        fireEvent.click(button);
      }).not.toThrow();
    });
  });

  describe('default props', () => {
    it('should default to online and render nothing', () => {
      const { container } = render(<HeaderOnline />);
      expect(container.firstChild).toBeNull();
    });
  });
});
