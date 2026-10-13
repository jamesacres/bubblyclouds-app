'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../providers/I18nProvider';

const AUTOMATIC_VALUE = '';

function getAutonym(tag: string): string {
  try {
    const name = new Intl.DisplayNames([tag], { type: 'language' }).of(tag);
    return name ?? tag;
  } catch {
    return tag;
  }
}

interface LanguageSelectProps {
  className?: string;
}

export default function LanguageSelect({ className }: LanguageSelectProps) {
  const { t } = useTranslation('ui');
  const { supportedLocales, preference, setLocale } = useLocale();
  const options = useMemo(
    () => supportedLocales.map((tag) => ({ tag, label: getAutonym(tag) })),
    [supportedLocales]
  );

  if (supportedLocales.length < 2) {
    return null;
  }

  return (
    <label className={className ?? 'flex flex-col gap-1 text-sm'}>
      <span>{t('language.label')}</span>
      <select
        value={preference ?? AUTOMATIC_VALUE}
        onChange={(event) => setLocale(event.target.value || null)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
      >
        <option value={AUTOMATIC_VALUE}>{t('language.automatic')}</option>
        {options.map(({ tag, label }) => (
          <option key={tag} value={tag}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
