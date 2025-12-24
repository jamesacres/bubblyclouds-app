import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserPanel } from './UserPanel';
import { UserProfile } from '../types/UserProfile';

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

jest.mock('react-feather', () => ({
  __esModule: true,
  Plus: (props: any) => <div data-testid="plus-icon" {...props} />,
  LogOut: (props: any) => <div data-testid="logout-icon" {...props} />,
  X: (props: any) => <div data-testid="close-icon" {...props} />,
}));

const mockUserPanelProps = {
  app: 'testapp',
  privacyUrl: 'https://example.com/privacy',
  termsUrl: 'https://example.com/terms',
  companyUrl: 'https://example.com',
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
  });
});
