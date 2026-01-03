'use client';

import React from 'react';
import { Wifi, WifiOff } from 'react-feather';

interface HeaderOnlineProps {
  isOnline?: boolean;
}

const HeaderOnline = ({ isOnline = true }: HeaderOnlineProps) => {
  return (
    <button
      onClick={() => {
        window.alert(`You are ${isOnline ? 'online' : 'offline'}!`);
        //(!isOnline ||
        //  window.confirm('Are you sure you wish to force offline mode?')) &&
        //  forceOffline(isOnline);
      }}
      className="text-theme-primary dark:text-theme-primary-light ml-1 h-8 w-8 cursor-pointer rounded-full bg-gray-100 p-1.5 transition-colors active:opacity-70 dark:bg-gray-800"
    >
      {isOnline ? (
        <Wifi className="m-auto h-full w-full" />
      ) : (
        <WifiOff className="m-auto h-full w-full" />
      )}
    </button>
  );
};

export default HeaderOnline;
