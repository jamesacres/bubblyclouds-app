import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserPanel } from './UserPanel';
import type { UserProfile } from '@bubblyclouds-app/types/userProfile';

jest.mock('./UserAvatar', () => ({
  __esModule: true,
  UserAvatar: ({
    user,
    size,
    showRing,
  }: {
    user: UserProfile;
    size: number;
    showRing: boolean;
  }) => (
    <div data-testid="user-avatar" data-size={size} data-ring={showRing}>
      Avatar - {user.name}
    </div>
  ),
}));

jest.mock('./DeleteAccountDialog', () => ({
  __esModule: true,
  DeleteAccountDialog: ({
    isOpen,
    onClose,
    onConfirm,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
  }) => (
    <div
      data-testid="delete-account-dialog"
      data-open={isOpen}
      onClick={() => (isOpen ? onConfirm() : null)}
    >
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('lucide-react', () => ({
  __esModule: true,
  Plus: (props: any) => <div data-testid="plus-icon" {...props} />,
  LogOut: (props: any) => <div data-testid="logout-icon" {...props} />,
  X: (props: any) => <div data-testid="close-icon" {...props} />,
}));

const mockUserPanelProps = {
  gameName: 'Testapp',
  privacyUrl: 'https://example.com/privacy',
  termsUrl: 'https://example.com/terms',
  companyUrl: 'https://example.com',
  companyName: 'Bubbly Clouds',
};

describe('UserPanel', () => {
  const mockUser: UserProfile = {
    sub: 'test-user-id',
    name: 'John Doe',
    given_name: 'John',
    family_name: 'Doe',
    picture: 'https://example.com/avatar.jpg',
  };

  let mockLogout: jest.Mock;
  let mockOnClose: jest.Mock;
  let mockDeleteAccount: jest.Mock;
  let mockShowSubscribeModal: jest.Mock;

  beforeEach(() => {
    mockLogout = jest.fn();
    mockOnClose = jest.fn();
    mockDeleteAccount = jest.fn().mockResolvedValue(true);
    mockShowSubscribeModal = jest.fn();
  });

  describe('rendering', () => {
    it('should render user info', () => {
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
        />
      );
      expect(screen.getByText(/Hi, John!/)).toBeInTheDocument();
      expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
    });

    it('should fall back to "User" when the name is missing', () => {
      const nameless: UserProfile = { ...mockUser, name: undefined };
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={nameless}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
        />
      );
      expect(screen.getByText(/Hi, User!/)).toBeInTheDocument();
      expect(screen.getByText('User', { selector: 'p' })).toBeInTheDocument();
    });

    it('should render differently for mobile and desktop', () => {
      const { rerender } = render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={true}
        />
      );
      expect(screen.getByTestId('close-icon')).toBeInTheDocument();

      rerender(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
        />
      );
      expect(screen.queryByTestId('close-icon')).not.toBeInTheDocument();
    });
  });

  describe('subscription status', () => {
    it('should show "Join" button when not subscribed', () => {
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
          isSubscribed={false}
          showSubscribeModal={mockShowSubscribeModal}
        />
      );
      expect(screen.getByText(/Join Testapp Plus/)).toBeInTheDocument();
    });

    it('should show "Active" status when subscribed', () => {
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
          isSubscribed={true}
          showSubscribeModal={mockShowSubscribeModal}
        />
      );
      expect(screen.getByText(/Testapp Plus Active/)).toBeInTheDocument();
    });

    it('should call subscribe modal on click', () => {
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
          isSubscribed={false}
          showSubscribeModal={mockShowSubscribeModal}
        />
      );
      fireEvent.click(screen.getByText(/Join Testapp Plus/));
      expect(mockShowSubscribeModal).toHaveBeenCalled();
    });
  });

  describe('actions', () => {
    it('should call logout on sign out click', () => {
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
        />
      );
      fireEvent.click(screen.getByText(/Sign out/));
      expect(mockLogout).toHaveBeenCalled();
    });

    it('should open delete dialog on delete account click', async () => {
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
          deleteAccount={mockDeleteAccount}
        />
      );
      fireEvent.click(screen.getByText(/Delete account/));
      await waitFor(() => {
        expect(screen.getByTestId('delete-account-dialog')).toHaveAttribute(
          'data-open',
          'true'
        );
      });
    });

    it('should call deleteAccount and logout on dialog confirm', async () => {
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
          deleteAccount={mockDeleteAccount}
        />
      );
      fireEvent.click(screen.getByText(/Delete account/));
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('delete-account-dialog'));
      });
      await waitFor(() => {
        expect(mockDeleteAccount).toHaveBeenCalled();
        expect(mockLogout).toHaveBeenCalled();
      });
    });

    it('should alert and not call deleteAccount when deleteAccount prop is missing', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
        />
      );
      fireEvent.click(screen.getByText(/Delete account/));
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('delete-account-dialog'));
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Delete account functionality not available.'
        );
      });
      expect(mockLogout).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('should alert and not call logout when deleteAccount resolves false', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      const mockFailingDeleteAccount = jest.fn().mockResolvedValue(false);

      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
          deleteAccount={mockFailingDeleteAccount}
        />
      );
      fireEvent.click(screen.getByText(/Delete account/));
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('delete-account-dialog'));
      });

      await waitFor(() => {
        expect(mockFailingDeleteAccount).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith(
          'Failed to delete account. Please try again later.'
        );
      });
      expect(mockLogout).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('should close the delete dialog via its onClose callback', async () => {
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
          deleteAccount={mockDeleteAccount}
        />
      );
      fireEvent.click(screen.getByText(/Delete account/));
      await waitFor(() => {
        expect(screen.getByTestId('delete-account-dialog')).toHaveAttribute(
          'data-open',
          'true'
        );
      });

      fireEvent.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.getByTestId('delete-account-dialog')).toHaveAttribute(
          'data-open',
          'false'
        );
      });
    });

    it('should close the delete dialog via its onClose callback on mobile', async () => {
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={true}
          deleteAccount={mockDeleteAccount}
        />
      );
      fireEvent.click(screen.getByText(/Delete account/));
      await waitFor(() => {
        expect(screen.getByTestId('delete-account-dialog')).toHaveAttribute(
          'data-open',
          'true'
        );
      });

      fireEvent.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.getByTestId('delete-account-dialog')).toHaveAttribute(
          'data-open',
          'false'
        );
      });
    });

    it('should call showSubscribeModal from the "Join Plus" action button', () => {
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
          isSubscribed={false}
          showSubscribeModal={mockShowSubscribeModal}
        />
      );
      fireEvent.click(screen.getByText('Join Plus'));
      expect(mockShowSubscribeModal).toHaveBeenCalled();
    });

    it('should call showSubscribeModal from the mobile "Join Plus" action button', () => {
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={true}
          isSubscribed={false}
          showSubscribeModal={mockShowSubscribeModal}
        />
      );
      fireEvent.click(screen.getByText('Join Plus'));
      expect(mockShowSubscribeModal).toHaveBeenCalled();
    });

    it('should call showSubscribeModal from the mobile primary "Join X Plus" button', () => {
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={true}
          isSubscribed={false}
          showSubscribeModal={mockShowSubscribeModal}
        />
      );
      fireEvent.click(screen.getByText(/Join Testapp Plus/));
      expect(mockShowSubscribeModal).toHaveBeenCalled();
    });

    it('should render subscribed state on mobile without a "Join Plus" action button', () => {
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={true}
          isSubscribed={true}
          showSubscribeModal={mockShowSubscribeModal}
        />
      );
      expect(screen.getByText(/Testapp Plus Active/)).toBeInTheDocument();
      expect(screen.queryByText('Join Plus')).not.toBeInTheDocument();
    });

    it('should render neither primary action nor "Join Plus" when showSubscribeModal is absent and not subscribed', () => {
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
          isSubscribed={false}
        />
      );
      expect(screen.queryByText('Join Plus')).not.toBeInTheDocument();
      expect(screen.queryByText(/Testapp Plus/)).not.toBeInTheDocument();
    });

    it('should invoke the onSuccess callback passed to showSubscribeModal from the primary action', () => {
      const showSubscribeModalThatSucceeds = jest.fn((onSuccess: () => void) =>
        onSuccess()
      );
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
          isSubscribed={false}
          showSubscribeModal={showSubscribeModalThatSucceeds}
        />
      );
      expect(() =>
        fireEvent.click(screen.getByText(/Join Testapp Plus/))
      ).not.toThrow();
      expect(showSubscribeModalThatSucceeds).toHaveBeenCalled();
    });

    it('should invoke the onSuccess callback passed to showSubscribeModal from the "Join Plus" action button', () => {
      const showSubscribeModalThatSucceeds = jest.fn((onSuccess: () => void) =>
        onSuccess()
      );
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
          isSubscribed={false}
          showSubscribeModal={showSubscribeModalThatSucceeds}
        />
      );
      expect(() =>
        fireEvent.click(screen.getByText('Join Plus'))
      ).not.toThrow();
      expect(showSubscribeModalThatSucceeds).toHaveBeenCalled();
    });
  });

  describe('footer links', () => {
    it('should render internal Link elements for relative privacy/terms URLs and call onClose', () => {
      render(
        <UserPanel
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
          gameName="Testapp"
          privacyUrl="/privacy"
          termsUrl="/terms"
          creditsUrl="/credits"
          companyUrl="https://example.com"
          companyName="Bubbly Clouds"
        />
      );

      const privacyLink = screen.getByText('Privacy policy');
      const termsLink = screen.getByText('Terms of Service');
      const creditsLink = screen.getByText('Credits');

      expect(privacyLink).toHaveAttribute('href', '/privacy');
      expect(termsLink).toHaveAttribute('href', '/terms');
      expect(creditsLink).toHaveAttribute('href', '/credits');

      fireEvent.click(privacyLink);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should render external anchor elements for absolute privacy/terms URLs and omit credits when not provided', () => {
      render(
        <UserPanel
          {...mockUserPanelProps}
          user={mockUser}
          logout={mockLogout}
          onClose={mockOnClose}
          isMobile={false}
        />
      );

      const privacyLink = screen.getByText('Privacy policy');
      expect(privacyLink).toHaveAttribute('target', '_blank');
      expect(screen.queryByText('Credits')).not.toBeInTheDocument();
    });
  });
});
