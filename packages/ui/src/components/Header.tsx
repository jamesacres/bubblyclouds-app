import dynamic from 'next/dynamic';
import React from 'react';

const HeaderBack = dynamic(() => import('./HeaderBack'), { ssr: false });
const HeaderOnline = dynamic(() => import('./HeaderOnline'), { ssr: false });
const HeaderTitle = dynamic(() => import('./HeaderTitle'), { ssr: false });

import ThemeControls from './ThemeControls';

interface HeaderUserProps {
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

interface HeaderProps {
  isOnline?: boolean;
  isCapacitor?: () => boolean;
  HeaderUser?: React.ComponentType<HeaderUserProps>;
  headerUserProps?: HeaderUserProps;
  appName: string;
  isSubscribed: boolean;
  onPremiumColorClick: (colorName: string, onSuccess: () => void) => void;
  showRainbowAnimation?: boolean;
}

const Header = ({
  isOnline,
  isCapacitor,
  HeaderUser,
  headerUserProps,
  appName,
  isSubscribed,
  onPremiumColorClick,
  showRainbowAnimation,
}: HeaderProps) => {
  return (
    <>
      <nav className="bg-stone-50/96 dark:bg-zinc-900/96 fixed left-0 top-0 z-50 flex w-screen items-center border-b border-stone-200/60 px-1 pt-[var(--ion-safe-area-top)] shadow-sm shadow-stone-900/[0.04] backdrop-blur-md dark:border-zinc-700/60 dark:shadow-black/10">
        <div className="flex h-11 shrink-0 items-center">
          <HeaderBack appName={appName} />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <HeaderTitle appName={appName} />
        </div>
        <div className="flex h-11 shrink-0 items-center gap-0">
          {HeaderUser && headerUserProps && (
            <HeaderUser {...(headerUserProps as HeaderUserProps)} />
          )}
          <ThemeControls
            isCapacitor={isCapacitor}
            isSubscribed={isSubscribed}
            onPremiumColorClick={onPremiumColorClick}
            showRainbowAnimation={showRainbowAnimation}
          />
          <HeaderOnline isOnline={isOnline} />
        </div>
      </nav>
      <div className="pt-[calc(var(--ion-safe-area-top)+2.75rem)]"></div>
    </>
  );
};

export default Header;
