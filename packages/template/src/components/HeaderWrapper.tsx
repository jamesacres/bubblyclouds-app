'use client';

import { useContext } from 'react';
import Header from '@sudoku-web/ui/components/Header';
import HeaderUser from '@sudoku-web/auth/components/HeaderUser';
import { RevenueCatContext } from '@sudoku-web/template/providers/RevenueCatProvider';
import { useOnline } from '@sudoku-web/template/hooks/online';
import { isCapacitor } from '@sudoku-web/template/helpers/capacitor';
import { useServerStorage } from '@sudoku-web/template/hooks/serverStorage';

export default function HeaderWrapper() {
  const revenueCatContext = useContext(RevenueCatContext);
  const { isOnline } = useOnline();
  const { deleteAccount } = useServerStorage();

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
