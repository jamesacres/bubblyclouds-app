'use client';
import { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Trash2,
} from 'lucide-react';
import { KIND_LABELS, WRAPPER_LABELS } from '../helpers/accountLabels';
import {
  AccountDefinition,
  AccountKind,
  InvestmentWrapper,
} from '../types/accounts';
import { MonthId } from '../types/monthId';

const createAccountId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `account-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const selectClassName =
  'rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white';

const rowSelectClassName =
  'rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-600 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white/70';

export const AccountManager = ({
  accounts,
  currentMonth,
  accountIdsWithData,
  onChange,
}: {
  accounts: AccountDefinition[];
  currentMonth: MonthId;
  accountIdsWithData: Set<string>;
  onChange: (accounts: AccountDefinition[]) => void;
}) => {
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState(AccountKind.INVESTMENT);
  const [newWrapper, setNewWrapper] = useState(InvestmentWrapper.ISA);
  const [showArchived, setShowArchived] = useState(false);
  const [draggingId, setDraggingId] = useState<string | undefined>(undefined);

  const isArchived = (account: AccountDefinition): boolean =>
    account.archivedMonth !== undefined &&
    account.archivedMonth <= currentMonth;

  const activeAccounts = accounts
    .filter((account) => !isArchived(account))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const archivedAccounts = accounts
    .filter(isArchived)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const updateAccount = (
    accountId: string,
    update: (account: AccountDefinition) => AccountDefinition
  ) => {
    onChange(
      accounts.map((account) =>
        account.accountId === accountId ? update(account) : account
      )
    );
  };

  const addAccount = () => {
    const name = newName.trim();
    if (!name) {
      return;
    }
    const nextSortOrder =
      accounts.reduce(
        (maximum, account) => Math.max(maximum, account.sortOrder),
        -1
      ) + 1;
    const account: AccountDefinition = {
      accountId: createAccountId(),
      kind: newKind,
      ...(newKind === AccountKind.INVESTMENT ? { wrapper: newWrapper } : {}),
      name,
      sortOrder: nextSortOrder,
      createdMonth: currentMonth,
    };
    onChange([...accounts, account]);
    setNewName('');
  };

  const changeKind = (accountId: string, kind: AccountKind) => {
    updateAccount(accountId, (account) => {
      if (kind === AccountKind.INVESTMENT) {
        return {
          ...account,
          kind,
          wrapper: account.wrapper ?? InvestmentWrapper.ISA,
        };
      }
      const next = { ...account, kind };
      delete next.wrapper;
      return next;
    });
  };

  const changeWrapper = (accountId: string, wrapper: InvestmentWrapper) => {
    updateAccount(accountId, (account) => ({ ...account, wrapper }));
  };

  const applyOrder = (ordered: AccountDefinition[]) => {
    const sortOrderByAccountId = new Map(
      ordered.map((account, position) => [account.accountId, position])
    );
    onChange(
      accounts.map((account) => {
        const sortOrder = sortOrderByAccountId.get(account.accountId);
        return sortOrder === undefined ? account : { ...account, sortOrder };
      })
    );
  };

  const move = (accountId: string, direction: -1 | 1) => {
    const index = activeAccounts.findIndex(
      (account) => account.accountId === accountId
    );
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= activeAccounts.length) {
      return;
    }
    const reordered = [...activeAccounts];
    [reordered[index], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[index],
    ];
    applyOrder(reordered);
  };

  const reorderByDrop = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) {
      return;
    }
    const fromIndex = activeAccounts.findIndex(
      (account) => account.accountId === draggedId
    );
    const toIndex = activeAccounts.findIndex(
      (account) => account.accountId === targetId
    );
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }
    const reordered = [...activeAccounts];
    const [dragged] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, dragged);
    applyOrder(reordered);
  };

  const removeAccount = (accountId: string) => {
    onChange(accounts.filter((account) => account.accountId !== accountId));
  };

  const archive = (accountId: string) => {
    updateAccount(accountId, (account) => ({
      ...account,
      archivedMonth: currentMonth,
    }));
  };

  const unarchive = (accountId: string) => {
    updateAccount(accountId, (account) => {
      const next = { ...account };
      delete next.archivedMonth;
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {activeAccounts.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-white/45">
          No accounts yet — add your first account below.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-white/10">
          {activeAccounts.map((account, index) => {
            const hasData = accountIdsWithData.has(account.accountId);
            return (
              <li
                key={account.accountId}
                draggable
                onDragStart={() => setDraggingId(account.accountId)}
                onDragEnd={() => setDraggingId(undefined)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggingId) {
                    reorderByDrop(draggingId, account.accountId);
                  }
                  setDraggingId(undefined);
                }}
                className={`flex flex-wrap items-center gap-2 py-2 ${
                  draggingId === account.accountId ? 'opacity-50' : ''
                }`}
              >
                <span
                  aria-hidden="true"
                  className="cursor-grab text-zinc-400 active:cursor-grabbing dark:text-white/30"
                >
                  <GripVertical className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  aria-label={`Rename ${account.name}`}
                  value={account.name}
                  onChange={(event) =>
                    updateAccount(account.accountId, (previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                <select
                  aria-label={`Type of ${account.name}`}
                  value={account.kind}
                  onChange={(event) => {
                    const kind = Object.values(AccountKind).find(
                      (candidate) => candidate === event.target.value
                    );
                    if (kind) {
                      changeKind(account.accountId, kind);
                    }
                  }}
                  className={rowSelectClassName}
                >
                  {Object.values(AccountKind).map((kind) => (
                    <option key={kind} value={kind}>
                      {KIND_LABELS[kind]}
                    </option>
                  ))}
                </select>
                {account.kind === AccountKind.INVESTMENT && (
                  <select
                    aria-label={`Wrapper of ${account.name}`}
                    value={account.wrapper ?? InvestmentWrapper.ISA}
                    onChange={(event) => {
                      const wrapper = Object.values(InvestmentWrapper).find(
                        (candidate) => candidate === event.target.value
                      );
                      if (wrapper) {
                        changeWrapper(account.accountId, wrapper);
                      }
                    }}
                    className={rowSelectClassName}
                  >
                    {Object.values(InvestmentWrapper).map((wrapper) => (
                      <option key={wrapper} value={wrapper}>
                        {WRAPPER_LABELS[wrapper]}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  aria-label={`Move ${account.name} up`}
                  disabled={index === 0}
                  onClick={() => move(account.accountId, -1)}
                  className="cursor-pointer rounded-lg p-1.5 text-zinc-500 transition-all duration-200 active:scale-95 disabled:opacity-30 dark:text-white/50"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  aria-label={`Move ${account.name} down`}
                  disabled={index === activeAccounts.length - 1}
                  onClick={() => move(account.accountId, 1)}
                  className="cursor-pointer rounded-lg p-1.5 text-zinc-500 transition-all duration-200 active:scale-95 disabled:opacity-30 dark:text-white/50"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                {hasData ? (
                  <button
                    aria-label={`Archive ${account.name}`}
                    onClick={() => archive(account.accountId)}
                    className="cursor-pointer rounded-lg p-1.5 text-zinc-500 transition-all duration-200 active:scale-95 dark:text-white/50"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    aria-label={`Delete ${account.name}`}
                    onClick={() => removeAccount(account.accountId)}
                    className="cursor-pointer rounded-lg p-1.5 text-red-500 transition-all duration-200 active:scale-95 dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-3 dark:border-white/10">
        <label
          htmlFor="new-account-name"
          className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40"
        >
          Add account
        </label>
        <input
          id="new-account-name"
          type="text"
          placeholder="Account name"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Account type"
            value={newKind}
            onChange={(event) => {
              const kind = Object.values(AccountKind).find(
                (candidate) => candidate === event.target.value
              );
              if (kind) {
                setNewKind(kind);
              }
            }}
            className={selectClassName}
          >
            {Object.values(AccountKind).map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABELS[kind]}
              </option>
            ))}
          </select>
          {newKind === AccountKind.INVESTMENT && (
            <select
              aria-label="Wrapper"
              value={newWrapper}
              onChange={(event) => {
                const wrapper = Object.values(InvestmentWrapper).find(
                  (candidate) => candidate === event.target.value
                );
                if (wrapper) {
                  setNewWrapper(wrapper);
                }
              }}
              className={selectClassName}
            >
              {Object.values(InvestmentWrapper).map((wrapper) => (
                <option key={wrapper} value={wrapper}>
                  {WRAPPER_LABELS[wrapper]}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={addAccount}
            disabled={!newName.trim()}
            className="bg-theme-primary cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {archivedAccounts.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowArchived((previous) => !previous)}
            className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 transition-all duration-200 active:scale-95 dark:text-white/40"
          >
            {showArchived ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            Archived ({archivedAccounts.length})
          </button>
          {showArchived && (
            <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-white/10">
              {archivedAccounts.map((account) => (
                <li
                  key={account.accountId}
                  className="flex items-center gap-2 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-500 dark:text-white/50">
                    {account.name}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:bg-white/10 dark:text-white/50">
                    {account.kind === AccountKind.INVESTMENT && account.wrapper
                      ? WRAPPER_LABELS[account.wrapper]
                      : KIND_LABELS[account.kind]}
                  </span>
                  <button
                    aria-label={`Unarchive ${account.name}`}
                    onClick={() => unarchive(account.accountId)}
                    className="cursor-pointer rounded-lg p-1.5 text-zinc-500 transition-all duration-200 active:scale-95 dark:text-white/50"
                  >
                    <ArchiveRestore className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
