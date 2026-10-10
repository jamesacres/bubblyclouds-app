'use client';

import type { i18n } from 'i18next';
import { useEffect, useRef } from 'react';

const TITLE_NAMESPACE = 'app';

export function useLocalizedDocumentTitle(i18n: i18n, locale: string) {
  const previous = useRef(locale);

  useEffect(() => {
    if (previous.current === locale) {
      return;
    }
    previous.current = locale;
    const options = { ns: TITLE_NAMESPACE, lng: locale };
    if (i18n.exists('meta.title', options)) {
      const translate = i18n.getFixedT(locale, TITLE_NAMESPACE);
      document.title = translate('meta.title');
    }
  }, [i18n, locale]);
}
