import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { CopyButton } from './CopyButton';

// Mock Share with jest.fn() inside the factory
jest.mock('@capacitor/share', () => ({
  Share: {
    canShare: jest.fn(() => Promise.resolve({ value: false })),
    share: jest.fn(() => Promise.resolve()),
  },
}));

describe('CopyButton', () => {
  // Get references to the mocks
  const { Share } = require('@capacitor/share');

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementations to default values
    Share.canShare.mockResolvedValue({ value: false });
    Share.share.mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    });
  });

  describe('rendering', () => {
    it('should render button with copy icon and text', async () => {
      render(<CopyButton getText={() => 'test text'} appName="Sudoku Race" />);
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });

    it('should render with default styling', () => {
      render(<CopyButton getText={() => 'test'} appName="Sudoku Race" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-theme-primary');
      expect(button).toHaveClass('dark:text-theme-primary-light');
      expect(button).toHaveClass('rounded-full');
      expect(button).toHaveClass('bg-gray-100');
    });

    it('should render with extra small sizing when extraSmall prop is true', () => {
      render(
        <CopyButton
          getText={() => 'test'}
          extraSmall={true}
          appName="Sudoku Race"
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-2');
      expect(button).toHaveClass('py-1');
      expect(button).toHaveClass('text-xs');
    });

    it('should render with default sizing when extraSmall is false', () => {
      render(
        <CopyButton
          getText={() => 'test'}
          extraSmall={false}
          appName="Sudoku Race"
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2.5');
      expect(button).toHaveClass('text-sm');
    });

    it('should use custom className when provided', () => {
      const customClass = 'custom-test-class';
      render(
        <CopyButton
          getText={() => 'test'}
          className={customClass}
          appName="Sudoku Race"
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass(customClass);
    });
  });

  describe('copy functionality', () => {
    it('should copy text to clipboard when clicked', async () => {
      const getText = jest.fn(() => 'invite link');
      render(<CopyButton getText={getText} appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(getText).toHaveBeenCalled();
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          'invite link'
        );
      });
    });

    it('should handle promise-based getText function', async () => {
      const getText = jest.fn(() => Promise.resolve('async text'));
      render(<CopyButton getText={getText} appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          'async text'
        );
      });
    });

    it('should show "Copied to clipboard!" feedback after successful copy', async () => {
      render(<CopyButton getText={() => 'test'} appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Copied to clipboard!/i)).toBeInTheDocument();
      });
    });

    it('should hide "Copied" message after 5 seconds', async () => {
      jest.useFakeTimers();
      render(<CopyButton getText={() => 'test'} appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Copied to clipboard!/i)).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(
          screen.queryByText(/Copied to clipboard!/i)
        ).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('should handle errors gracefully during copy', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const clipboardError = new Error('Clipboard error');
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(
        clipboardError
      );

      render(<CopyButton getText={() => 'test'} appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to copy:',
          clipboardError
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should disable button during loading', async () => {
      const getText: jest.Mock<Promise<string>, []> = jest.fn(
        () => new Promise((resolve) => setTimeout(() => resolve('text'), 100))
      );
      render(<CopyButton getText={getText} appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    it('should enable button after operation completes', async () => {
      render(<CopyButton getText={() => 'test'} appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('share functionality', () => {
    it('should check if sharing is available on mount', async () => {
      const { Share } = require('@capacitor/share');
      render(<CopyButton getText={() => 'test'} appName="Sudoku Race" />);

      await waitFor(() => {
        expect(Share.canShare).toHaveBeenCalled();
      });
    });

    it('should call Share.share when canShare returns true', async () => {
      // Set canShare to return true BEFORE rendering the component
      Share.canShare.mockResolvedValue({ value: true });

      render(
        <CopyButton
          getText={() => 'test link'}
          partyName="Racing Team"
          appName="Sudoku Race"
        />
      );

      // Wait for the useEffect to complete and canShare state to be set
      await waitFor(() => {
        expect(screen.getByText(/Share Invite Link/i)).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(Share.share).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "You're invited to a Sudoku Race!",
            text: 'Join the Racing Team racing team',
            url: 'test link',
            dialogTitle: 'Share invite',
          })
        );
      });
    });

    it('should include party name in share text when provided', async () => {
      Share.canShare.mockResolvedValue({ value: true });

      render(
        <CopyButton
          getText={() => 'invite link'}
          partyName="Dragon Team"
          appName="Sudoku Race"
        />
      );

      // Wait for the useEffect to complete and canShare state to be set
      await waitFor(() => {
        expect(screen.getByText(/Share Invite Link/i)).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(Share.share).toHaveBeenCalledWith(
          expect.objectContaining({
            text: 'Join the Dragon Team racing team',
          })
        );
      });
    });

    it('should not include party name in share text when not provided', async () => {
      Share.canShare.mockResolvedValue({ value: true });

      render(
        <CopyButton getText={() => 'invite link'} appName="Sudoku Race" />
      );

      // Wait for the useEffect to complete and canShare state to be set
      await waitFor(() => {
        expect(screen.getByText(/Share Invite Link/i)).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(Share.share).toHaveBeenCalledWith(
          expect.objectContaining({
            text: 'Join the racing team',
          })
        );
      });
    });

    it('should handle canShare errors gracefully', async () => {
      const { Share } = require('@capacitor/share');
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      Share.canShare.mockRejectedValueOnce(new Error('Share check failed'));

      render(<CopyButton getText={() => 'test'} appName="Sudoku Race" />);

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      consoleWarnSpy.mockRestore();
    });

    it('should show copy icon on non-iOS when canShare is false', async () => {
      render(
        <CopyButton
          getText={() => 'test'}
          isIOS={() => false}
          appName="Sudoku Race"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Copy Invite Link/i)).toBeInTheDocument();
      });
    });

    it('should show loading spinner while copy is in progress', async () => {
      jest.useFakeTimers();
      const getText: jest.Mock<Promise<string>, []> = jest.fn(
        () => new Promise((resolve) => setTimeout(() => resolve('test'), 1000))
      );

      render(<CopyButton getText={getText} appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Spinner should be visible during loading
      await waitFor(() => {
        const svg = button.querySelector('svg');
        expect(svg?.className.baseVal).toContain('animate-spin');
      });

      jest.useRealTimers();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string from getText', async () => {
      render(<CopyButton getText={() => ''} appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
      });
    });

    it('should handle multiple rapid clicks', async () => {
      const getText = jest.fn(() => 'text');
      render(<CopyButton getText={getText} appName="Sudoku Race" />);

      const button = screen.getByRole('button');

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Button should still be disabled during the last operation
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('accessibility', () => {
    it('should be keyboard accessible', () => {
      render(<CopyButton getText={() => 'test'} appName="Sudoku Race" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have proper button role for screen readers', () => {
      render(<CopyButton getText={() => 'test'} appName="Sudoku Race" />);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });
  });
});
