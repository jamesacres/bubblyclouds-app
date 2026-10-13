import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import type { LocaleLoader } from '../config/i18n';
import { I18nProvider, LOCALE_STORAGE_KEY, useLocale } from './I18nProvider';

const resources = {
  en: { app: { greeting: 'Hello' } },
  fr: { app: { greeting: 'Bonjour' } },
  'zh-CN': { app: { greeting: '你好' } },
};
const supportedLocales = ['en', 'fr', 'zh-CN'];

function setNavigatorLanguages(languages: string[]) {
  Object.defineProperty(window.navigator, 'languages', {
    value: languages,
    configurable: true,
  });
}

function Probe() {
  const { t } = useTranslation('app');
  const { locale, preference, setLocale } = useLocale();
  return (
    <div>
      <span data-testid="greeting">{t('greeting')}</span>
      <span data-testid="locale">{locale}</span>
      <span data-testid="preference">{preference ?? 'none'}</span>
      <button onClick={() => setLocale('fr')}>fr</button>
      <button onClick={() => setLocale('de')}>de</button>
      <button onClick={() => setLocale('ar')}>ar</button>
      <button onClick={() => setLocale(null)}>auto</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <I18nProvider
      resources={resources}
      defaultLocale="en"
      supportedLocales={supportedLocales}
    >
      <Probe />
    </I18nProvider>
  );
}

describe('I18nProvider lazy locales', () => {
  const makeResources = () => ({
    en: { app: { greeting: 'Hello', meta: { title: 'Game' } } },
  });
  const lazySupported = ['en', 'de', 'ar'];

  function makeLoaders() {
    const de = jest.fn<ReturnType<LocaleLoader>, []>(() =>
      Promise.resolve({
        app: { greeting: 'Hallo', meta: { title: 'Spiel' } },
      })
    );
    const ar = jest.fn<ReturnType<LocaleLoader>, []>(() =>
      Promise.resolve({
        app: { greeting: 'مرحبا', meta: { title: 'لعبة' } },
      })
    );
    return { de, ar, loaders: { de, ar } };
  }

  function renderLazy(loaders: Record<string, LocaleLoader | undefined>) {
    return render(
      <I18nProvider
        resources={makeResources()}
        defaultLocale="en"
        supportedLocales={lazySupported}
        localeLoaders={loaders}
      >
        <Probe />
      </I18nProvider>
    );
  }

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
    document.documentElement.dir = '';
    document.title = 'Original';
    setNavigatorLanguages(['en-US']);
  });

  it('keeps English on the first render and swaps after the chunk loads', async () => {
    setNavigatorLanguages(['de-DE']);
    const { de, loaders } = makeLoaders();
    renderLazy(loaders);

    expect(screen.getByTestId('greeting')).toHaveTextContent('Hello');
    await waitFor(() =>
      expect(screen.getByTestId('locale')).toHaveTextContent('de')
    );
    expect(screen.getByTestId('greeting')).toHaveTextContent('Hallo');
    expect(document.documentElement.lang).toBe('de');
    expect(document.documentElement.dir).toBe('ltr');
    expect(de).toHaveBeenCalledTimes(1);
  });

  it('does not load a locale that is already loaded', async () => {
    const { de, loaders } = makeLoaders();
    renderLazy(loaders);
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(de).not.toHaveBeenCalled();
  });

  it('sets dir to rtl for a right-to-left locale', async () => {
    setNavigatorLanguages(['ar-EG']);
    const { loaders } = makeLoaders();
    renderLazy(loaders);

    await waitFor(() =>
      expect(screen.getByTestId('locale')).toHaveTextContent('ar')
    );
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(screen.getByTestId('greeting')).toHaveTextContent('مرحبا');
  });

  it('flips dir back when switching to a left-to-right locale', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'ar');
    const { loaders } = makeLoaders();
    renderLazy(loaders);
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));

    act(() => {
      screen.getByText('de').click();
    });
    await waitFor(() =>
      expect(screen.getByTestId('locale')).toHaveTextContent('de')
    );
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('honours a stored choice and loads it lazily', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'de');
    setNavigatorLanguages(['ar']);
    const { de, ar, loaders } = makeLoaders();
    renderLazy(loaders);

    await waitFor(() =>
      expect(screen.getByTestId('greeting')).toHaveTextContent('Hallo')
    );
    expect(screen.getByTestId('preference')).toHaveTextContent('de');
    expect(de).toHaveBeenCalledTimes(1);
    expect(ar).not.toHaveBeenCalled();
  });

  it('setLocale(null) re-detects and loads the detected locale', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'de');
    setNavigatorLanguages(['ar']);
    const { loaders } = makeLoaders();
    renderLazy(loaders);
    await waitFor(() =>
      expect(screen.getByTestId('locale')).toHaveTextContent('de')
    );

    act(() => {
      screen.getByText('auto').click();
    });

    await waitFor(() =>
      expect(screen.getByTestId('locale')).toHaveTextContent('ar')
    );
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull();
    expect(screen.getByTestId('preference')).toHaveTextContent('none');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('keeps the current locale when a chunk fails to load', async () => {
    setNavigatorLanguages(['de']);
    const failing = jest.fn<ReturnType<LocaleLoader>, []>(() =>
      Promise.reject(new Error('chunk failed'))
    );
    renderLazy({ de: failing });
    await waitFor(() => expect(failing).toHaveBeenCalled());
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(document.documentElement.lang).not.toBe('de');
  });

  it('updates document.title from meta.title when the locale changes', async () => {
    const { loaders } = makeLoaders();
    renderLazy(loaders);
    expect(document.title).toBe('Original');

    localStorage.setItem(LOCALE_STORAGE_KEY, 'de');
    act(() => {
      screen.getByText('de').click();
    });

    await waitFor(() => expect(document.title).toBe('Spiel'));
  });

  it('leaves document.title alone when the namespace has no meta.title', async () => {
    setNavigatorLanguages(['de']);
    renderProviderWithoutTitle();
    await waitFor(() =>
      expect(screen.getByTestId('locale')).toHaveTextContent('de')
    );
    expect(document.title).toBe('Original');
  });

  function renderProviderWithoutTitle() {
    return render(
      <I18nProvider
        resources={{ en: { app: { greeting: 'Hello' } } }}
        defaultLocale="en"
        supportedLocales={['en', 'de']}
        localeLoaders={{
          de: () => Promise.resolve({ app: { greeting: 'Hallo' } }),
        }}
      >
        <Probe />
      </I18nProvider>
    );
  }
});

describe('I18nProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
    document.documentElement.dir = '';
    document.title = 'Original';
    setNavigatorLanguages(['en-US']);
  });

  it('falls back to the default locale', () => {
    renderProvider();
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('greeting')).toHaveTextContent('Hello');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('detects the locale from navigator.languages in preference order', () => {
    setNavigatorLanguages(['de', 'fr-CA', 'en']);
    renderProvider();
    expect(screen.getByTestId('locale')).toHaveTextContent('fr');
    expect(screen.getByTestId('greeting')).toHaveTextContent('Bonjour');
    expect(document.documentElement.lang).toBe('fr');
    expect(screen.getByTestId('preference')).toHaveTextContent('none');
  });

  it('prefers the stored choice over navigator.languages', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN');
    setNavigatorLanguages(['fr']);
    renderProvider();
    expect(screen.getByTestId('locale')).toHaveTextContent('zh-CN');
    expect(screen.getByTestId('preference')).toHaveTextContent('zh-CN');
    expect(screen.getByTestId('greeting')).toHaveTextContent('你好');
  });

  it('ignores an unsupported stored choice', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'de');
    setNavigatorLanguages(['fr']);
    renderProvider();
    expect(screen.getByTestId('locale')).toHaveTextContent('fr');
    expect(screen.getByTestId('preference')).toHaveTextContent('none');
  });

  it('renders the default locale on the first render before detection', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
    const seen: string[] = [];
    function Recorder() {
      const { locale } = useLocale();
      seen.push(locale);
      return null;
    }
    render(
      <I18nProvider
        resources={resources}
        defaultLocale="en"
        supportedLocales={supportedLocales}
      >
        <Recorder />
      </I18nProvider>
    );
    expect(seen[0]).toBe('en');
    expect(seen[seen.length - 1]).toBe('fr');
  });

  it('setLocale persists the choice and switches language', () => {
    renderProvider();
    act(() => {
      screen.getByText('fr').click();
    });
    expect(screen.getByTestId('locale')).toHaveTextContent('fr');
    expect(screen.getByTestId('greeting')).toHaveTextContent('Bonjour');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
  });

  it('setLocale ignores unsupported locales', () => {
    renderProvider();
    act(() => {
      screen.getByText('de').click();
    });
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull();
  });

  it('setLocale(null) clears the stored choice and re-detects', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN');
    setNavigatorLanguages(['fr']);
    renderProvider();
    expect(screen.getByTestId('locale')).toHaveTextContent('zh-CN');

    act(() => {
      screen.getByText('auto').click();
    });

    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull();
    expect(screen.getByTestId('preference')).toHaveTextContent('none');
    expect(screen.getByTestId('locale')).toHaveTextContent('fr');
  });

  it('survives unavailable storage', () => {
    const getItem = jest
      .spyOn(window.localStorage, 'getItem')
      .mockImplementation(() => {
        throw new Error('denied');
      });
    const setItem = jest
      .spyOn(window.localStorage, 'setItem')
      .mockImplementation(() => {
        throw new Error('denied');
      });
    renderProvider();
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    act(() => {
      screen.getByText('fr').click();
    });
    expect(screen.getByTestId('locale')).toHaveTextContent('fr');
    getItem.mockRestore();
    setItem.mockRestore();
  });
});

describe('useLocale without a provider', () => {
  it('returns a single-locale default', () => {
    function Bare() {
      const { locale, supportedLocales: locales } = useLocale();
      return (
        <span data-testid="bare">
          {locale}:{locales.length}
        </span>
      );
    }
    render(<Bare />);
    expect(screen.getByTestId('bare')).toHaveTextContent('en:1');
  });
});
