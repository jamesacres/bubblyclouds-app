'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { isAndroid, isCapacitor, isIOS } from '../helpers/capacitor';

interface RateAppButtonProps {
  appName: string;
  appStoreUrl: string;
  googlePlayUrl: string;
  variant?: 'card' | 'inline';
  className?: string;
}

export const RateAppButton = ({
  appName,
  appStoreUrl,
  googlePlayUrl,
  variant = 'card',
  className,
}: RateAppButtonProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const userAgent =
    mounted && typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOSWeb = /iPad|iPhone|iPod/.test(userAgent) && !isCapacitor();
  const isAndroidWeb = /Android/.test(userAgent) && !isCapacitor();
  const isMobileWeb = isIOSWeb || isAndroidWeb;

  const prompt = `Enjoying ${appName}?`;

  const reviewUrl = `${appStoreUrl}?action=write-review`;

  const openStore = (url: string) => {
    window.open(url, '_blank', 'noopener');
  };

  if (mounted && (isCapacitor() || isMobileWeb)) {
    const handleClick = () => {
      const useAndroidStore = isAndroid() || isAndroidWeb;
      if (isCapacitor()) {
        openStore(useAndroidStore ? googlePlayUrl : reviewUrl);
      } else {
        openStore(isAndroidWeb ? googlePlayUrl : appStoreUrl);
      }
    };

    if (variant === 'inline') {
      return (
        <button
          onClick={handleClick}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-700 transition-all duration-200 hover:scale-[1.02] hover:bg-amber-500/20 active:scale-[0.98] dark:text-amber-300 ${className ?? ''}`}
        >
          <Star
            className="h-4 w-4 fill-amber-500 text-amber-500"
            aria-hidden="true"
          />
          {prompt} Rate it
        </button>
      );
    }

    return (
      <button
        onClick={handleClick}
        className={`liquid-glass flex w-full items-center justify-between gap-4 rounded-3xl p-4 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.97] md:p-6 ${className ?? ''}`}
      >
        <div>
          <div className="flex items-center gap-2 text-base font-black leading-tight text-white">
            <Star
              className="h-4 w-4 fill-amber-400 text-amber-400"
              aria-hidden="true"
            />
            {prompt}
          </div>
          <p className="mt-1 text-sm text-white/50">Rate it in seconds</p>
        </div>
        <span className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">
          Rate it
        </span>
      </button>
    );
  }

  return null;
};

export default RateAppButton;
