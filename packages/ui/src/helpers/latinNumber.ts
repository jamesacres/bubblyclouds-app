const LATIN_NUMBERING_SYSTEM = 'latn';

function withLatinNumbering(locale: string): string {
  if (/-u-/i.test(locale)) {
    return locale;
  }
  return `${locale}-u-nu-${LATIN_NUMBERING_SYSTEM}`;
}

export function formatLatinNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(withLatinNumbering(locale), options).format(
      value
    );
  } catch {
    return new Intl.NumberFormat(
      `en-u-nu-${LATIN_NUMBERING_SYSTEM}`,
      options
    ).format(value);
  }
}
