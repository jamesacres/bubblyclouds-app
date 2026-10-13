'use client';

import { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import PlusModal from '@bubblyclouds-app/template/components/PlusModal';
import { getPremiumFeatures } from '../config/premiumFeatures';
import { getSubscriptionContextMessages } from '../config/subscriptionMessages';

export default function UnblockRacePlusModal() {
  const { t } = useTranslation('app');
  const features = useMemo(() => getPremiumFeatures(t), [t]);
  const contextMessages = useMemo(() => getSubscriptionContextMessages(t), [t]);
  const description = (
    <p className="text-gray-600 dark:text-gray-400">
      <Trans
        t={t}
        i18nKey="plusModal.description"
        values={{ plusName: t('brand.plusProduct') }}
        components={{
          badge: (
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" />
          ),
          strong: <span className="font-semibold" />,
        }}
      />
    </p>
  );

  return (
    <PlusModal
      features={features}
      description={description}
      contextMessages={contextMessages}
    />
  );
}
