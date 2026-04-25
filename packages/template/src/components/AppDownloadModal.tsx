'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Smartphone, ExternalLink } from 'lucide-react';
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
  if (isCapacitor()) {
    return null;
  }

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
    window.location.href = `${deepLinkScheme}://-${currentPath}`;
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
          <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center sm:items-center sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full overflow-hidden rounded-t-3xl border border-white/10 bg-zinc-900 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] sm:max-w-md sm:rounded-3xl">
                <div className="p-6">
                  {/* Header */}
                  <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/15 shadow-[inset_0_1px_0_rgba(125,211,252,0.1)]">
                      <Smartphone className="h-5 w-5 text-sky-400" />
                    </div>
                    <div>
                      <Dialog.Title className="text-base font-bold tracking-tight text-zinc-100">
                        Continue in the app
                      </Dialog.Title>
                      <p className="mt-1 text-sm leading-snug text-zinc-400">
                        {isMobileWeb ? mobileDescription : desktopDescription}
                      </p>
                    </div>
                  </div>

                  {/* Store badges */}
                  <div className="space-y-3">
                    {(isIOSWeb || !isMobileWeb) && (
                      <button
                        onClick={handleAppStoreClick}
                        className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-zinc-800/80 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-200 hover:border-white/20 hover:bg-zinc-700/70 active:scale-[0.98]"
                      >
                        <Image
                          src="/badges/download-on-app-store.svg"
                          alt="Download on the App Store"
                          className="h-9 w-auto flex-shrink-0"
                          width={120}
                          height={36}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-zinc-100">
                            App Store
                          </div>
                          <div className="text-xs text-zinc-400">
                            iPhone &amp; iPad
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                      </button>
                    )}

                    {(isAndroidWeb || !isMobileWeb) && (
                      <button
                        onClick={handleGooglePlayClick}
                        className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-zinc-800/80 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-200 hover:border-white/20 hover:bg-zinc-700/70 active:scale-[0.98]"
                      >
                        <Image
                          src="/badges/get-it-on-google-play.svg"
                          alt="Get it on Google Play"
                          className="h-9 w-auto flex-shrink-0"
                          width={120}
                          height={36}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-zinc-100">
                            Google Play
                          </div>
                          <div className="text-xs text-zinc-400">Android</div>
                        </div>
                        <ExternalLink className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                      </button>
                    )}
                  </div>

                  {/* Open in app — mobile only */}
                  {isMobileWeb && (
                    <button
                      onClick={handleOpenInApp}
                      className="mt-3 w-full rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-200 hover:bg-amber-400 active:scale-[0.98]"
                    >
                      {openInAppLabel}
                    </button>
                  )}

                  {/* Continue in browser — quiet tertiary */}
                  <div className="border-white/8 mt-3 border-t pt-3">
                    <button
                      onClick={handleContinueWeb}
                      className="w-full rounded-xl px-4 py-2.5 text-sm text-zinc-500 transition-all duration-200 hover:bg-zinc-800/60 hover:text-zinc-300 active:scale-[0.98]"
                    >
                      {isMobileWeb
                        ? 'Continue in browser'
                        : 'Continue on desktop'}
                    </button>
                  </div>
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
