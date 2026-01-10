'use client';
import React, { Dispatch, SetStateAction, useState } from 'react';

export interface GlobalState {
  isForceOffline: boolean;
}

export const GlobalStateContext = React.createContext<
  [GlobalState, Dispatch<SetStateAction<GlobalState>>] | undefined
>(undefined);

const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value = useState<GlobalState>({
    isForceOffline: false,
  });
  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export default GlobalStateProvider;
