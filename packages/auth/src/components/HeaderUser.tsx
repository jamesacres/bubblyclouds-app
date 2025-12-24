'use client';

import React from 'react';
import { UserContext, UserContextInterface } from '../providers/AuthProvider';
import { UserButton } from './UserButton';

// Props for external dependencies
export interface HeaderUserDependencies {
  isOnline?: boolean;
  isSubscribed?: boolean;
  showSubscribeModal?: (onSuccess: () => void) => void;
  deleteAccount?: () => Promise<boolean>;
  privacyUrl: string;
  termsUrl: string;
  companyUrl: string;
}

const HeaderUser: React.FC<HeaderUserDependencies> = ({
  isOnline = true,
  isSubscribed = false,
  showSubscribeModal,
  deleteAccount,
  privacyUrl,
  termsUrl,
  companyUrl,
}) => {
  const { isLoggingIn, loginRedirect, logout, user, app } =
    (React.useContext(UserContext) as UserContextInterface | undefined) || {};

  return user && logout && app ? (
    <UserButton
      user={user}
      logout={logout}
      isSubscribed={isSubscribed}
      showSubscribeModal={showSubscribeModal}
      deleteAccount={deleteAccount}
      app={app}
      privacyUrl={privacyUrl}
      termsUrl={termsUrl}
      companyUrl={companyUrl}
    />
  ) : (
    isOnline && (
      <button
        disabled={isLoggingIn}
        onClick={() => loginRedirect && loginRedirect({ userInitiated: true })}
        className={`${isLoggingIn ? 'cursor-wait' : 'cursor-pointer'} bg-theme-primary disabled:bg-theme-primary-lighter mx-1 inline-block rounded-full px-4 py-1.5 text-sm font-medium text-white transition-opacity active:opacity-70`}
      >
        Sign in
      </button>
    )
  );
};

export default HeaderUser;
