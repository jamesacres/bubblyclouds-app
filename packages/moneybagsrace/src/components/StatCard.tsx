'use client';
import { formatPence } from '../helpers/money';
import { ChangeStat } from '../helpers/networth';

export const changeText = (change: ChangeStat): string => {
  const sign = change.absolutePence >= 0 ? '+' : '';
  return `${sign}${formatPence(change.absolutePence)} (${sign}${change.percent.toFixed(1)}%)`;
};

export const changeColorClass = (change: ChangeStat): string =>
  change.absolutePence >= 0 ? 'text-emerald-400' : 'text-rose-400';

interface StatCardProps {
  label: string;
  valuePence: number;
  change?: ChangeStat;
}

const StatCard = ({ label, valuePence, change }: StatCardProps) => {
  return (
    <div
      data-testid="stat-card"
      className="rounded-2xl border border-white/10 bg-white/5 p-4"
    >
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">
        {label}
      </p>
      <p className="text-xl font-black leading-tight text-white">
        {formatPence(valuePence)}
      </p>
      {change && (
        <p
          data-testid="stat-card-change"
          className={`mt-1 text-xs font-semibold ${changeColorClass(change)}`}
        >
          {changeText(change)}
        </p>
      )}
    </div>
  );
};

export default StatCard;
