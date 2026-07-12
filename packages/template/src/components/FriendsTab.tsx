'use client';
import React, { useState } from 'react';
import { ServerStateResult, Party } from '@bubblyclouds-app/types/serverTypes';
import { UserProfile } from '@bubblyclouds-app/types/userProfile';
import { useSessions } from '../providers/SessionsProvider';
import {
  Loader,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Users,
} from 'lucide-react';
import IntegratedSessionRow from './IntegratedSessionRow';
import { BaseServerState } from '../types/state';
import { UserSessions } from '@bubblyclouds-app/types/userSessions';

interface FriendsTabProps<State extends BaseServerState = BaseServerState> {
  user: UserProfile | undefined;
  parties: Party[] | undefined;
  mySessions: ServerStateResult<State>[] | undefined;
  onRefresh?: () => Promise<void>;
  SimpleState: React.ComponentType<{ state: State }>;
  calculateCompletionPercentageFromState: (state: State) => number;
  isPuzzleCheated: (state: State) => boolean;
  buildPuzzleUrlFromState: (state: State, isCompleted?: boolean) => string;
  gameName: string;
  LeaderboardComponent?: React.ComponentType<{
    sessions: ServerStateResult<State>[] | null;
    friendSessions: UserSessions<State>;
    parties: Party[];
    user: UserProfile;
    selectedParty?: Party;
    isPuzzleCheated: (state: State) => boolean;
    gameName: string;
  }>;
  getDifficultyDisplay: (difficulty: string) => {
    name: string;
    badgeColor: string;
  };
  getMovesDisplay?: (
    state: State
  ) => { movesMade: number; movesRequired: number } | undefined;
  getStarRating?: (state: State) => number | undefined;
}

export const FriendsTab = <State extends BaseServerState = BaseServerState>({
  user,
  parties,
  mySessions,
  onRefresh,
  SimpleState,
  calculateCompletionPercentageFromState,
  isPuzzleCheated,
  buildPuzzleUrlFromState,
  LeaderboardComponent,
  gameName,
  getDifficultyDisplay,
  getMovesDisplay,
  getStarRating,
}: FriendsTabProps<State>) => {
  const { sessions, friendSessions } = useSessions<State>();
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [selectedPartyId, setSelectedPartyId] = useState<string | 'all'>('all');
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

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const selectedParty =
    selectedPartyId === 'all'
      ? undefined
      : parties?.find((p) => p.partyId === selectedPartyId);
  const displayParties =
    selectedPartyId === 'all' ? parties : selectedParty ? [selectedParty] : [];

  return (
    <div className="mb-4">
      {/* Party filter + refresh */}
      {parties && parties.length > 0 && (
        <div className="mb-4">
          {/* Scrollable party filter pills */}
          <div className="-mx-5 overflow-x-auto px-5">
            <div className="flex w-max gap-2 pb-2">
              <button
                onClick={() => setSelectedPartyId('all')}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                  selectedPartyId === 'all'
                    ? 'bg-theme-primary text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
              >
                All teams
              </button>
              {parties.map((party) => (
                <button
                  key={party.partyId}
                  onClick={() => setSelectedPartyId(party.partyId)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                    selectedPartyId === party.partyId
                      ? 'bg-theme-primary text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                  }`}
                >
                  {party.partyName}
                </button>
              ))}
            </div>
          </div>
          {/* Refresh — separate row so it never overlaps the scroll area */}
          {onRefresh && (
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
          )}
        </div>
      )}

      {/* Leaderboard Section */}
      {LeaderboardComponent && user && parties && (
        <div className="mb-6">
          <LeaderboardComponent
            sessions={sessions}
            friendSessions={friendSessions}
            parties={parties}
            user={user}
            selectedParty={selectedParty}
            isPuzzleCheated={isPuzzleCheated}
            gameName={gameName}
          />
        </div>
      )}

      {/* Friends' Puzzles */}
      {displayParties?.length ? (
        <div>
          <div className="mb-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
              Friends&apos; Puzzles
              {selectedParty && (
                <span className="ml-2 text-base font-normal text-zinc-400 dark:text-zinc-500">
                  &middot; {selectedParty.partyName}
                </span>
              )}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Tap a friend to see their recent puzzles and race them.
            </p>
          </div>

          <ul className="space-y-3">
            {displayParties.map(({ partyId, members, partyName }) => (
              <li key={partyId}>
                <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:border-zinc-700/60 dark:bg-zinc-800/60">
                  {/* Team header */}
                  <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-700/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-700">
                      <Users className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <h3 className="text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
                      {partyName}
                    </h3>
                    <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                      {
                        members.filter(({ userId }) => userId !== user?.sub)
                          .length
                      }{' '}
                      members
                    </span>
                  </div>

                  {/* Members */}
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-700/40">
                    {members
                      .filter(({ userId }) => userId !== user?.sub)
                      .map(({ userId, memberNickname }) => {
                        const isExpanded = expandedUsers.has(userId);
                        const friendData = friendSessions[userId];

                        return (
                          <li key={userId}>
                            <button
                              className="flex w-full cursor-pointer items-center gap-3 px-5 py-3.5 text-left transition-colors duration-150 hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-700/30 dark:active:bg-zinc-700/50"
                              onClick={() => toggleUserExpansion(userId)}
                            >
                              {/* Avatar initial */}
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                                <span className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-300">
                                  {memberNickname.charAt(0)}
                                </span>
                              </div>
                              <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                {memberNickname}
                              </span>
                              {friendData?.isLoading ? (
                                <Loader className="h-4 w-4 animate-spin text-zinc-400" />
                              ) : isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-zinc-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-zinc-400" />
                              )}
                            </button>

                            {isExpanded && friendData?.sessions && (
                              <div className="border-t border-zinc-100 bg-zinc-50/60 px-3 pb-3 pt-3 dark:border-zinc-700/40 dark:bg-zinc-800/40">
                                {friendData.sessions.length ? (
                                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
                                    {friendData.sessions
                                      .sort(
                                        (a, b) =>
                                          new Date(b.updatedAt).getTime() -
                                          new Date(a.updatedAt).getTime()
                                      )
                                      .map((userSession) => (
                                        <IntegratedSessionRow<State>
                                          key={userSession.sessionId}
                                          session={userSession}
                                          userSessions={mySessions}
                                          SimpleState={SimpleState}
                                          calculateCompletionPercentageFromState={
                                            calculateCompletionPercentageFromState
                                          }
                                          isPuzzleCheated={isPuzzleCheated}
                                          buildPuzzleUrlFromState={
                                            buildPuzzleUrlFromState
                                          }
                                          getDifficultyDisplay={
                                            getDifficultyDisplay
                                          }
                                          getMovesDisplay={getMovesDisplay}
                                          getStarRating={getStarRating}
                                        />
                                      ))}
                                  </ul>
                                ) : (
                                  <p className="py-2 text-center text-sm text-zinc-400 dark:text-zinc-500">
                                    No recent puzzles — challenge them!
                                  </p>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* Empty state — no teams yet */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-zinc-50 py-16 text-center dark:border-zinc-800 dark:bg-zinc-800/40">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            <Users className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
          </div>
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            No racing teams yet
          </p>
          <p className="mt-1 max-w-[240px] text-xs text-zinc-400 dark:text-zinc-500">
            Invite friends from the Races lobby when solving a puzzle
          </p>
        </div>
      )}
    </div>
  );
};

export default FriendsTab;
