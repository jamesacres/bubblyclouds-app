'use client';

import PlusModal from '@bubblyclouds-app/template/components/PlusModal';
import { PREMIUM_FEATURES } from '../config/premiumFeatures';
import { SUBSCRIPTION_CONTEXT_MESSAGES } from '../config/subscriptionMessages';

const PLUS_DESCRIPTION = (
  <p className="text-gray-600 dark:text-gray-400">
    Join{' '}
    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
      Money Bags Race Plus
    </span>{' '}
    for extra racing teams and premium features. Race friends and family, and
    keep it ad free.
  </p>
);

export default function MoneyBagsRacePlusModal() {
  return (
    <PlusModal
      features={PREMIUM_FEATURES}
      description={PLUS_DESCRIPTION}
      contextMessages={SUBSCRIPTION_CONTEXT_MESSAGES}
    />
  );
}
