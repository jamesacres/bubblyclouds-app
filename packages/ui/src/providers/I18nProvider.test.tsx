import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
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

describe('I18nProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
    setNavigatorLanguages(['en-US']);
  });

  it('falls back to the default locale', () => {
    renderProvider();
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('greeting')).toHaveTextContent('Hello');
    expect(document.documentElement.lang).toBe('en');
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
