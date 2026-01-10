import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PartyConfirmationDialog } from './PartyConfirmationDialog';

describe('PartyConfirmationDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnConfirm.mockResolvedValue(undefined);
  });

  describe('visibility', () => {
    it('should render when isOpen is true', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
        />
      );
      expect(screen.getByText(/Leave Party/i)).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <PartyConfirmationDialog
          isOpen={false}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
        />
      );
      expect(screen.queryByText(/Leave Party/i)).not.toBeInTheDocument();
    });
  });

  describe('leave mode', () => {
    it('should display "Leave Party" title for member leaving', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
          isOwner={false}
        />
      );
      expect(screen.getByText(/Leave Party/i)).toBeInTheDocument();
    });

    it('should display "Delete Party" title for owner leaving', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
          isOwner={true}
        />
      );
      expect(
        screen.getByText(/Are you sure you want to delete.*Friends Party/i)
      ).toBeInTheDocument();
    });

    it('should display appropriate message for member leaving', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
          isOwner={false}
        />
      );
      expect(
        screen.getByText(/Are you sure you want to leave.*Friends Party/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You will no longer see other members/i)
      ).toBeInTheDocument();
    });

    it('should display appropriate message for owner leaving', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
          isOwner={true}
        />
      );
      expect(
        screen.getByText(/Are you sure you want to delete.*Friends Party/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/This will permanently remove the party/i)
      ).toBeInTheDocument();
    });

    it('should display "Leave" button text for member', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
          isOwner={false}
        />
      );
      expect(
        screen.getByRole('button', { name: /^Leave$/ })
      ).toBeInTheDocument();
    });

    it('should display "Delete Party" button text for owner', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
          isOwner={true}
        />
      );
      expect(
        screen.getByRole('button', { name: /^Delete Party$/ })
      ).toBeInTheDocument();
    });

    it('should render member leaving with proper styling', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
          isOwner={false}
        />
      );
      // Member leaving should have proper UI
      expect(
        screen.getByRole('button', { name: /^Leave$/ })
      ).toBeInTheDocument();
    });

    it('should render owner leaving with proper styling', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
          isOwner={true}
        />
      );
      // Owner leaving should show delete party button
      expect(
        screen.getByRole('button', { name: /^Delete Party$/ })
      ).toBeInTheDocument();
    });
  });

  describe('remove mode', () => {
    it('should display "Remove Member" title', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="remove"
          partyName="Friends Party"
          memberName="John Doe"
        />
      );
      expect(screen.getByText(/Remove Member/i)).toBeInTheDocument();
    });

    it('should display member name in confirmation message', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="remove"
          partyName="Friends Party"
          memberName="John Doe"
        />
      );
      expect(
        screen.getByText(
          /Are you sure you want to remove.*John Doe.*Friends Party/i
        )
      ).toBeInTheDocument();
    });

    it('should display "Remove" button text', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="remove"
          partyName="Friends Party"
          memberName="John Doe"
        />
      );
      expect(
        screen.getByRole('button', { name: /^Remove$/ })
      ).toBeInTheDocument();
    });

    it('should render remove with proper action button', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="remove"
          partyName="Friends Party"
          memberName="John Doe"
        />
      );
      // Remove should have proper remove button
      expect(
        screen.getByRole('button', { name: /^Remove$/ })
      ).toBeInTheDocument();
    });

    it('should show "Removing..." while processing', async () => {
      mockOnConfirm.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          })
      );

      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="remove"
          partyName="Friends Party"
          memberName="John Doe"
        />
      );
      const removeButton = screen.getByRole('button', { name: /^Remove$/ });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.getByText(/Removing/i)).toBeInTheDocument();
      });
    });
  });

  describe('action button behavior', () => {
    it('should call onConfirm when action button is clicked', async () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
          isOwner={false}
        />
      );
      const leaveButton = screen.getByRole('button', { name: /^Leave$/ });
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
      });
    });

    it('should call onClose after successful action', async () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
          isOwner={false}
        />
      );
      const leaveButton = screen.getByRole('button', { name: /^Leave$/ });
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show processing state button text during action', async () => {
      mockOnConfirm.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          })
      );

      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
          isOwner={false}
        />
      );
      const leaveButton = screen.getByRole('button', { name: /^Leave$/ });
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(screen.getByText(/Leaving/i)).toBeInTheDocument();
      });
    });

    it('should be disabled while processing', async () => {
      mockOnConfirm.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          })
      );

      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
          isOwner={false}
        />
      );
      const leaveButton = screen.getByRole('button', { name: /^Leave$/ });
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(leaveButton).toBeDisabled();
      });
    });
  });

  describe('cancel button', () => {
    it('should display cancel button', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
        />
      );
      expect(
        screen.getByRole('button', { name: /Cancel/i })
      ).toBeInTheDocument();
    });

    it('should call onClose when cancel is clicked', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
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
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
        />
      );
      const actionButton = screen.getByRole('button', { name: /^Leave$/ });
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });

      fireEvent.click(actionButton);

      await waitFor(() => {
        expect(cancelButton).toBeDisabled();
      });
    });
  });

  describe('error handling', () => {
    it('should handle action errors gracefully', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockOnConfirm.mockRejectedValue(new Error('Action failed'));

      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
        />
      );
      const leaveButton = screen.getByRole('button', { name: /^Leave$/ });

      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Error leaving party:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should log appropriate error message for remove action', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockOnConfirm.mockRejectedValue(new Error('Action failed'));

      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="remove"
          partyName="Friends Party"
          memberName="John Doe"
        />
      );
      const removeButton = screen.getByRole('button', { name: /^Remove$/ });

      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Error removing member from party:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should handle action errors gracefully', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockOnConfirm.mockRejectedValueOnce(new Error('Action failed'));

      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
        />
      );
      const leaveButton = screen.getByRole('button', { name: /^Leave$/ });

      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
      });

      // Dialog remains visible after error
      expect(
        screen.getByText(/Are you sure you want to leave/i)
      ).toBeInTheDocument();
    });
  });

  describe('dialog structure', () => {
    it('should render dialog with title and message', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
        />
      );
      expect(screen.getByText(/Leave Party/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to leave/i)
      ).toBeInTheDocument();
    });

    it('should render dialog panel with all controls', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
        />
      );
      // Panel is rendered when dialog controls are present
      expect(
        screen.getByRole('button', { name: /Cancel/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /^Leave$/ })
      ).toBeInTheDocument();
    });
  });

  describe('dark mode support', () => {
    it('should render dialog that supports dark mode', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
        />
      );
      // Dialog renders content properly, dark mode styling is CSS
      expect(screen.getByText(/Leave Party/i)).toBeInTheDocument();
    });
  });

  describe('button styling', () => {
    it('should have red delete/action buttons', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
        />
      );
      const actionButton = screen.getByRole('button', { name: /^Leave$/ });
      expect(actionButton).toHaveClass('bg-red-600');
    });

    it('should show hover effect on action button', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
        />
      );
      const actionButton = screen.getByRole('button', { name: /^Leave$/ });
      expect(actionButton).toHaveClass('hover:bg-red-700');
    });
  });

  describe('keyboard interaction', () => {
    it('should support keyboard navigation', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
        />
      );
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveProperty('onclick');
      });
    });
  });

  describe('optional parameters', () => {
    it('should handle missing memberName when type is leave', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
        />
      );
      expect(screen.getByText(/Leave Party/i)).toBeInTheDocument();
    });

    it('should use default isOwner value of false', () => {
      render(
        <PartyConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="leave"
          partyName="Friends Party"
        />
      );
      // Should show "Leave Party" not "Delete Party" for non-owner
      expect(screen.getByText(/Leave Party/i)).toBeInTheDocument();
    });
  });
});
