export function formatDate(date: string, locale: string = 'en-GB'): string {
  const dateObj = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC', // Force UTC to ensure consistency
  };
  return dateObj.toLocaleDateString(locale, options);
}

export function formatDateWithDay(
  date: string,
  locale: string = 'en-GB'
): string {
  const dateObj = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC', // Force UTC to ensure consistency
  };
  // Format and remove comma to match production format
  return dateObj.toLocaleDateString(locale, options).replace(/,/g, '');
}
