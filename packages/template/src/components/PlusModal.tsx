'use client';

import { isCapacitor } from '../helpers/capacitor';
import { isElectron } from '../helpers/electron';
import { RevenueCatContext } from '../providers/RevenueCatProvider';
import { SubscriptionContext } from '@sudoku-web/types/subscriptionContext';
import { PurchasesPackage as CapacitorPackage } from '@revenuecat/purchases-capacitor';
import { Package as WebPackage } from '@revenuecat/purchases-js';
import Image from 'next/image';
import {
  ReactElement,
  ReactNode,
  cloneElement,
  useContext,
  useState,
} from 'react';
import { X, Check } from 'react-feather';

interface PremiumFeature {
  icon: ReactElement;
  title: string;
  description?: string;
}

interface ContextMessage {
  bgColor: string;
  textColor: string;
  content: ReactNode;
}

interface PlusModalProps {
  features: PremiumFeature[];
  description: ReactNode;
  contextMessages: Record<SubscriptionContext, ContextMessage>;
}

const PlusModal = ({
  features,
  description,
  contextMessages,
}: PlusModalProps) => {
  const {
    isLoading,
    isSubscribed,
    packages,
    purchasePackage,
    restorePurchases,
    subscribeModal: modal,
  } = useContext(RevenueCatContext) || {};

  const getContextualMessage = (context?: SubscriptionContext) => {
    if (!context) return null;

    const messageConfig = contextMessages[context];
    if (!messageConfig) return null;

    return (
      <div className={`mb-4 rounded-lg p-3 ${messageConfig.bgColor}`}>
        <p className={`text-sm ${messageConfig.textColor}`}>
          {messageConfig.content}
        </p>
      </div>
    );
  };
  let monthlyPackage = packages?.find((pkg) =>
    pkg.identifier.toLowerCase().includes('monthly')
  );
  let lifetimePackage = packages?.find((pkg) =>
    pkg.identifier.toLowerCase().includes('lifetime')
  );
  let monthlyPriceString;
  let lifetimePriceString;
  if (isCapacitor()) {
    // iOS and Android
    monthlyPriceString = (monthlyPackage as CapacitorPackage | undefined)
      ?.product.priceString;
    lifetimePriceString = (lifetimePackage as CapacitorPackage | undefined)
      ?.product.priceString;
  } else if (isElectron()) {
    // Do nothing
  } else {
    // Web
    monthlyPriceString = (monthlyPackage as WebPackage | undefined)
      ?.webBillingProduct.currentPrice.formattedPrice;
    lifetimePriceString = (lifetimePackage as WebPackage | undefined)
      ?.webBillingProduct.currentPrice.formattedPrice;
  }

  const [selectedPlan, setSelectedPlan] = useState<'lifetime' | 'monthly'>(
    'monthly'
  );

  if (!modal?.isOpen || isLoading || isSubscribed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={() => {
          modal?.hideModal();
          modal.cancelCallback();
        }}
      />

      {/* Modal */}
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95">
        {/* Close Button */}
        <button
          onClick={() => {
            modal?.hideModal();
            modal.cancelCallback();
          }}
          className="absolute top-4 right-4 z-10 cursor-pointer rounded-full p-2 text-gray-400 backdrop-blur-sm transition-all hover:bg-gray-200/80 hover:text-gray-600 dark:hover:bg-gray-700/80 dark:hover:text-gray-300"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="mb-6 px-6 pt-2 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
              <Image
                src="/icons/icon-512.webp"
                alt="App Icon"
                width={512}
                height={512}
              />
            </div>
            {description}
          </div>

          {/* Contextual Message */}
          <div className="px-6">{getContextualMessage(modal?.context)}</div>

          {/* Pricing Options */}
          <div className="mb-6 space-y-3 px-6">
            <div
              className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 ${
                selectedPlan === 'lifetime'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700'
              }`}
              onClick={() => setSelectedPlan('lifetime')}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    selectedPlan === 'lifetime'
                      ? 'bg-blue-500 text-white'
                      : 'border-2 border-gray-300 dark:border-gray-500'
                  }`}
                >
                  {selectedPlan === 'lifetime' && <Check className="h-4 w-4" />}
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Lifetime
                </span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                {lifetimePriceString}
              </span>
            </div>

            <div
              className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 ${
                selectedPlan === 'monthly'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700'
              }`}
              onClick={() => setSelectedPlan('monthly')}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    selectedPlan === 'monthly'
                      ? 'bg-blue-500 text-white'
                      : 'border-2 border-gray-300 dark:border-gray-500'
                  }`}
                >
                  {selectedPlan === 'monthly' && <Check className="h-4 w-4" />}
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Monthly
                </span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                {monthlyPriceString}/month
              </span>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-6 px-6">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
              What&apos;s Included
            </h3>
            <div className="space-y-4 pb-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 rounded-lg bg-white p-3 dark:bg-gray-700"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white">
                    {cloneElement(feature.icon, { className: 'h-6 w-6' })}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {feature.title}
                    </h4>
                    {feature.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Action Buttons */}
        <div className="flex-shrink-0 rounded-b-2xl border-t-2 border-gray-300/70 bg-white/95 shadow-[0_-16px_32px_-4px_rgba(0,0,0,0.4)] backdrop-blur-xl dark:border-gray-600/70 dark:bg-gray-900/95">
          <div className="space-y-3 px-6 py-4">
            <button
              className="w-full cursor-pointer rounded-xl bg-blue-500 py-4 font-semibold text-white transition-colors hover:bg-blue-600 active:bg-blue-700"
              onClick={async () => {
                if (
                  selectedPlan &&
                  purchasePackage &&
                  lifetimePackage &&
                  monthlyPackage
                ) {
                  const isSubscribed = await purchasePackage(
                    selectedPlan === 'lifetime'
                      ? lifetimePackage
                      : monthlyPackage
                  );
                  modal.hideModal();
                  if (isSubscribed) {
                    modal.callback();
                  }
                }
              }}
            >
              Continue
            </button>
            <div className="flex gap-4">
              <button
                className="flex-1 cursor-pointer py-2 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                onClick={async () => {
                  if (restorePurchases) {
                    const isSubscribed = await restorePurchases();
                    modal.hideModal();
                    if (isSubscribed) {
                      modal.callback();
                    }
                  }
                }}
              >
                Restore purchases
              </button>
              <button
                className="flex-1 cursor-pointer py-2 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                onClick={() => {
                  modal?.hideModal();
                  modal.cancelCallback();
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlusModal;
