import React from 'react';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';
import { DAILY_LIMITS } from './dailyLimits';

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
  SubscriptionContext,
  ContextMessage
> = {
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
  [SubscriptionContext.CHECK_GRID]: {
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-800 dark:text-orange-200',
    content: (
      <>
        📅 <strong>You&rsquo;ve reached your daily grid check limit!</strong>{' '}
        You get {DAILY_LIMITS.CHECK_GRID} free grid checks per day. The limit
        resets tomorrow, or subscribe for unlimited checks.
      </>
    ),
  },
  [SubscriptionContext.REVEAL]: {
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-800 dark:text-blue-200',
    content: (
      <>
        🔓 <strong>Reveal grid is a premium feature!</strong> Subscribe to
        unlock the ability to reveal the complete solution.
      </>
    ),
  },
  [SubscriptionContext.THEME_COLOR]: {
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-800 dark:text-purple-200',
    content: (
      <>
        🎨 <strong>Premium theme colors are subscription-only!</strong>{' '}
        Subscribe to unlock all beautiful theme colors and personalise your
        sudoku experience.
      </>
    ),
  },
  [SubscriptionContext.DAILY_PUZZLE_LIMIT]: {
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-800 dark:text-green-200',
    content: (
      <>
        🧩 <strong>You&rsquo;ve reached your daily puzzle limit!</strong> Free
        users can play {DAILY_LIMITS.PUZZLE} puzzle per day. The limit resets
        tomorrow, or subscribe for unlimited puzzles.
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
