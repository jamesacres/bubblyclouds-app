'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Smartphone, Download } from 'react-feather';
import { isCapacitor } from '../helpers/capacitor';
import Image from 'next/image';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueWeb: () => void;
  appName: string;
  appStoreUrl: string;
  googlePlayUrl: string;
  deepLinkScheme: string;
  mobileDescription: string;
  desktopDescription: string;
  openInAppLabel: string;
}

export const AppDownloadModal = ({
  isOpen,
  onClose,
  onContinueWeb,
  appName: _appName,
  appStoreUrl,
  googlePlayUrl,
  deepLinkScheme,
  mobileDescription,
  desktopDescription,
  openInAppLabel,
}: AppDownloadModalProps) => {
  // Don't show if already in the app
  if (isCapacitor()) {
    return null;
  }

  // Detect platform from user agent for web browsers
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOSWeb = /iPad|iPhone|iPod/.test(userAgent) && !isCapacitor();
  const isAndroidWeb = /Android/.test(userAgent) && !isCapacitor();
  const isMobileWeb = isIOSWeb || isAndroidWeb;

  const handleAppStoreClick = () => {
    window.open(appStoreUrl, '_blank');
  };

  const handleGooglePlayClick = () => {
    window.open(googlePlayUrl, '_blank');
  };

  const handleContinueWeb = () => {
    onContinueWeb();
    onClose();
  };

  const handleOpenInApp = () => {
    const currentPath = window.location.pathname + window.location.search;
    const deepLink = `${deepLinkScheme}://-${currentPath}`;

    // Try to open the deep link
    window.location.href = deepLink;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white/95 p-6 text-left align-middle shadow-2xl backdrop-blur-md transition-all dark:bg-zinc-900/95">
                {/* Header */}
                <div className="mb-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="relative">
                      <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                        <Smartphone className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-blue-500">
                        <Download className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>

                  <Dialog.Title className="mb-2 text-2xl font-bold">
                    <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      Did you know you can continue in our mobile app?
                    </span>
                  </Dialog.Title>

                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    {isMobileWeb ? mobileDescription : desktopDescription}
                  </p>
                </div>

                {/* App Store buttons */}
                <div className="space-y-4">
                  {/* iOS App Store - only show on iOS web or desktop */}
                  {(isIOSWeb || !isMobileWeb) && (
                    <button
                      onClick={handleAppStoreClick}
                      className="block w-full cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    >
                      <Image
                        src="/badges/download-on-app-store.svg"
                        alt="Download on the App Store"
                        className="mx-auto h-14 w-auto"
                        width={168}
                        height={56}
                      />
                    </button>
                  )}

                  {/* Google Play - only show on Android web or desktop */}
                  {(isAndroidWeb || !isMobileWeb) && (
                    <button
                      onClick={handleGooglePlayClick}
                      className="block w-full cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    >
                      <Image
                        src="/badges/get-it-on-google-play.svg"
                        alt="Get it on Google Play"
                        className="mx-auto h-14 w-auto"
                        width={168}
                        height={56}
                      />
                    </button>
                  )}
                </div>

                {/* Open in app option - only show on mobile */}
                {isMobileWeb && (
                  <div className="mt-4 text-center">
                    <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                      Already got the app?
                    </p>
                    <button
                      onClick={handleOpenInApp}
                      className="w-full cursor-pointer rounded-xl bg-blue-100 px-4 py-3 text-sm font-medium text-blue-700 transition-all duration-200 hover:bg-blue-200 active:scale-95 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                    >
                      {openInAppLabel}
                    </button>
                  </div>
                )}

                {/* Continue in browser option */}
                <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                  <button
                    onClick={handleContinueWeb}
                    className="w-full cursor-pointer rounded-xl px-4 py-3 text-sm text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-200"
                  >
                    {isMobileWeb
                      ? 'Continue in browser'
                      : 'Continue on desktop'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AppDownloadModal;
