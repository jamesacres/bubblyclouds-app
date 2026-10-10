'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Resource } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import {
  addLocaleBundles,
  createI18n,
  FALLBACK_LOCALE,
  type LocaleLoader,
} from '../config/i18n';
import { useLocalizedDocumentTitle } from '../hooks/useLocalizedDocumentTitle';
import { resolveLocale } from '../helpers/resolveLocale';
import { getTextDirection } from '../helpers/textDirection';

export const LOCALE_STORAGE_KEY = 'bubblyclouds.locale';

interface LocaleContextType {
  locale: string;
  supportedLocales: readonly string[];
  preference: string | null;
  setLocale: (locale: string | null) => void;
}

const defaultContext: LocaleContextType = {
  locale: FALLBACK_LOCALE,
  supportedLocales: [FALLBACK_LOCALE],
  preference: null,
  setLocale: () => {},
};

const LocaleContext = createContext<LocaleContextType>(defaultContext);

interface I18nProviderProps {
  resources: Resource;
  defaultLocale: string;
  supportedLocales: readonly string[];
  localeLoaders?: Readonly<Record<string, LocaleLoader | undefined>>;
  children: React.ReactNode;
}

function readStoredLocale(supportedLocales: readonly string[]): string | null {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const resolved = resolveLocale([stored], supportedLocales, '');
    return resolved || null;
  } catch {
    return null;
  }
}

function writeStoredLocale(locale: string | null) {
  try {
    if (locale === null) {
      localStorage.removeItem(LOCALE_STORAGE_KEY);
    } else {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
  } catch {
    return;
  }
}

function detectLocale(
  supportedLocales: readonly string[],
  defaultLocale: string
): string {
  const languages =
    typeof navigator !== 'undefined' && navigator.languages
      ? navigator.languages
      : [];
  return resolveLocale(languages, supportedLocales, defaultLocale);
}

export function I18nProvider({
  resources,
  defaultLocale,
  supportedLocales,
  localeLoaders,
  children,
}: I18nProviderProps) {
  const [i18n] = useState(() =>
    createI18n(resources, { defaultLocale, supportedLocales })
  );
  const [locale, setActiveLocale] = useState(defaultLocale);
  const [preference, setPreference] = useState<string | null>(null);

  const loaded = useRef(new Set(Object.keys(resources)));
  const request = useRef(0);

  useLocalizedDocumentTitle(i18n, locale);

  const commit = useCallback(
    (nextLocale: string) => {
      setActiveLocale(nextLocale);
      i18n.changeLanguage(nextLocale);
      document.documentElement.lang = nextLocale;
      document.documentElement.dir = getTextDirection(nextLocale);
    },
    [i18n]
  );

  const apply = useCallback(
    (nextLocale: string) => {
      request.current += 1;
      const current = request.current;
      const loader = localeLoaders?.[nextLocale];
      if (loaded.current.has(nextLocale) || !loader) {
        commit(nextLocale);
        return;
      }
      loader()
        .then((bundles) => {
          addLocaleBundles(i18n, nextLocale, bundles);
          loaded.current.add(nextLocale);
          if (request.current === current) {
            commit(nextLocale);
          }
        })
        .catch(() => undefined);
    },
    [i18n, commit, localeLoaders]
  );

  useEffect(() => {
    const stored = readStoredLocale(supportedLocales);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreference(stored);
    apply(stored ?? detectLocale(supportedLocales, defaultLocale));
    return () => {
      request.current += 1;
    };
  }, [apply, supportedLocales, defaultLocale]);

  const setLocale = useCallback(
    (requested: string | null) => {
      if (requested === null) {
        writeStoredLocale(null);
        setPreference(null);
        apply(detectLocale(supportedLocales, defaultLocale));
        return;
      }
      const resolved = resolveLocale([requested], supportedLocales, '');
      if (!resolved) {
        return;
      }
      writeStoredLocale(resolved);
      setPreference(resolved);
      apply(resolved);
    },
    [apply, supportedLocales, defaultLocale]
  );

  const value = useMemo(
    () => ({ locale, supportedLocales, preference, setLocale }),
    [locale, supportedLocales, preference, setLocale]
  );

  return (
    <I18nextProvider i18n={i18n}>
      <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
    </I18nextProvider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
