'use client';
import { useState } from 'react';
import { Users, RotateCcw } from 'lucide-react';
import { Party } from '@bubblyclouds-app/types/serverTypes';
import { UserProfile } from '@bubblyclouds-app/types/userProfile';

interface RacingTeamsTabProps {
  user: UserProfile | undefined;
  parties: Party[] | undefined;
  onRefresh?: () => Promise<void>;
}

export default function RacingTeamsTab({
  user,
  parties,
  onRefresh,
}: RacingTeamsTabProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!parties || parties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-zinc-50 py-16 text-center dark:border-zinc-800 dark:bg-zinc-800/40">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          <Users className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
        </div>
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          No racing teams yet
        </p>
        <p className="mt-1 max-w-[240px] text-xs text-zinc-400 dark:text-zinc-500">
          Invite friends and family to join your team
        </p>
      </div>
    );
  }

  return (
    <div>
      {onRefresh && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex cursor-pointer items-center gap-1.5 px-2 py-2 text-xs text-zinc-400 transition-all duration-200 hover:text-zinc-600 active:scale-95 disabled:opacity-50 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            <RotateCcw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      )}
      <ul className="space-y-3">
        {parties.map(({ partyId, partyName, members }) => (
          <li key={partyId}>
            <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:border-zinc-700/60 dark:bg-zinc-800/60">
              <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-700/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-700">
                  <Users className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
                  {partyName}
                </h3>
                <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                  {members.filter(({ userId }) => userId !== user?.sub).length}{' '}
                  members
                </span>
              </div>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-700/40">
                {members
                  .filter(({ userId }) => userId !== user?.sub)
                  .map(({ userId, memberNickname }) => (
                    <li
                      key={userId}
                      className="flex items-center gap-3 px-5 py-3.5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <span className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-300">
                          {memberNickname.charAt(0)}
                        </span>
                      </div>
                      <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {memberNickname}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
