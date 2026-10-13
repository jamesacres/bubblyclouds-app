import React from 'react';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';
import { DAILY_LIMITS } from '@bubblyclouds-app/template/config/dailyLimits';
import { Translate } from '@bubblyclouds-app/template/types/i18n';

/**
 * Interface for subscription context message configuration
 */
interface ContextMessage {
  /** Background color classes for the message container */
  bgColor: string;
  /** Text color classes for the message content */
  textColor: string;
  /** JSX content for the message */
  content: React.ReactNode;
}

/**
 * Map of subscription contexts to their respective messages
 * Each context provides specific messaging about why the subscription modal is being shown
 */
export const getSubscriptionContextMessages = (
  t: Translate
): Record<
  Exclude<
    SubscriptionContext,
    | SubscriptionContext.CHECK_GRID
    | SubscriptionContext.REVEAL
    | SubscriptionContext.DAILY_PUZZLE_LIMIT
  >,
  ContextMessage
> => ({
  [SubscriptionContext.HINT]: {
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-800 dark:text-orange-200',
    content: (
      <>
        💡{' '}
        <strong>
          {t('subscription.hint.title', { limit: DAILY_LIMITS.HINT })}
        </strong>{' '}
        {t('subscription.hint.body', { limit: DAILY_LIMITS.HINT })}
      </>
    ),
  },
  [SubscriptionContext.UNDO]: {
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-800 dark:text-orange-200',
    content: (
      <>
        📅{' '}
        <strong>
          {t('subscription.undo.title', { limit: DAILY_LIMITS.UNDO })}
        </strong>{' '}
        {t('subscription.undo.body', { limit: DAILY_LIMITS.UNDO })}
      </>
    ),
  },
  [SubscriptionContext.COLLECTION_LOCKED]: {
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    textColor: 'text-indigo-800 dark:text-indigo-200',
    content: (
      <>
        ✨ <strong>{t('subscription.collectionLocked.title')}</strong>{' '}
        {t('subscription.collectionLocked.body')}
      </>
    ),
  },
  [SubscriptionContext.THEME_COLOR]: {
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-800 dark:text-purple-200',
    content: (
      <>
        🎨 <strong>{t('subscription.themeColor.title')}</strong>{' '}
        {t('subscription.themeColor.body')}
      </>
    ),
  },
  [SubscriptionContext.REMOVE_MEMBER]: {
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-800 dark:text-purple-200',
    content: (
      <>
        👥 <strong>{t('subscription.removeMember.title')}</strong>{' '}
        {t('subscription.removeMember.body')}
      </>
    ),
  },
  [SubscriptionContext.MULTIPLE_PARTIES]: {
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-800 dark:text-blue-200',
    content: (
      <>
        🏘️ <strong>{t('subscription.multipleParties.title')}</strong>{' '}
        {t('subscription.multipleParties.body')}
      </>
    ),
  },
  [SubscriptionContext.PARTY_MAX_SIZE]: {
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-800 dark:text-purple-200',
    content: (
      <>
        👥 <strong>{t('subscription.partyMaxSize.title')}</strong>{' '}
        {t('subscription.partyMaxSize.body')}
      </>
    ),
  },
});
