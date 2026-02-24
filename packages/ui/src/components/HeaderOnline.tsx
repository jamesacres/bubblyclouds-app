'use client';

import React from 'react';
import { WifiOff } from 'lucide-react';

interface HeaderOnlineProps {
  isOnline?: boolean;
}

const HeaderOnline = ({ isOnline = true }: HeaderOnlineProps) => {
  if (isOnline) return null;
  return (
    <button
      aria-label="Offline"
      title="Offline"
      className="flex h-11 w-11 cursor-default items-center justify-center rounded-md text-amber-500 transition-all"
    >
      <WifiOff className="h-5 w-5" />
    </button>
  );
};

export default HeaderOnline;
