const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const localizedMonthName = (month: string, language: string): string => {
  const index = ENGLISH_MONTHS.indexOf(month);
  if (index === -1) {
    return month;
  }
  return new Date(Date.UTC(2000, index, 1)).toLocaleDateString(language, {
    month: 'long',
    timeZone: 'UTC',
  });
};
