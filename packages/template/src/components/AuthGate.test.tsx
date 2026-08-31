import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthGate from './AuthGate';

describe('AuthGate', () => {
  const defaultProps = {
    isInitialised: true,
    onSignInRequired: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading state while auth is still resolving, with no sign-in trigger', () => {
    render(<AuthGate {...defaultProps} isInitialised={false} />);

    expect(screen.getByTestId('auth-gate-loading')).toBeInTheDocument();
    expect(defaultProps.onSignInRequired).not.toHaveBeenCalled();
  });

  it('renders a blank gate with no loader once auth has resolved', () => {
    render(<AuthGate {...defaultProps} />);

    expect(screen.getByTestId('auth-gate')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-gate-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('auth-gate-primary')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('auto-triggers sign-in once auth resolves without a user', () => {
    const onSignInRequired = jest.fn();
    render(
      <AuthGate isInitialised={true} onSignInRequired={onSignInRequired} />
    );

    expect(onSignInRequired).toHaveBeenCalledTimes(1);
  });

  it('does not trigger sign-in while auth is still resolving', () => {
    const onSignInRequired = jest.fn();
    render(
      <AuthGate isInitialised={false} onSignInRequired={onSignInRequired} />
    );

    expect(onSignInRequired).not.toHaveBeenCalled();
  });

  it('does not re-trigger sign-in on re-render while still logged out', () => {
    const onSignInRequired = jest.fn();
    const { rerender } = render(
      <AuthGate isInitialised={true} onSignInRequired={onSignInRequired} />
    );

    expect(onSignInRequired).toHaveBeenCalledTimes(1);

    rerender(
      <AuthGate isInitialised={true} onSignInRequired={onSignInRequired} />
    );

    expect(onSignInRequired).toHaveBeenCalledTimes(1);
  });

  it('re-triggers sign-in if auth resolves again to logged-out after a loading phase', () => {
    const onSignInRequired = jest.fn();
    const { rerender } = render(
      <AuthGate isInitialised={true} onSignInRequired={onSignInRequired} />
    );

    expect(onSignInRequired).toHaveBeenCalledTimes(1);

    rerender(
      <AuthGate isInitialised={false} onSignInRequired={onSignInRequired} />
    );
    rerender(
      <AuthGate isInitialised={true} onSignInRequired={onSignInRequired} />
    );

    expect(onSignInRequired).toHaveBeenCalledTimes(2);
  });
});
