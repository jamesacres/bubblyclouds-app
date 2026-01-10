'use client';
import type { UserProfile } from '@bubblyclouds-app/types/userProfile';
import React, { MutableRefObject, useRef } from 'react';

export interface State {
  accessToken: string | null;
  accessExpiry: Date | null;
  refreshToken: string | null;
  refreshExpiry: Date | null;
  user: UserProfile | null;
  userExpiry: Date | null;
}

type Value = [MutableRefObject<State>, (state: State) => void];

export const FetchContext = React.createContext<Value | undefined>(undefined);

const FetchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initialState = {
    accessToken: null,
    accessExpiry: null,
    refreshToken: null,
    refreshExpiry: null,
    user: null,
    userExpiry: null,
  };
  const stateRef = useRef<State>(initialState);

  const setState = (newState: State) => {
    stateRef.current = newState;
  };

  const value: Value = [stateRef, setState];
  return (
    <FetchContext.Provider value={value}>{children}</FetchContext.Provider>
  );
};

export default FetchProvider;
