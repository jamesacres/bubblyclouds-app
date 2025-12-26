'use client';
import {
  UserContext,
  UserContextInterface,
} from '@sudoku-web/auth/providers/AuthProvider';
import { useContext, useEffect } from 'react';

export default function Home() {
  const context = useContext(UserContext) as UserContextInterface | undefined;
  const { isInitialised, handleRestoreState } = context || {};

  useEffect(() => {
    if ('electronAPI' in window && isInitialised && handleRestoreState) {
      // restore state
      handleRestoreState();
    }
  }, [isInitialised, handleRestoreState]);
  return <main />;
}
