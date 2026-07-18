import { MonthId } from '../types/monthId';

const MONTH_ID_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const parseMonthId = (monthId: MonthId): { year: number; month: number } => {
  const [year, month] = monthId.split('-');
  return { year: Number(year), month: Number(month) };
};

const toMonthId = (year: number, month: number): MonthId =>
  `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;

export const currentMonthId = (): MonthId => {
  const now = new Date();
  return toMonthId(now.getUTCFullYear(), now.getUTCMonth() + 1);
};

export const isValidMonthId = (monthId: string): boolean =>
  MONTH_ID_REGEX.test(monthId);

export const addMonths = (monthId: MonthId, delta: number): MonthId => {
  const { year, month } = parseMonthId(monthId);
  const total = year * 12 + (month - 1) + delta;
  return toMonthId(Math.floor(total / 12), (((total % 12) + 12) % 12) + 1);
};

export const previousMonthId = (monthId: MonthId): MonthId =>
  addMonths(monthId, -1);

export const nextMonthId = (monthId: MonthId): MonthId => addMonths(monthId, 1);

export const monthsBetween = (from: MonthId, to: MonthId): number => {
  const a = parseMonthId(from);
  const b = parseMonthId(to);
  return (b.year - a.year) * 12 + (b.month - a.month);
};

export const monthIdToLabel = (monthId: MonthId): string => {
  const { year, month } = parseMonthId(monthId);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

export const monthIdToLongLabel = (monthId: MonthId): string => {
  const { year, month } = parseMonthId(monthId);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
};
