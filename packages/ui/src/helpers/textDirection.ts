const RTL_LANGUAGES = ['ar', 'he', 'ur', 'fa'];

export type TextDirection = 'ltr' | 'rtl';

function readDirection(info: unknown): TextDirection | null {
  if (typeof info !== 'object' || info === null || !('direction' in info)) {
    return null;
  }
  if (info.direction === 'rtl' || info.direction === 'ltr') {
    return info.direction;
  }
  return null;
}

function intlDirection(tag: string): TextDirection | null {
  try {
    const locale = new Intl.Locale(tag);
    if ('getTextInfo' in locale && typeof locale.getTextInfo === 'function') {
      return readDirection(locale.getTextInfo());
    }
    if ('textInfo' in locale) {
      return readDirection(locale.textInfo);
    }
  } catch {
    return null;
  }
  return null;
}

export function getTextDirection(tag: string): TextDirection {
  const fromIntl = intlDirection(tag);
  if (fromIntl) {
    return fromIntl;
  }
  const language = tag.trim().replace(/_/g, '-').split('-')[0].toLowerCase();
  return RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
}
