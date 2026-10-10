'use client';

import { Trans, useTranslation } from 'react-i18next';
import PlusModal from '@bubblyclouds-app/template/components/PlusModal';
import { usePremiumFeatures } from '../config/premiumFeatures';
import { useSubscriptionContextMessages } from '../config/subscriptionMessages';

export default function SudokuPlusModal() {
  const { t } = useTranslation('app');
  const features = usePremiumFeatures();
  const contextMessages = useSubscriptionContextMessages();

  return (
    <PlusModal
      features={features}
      description={
        <p className="text-gray-600 dark:text-gray-400">
          <Trans
            t={t}
            i18nKey="plusModal.description"
            values={{ plusName: t('brand.plusName') }}
            components={{
              badge: (
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" />
              ),
              emphasis: <span className="font-semibold" />,
            }}
          />
        </p>
      }
      contextMessages={contextMessages}
    />
  );
}
