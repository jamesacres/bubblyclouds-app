'use client';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { useContext, useEffect } from 'react';

export default function Home() {
  const context = useContext(UserContext);
  const { isInitialised, handleRestoreState } = context || {};

  useEffect(() => {
    if ('electronAPI' in window && isInitialised && handleRestoreState) {
      // restore state
      handleRestoreState();
    }
  }, [isInitialised, handleRestoreState]);
  return <main />;
}
