'use client';

import { UserProfile } from '../types/UserProfile';
import { useState } from 'react';
import { UserAvatar } from './UserAvatar';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { Plus, LogOut, X } from 'react-feather';

// Props for external dependencies
export interface UserPanelDependencies {
  deleteAccount?: () => Promise<boolean>;
  isSubscribed?: boolean;
  showSubscribeModal?: (onSuccess: () => void) => void;
}

interface UserPanelProps extends UserPanelDependencies {
  user: UserProfile;
  logout: () => void;
  onClose?: () => void;
  isMobile?: boolean;
  app: string;
}

export const UserPanel = ({
  user,
  logout,
  onClose,
  isMobile = false,
  deleteAccount,
  isSubscribed = false,
  showSubscribeModal,
  app,
}: UserPanelProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (!deleteAccount) {
      alert('Delete account functionality not available.');
      return;
    }

    const success = await deleteAccount();
    if (success) {
      logout();
    } else {
      alert('Failed to delete account. Please try again later.');
    }
  };

  // Shared user info component
  const UserInfo = ({
    size,
    showSubtitle = false,
  }: {
    size: number;
    showSubtitle?: boolean;
  }) => (
    <div className="flex flex-col items-center">
      <UserAvatar user={user} size={size} showRing={true} />
      <h2
        className={`${size > 70 ? 'mt-4 text-xl' : 'mt-3 text-lg'} font-medium`}
      >
        Hi, {user.name?.split(' ')[0] || 'User'}!
      </h2>
      {showSubtitle && (
        <p className="text-sm text-gray-400">{user.name || 'User'}</p>
      )}
    </div>
  );

  // Shared primary action component
  const PrimaryAction = () => (
    <>
      {isSubscribed ? (
        <div className="rounded-full border border-gray-600 bg-gray-700 px-6 py-3 text-center">
          <span className="inline-flex items-center text-sm font-medium">
            <span className="mr-2">✨</span>
            {app.charAt(0).toUpperCase() + app.slice(1)} Plus Active
            <span className="ml-2">✓</span>
          </span>
        </div>
      ) : (
        <button
          onClick={() => showSubscribeModal?.(() => {})}
          className="w-full cursor-pointer rounded-full border border-gray-600 bg-gray-700 px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-600"
        >
          Join {app.charAt(0).toUpperCase() + app.slice(1)} Plus
        </button>
      )}
    </>
  );

  // Shared action buttons component
  const ActionButtons = () => (
    <div
      className={`${isSubscribed ? 'flex justify-center' : 'grid grid-cols-2 gap-3'}`}
    >
      {!isSubscribed && (
        <button
          onClick={() => showSubscribeModal?.(() => {})}
          className="flex cursor-pointer items-center justify-center rounded-2xl bg-gray-700 px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-600"
        >
          <Plus size={16} className="mr-2" />
          Join Plus
        </button>
      )}
      <button
        onClick={() => logout()}
        className={`flex cursor-pointer items-center justify-center rounded-2xl bg-gray-700 px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-600 ${isSubscribed ? 'w-full max-w-xs' : ''}`}
      >
        <LogOut size={16} className="mr-2" />
        Sign out
      </button>
    </div>
  );

  // Shared footer links component
  const FooterLinks = () => (
    <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
      <a
        href="https://bubblyclouds.com/privacy"
        target="_blank"
        className="hover:text-white"
      >
        Privacy policy
      </a>
      <span>•</span>
      <a
        href="https://bubblyclouds.com/terms"
        target="_blank"
        className="hover:text-white"
      >
        Terms of Service
      </a>
    </div>
  );

  // Shared delete account button
  const DeleteAccountButton = () => (
    <button
      onClick={() => setIsDeleteDialogOpen(true)}
      className="w-full cursor-pointer text-center text-xs text-red-400 hover:text-red-300"
    >
      Delete account
    </button>
  );

  // Shared powered by component
  const PoweredBy = () => (
    <div className="border-t border-gray-700 px-6 py-3 text-center text-xs text-gray-500">
      Powered by{' '}
      <a
        href="https://bubblyclouds.com/"
        target="_blank"
        className="hover:text-gray-300"
      >
        Bubbly Clouds
      </a>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className="w-full max-w-sm rounded-3xl bg-gray-800 text-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="text-lg font-medium text-gray-300">Account</div>
            <button
              onClick={onClose}
              className="cursor-pointer text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4">
            <UserInfo size={80} />
          </div>

          {/* Primary action */}
          <div className="px-6 py-4">
            <PrimaryAction />
          </div>

          {/* Actions */}
          <div className="px-6 py-4">
            <ActionButtons />
          </div>

          {/* Footer */}
          <div className="px-6 py-4">
            <FooterLinks />
          </div>

          {/* Delete account */}
          <div className="px-6 pb-4">
            <DeleteAccountButton />
          </div>

          {/* Powered by footer */}
          <PoweredBy />
        </div>

        <DeleteAccountDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteAccount}
        />
      </>
    );
  }

  // Desktop version
  return (
    <>
      <div className="w-80 overflow-hidden rounded-2xl bg-gray-800 text-white shadow-2xl ring-1 ring-black/10">
        {/* User info */}
        <div className="px-6 py-6">
          <UserInfo size={64} showSubtitle={true} />
        </div>

        {/* Primary action */}
        <div className="px-6 py-2">
          <PrimaryAction />
        </div>

        {/* Actions */}
        <div className="px-6 py-4">
          <ActionButtons />
        </div>

        {/* Footer */}
        <div className="px-6 py-4">
          <FooterLinks />
        </div>

        {/* Delete account */}
        <div className="px-6 pb-4">
          <DeleteAccountButton />
        </div>

        {/* Powered by footer */}
        <PoweredBy />
      </div>

      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </>
  );
};
