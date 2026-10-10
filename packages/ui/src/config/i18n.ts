import { createInstance, type i18n, type Resource } from 'i18next';
import { fallbackTags } from '../helpers/resolveLocale';

export const FALLBACK_LOCALE = 'en';
export const DEFAULT_NAMESPACE = 'app';

export type LocaleBundles = Record<string, unknown>;
export type LocaleLoader = () => Promise<LocaleBundles>;
type BundleModule = { default: unknown };

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

export function buildFallbackMap(
  supportedLocales: readonly string[],
  defaultLocale: string
): Record<string, string[]> {
  const byLowercase = new Map(
    supportedLocales.map((tag) => [tag.toLowerCase(), tag])
  );
  const map: Record<string, string[]> = { default: [defaultLocale] };
  for (const tag of supportedLocales) {
    if (tag === defaultLocale) {
      continue;
    }
    const chain = fallbackTags(tag)
      .map((candidate) => byLowercase.get(candidate))
      .filter((candidate): candidate is string => candidate !== undefined)
      .filter((candidate) => candidate !== tag && candidate !== defaultLocale);
    map[tag] = Array.from(new Set([...chain, defaultLocale]));
  }
  return map;
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
    fallbackLng: buildFallbackMap(supportedLocales, defaultLocale),
    supportedLngs: [...supportedLocales],
    ns: collectNamespaces(resources),
    defaultNS: options.defaultNS ?? DEFAULT_NAMESPACE,
    initAsync: false,
    returnNull: false,
    interpolation: { escapeValue: false },
  });
  return instance;
}

export function addLocaleBundles(
  instance: i18n,
  tag: string,
  bundles: LocaleBundles
): void {
  for (const [namespace, bundle] of Object.entries(bundles)) {
    instance.addResourceBundle(tag, namespace, bundle, true, true);
  }
}

export function createLocaleLoader(
  modules: Record<string, () => Promise<BundleModule>>
): LocaleLoader {
  return async () => {
    const entries = await Promise.all(
      Object.entries(modules).map(
        async ([namespace, load]): Promise<[string, unknown]> => [
          namespace,
          (await load()).default,
        ]
      )
    );
    return Object.fromEntries(entries);
  };
}
