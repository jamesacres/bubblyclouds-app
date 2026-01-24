'use client';
import {
  UserContext,
  UserContextInterface,
} from '@bubblyclouds-app/auth/providers/AuthProvider';
import { useContext, useEffect } from 'react';

export default function Home() {
  const context = useContext(UserContext) as UserContextInterface | undefined;
  const isInitialised = context?.isInitialised;
  const handleAuthUrl = context?.handleAuthUrl;

  useEffect(() => {
    console.info('auth page loading..');
    const options = { active: true };

    if (isInitialised && handleAuthUrl) {
      // exchange code for tokens
      handleAuthUrl(options);
    } else {
      console.info(
        `auth skipping due to isInitialised ${isInitialised} handleAuthUrl ${!!handleAuthUrl}`
      );
    }

    return () => {
      options.active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialised]);
  return <main />;
}
