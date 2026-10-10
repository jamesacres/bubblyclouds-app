'use client';

import type { UserProfile } from '@bubblyclouds-app/types/userProfile';
import { useState } from 'react';
import { UserAvatar } from './UserAvatar';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { Plus, LogOut, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import LanguageSelect from '@bubblyclouds-app/ui/components/LanguageSelect';

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
  gameName: string;
  privacyUrl: string;
  termsUrl: string;
  creditsUrl?: string;
  companyUrl: string;
  companyName: string;
  subscriptionManagementUrl?: string;
}

const COMPANY_PLACEHOLDER = '\u0000';

const UserInfo = ({
  user,
  size,
  showSubtitle = false,
}: {
  user: UserProfile;
  size: number;
  showSubtitle?: boolean;
}) => {
  const { t } = useTranslation('auth');
  const fallbackName = t('panel.fallbackName');
  return (
    <div className="flex flex-col items-center">
      <UserAvatar user={user} size={size} showRing={true} />
      <h2
        className={`${size > 70 ? 'mt-4 text-xl' : 'mt-3 text-lg'} break-words text-center font-medium`}
      >
        {t('panel.greeting', {
          name: user.name?.split(' ')[0] || fallbackName,
        })}
      </h2>
      {showSubtitle && (
        <p dir="auto" className="break-words text-center text-sm text-gray-400">
          {user.name || fallbackName}
        </p>
      )}
    </div>
  );
};

// Shared primary action component
const PrimaryAction = ({
  isSubscribed,
  subscriptionManagementUrl,
  showSubscribeModal,
  gameName,
}: {
  isSubscribed: boolean;
  subscriptionManagementUrl?: string;
  showSubscribeModal?: (onSuccess: () => void) => void;
  gameName: string;
}) => {
  const { t } = useTranslation('auth');
  return (
    <div className="flex justify-center">
      {isSubscribed ? (
        <a
          href={subscriptionManagementUrl}
          target="_blank"
          className="w-full rounded-full border border-gray-600 bg-gray-700 px-6 py-3 text-center"
        >
          <span className="inline-flex items-center text-sm font-medium">
            <span className="me-2">✨</span>
            {t('panel.plusActive', { gameName, plus: t('brand.plus') })}
            <span className="ms-2">✓</span>
          </span>
        </a>
      ) : showSubscribeModal ? (
        <button
          onClick={() => showSubscribeModal?.(() => {})}
          className="w-full cursor-pointer rounded-full border border-gray-600 bg-gray-700 px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-600"
        >
          {t('panel.joinGamePlus', { gameName, plus: t('brand.plus') })}
        </button>
      ) : (
        <></>
      )}
    </div>
  );
};

// Shared action buttons component
const ActionButtons = ({
  isSubscribed,
  showSubscribeModal,
  logout,
}: {
  isSubscribed: boolean;
  showSubscribeModal?: (onSuccess: () => void) => void;
  logout: () => void;
}) => {
  const { t } = useTranslation('auth');
  return (
    <div
      className={`${isSubscribed ? 'flex justify-center' : 'grid grid-cols-2 gap-3'}`}
    >
      {!isSubscribed && showSubscribeModal && (
        <button
          onClick={() => showSubscribeModal?.(() => {})}
          className="flex cursor-pointer items-center justify-center rounded-2xl bg-gray-700 px-4 py-3 text-center text-sm font-medium transition-colors hover:bg-gray-600"
        >
          <Plus size={16} className="me-2 shrink-0" />
          {t('panel.joinPlus', { plus: t('brand.plus') })}
        </button>
      )}
      <button
        onClick={() => logout()}
        className={`flex cursor-pointer items-center justify-center rounded-2xl bg-gray-700 px-4 py-3 text-center text-sm font-medium transition-colors hover:bg-gray-600 ${isSubscribed ? 'w-full max-w-xs' : ''}`}
      >
        <LogOut size={16} className="me-2 shrink-0" />
        {t('panel.signOut')}
      </button>
    </div>
  );
};

// Shared footer links component
const FooterLinks = ({
  privacyUrl,
  termsUrl,
  creditsUrl,
  onClose,
}: {
  privacyUrl: string;
  termsUrl: string;
  creditsUrl?: string;
  onClose?: () => void;
}) => {
  const { t } = useTranslation('auth');
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-gray-400">
      {privacyUrl.startsWith('http') ? (
        <a href={privacyUrl} target="_blank" className="hover:text-white">
          {t('panel.privacy')}
        </a>
      ) : (
        <Link href={privacyUrl} onClick={onClose} className="hover:text-white">
          {t('panel.privacy')}
        </Link>
      )}
      <span>•</span>
      {termsUrl.startsWith('http') ? (
        <a href={termsUrl} target="_blank" className="hover:text-white">
          {t('panel.terms')}
        </a>
      ) : (
        <Link href={termsUrl} onClick={onClose} className="hover:text-white">
          {t('panel.terms')}
        </Link>
      )}
      {creditsUrl && (
        <>
          <span>•</span>
          <Link
            href={creditsUrl}
            onClick={onClose}
            className="hover:text-white"
          >
            {t('panel.credits')}
          </Link>
        </>
      )}
    </div>
  );
};

// Shared delete account button
const DeleteAccountButton = ({
  setIsDeleteDialogOpen,
}: {
  setIsDeleteDialogOpen: (open: boolean) => void;
}) => {
  const { t } = useTranslation('auth');
  return (
    <button
      onClick={() => setIsDeleteDialogOpen(true)}
      className="w-full cursor-pointer text-center text-xs text-red-400 hover:text-red-300"
    >
      {t('panel.deleteAccount')}
    </button>
  );
};

// Shared powered by component
const PoweredBy = ({
  companyUrl,
  companyName,
}: {
  companyUrl: string;
  companyName: string;
}) => {
  const { t } = useTranslation('auth');
  const [before, after] = t('panel.poweredBy', {
    companyName: COMPANY_PLACEHOLDER,
  }).split(COMPANY_PLACEHOLDER);
  return (
    <div className="border-t border-gray-700 px-6 py-3 text-center text-xs text-gray-500">
      {before}
      <a href={companyUrl} target="_blank" className="hover:text-gray-300">
        {companyName}
      </a>
      {after}
    </div>
  );
};

const LanguageSection = () => (
  <div className="px-6 pb-4 text-gray-300 empty:hidden">
    <LanguageSelect className="flex flex-col gap-1 text-sm" />
  </div>
);

export const UserPanel = ({
  user,
  logout,
  onClose,
  isMobile = false,
  deleteAccount,
  isSubscribed = false,
  showSubscribeModal,
  gameName,
  privacyUrl,
  termsUrl,
  creditsUrl,
  companyUrl,
  subscriptionManagementUrl,
  companyName,
}: UserPanelProps) => {
  const { t } = useTranslation('auth');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (!deleteAccount) {
      alert(t('panel.deleteUnavailable'));
      return;
    }

    const success = await deleteAccount();
    if (success) {
      logout();
    } else {
      alert(t('panel.deleteFailed'));
    }
  };

  if (isMobile) {
    return (
      <>
        <div className="w-full max-w-sm rounded-3xl bg-gray-800 text-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="text-lg font-medium text-gray-300">
              {t('panel.title')}
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4">
            <UserInfo user={user} size={80} />
          </div>

          {/* Primary action */}
          <div className="px-6 py-4">
            <PrimaryAction
              isSubscribed={isSubscribed}
              subscriptionManagementUrl={subscriptionManagementUrl}
              showSubscribeModal={showSubscribeModal}
              gameName={gameName}
            />
          </div>

          {/* Actions */}
          <div className="px-6 py-4">
            <ActionButtons
              isSubscribed={isSubscribed}
              showSubscribeModal={showSubscribeModal}
              logout={logout}
            />
          </div>

          <LanguageSection />

          {/* Footer */}
          <div className="px-6 py-4">
            <FooterLinks
              privacyUrl={privacyUrl}
              termsUrl={termsUrl}
              creditsUrl={creditsUrl}
              onClose={onClose}
            />
          </div>

          {/* Delete account */}
          <div className="px-6 pb-4">
            <DeleteAccountButton
              setIsDeleteDialogOpen={setIsDeleteDialogOpen}
            />
          </div>

          {/* Powered by footer */}
          <PoweredBy companyUrl={companyUrl} companyName={companyName} />
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
          <UserInfo user={user} size={64} showSubtitle={true} />
        </div>

        {/* Primary action */}
        <div className="px-6 py-2">
          <PrimaryAction
            isSubscribed={isSubscribed}
            showSubscribeModal={showSubscribeModal}
            gameName={gameName}
          />
        </div>

        {/* Actions */}
        <div className="px-6 py-4">
          <ActionButtons
            isSubscribed={isSubscribed}
            showSubscribeModal={showSubscribeModal}
            logout={logout}
          />
        </div>

        <LanguageSection />

        {/* Footer */}
        <div className="px-6 py-4">
          <FooterLinks
            privacyUrl={privacyUrl}
            termsUrl={termsUrl}
            creditsUrl={creditsUrl}
            onClose={onClose}
          />
        </div>

        {/* Delete account */}
        <div className="px-6 pb-4">
          <DeleteAccountButton setIsDeleteDialogOpen={setIsDeleteDialogOpen} />
        </div>

        {/* Powered by footer */}
        <PoweredBy companyUrl={companyUrl} companyName={companyName} />
      </div>

      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </>
  );
};
