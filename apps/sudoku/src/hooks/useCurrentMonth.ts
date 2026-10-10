import { useTranslation } from 'react-i18next';

export function useCurrentMonth(now: Date = new Date()): {
  englishMonth: string;
  localizedMonth: string;
} {
  const { i18n } = useTranslation('app');
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    timeZone: 'UTC',
  };

  return {
    englishMonth: now.toLocaleString('en-US', options),
    localizedMonth: now.toLocaleString(i18n.language, options),
  };
}
