'use client';

import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Loader,
  Share as ShareIOS,
  Share2 as ShareAndroid,
} from 'lucide-react';
import { canShareUrl, shareOrCopyUrl } from '../helpers/share';

const CopyButton = ({
  getText,
  extraSmall = false,
  className = '',
  style,
  partyName,
  isIOS = () => false,
  appName,
}: {
  getText: () => Promise<string> | string;
  extraSmall?: boolean;
  className?: string;
  style?: React.CSSProperties;
  partyName?: string;
  isIOS?: () => boolean;
  appName: string;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    canShareUrl().then(setCanShare);
  }, []);

  const handleCopy = async () => {
    setIsLoading(true);

    try {
      const text = await getText();
      if (text) {
        await shareOrCopyUrl({ url: text, appName, partyName });
        setShowCopied(true);
        setTimeout(() => {
          setShowCopied(false);
        }, 5000);
      }
    } catch (error) {
      console.warn('Failed to copy/share:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const defaultClassName = `text-theme-primary dark:text-theme-primary-light flex cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 active:opacity-80 dark:bg-gray-700 dark:hover:bg-gray-600 ${
    extraSmall ? 'px-2 py-1 text-xs' : 'w-full px-4 py-2.5 text-sm'
  } font-medium`;

  const ShareIcon = isIOS() ? ShareIOS : ShareAndroid;

  return (
    <button
      className={className || defaultClassName}
      style={style}
      onClick={handleCopy}
      disabled={isLoading}
    >
      {showCopied ? (
        <>
          <Check className="mr-2" size={extraSmall ? 14 : 18} /> Copied to
          clipboard!
        </>
      ) : (
        <>
          {isLoading ? (
            <Loader
              className="mx-auto animate-spin"
              size={extraSmall ? 14 : 18}
            />
          ) : canShare ? (
            <>
              <ShareIcon className="mr-2" size={extraSmall ? 14 : 18} /> Share
              Invite Link
            </>
          ) : (
            <>
              <Copy className="mr-2" size={extraSmall ? 14 : 18} /> Copy Invite
              Link
            </>
          )}
        </>
      )}
    </button>
  );
};

export { CopyButton };
