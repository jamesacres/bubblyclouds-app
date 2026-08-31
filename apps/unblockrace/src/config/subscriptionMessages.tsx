import React from 'react';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';
import { DAILY_LIMITS } from '@bubblyclouds-app/template/config/dailyLimits';

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
export const SUBSCRIPTION_CONTEXT_MESSAGES: Record<
  Exclude<
    SubscriptionContext,
    | SubscriptionContext.CHECK_GRID
    | SubscriptionContext.REVEAL
    | SubscriptionContext.DAILY_PUZZLE_LIMIT
  >,
  ContextMessage
> = {
  [SubscriptionContext.HINT]: {
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-800 dark:text-orange-200',
    content: (
      <>
        💡{' '}
        <strong>
          You&rsquo;ve used your {DAILY_LIMITS.HINT} free hints today.
        </strong>{' '}
        Plus gives you unlimited hints — never get stuck again — and keeps the
        whole app ad free.
      </>
    ),
  },
  [SubscriptionContext.UNDO]: {
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-800 dark:text-orange-200',
    content: (
      <>
        📅 <strong>You&rsquo;ve reached your daily undo limit!</strong> You get{' '}
        {DAILY_LIMITS.UNDO} free undos per day. The limit resets tomorrow, or
        subscribe for unlimited undos.
      </>
    ),
  },
  [SubscriptionContext.COLLECTION_LOCKED]: {
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    textColor: 'text-indigo-800 dark:text-indigo-200',
    content: (
      <>
        ✨ <strong>This puzzle is part of the Plus collection.</strong> Plus
        unlocks every puzzle in every month&rsquo;s pack, and keeps the whole
        app ad free.
      </>
    ),
  },
  [SubscriptionContext.THEME_COLOR]: {
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-800 dark:text-purple-200',
    content: (
      <>
        🎨 <strong>This theme is exclusive to Plus.</strong> Upgrade to unlock
        all beautiful theme colors and personalise your unblock race experience.
      </>
    ),
  },
  [SubscriptionContext.REMOVE_MEMBER]: {
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-800 dark:text-purple-200',
    content: (
      <>
        👥{' '}
        <strong>Removing members from your party is a premium feature!</strong>{' '}
        Subscribe to unlock advanced party management features including member
        removal.
      </>
    ),
  },
  [SubscriptionContext.MULTIPLE_PARTIES]: {
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-800 dark:text-blue-200',
    content: (
      <>
        🏘️ <strong>Multiple racing teams is a premium feature!</strong> Free
        users can have one team. Subscribe to create and join unlimited teams
        for family, friends, and more.
      </>
    ),
  },
  [SubscriptionContext.PARTY_MAX_SIZE]: {
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-800 dark:text-purple-200',
    content: (
      <>
        👥 <strong>Large parties is a premium feature!</strong> Subscribe to
        unlock advanced party management features including large parties.
      </>
    ),
  },
};
