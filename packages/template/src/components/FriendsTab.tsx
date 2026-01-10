'use client';
import React, { useState } from 'react';
import { ServerStateResult, Party } from '@bubblyclouds-app/types/serverTypes';
import { UserProfile } from '@bubblyclouds-app/types/userProfile';
import { useSessions } from '../providers/SessionsProvider';
import { Loader, ChevronDown, ChevronRight, RotateCcw } from 'react-feather';
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
      <h1 className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-4xl font-bold text-transparent">
        Racing Teams
      </h1>
      <p className="my-4">
        💡 Send your friends an invite link from the Races sidebar when solving
        a puzzle.
      </p>

      {/* Party Selection Tabs */}
      {parties && parties.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSelectedPartyId('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                selectedPartyId === 'all'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              All
            </button>
            {parties.map((party) => (
              <button
                key={party.partyId}
                onClick={() => setSelectedPartyId(party.partyId)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  selectedPartyId === party.partyId
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {party.partyName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard Section */}
      {LeaderboardComponent && user && parties && (
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Leaderboard
            </h2>
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-800 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <RotateCcw
                  className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            )}
          </div>
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

      {/* Individual Friends Puzzles Section */}
      {displayParties?.length !== 0 && (
        <>
          <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
            <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-200">
              Browse Friends&apos; Puzzles
              {selectedParty && (
                <span className="text-base font-normal text-gray-600 dark:text-gray-400">
                  {' '}
                  • {selectedParty.partyName}
                </span>
              )}
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Select a friend below to see and solve their recent puzzles. Race
              to be the quickest!
            </p>
          </div>
        </>
      )}

      {displayParties?.length ? (
        <>
          <ul className="space-y-4">
            {displayParties?.map(({ partyId, members, partyName }) => (
              <li key={partyId}>
                <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-zinc-800/80">
                  <h3 className="text-theme-primary dark:text-theme-primary-light text-xl font-semibold">
                    {partyName}
                  </h3>
                  <ul className="mt-4 space-y-4">
                    {members
                      .filter(({ userId }) => userId !== user?.sub)
                      .map(({ userId, memberNickname }) => (
                        <li
                          key={userId}
                          className="rounded-xl bg-gray-50 dark:bg-zinc-700/40"
                        >
                          <button
                            className="flex w-full cursor-pointer items-center rounded-xl p-3 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-600/40"
                            onClick={() => toggleUserExpansion(userId)}
                          >
                            <span className="mr-2 text-xl">🧍</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {memberNickname}
                            </span>
                            {friendSessions[userId]?.isLoading ? (
                              <Loader className="mr-0 ml-auto animate-spin" />
                            ) : (
                              <>
                                {expandedUsers.has(userId) ? (
                                  <ChevronDown className="mr-0 ml-auto" />
                                ) : (
                                  <ChevronRight className="mr-0 ml-auto" />
                                )}
                              </>
                            )}
                          </button>
                          {expandedUsers.has(userId) &&
                            friendSessions[userId]?.sessions && (
                              <>
                                {friendSessions[userId]?.sessions?.length ? (
                                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                                    {friendSessions[userId]?.sessions
                                      ?.sort(
                                        (a, b) =>
                                          new Date(b.updatedAt).getTime() -
                                          new Date(a.updatedAt).getTime()
                                      )
                                      ?.map((userSession) => (
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
                                        />
                                      ))}
                                  </ul>
                                ) : (
                                  <p className="px-3 pb-3 text-gray-600 dark:text-gray-400">
                                    No recent puzzles, ask them to play!
                                  </p>
                                )}
                              </>
                            )}
                        </li>
                      ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <></>
      )}
    </div>
  );
};

export default FriendsTab;
