'use client';

import React from 'react';
import { UserContext } from '../providers/AuthProvider';
import { UserButton } from './UserButton';

export interface HeaderUserDependencies {
  isOnline?: boolean;
  isSubscribed?: boolean;
  subscriptionManagementUrl?: string;
  showSubscribeModal?: (onSuccess: () => void) => void;
  deleteAccount?: () => Promise<boolean>;
  privacyUrl: string;
  termsUrl: string;
  creditsUrl?: string;
  companyUrl: string;
  companyName: string;
}

const HeaderUser: React.FC<HeaderUserDependencies> = ({
  isOnline = true,
  isSubscribed = false,
  subscriptionManagementUrl,
  showSubscribeModal,
  deleteAccount,
  privacyUrl,
  termsUrl,
  creditsUrl,
  companyUrl,
  companyName,
}) => {
  const { isLoggingIn, logout, user, app, showLoginModal } =
    React.useContext(UserContext) || {};

  return user && logout && app ? (
    <UserButton
      user={user}
      logout={logout}
      isSubscribed={isSubscribed}
      subscriptionManagementUrl={subscriptionManagementUrl}
      showSubscribeModal={showSubscribeModal}
      deleteAccount={deleteAccount}
      app={app}
      privacyUrl={privacyUrl}
      termsUrl={termsUrl}
      creditsUrl={creditsUrl}
      companyUrl={companyUrl}
      companyName={companyName}
    />
  ) : (
    isOnline && (
      <button
        disabled={isLoggingIn}
        onClick={() => showLoginModal?.()}
        className={`${isLoggingIn ? 'cursor-wait' : 'cursor-pointer'} bg-theme-primary disabled:bg-theme-primary-lighter mx-1 inline-block rounded-full px-4 py-1.5 text-sm font-medium text-white transition-opacity active:opacity-70`}
      >
        Sign in
      </button>
    )
  );
};

export default HeaderUser;
