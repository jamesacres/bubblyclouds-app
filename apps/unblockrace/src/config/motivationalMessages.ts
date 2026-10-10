import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function useMotivationalMessages(): string[] {
  const { t } = useTranslation('app');

  return useMemo(() => {
    const messages: unknown = t('motivational.messages', {
      returnObjects: true,
    });
    if (
      Array.isArray(messages) &&
      messages.every((message) => typeof message === 'string')
    ) {
      return messages;
    }
    return [];
  }, [t]);
}
