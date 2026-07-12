import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserButton } from './UserButton';
import type { UserProfile } from '@bubblyclouds-app/types/userProfile';

jest.mock('./UserPanel', () => ({
  __esModule: true,
  UserPanel: ({
    user,
    logout: _logout,
    isMobile,
    onClose,
  }: {
    user: UserProfile;
    logout: () => void;
    isMobile: boolean;
    onClose?: () => void;
  }) => (
    <div data-testid={isMobile ? 'mobile-user-panel' : 'user-panel'}>
      User Panel - {user.name}
      {isMobile && onClose && (
        <button data-testid="mobile-close" onClick={onClose}>
          Close
        </button>
      )}
    </div>
  ),
}));

jest.mock('./UserAvatar', () => ({
  __esModule: true,
  UserAvatar: ({ user, size }: { user: UserProfile; size: number }) => (
    <div data-testid="user-avatar" data-size={size}>
      Avatar - {user.name}
    </div>
  ),
}));

const mockUserButtonProps = {
  gameName: 'Testapp',
  privacyUrl: 'https://example.com/privacy',
  termsUrl: 'https://example.com/terms',
  companyUrl: 'https://example.com',
  companyName: 'Bubbly Clouds',
};

describe('UserButton', () => {
  const mockUser: UserProfile = {
    sub: 'test-user-id',
    name: 'John Doe',
    given_name: 'John',
    family_name: 'Doe',
    picture: 'https://example.com/avatar.jpg',
  };

  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render UserAvatar', () => {
      render(
        <UserButton
          user={mockUser}
          logout={mockLogout}
          {...mockUserButtonProps}
        />
      );
      expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
      expect(screen.getByText(`Avatar - ${mockUser.name}`)).toBeInTheDocument();
    });

    it('should render desktop UserPanel (hidden by default)', () => {
      render(
        <UserButton
          user={mockUser}
          logout={mockLogout}
          {...mockUserButtonProps}
        />
      );
      expect(screen.queryByTestId('user-panel')).not.toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('should open desktop popover on click', () => {
      render(
        <UserButton
          user={mockUser}
          logout={mockLogout}
          {...mockUserButtonProps}
        />
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(screen.getByTestId('user-panel')).toBeInTheDocument();
    });

    it('should open mobile dialog on click on small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      render(
        <UserButton
          user={mockUser}
          logout={mockLogout}
          {...mockUserButtonProps}
        />
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByTestId('mobile-user-panel')).toBeInTheDocument();

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    it('should not open mobile dialog on click on large screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(
        <UserButton
          user={mockUser}
          logout={mockLogout}
          {...mockUserButtonProps}
        />
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.queryByTestId('mobile-user-panel')).not.toBeInTheDocument();
      expect(screen.getByTestId('user-panel')).toBeInTheDocument();
    });

    it('should close the mobile dialog when Escape is pressed', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      render(
        <UserButton
          user={mockUser}
          logout={mockLogout}
          {...mockUserButtonProps}
        />
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByTestId('mobile-user-panel')).toBeInTheDocument();

      fireEvent.keyDown(document.activeElement || document.body, {
        key: 'Escape',
        code: 'Escape',
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('mobile-user-panel')
        ).not.toBeInTheDocument();
      });

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    it('should close the mobile dialog when UserPanel invokes onClose', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      render(
        <UserButton
          user={mockUser}
          logout={mockLogout}
          {...mockUserButtonProps}
        />
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByTestId('mobile-user-panel')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('mobile-close'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('mobile-user-panel')
        ).not.toBeInTheDocument();
      });

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });
  });
});
