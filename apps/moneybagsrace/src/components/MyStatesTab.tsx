'use client';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { ServerStateResult } from '@bubblyclouds-app/types/serverTypes';
import { MoneyBagsState } from '../types/state';

interface MyStatesTabProps {
  sessions: ServerStateResult<MoneyBagsState>[];
  app: string;
}

const monthLabel = (stateId: string): string => {
  const [year, month] = stateId.split('-');
  if (!year || !month) {
    return stateId;
  }
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

export default function MyStatesTab({ sessions, app }: MyStatesTabProps) {
  const sorted = [...sessions].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  if (!sorted.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-zinc-50 py-16 text-center dark:border-zinc-800 dark:bg-zinc-800/40">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          <Calendar className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
        </div>
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          No saved states yet
        </p>
        <p className="mt-1 max-w-[220px] text-xs text-zinc-400 dark:text-zinc-500">
          Head to Start to save your first monthly state
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {sorted.map((session) => {
        const prefix = `${app}-`;
        const stateId = session.sessionId.startsWith(prefix)
          ? session.sessionId.slice(prefix.length)
          : session.sessionId;
        return (
          <li key={session.sessionId}>
            <Link
              href={`/state?month=${stateId}`}
              className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] dark:border-zinc-700/60 dark:bg-zinc-800/60"
            >
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {monthLabel(stateId)}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {session.updatedAt.toLocaleDateString()}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
