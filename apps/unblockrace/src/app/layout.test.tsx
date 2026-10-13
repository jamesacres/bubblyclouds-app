import { generateMetadata } from './layout';
import { DEFAULT_LOCALE } from '../i18n';
import en from '../locales/en.json';

jest.mock('next/font/google', () => {
  const font = () => ({ variable: 'font-var', className: 'font-class' });
  return { Outfit: font, Orbitron: font, Pacifico: font };
});
jest.mock('./globals.css', () => ({}));
jest.mock('./providers', () => ({ Providers: () => null }));
jest.mock('@bubblyclouds-app/template/components/ErrorBoundary', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@bubblyclouds-app/template/components/GlobalErrorHandler', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../components/AppHeader', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../components/UnblockRacePlusModal', () => ({
  __esModule: true,
  default: () => null,
}));

describe('layout generateMetadata', () => {
  it('sources title and description from the default locale file', () => {
    const metadata = generateMetadata();

    expect(DEFAULT_LOCALE).toBe('en');
    expect(metadata.title).toBe(en.brand.appName);
    expect(metadata.description).toBe(en.meta.description);
  });

  it('keeps the icons', () => {
    const { icons } = generateMetadata();

    expect(Array.isArray(icons)).toBe(true);
    expect(icons).toHaveLength(7);
  });
});
