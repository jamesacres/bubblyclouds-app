const WHOLE_POUNDS_THRESHOLD_PENCE = 1_000_000; // £10,000

const wholePoundsFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const penceFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatPence = (pence: number): string => {
  if (Math.abs(pence) >= WHOLE_POUNDS_THRESHOLD_PENCE) {
    return wholePoundsFormatter.format(Math.round(pence / 100));
  }
  return penceFormatter.format(pence / 100);
};

export const parsePoundsToPence = (input: string): number | undefined => {
  const cleaned = input.replace(/[£,\s]/g, '');
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) {
    return undefined;
  }
  const [, sign, pounds, fraction] = match;
  const fractionPence = fraction ? Number(fraction.padEnd(2, '0')) : 0;
  const pence = Number(pounds) * 100 + fractionPence;
  if (!Number.isSafeInteger(pence)) {
    return undefined;
  }
  return sign === '-' ? -pence : pence;
};
