import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserButton } from './UserButton';
import { UserProfile } from '../types/UserProfile';

jest.mock('./UserPanel', () => ({
  __esModule: true,
  UserPanel: ({
    user,
    logout: _logout,
    isMobile,
  }: {
    user: UserProfile;
    logout: () => void;
    isMobile: boolean;
  }) => (
    <div data-testid={isMobile ? 'mobile-user-panel' : 'user-panel'}>
      User Panel - {user.name}
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
  app: 'testapp',
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
  });
});
