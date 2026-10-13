'use client';

import { useTranslation } from 'react-i18next';
import HeaderWrapper from '@bubblyclouds-app/template/components/HeaderWrapper';
import { APP_CONFIG } from '../../app.config.js';

export default function AppHeader() {
  const { t } = useTranslation('app');
  return (
    <HeaderWrapper
      app={APP_CONFIG.app}
      appName={t('brand.appName')}
      apiUrl={APP_CONFIG.apiUrl}
      privacyUrl={APP_CONFIG.privacyUrl}
      termsUrl={APP_CONFIG.termsUrl}
      creditsUrl={APP_CONFIG.creditsUrl}
      companyUrl={APP_CONFIG.companyUrl}
      companyName={t('brand.companyName')}
    />
  );
}
