import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';
import { DAILY_LIMITS } from './dailyLimits';

interface ContextMessage {
  bgColor: string;
  textColor: string;
  content: React.ReactNode;
}

export function useSubscriptionContextMessages(): Record<
  SubscriptionContext,
  ContextMessage
> {
  const { t } = useTranslation('app');
  const components = { bold: <strong /> };

  return {
    [SubscriptionContext.HINT]: {
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-800 dark:text-orange-200',
      content: (
        <Trans
          t={t}
          i18nKey="subscription.hint"
          count={DAILY_LIMITS.HINT}
          components={components}
        />
      ),
    },
    [SubscriptionContext.UNDO]: {
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-800 dark:text-orange-200',
      content: (
        <Trans
          t={t}
          i18nKey="subscription.undo"
          count={DAILY_LIMITS.UNDO}
          components={components}
        />
      ),
    },
    [SubscriptionContext.CHECK_GRID]: {
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-800 dark:text-orange-200',
      content: (
        <Trans
          t={t}
          i18nKey="subscription.checkGrid"
          count={DAILY_LIMITS.CHECK_GRID}
          components={components}
        />
      ),
    },
    [SubscriptionContext.REVEAL]: {
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-800 dark:text-blue-200',
      content: (
        <Trans t={t} i18nKey="subscription.reveal" components={components} />
      ),
    },
    [SubscriptionContext.THEME_COLOR]: {
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-800 dark:text-purple-200',
      content: (
        <Trans
          t={t}
          i18nKey="subscription.themeColor"
          components={components}
        />
      ),
    },
    [SubscriptionContext.DAILY_PUZZLE_LIMIT]: {
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-800 dark:text-green-200',
      content: (
        <Trans
          t={t}
          i18nKey="subscription.dailyPuzzleLimit"
          count={DAILY_LIMITS.PUZZLE}
          components={components}
        />
      ),
    },
    [SubscriptionContext.COLLECTION_LOCKED]: {
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-800 dark:text-indigo-200',
      content: (
        <Trans
          t={t}
          i18nKey="subscription.collectionLocked"
          components={components}
        />
      ),
    },
    [SubscriptionContext.REMOVE_MEMBER]: {
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-800 dark:text-purple-200',
      content: (
        <Trans
          t={t}
          i18nKey="subscription.removeMember"
          components={components}
        />
      ),
    },
    [SubscriptionContext.MULTIPLE_PARTIES]: {
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-800 dark:text-blue-200',
      content: (
        <Trans
          t={t}
          i18nKey="subscription.multipleParties"
          components={components}
        />
      ),
    },
    [SubscriptionContext.PARTY_MAX_SIZE]: {
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-800 dark:text-purple-200',
      content: (
        <Trans
          t={t}
          i18nKey="subscription.partyMaxSize"
          components={components}
        />
      ),
    },
  };
}
