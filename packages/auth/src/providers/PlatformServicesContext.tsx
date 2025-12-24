'use client';
import React from 'react';

export interface PlatformServices {
  isElectron: () => boolean;
  isCapacitor: () => boolean;
  openBrowser: (url: string) => Promise<void>;
  saveElectronState: (state: any) => Promise<void>;
  getCapacitorState: () => Promise<string>;
  saveCapacitorState: (state: any) => Promise<void>;
  app: string;
}

export const PlatformServicesContext = React.createContext<
  PlatformServices | undefined
>(undefined);

interface PlatformServicesProviderProps {
  children: React.ReactNode;
  services: PlatformServices;
}

const PlatformServicesProvider: React.FC<PlatformServicesProviderProps> = ({
  children,
  services,
}) => {
  return (
    <PlatformServicesContext.Provider value={services}>
      {children}
    </PlatformServicesContext.Provider>
  );
};

export default PlatformServicesProvider;
