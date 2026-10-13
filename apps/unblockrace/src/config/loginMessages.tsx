import { LoginContext } from '@bubblyclouds-app/types/loginContext';
import type { LoginContextMessage } from '@bubblyclouds-app/auth/components/LoginModal';
import { Translate } from '@bubblyclouds-app/template/types/i18n';

export const getLoginContextMessages = (
  t: Translate
): Partial<Record<LoginContext, LoginContextMessage>> => ({
  [LoginContext.DAILY_PUZZLE]: {
    textColor: 'text-violet-200',
    content: <>{t('login.context.dailyPuzzle')}</>,
  },
  [LoginContext.COLLECTION]: {
    textColor: 'text-fuchsia-200',
    content: <>{t('login.context.collection')}</>,
  },
  [LoginContext.JOIN_TEAM]: {
    textColor: 'text-blue-200',
    content: <>{t('login.context.joinTeam')}</>,
  },
  [LoginContext.RACE_LOBBY]: {
    textColor: 'text-emerald-200',
    content: <>{t('login.context.raceLobby')}</>,
  },
  [LoginContext.PUZZLE_ENTRY]: {
    textColor: 'text-violet-200',
    content: <>{t('login.context.puzzleEntry')}</>,
  },
});

export const getLoginValueProps = (t: Translate): string[] => [
  t('login.valueProps.saveProgress'),
  t('login.valueProps.raceFriends'),
  t('login.valueProps.trackStats'),
];
