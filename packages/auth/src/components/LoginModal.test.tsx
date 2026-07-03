import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';
import { LoginModal } from './LoginModal';

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onGoogle: jest.fn(),
  onApple: jest.fn(),
  onEmail: jest.fn(),
  logoSrc: '/logo.png',
  appName: 'Test App',
  termsUrl: 'https://example.com/terms',
  privacyUrl: 'https://example.com/privacy',
};

describe('LoginModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<LoginModal {...defaultProps} />);
      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    });

    it('does not render sign-in content when isOpen is false', () => {
      render(<LoginModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Sign in with Google')).not.toBeInTheDocument();
    });
  });

  describe('branding', () => {
    it('renders logo with correct src and alt', () => {
      render(<LoginModal {...defaultProps} />);
      const logo = screen.getByAltText('Test App');
      expect(logo).toHaveAttribute('src', '/logo.png');
    });

    it('uses appName as logo alt text', () => {
      render(
        <LoginModal {...defaultProps} appName="My App" logoSrc="/my.png" />
      );
      expect(screen.getByAltText('My App')).toBeInTheDocument();
    });
  });

  describe('sign-in buttons', () => {
    it('calls onGoogle when Google button is clicked', () => {
      render(<LoginModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Sign in with Google'));
      expect(defaultProps.onGoogle).toHaveBeenCalledTimes(1);
    });

    it('calls onApple when Apple button is clicked', () => {
      render(<LoginModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Sign in with Apple'));
      expect(defaultProps.onApple).toHaveBeenCalledTimes(1);
    });

    it('disables Google, Apple and email submit buttons while isLoggingIn is true', () => {
      render(<LoginModal {...defaultProps} isLoggingIn={true} />);
      expect(
        screen.getByText('Sign in with Google').closest('button')
      ).toBeDisabled();
      expect(
        screen.getByText('Sign in with Apple').closest('button')
      ).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    });

    it('does not call onGoogle or onApple when disabled by isLoggingIn', () => {
      render(<LoginModal {...defaultProps} isLoggingIn={true} />);
      fireEvent.click(screen.getByText('Sign in with Google'));
      fireEvent.click(screen.getByText('Sign in with Apple'));
      expect(defaultProps.onGoogle).not.toHaveBeenCalled();
      expect(defaultProps.onApple).not.toHaveBeenCalled();
    });
  });

  describe('email sign-in', () => {
    it('renders email input and submit button', () => {
      render(<LoginModal {...defaultProps} />);
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Continue' })
      ).toBeInTheDocument();
    });

    it('calls onEmail with trimmed email when form is submitted', async () => {
      render(<LoginModal {...defaultProps} />);
      const input = screen.getByPlaceholderText('your@email.com');
      await userEvent.type(input, '  test@example.com  ');
      fireEvent.submit(input.closest('form')!);
      expect(defaultProps.onEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('does not call onEmail when email is empty or whitespace', async () => {
      render(<LoginModal {...defaultProps} />);
      const input = screen.getByPlaceholderText('your@email.com');
      await userEvent.type(input, '   ');
      fireEvent.submit(input.closest('form')!);
      expect(defaultProps.onEmail).not.toHaveBeenCalled();
    });

    it('calls onEmail when Continue button is clicked with valid email', async () => {
      render(<LoginModal {...defaultProps} />);
      const input = screen.getByPlaceholderText('your@email.com');
      await userEvent.type(input, 'user@test.com');
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      expect(defaultProps.onEmail).toHaveBeenCalledWith('user@test.com');
    });
  });

  describe('footer links', () => {
    it('calls onClose when Cancel is clicked', () => {
      render(<LoginModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('renders Terms of Service link with correct href', () => {
      render(<LoginModal {...defaultProps} />);
      const termsLink = screen.getByText('Terms of Service');
      expect(termsLink).toHaveAttribute('href', 'https://example.com/terms');
      expect(termsLink).toHaveAttribute('target', '_blank');
    });

    it('renders Privacy Policy link with correct href', () => {
      render(<LoginModal {...defaultProps} />);
      const privacyLink = screen.getByText('Privacy Policy');
      expect(privacyLink).toHaveAttribute(
        'href',
        'https://example.com/privacy'
      );
      expect(privacyLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('contextual messaging', () => {
    it('shows the default sign-in prompt when no context is given', () => {
      render(<LoginModal {...defaultProps} />);
      expect(screen.getByText('Sign in to continue')).toBeInTheDocument();
    });

    it('does not show value props when none are given', () => {
      render(<LoginModal {...defaultProps} />);
      expect(
        screen.queryByText(
          'Save your progress · Race friends · Track your stats'
        )
      ).not.toBeInTheDocument();
    });

    it('shows the value props when given', () => {
      render(
        <LoginModal
          {...defaultProps}
          valueProps={[
            'Save your progress',
            'Race friends',
            'Track your stats',
          ]}
        />
      );
      expect(
        screen.getByText('Save your progress · Race friends · Track your stats')
      ).toBeInTheDocument();
    });

    it('renders the matching contextual message when context and contextMessages are given', () => {
      render(
        <LoginModal
          {...defaultProps}
          context={LoginContext.DAILY_PUZZLE}
          contextMessages={{
            [LoginContext.DAILY_PUZZLE]: {
              textColor: 'text-violet-200',
              content: 'Sign in to start today’s puzzle',
            },
          }}
        />
      );
      expect(
        screen.getByText('Sign in to start today’s puzzle')
      ).toBeInTheDocument();
      expect(screen.queryByText('Sign in to continue')).not.toBeInTheDocument();
    });

    it('falls back to the default prompt when context has no matching message', () => {
      render(
        <LoginModal
          {...defaultProps}
          context={LoginContext.DAILY_PUZZLE}
          contextMessages={{}}
        />
      );
      expect(screen.getByText('Sign in to continue')).toBeInTheDocument();
    });
  });

  describe('email input state', () => {
    it('updates email state as user types', async () => {
      render(<LoginModal {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        'your@email.com'
      ) as HTMLInputElement;
      await userEvent.type(input, 'hello@world.com');
      expect(input.value).toBe('hello@world.com');
    });

    it('clears input by rerendering when closed and reopened', async () => {
      const { rerender } = render(<LoginModal {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        'your@email.com'
      ) as HTMLInputElement;
      await userEvent.type(input, 'hello@world.com');
      expect(input.value).toBe('hello@world.com');

      rerender(<LoginModal {...defaultProps} isOpen={false} />);
      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText('your@email.com')
        ).not.toBeInTheDocument();
      });
    });

    it('resets email state when reopened after being closed', async () => {
      const { rerender } = render(<LoginModal {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        'your@email.com'
      ) as HTMLInputElement;
      await userEvent.type(input, 'hello@world.com');
      expect(input.value).toBe('hello@world.com');

      rerender(<LoginModal {...defaultProps} isOpen={false} />);
      rerender(<LoginModal {...defaultProps} isOpen={true} />);

      await waitFor(() => {
        expect(
          (screen.getByPlaceholderText('your@email.com') as HTMLInputElement)
            .value
        ).toBe('');
      });
    });
  });
});
