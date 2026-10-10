import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageSelect from './LanguageSelect';
import ui from '../locales/en.json';
import { I18nProvider, LOCALE_STORAGE_KEY } from '../providers/I18nProvider';

const resources = {
  en: { app: {}, ui },
  fr: { app: {}, ui },
};

function renderSelect(supportedLocales: string[]) {
  return render(
    <I18nProvider
      resources={resources}
      defaultLocale="en"
      supportedLocales={supportedLocales}
    >
      <LanguageSelect />
    </I18nProvider>
  );
}

describe('LanguageSelect', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window.navigator, 'languages', {
      value: ['en-US'],
      configurable: true,
    });
  });

  it('renders nothing for a single supported locale', () => {
    const { container } = renderSelect(['en']);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing without a provider', () => {
    const { container } = render(<LanguageSelect />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists Automatic and one autonym per locale', () => {
    renderSelect(['en', 'fr']);
    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'Automatic',
      'English',
      'français',
    ]);
    expect(screen.getByLabelText('Language')).toBeInTheDocument();
  });

  it('calls setLocale with the chosen locale and clears on Automatic', async () => {
    const user = userEvent.setup();
    renderSelect(['en', 'fr']);
    const select = screen.getByRole('combobox');

    await user.selectOptions(select, 'fr');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('fr');
    expect(select).toHaveValue('fr');

    await user.selectOptions(select, 'Automatic');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull();
    expect(select).toHaveValue('');
  });
});
