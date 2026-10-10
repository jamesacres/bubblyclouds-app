'use client';

import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation('app');

  return <div className="text-center">{t('notFound.message')}</div>;
}
