import { Translate } from '@bubblyclouds-app/games/types/i18n';

// Calendar-date label for the daily run's end-game summary card, e.g.
// "Daily · Aug 8". A real date needs no arbitrary launch-date baseline and
// reads the same for every player who raced that day.
export const getDailyLabel = (
  t: Translate,
  language: string,
  date: Date = new Date()
): string =>
  t('daily.label', {
    date: date.toLocaleDateString(language, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }),
  });
