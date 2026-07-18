'use client';
import { CountUp } from '@bubblyclouds-app/ui/components/CountUp';
import { formatPence } from '../helpers/money';
import { ChangeStat } from '../helpers/networth';
import { changeColorClass, changeText } from './StatCard';

interface NetWorthHeadlineProps {
  valuePence: number;
  change?: ChangeStat;
}

const NetWorthHeadline = ({ valuePence, change }: NetWorthHeadlineProps) => {
  return (
    <div data-testid="net-worth-headline">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">
        Household net worth
      </p>
      <CountUp
        value={valuePence}
        format={formatPence}
        className="block text-[2.6rem] font-black leading-[1.1] tracking-tight text-white md:text-5xl"
      />
      {change && (
        <p
          data-testid="net-worth-headline-change"
          className={`mt-1 text-sm font-semibold ${changeColorClass(change)}`}
        >
          {changeText(change)} vs last month
        </p>
      )}
    </div>
  );
};

export default NetWorthHeadline;
