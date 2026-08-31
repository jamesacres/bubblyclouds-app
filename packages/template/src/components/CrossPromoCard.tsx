'use client';

import { ReactNode, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { isAndroid, isCapacitor, isIOS } from '../helpers/capacitor';

interface CrossPromoCardProps {
  gameName: string;
  tagline: string;
  preview: ReactNode;
  appUrl: string;
  appStoreUrl: string;
  googlePlayUrl: string;
  className?: string;
}

export const CrossPromoCard = ({
  gameName,
  tagline,
  preview,
  appUrl,
  appStoreUrl,
  googlePlayUrl,
  className,
}: CrossPromoCardProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const userAgent =
    mounted && typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOSWeb = /iPad|iPhone|iPod/.test(userAgent) && !isCapacitor();
  const isAndroidWeb = /Android/.test(userAgent) && !isCapacitor();

  const resolveHref = (): string => {
    if (isAndroid() || isAndroidWeb) {
      return googlePlayUrl;
    }
    if (isIOS() || isIOSWeb) {
      return appStoreUrl;
    }
    return appUrl;
  };

  return (
    <a
      href={resolveHref()}
      target="_blank"
      rel="noopener noreferrer"
      className={`liquid-glass group flex items-center gap-4 rounded-3xl p-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.97] md:p-6 ${className ?? ''}`}
    >
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/35">
          Why not try
        </p>
        <p className="mb-1 text-xl font-black leading-tight text-white md:text-2xl">
          {gameName}
        </p>
        <p className="mb-3 text-xs leading-snug text-white/50 md:text-sm">
          {tagline}
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
          Try it free
          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </span>
      </div>
      <div className="w-[34%] max-w-[150px] shrink-0">{preview}</div>
    </a>
  );
};

export default CrossPromoCard;
