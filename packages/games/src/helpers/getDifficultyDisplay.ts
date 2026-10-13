import { Translate } from '../types/i18n';

export const getDifficultyDisplay = (difficulty: string, t: Translate) => {
  const difficultyMap: {
    [key: string]: { name: string; badgeColor: string };
  } = {
    simple: {
      name: `⚡️ ${t('difficulty.daily.simple')}`,
      badgeColor: 'bg-green-500 text-white',
    },
    easy: {
      name: `🔥 ${t('difficulty.daily.easy')}`,
      badgeColor: 'bg-yellow-500 text-white',
    },
    intermediate: {
      name: `🚀 ${t('difficulty.daily.intermediate')}`,
      badgeColor: 'bg-red-500 text-white',
    },
    expert: {
      name: `🔴 ${t('difficulty.daily.expert')}`,
      badgeColor: 'bg-red-500 text-white',
    },

    '1-very-easy': {
      name: `🟢 ${t('difficulty.book.veryEasy')}`,
      badgeColor: 'bg-green-400 text-white',
    },
    '2-easy': {
      name: `🟢 ${t('difficulty.book.easy')}`,
      badgeColor: 'bg-green-500 text-white',
    },
    '3-moderately-easy': {
      name: `🟡 ${t('difficulty.book.moderatelyEasy')}`,
      badgeColor: 'bg-lime-600 text-white',
    },
    '4-moderate': {
      name: `🟡 ${t('difficulty.book.moderate')}`,
      badgeColor: 'bg-yellow-600 text-white',
    },
    '5-moderately-hard': {
      name: `🟠 ${t('difficulty.book.moderatelyHard')}`,
      badgeColor: 'bg-orange-500 text-white',
    },
    '6-hard': {
      name: `🔴 ${t('difficulty.book.hard')}`,
      badgeColor: 'bg-red-500 text-white',
    },
    '7-vicious': {
      name: `🔥 ${t('difficulty.book.vicious')}`,
      badgeColor: 'bg-red-600 text-white',
    },
    '8-fiendish': {
      name: `🔥 ${t('difficulty.book.fiendish')}`,
      badgeColor: 'bg-red-700 text-white',
    },
    '9-devilish': {
      name: `🔥 ${t('difficulty.book.devilish')}`,
      badgeColor: 'bg-red-800 text-white',
    },
    '10-hell': {
      name: `🔥🔥 ${t('difficulty.book.hell')}`,
      badgeColor: 'bg-red-900 text-white',
    },
    '11-beyond-hell': {
      name: `🔥🔥🔥 ${t('difficulty.book.beyondHell')}`,
      badgeColor: 'bg-black text-white',
    },
  };

  return (
    difficultyMap[difficulty] || {
      name: difficulty,
      badgeColor: 'bg-gray-500 text-white',
    }
  );
};
