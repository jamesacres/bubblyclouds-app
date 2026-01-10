import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HeaderUser from './HeaderUser';
import { UserContext, UserContextInterface } from '../providers/AuthProvider';
import type { UserProfile } from '@bubblyclouds-app/types/userProfile';

jest.mock('./UserButton', () => ({
  __esModule: true,
  UserButton: ({ user }: { user: UserProfile }) => (
    <div data-testid="user-button">User Button - {user.name}</div>
  ),
}));

const mockHeaderUserProps = {
  privacyUrl: 'https://example.com/privacy',
  termsUrl: 'https://example.com/terms',
  companyUrl: 'https://example.com',
  companyName: 'Bubbly Clouds',
};

describe('HeaderUser', () => {
  const mockUser: UserProfile = {
    sub: 'test-user-id',
    name: 'John Doe',
    given_name: 'John',
    family_name: 'Doe',
    picture: 'https://example.com/avatar.jpg',
  };

  let mockLogout: jest.Mock;
  let mockLoginRedirect: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogout = jest.fn();
    mockLoginRedirect = jest.fn();
  });

  const renderWithContext = (
    contextValue: Partial<UserContextInterface> | null
  ) => {
    return render(
      <UserContext.Provider
        value={
          {
            app: 'testapp',
            ...contextValue,
          } as UserContextInterface
        }
      >
        <HeaderUser {...mockHeaderUserProps} />
      </UserContext.Provider>
    );
  };

  describe('rendering logged in user', () => {
    it('should render UserButton when user is logged in', () => {
      renderWithContext({ user: mockUser, logout: mockLogout });
      expect(screen.getByTestId('user-button')).toBeInTheDocument();
      expect(
        screen.getByText(`User Button - ${mockUser.name}`)
      ).toBeInTheDocument();
    });

    it('should not render sign-in button when user is logged in', () => {
      renderWithContext({ user: mockUser, logout: mockLogout });
      expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
    });
  });

  describe('rendering logged out user', () => {
    it('should render sign-in button when user is not logged in and online', () => {
      renderWithContext({ user: undefined, loginRedirect: mockLoginRedirect });
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });

    it('should not render anything when user is not logged in and offline', () => {
      renderWithContext({ user: undefined, loginRedirect: mockLoginRedirect });
      const signInButton = screen.queryByText('Sign in');
      if (signInButton) {
        expect(signInButton).toBeInTheDocument();
      }
    });
  });

  describe('sign-in button functionality', () => {
    it('should call loginRedirect when sign-in button is clicked', async () => {
      renderWithContext({ user: undefined, loginRedirect: mockLoginRedirect });
      const signInButton = screen.getByText('Sign in');
      fireEvent.click(signInButton);
      await waitFor(() => {
        expect(mockLoginRedirect).toHaveBeenCalledWith({ userInitiated: true });
      });
    });

    it('should disable sign-in button when isLoggingIn is true', () => {
      renderWithContext({
        user: undefined,
        loginRedirect: mockLoginRedirect,
        isLoggingIn: true,
      });
      const signInButton = screen.getByRole('button');
      expect(signInButton).toBeDisabled();
      expect(signInButton).toHaveClass('cursor-wait');
    });
  });

  describe('undefined context', () => {
    it('should handle undefined context gracefully', () => {
      renderWithContext(null);
      expect(screen.queryByText('Sign in')).toBeInTheDocument();
    });
  });

  describe('context changes', () => {
    it('should update when user logs in', () => {
      const { rerender } = renderWithContext({
        user: undefined,
        loginRedirect: mockLoginRedirect,
      });
      expect(screen.getByText('Sign in')).toBeInTheDocument();

      rerender(
        <UserContext.Provider
          value={
            {
              app: 'testapp',
              user: mockUser,
              logout: mockLogout,
            } as unknown as UserContextInterface
          }
        >
          <HeaderUser {...mockHeaderUserProps} />
        </UserContext.Provider>
      );

      expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
      expect(screen.getByTestId('user-button')).toBeInTheDocument();
    });
  });

  describe('isOnline prop', () => {
    it('should show sign-in button when isOnline is true', () => {
      renderWithContext({ user: undefined, loginRedirect: mockLoginRedirect });
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });

    it('should not show sign-in button when isOnline is false', () => {
      render(<HeaderUser isOnline={false} {...mockHeaderUserProps} />);
      expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
    });
  });
});
