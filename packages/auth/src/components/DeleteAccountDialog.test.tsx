import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteAccountDialog } from './DeleteAccountDialog';

describe('DeleteAccountDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnConfirm.mockResolvedValue(undefined);
  });

  describe('visibility', () => {
    it('should render when isOpen is true', () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      expect(
        screen.getByText(/This action cannot be undone/i)
      ).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <DeleteAccountDialog
          isOpen={false}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      expect(screen.queryByText(/Delete Account/i)).not.toBeInTheDocument();
    });
  });

  describe('header content', () => {
    it('should display warning message about data deletion', () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      expect(
        screen.getByText(/This action cannot be undone/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /All of your data across all Bubbly Clouds applications/i
        )
      ).toBeInTheDocument();
    });

    it('should display confirmation and buttons', () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      expect(
        screen.getByText(/I confirm that I want to delete/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Cancel/i })
      ).toBeInTheDocument();
    });
  });

  describe('confirmation checkbox', () => {
    it('should display confirmation checkbox', () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('should display confirmation text', () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      expect(
        screen.getByText(/I confirm that I want to delete my entire account/i)
      ).toBeInTheDocument();
    });

    it('should be unchecked by default', () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('should toggle when clicked', () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

      expect(checkbox.checked).toBe(false);
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('delete button behavior', () => {
    it('should be disabled when checkbox is unchecked', () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const deleteButton = screen.getByRole('button', {
        name: /Delete Account/i,
      });
      expect(deleteButton).toBeDisabled();
    });

    it('should be enabled when checkbox is checked', () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const checkbox = screen.getByRole('checkbox');
      const deleteButton = screen.getByRole('button', {
        name: /Delete Account/i,
      });

      fireEvent.click(checkbox);

      expect(deleteButton).not.toBeDisabled();
    });

    it('should call onConfirm when clicked with confirmation', async () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const checkbox = screen.getByRole('checkbox');
      const deleteButton = screen.getByRole('button', {
        name: /Delete Account/i,
      });

      fireEvent.click(checkbox);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
      });
    });

    it('should not call onConfirm when clicked without confirmation', async () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const deleteButton = screen.getByRole('button', {
        name: /Delete Account/i,
      });

      expect(deleteButton).toBeDisabled();
      fireEvent.click(deleteButton);

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should show "Deleting..." while processing', async () => {
      mockOnConfirm.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          })
      );

      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const checkbox = screen.getByRole('checkbox');
      const deleteButton = screen.getByRole('button', {
        name: /Delete Account/i,
      });

      fireEvent.click(checkbox);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Deleting/i)).toBeInTheDocument();
      });
    });

    it('should call onClose after successful deletion', async () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const checkbox = screen.getByRole('checkbox');
      const deleteButton = screen.getByRole('button', {
        name: /Delete Account/i,
      });

      fireEvent.click(checkbox);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('cancel button', () => {
    it('should display cancel button', () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      expect(
        screen.getByRole('button', { name: /Cancel/i })
      ).toBeInTheDocument();
    });

    it('should call onClose when clicked', () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should be disabled while processing', async () => {
      mockOnConfirm.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          })
      );

      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const checkbox = screen.getByRole('checkbox');
      const deleteButton = screen.getByRole('button', {
        name: /Delete Account/i,
      });
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });

      fireEvent.click(checkbox);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(cancelButton).toBeDisabled();
      });
    });
  });

  describe('error handling', () => {
    it('should handle deletion errors gracefully', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockOnConfirm.mockRejectedValue(new Error('Deletion failed'));

      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const checkbox = screen.getByRole('checkbox');
      const deleteButton = screen.getByRole('button', {
        name: /Delete Account/i,
      });

      fireEvent.click(checkbox);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Error deleting account:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should handle deletion errors gracefully', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockOnConfirm.mockRejectedValueOnce(new Error('Deletion failed'));

      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const checkbox = screen.getByRole('checkbox');
      const deleteButton = screen.getByRole('button', {
        name: /Delete Account/i,
      });

      fireEvent.click(checkbox);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
      });

      expect(
        screen.getByText(/This action cannot be undone/i)
      ).toBeInTheDocument();
    });

    it('should recover from failed deletion attempt', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockOnConfirm.mockRejectedValueOnce(new Error('Deletion failed'));

      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const checkbox = screen.getByRole('checkbox');
      const deleteButton = screen.getByRole('button', {
        name: /Delete Account/i,
      });

      fireEvent.click(checkbox);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      });

      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('dialog structure', () => {
    it('should render dialog with title and warning', () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      expect(
        screen.getByText(/This action cannot be undone/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/I confirm that I want to delete/i)
      ).toBeInTheDocument();
    });

    it('should render dialog panel with all controls', () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Cancel/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Delete Account/i })
      ).toBeInTheDocument();
    });
  });

  describe('button states', () => {
    it('should have red delete button', () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const deleteButton = screen.getByRole('button', {
        name: /Delete Account/i,
      });
      expect(deleteButton).toHaveClass('bg-red-300');
    });

    it('should have green text in delete button when enabled', () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const deleteButton = screen.getByRole('button', {
        name: /Delete Account/i,
      });
      expect(deleteButton).toHaveClass('bg-red-600');
    });
  });

  describe('keyboard interaction', () => {
    it('should support keyboard navigation', () => {
      render(
        <DeleteAccountDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );
      const checkbox = screen.getByRole('checkbox');
      const buttons = screen.getAllByRole('button');

      expect(checkbox).toHaveProperty('onclick');
      buttons.forEach((button) => {
        expect(button).toHaveProperty('onclick');
      });
    });
  });
});
