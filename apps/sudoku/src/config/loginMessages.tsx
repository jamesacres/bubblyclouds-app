import { useTranslation } from 'react-i18next';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';
import type { LoginContextMessage } from '@bubblyclouds-app/auth/components/LoginModal';

export function useLoginMessages(): {
  contextMessages: Partial<Record<LoginContext, LoginContextMessage>>;
  valueProps: string[];
} {
  const { t } = useTranslation('app');

  return {
    contextMessages: {
      [LoginContext.DAILY_PUZZLE]: {
        textColor: 'text-violet-200',
        content: t('login.dailyPuzzle'),
      },
      [LoginContext.PUZZLE_BOOK]: {
        textColor: 'text-fuchsia-200',
        content: t('login.puzzleBook'),
      },
      [LoginContext.JOIN_TEAM]: {
        textColor: 'text-blue-200',
        content: t('login.joinTeam'),
      },
      [LoginContext.RACE_LOBBY]: {
        textColor: 'text-emerald-200',
        content: t('login.raceLobby'),
      },
      [LoginContext.PUZZLE_ENTRY]: {
        textColor: 'text-violet-200',
        content: t('login.puzzleEntry'),
      },
    },
    valueProps: [
      t('login.valueProps.saveProgress'),
      t('login.valueProps.raceFriends'),
      t('login.valueProps.trackStats'),
    ],
  };
}
