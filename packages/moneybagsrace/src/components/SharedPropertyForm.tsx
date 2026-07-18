'use client';
import { formatPence } from '../helpers/money';
import { CurrencyInput } from './CurrencyInput';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const relativeTimeLabel = (isoDate: string, now: Date): string => {
  const elapsedMs = now.getTime() - Date.parse(isoDate);
  if (elapsedMs < MINUTE_MS) {
    return 'just now';
  }
  if (elapsedMs < HOUR_MS) {
    const minutes = Math.floor(elapsedMs / MINUTE_MS);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (elapsedMs < DAY_MS) {
    const hours = Math.floor(elapsedMs / HOUR_MS);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(elapsedMs / DAY_MS);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export const SharedPropertyForm = ({
  houseValuePence,
  mortgageBalancePence,
  onChange,
  updatedAt,
  updatedByNickname,
}: {
  houseValuePence: number;
  mortgageBalancePence: number;
  onChange: (houseValuePence: number, mortgageBalancePence: number) => void;
  updatedAt?: string;
  updatedByNickname?: string;
}) => (
  <div className="flex flex-col gap-3">
    <CurrencyInput
      id="shared-house-value"
      label="House value"
      valuePence={houseValuePence}
      onChangePence={(pence) => onChange(pence, mortgageBalancePence)}
    />
    <CurrencyInput
      id="shared-mortgage-balance"
      label="Mortgage balance"
      valuePence={mortgageBalancePence}
      onChangePence={(pence) => onChange(houseValuePence, pence)}
    />
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40">
        Property equity
      </span>
      <span className="text-sm font-bold tabular-nums text-zinc-900 dark:text-white">
        {formatPence(houseValuePence - mortgageBalancePence)}
      </span>
    </div>
    {updatedAt && updatedByNickname && (
      <p className="text-xs text-zinc-400 dark:text-white/35">
        Updated by {updatedByNickname}{' '}
        {relativeTimeLabel(updatedAt, new Date())}
      </p>
    )}
  </div>
);
