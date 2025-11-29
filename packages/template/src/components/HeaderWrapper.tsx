'use client';

import { useContext } from 'react';
import Header from '@sudoku-web/ui/components/Header';
import HeaderUser from '@sudoku-web/auth/components/HeaderUser';
import { RevenueCatContext } from '../providers/RevenueCatProvider';
import { useOnline } from '../hooks/online';
import { isCapacitor } from '../helpers/capacitor';
import { useServerStorage } from '../hooks/serverStorage';

export default function HeaderWrapper({ app }: { app: string }) {
  const revenueCatContext = useContext(RevenueCatContext);
  const { isOnline } = useOnline();
  const { deleteAccount } = useServerStorage({ app });

  const handleShowSubscribeModal = (onSuccess: () => void) => {
    revenueCatContext?.subscribeModal?.showModalIfRequired(onSuccess);
  };

  return (
    <Header
      isOnline={isOnline}
      isCapacitor={isCapacitor}
      HeaderUser={HeaderUser}
      headerUserProps={{
        isSubscribed: revenueCatContext?.isSubscribed,
        showSubscribeModal: revenueCatContext?.subscribeModal
          ?.showModalIfRequired
          ? handleShowSubscribeModal
          : undefined,
        deleteAccount,
      }}
    />
  );
}
