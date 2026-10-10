import { createInstance, type i18n, type Resource } from 'i18next';

export const FALLBACK_LOCALE = 'en';
export const DEFAULT_NAMESPACE = 'app';

interface CreateI18nOptions {
  locale?: string;
  defaultLocale?: string;
  supportedLocales?: readonly string[];
  defaultNS?: string;
}

function collectNamespaces(resources: Resource): string[] {
  const namespaces = new Set<string>();
  for (const bundle of Object.values(resources)) {
    for (const namespace of Object.keys(bundle)) {
      namespaces.add(namespace);
    }
  }
  return Array.from(namespaces);
}

export function createI18n(
  resources: Resource,
  options: CreateI18nOptions = {}
): i18n {
  const defaultLocale = options.defaultLocale ?? FALLBACK_LOCALE;
  const supportedLocales = options.supportedLocales ?? Object.keys(resources);
  const instance = createInstance();
  instance.init({
    resources,
    lng: options.locale ?? defaultLocale,
    fallbackLng: defaultLocale,
    supportedLngs: [...supportedLocales],
    ns: collectNamespaces(resources),
    defaultNS: options.defaultNS ?? DEFAULT_NAMESPACE,
    initAsync: false,
    returnNull: false,
    interpolation: { escapeValue: false },
  });
  return instance;
}
