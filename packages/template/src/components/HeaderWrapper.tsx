'use client';

import { useContext } from 'react';
import Header from '@bubblyclouds-app/ui/components/Header';
import HeaderUser from '@bubblyclouds-app/auth/components/HeaderUser';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';
import { RevenueCatContext } from '../providers/RevenueCatProvider';
import { useOnline } from '../hooks/online';
import { isCapacitor } from '../helpers/capacitor';
import { useServerStorage } from '../hooks/serverStorage';

export default function HeaderWrapper({
  app,
  appName,
  apiUrl,
  privacyUrl,
  termsUrl,
  creditsUrl,
  companyUrl,
  companyName,
}: {
  app: string;
  appName: string;
  apiUrl: string;
  privacyUrl: string;
  termsUrl: string;
  creditsUrl?: string;
  companyUrl: string;
  companyName: string;
}) {
  const revenueCatContext = useContext(RevenueCatContext);
  const { isOnline } = useOnline();
  const { deleteAccount } = useServerStorage({ app, apiUrl });

  const handleShowSubscribeModal = (onSuccess: () => void) => {
    revenueCatContext?.subscribeModal?.showModalIfRequired(onSuccess);
  };

  const handlePremiumColorClick = (
    _colorName: string,
    onSuccess: () => void
  ) => {
    revenueCatContext?.subscribeModal?.showModalIfRequired(
      onSuccess,
      () => {},
      SubscriptionContext.THEME_COLOR
    );
  };

  return (
    <Header
      isOnline={isOnline}
      isCapacitor={isCapacitor}
      HeaderUser={HeaderUser}
      headerUserProps={{
        isSubscribed: revenueCatContext?.isSubscribed,
        subscriptionManagementUrl: revenueCatContext?.subscriptionManagementUrl,
        showSubscribeModal: revenueCatContext?.subscribeModal
          ?.showModalIfRequired
          ? handleShowSubscribeModal
          : undefined,
        deleteAccount,
        privacyUrl,
        termsUrl,
        creditsUrl,
        companyUrl,
        companyName,
      }}
      appName={appName}
      isSubscribed={revenueCatContext?.isSubscribed ?? false}
      onPremiumColorClick={handlePremiumColorClick}
    />
  );
}
