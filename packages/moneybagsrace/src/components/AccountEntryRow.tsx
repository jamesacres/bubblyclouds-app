'use client';
import { accountBadgeLabel } from '../helpers/accountLabels';
import { formatPence } from '../helpers/money';
import { AccountKind, InvestmentWrapper } from '../types/accounts';
import { CurrencyInput } from './CurrencyInput';

export const AccountEntryRow = ({
  accountId,
  kind,
  wrapper,
  name,
  balancePence,
  previousBalancePence,
  onChangeBalance,
}: {
  accountId: string;
  kind: AccountKind;
  wrapper?: InvestmentWrapper;
  name: string;
  balancePence: number;
  previousBalancePence?: number;
  onChangeBalance: (balancePence: number) => void;
}) => (
  <div className="flex flex-col gap-1 py-3">
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-zinc-900 dark:text-white">
        {name}
      </span>
      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:bg-white/10 dark:text-white/50">
        {accountBadgeLabel(kind, wrapper)}
      </span>
    </div>
    <CurrencyInput
      id={`account-${accountId}`}
      label={
        kind === AccountKind.CREDIT_CARD ? 'Amount owed' : 'Current balance'
      }
      valuePence={balancePence}
      onChangePence={onChangeBalance}
      allowNegative={kind !== AccountKind.CREDIT_CARD}
    />
    {previousBalancePence !== undefined && (
      <p className="text-xs text-zinc-400 dark:text-white/35">
        Last month: {formatPence(previousBalancePence)}
      </p>
    )}
  </div>
);
