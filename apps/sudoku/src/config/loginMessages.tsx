import React from 'react';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';
import type { LoginContextMessage } from '@bubblyclouds-app/auth/components/LoginModal';

/**
 * Map of login contexts to their respective messages
 * Each context provides specific messaging about why sign-in is being requested
 */
export const LOGIN_CONTEXT_MESSAGES: Partial<
  Record<LoginContext, LoginContextMessage>
> = {
  [LoginContext.DAILY_PUZZLE]: {
    textColor: 'text-violet-200',
    content: <>Sign in to start today&rsquo;s puzzle</>,
  },
  [LoginContext.PUZZLE_BOOK]: {
    textColor: 'text-fuchsia-200',
    content: <>Sign in to browse the puzzle book</>,
  },
  [LoginContext.JOIN_TEAM]: {
    textColor: 'text-blue-200',
    content: <>Sign in to join the team</>,
  },
  [LoginContext.RACE_LOBBY]: {
    textColor: 'text-emerald-200',
    content: <>Sign in to race with others</>,
  },
};

export const LOGIN_VALUE_PROPS = [
  'Save your progress',
  'Race friends',
  'Track your stats',
];
