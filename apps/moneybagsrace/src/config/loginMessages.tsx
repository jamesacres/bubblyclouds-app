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
  [LoginContext.JOIN_TEAM]: {
    textColor: 'text-blue-200',
    content: <>Sign in to join the team</>,
  },
  [LoginContext.RACE_LOBBY]: {
    textColor: 'text-emerald-200',
    content: <>Sign in to race with others</>,
  },
  [LoginContext.PUZZLE_ENTRY]: {
    textColor: 'text-violet-200',
    content: <>Sign in to save your net worth</>,
  },
};

export const LOGIN_VALUE_PROPS = [
  'Track your net worth',
  'Race friends and family',
  'Plan your retirement',
];
