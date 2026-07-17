import React from 'react';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';

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
export const SUBSCRIPTION_CONTEXT_MESSAGES: Partial<
  Record<SubscriptionContext, ContextMessage>
> = {
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
