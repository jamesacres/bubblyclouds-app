'use client';
import { Parties, Session } from '@bubblyclouds-app/types/serverTypes';
import { useParties } from '@bubblyclouds-app/template/hooks/useParties';
import { memo, useMemo, useState, useEffect, useRef } from 'react';
import {
  getPlayerColor,
  getAllUserIds,
} from '@bubblyclouds-app/template/utils/playerColors';
import { formatSeconds } from '@bubblyclouds-app/ui/helpers/formatSeconds';
import { Tab } from '@bubblyclouds-app/types/tabs';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { BaseState } from '@bubblyclouds-app/template/types/state';
import { AgentProgress } from '@bubblyclouds-app/types/agentTypes';

interface Arguments<
  State extends {
    answerStack: unknown[];
    completed?: BaseState['completed'];
  },
> {
  sessionParties: Parties<Session<State>>;
  // The current user's live state, memoized by the parent so the memoised
  // track only re-renders on real progress changes
  state: State;
  userId?: string;
  onClick?: () => void;
  refreshSessionParties: () => void;
  isPolling: boolean;
  calculateCompletionPercentageFromState: (state: State) => number;
  isPuzzleCheated: (answerStack: State['answerStack']) => boolean;
  localAgentProgress?: AgentProgress[];
  onInviteFriends?: () => void;
  // Optional short stats string (e.g. "12 moves") shown next to each
  // finished player's time on the leaderboard. Games without a move-count
  // concept (sudoku) can omit this — undefined return values are hidden.
  calculateStatsDisplayFromState?: (state: State) => string | undefined;
  // Optional live progress label (e.g. "3/24 moves ⚡") shown in place of the
  // percentage in the inline legend, from move zero. Games without a
  // move-count concept (sudoku) omit this and keep showing the percentage.
  calculateProgressStatsDisplayFromState?: (state: State) => string | undefined;
}

interface PlayerProgress {
  userId: string;
  nickname: string;
  percentage: number;
  isCurrentUser: boolean;
  finishTime?: number;
  isPuzzleCheated: boolean;
  statsDisplay?: string;
  progressStatsDisplay?: string;
}

const RaceTrack = <
  State extends {
    answerStack: unknown[];
    completed?: BaseState['completed'];
  },
>({
  sessionParties,
  state,
  userId,
  onClick,
  refreshSessionParties,
  isPolling,
  calculateCompletionPercentageFromState,
  isPuzzleCheated,
  localAgentProgress,
  onInviteFriends,
  calculateStatsDisplayFromState,
  calculateProgressStatsDisplayFromState,
}: Arguments<State>) => {
  const { getNicknameByUserId, parties, refreshParties } = useParties();

  // Track height state for responsive layout (SSR-safe)
  const [trackHeight, setTrackHeight] = useState(40);

  // Track member IDs we've seen to avoid repeated refreshes
  const seenMemberIds = useRef(new Set<string>());

  useEffect(() => {
    const updateTrackHeight = () => {
      setTrackHeight(window.innerWidth >= 1024 ? 56 : 40);
    };

    updateTrackHeight();

    window.addEventListener('resize', updateTrackHeight);
    return () => window.removeEventListener('resize', updateTrackHeight);
  }, []);

  // Check for new members without nicknames and refresh parties
  useEffect(() => {
    let hasNewMemberWithoutNickname = false;

    Object.values(sessionParties).forEach((party) => {
      if (party?.memberSessions) {
        Object.keys(party.memberSessions).forEach((memberId) => {
          if (memberId !== userId && !seenMemberIds.current.has(memberId)) {
            seenMemberIds.current.add(memberId);
            const nickname = getNicknameByUserId(memberId);
            if (!nickname) {
              hasNewMemberWithoutNickname = true;
            }
          }
        });
      }
    });

    if (hasNewMemberWithoutNickname) {
      refreshParties();
    }
  }, [sessionParties, userId, getNicknameByUserId, refreshParties]);

  // Get consistent ordering of all user IDs for color assignment
  const allUserIds = useMemo(() => getAllUserIds(parties), [parties]);

  // Calculate and collect progress for all unique users
  const allPlayerProgress = useMemo((): PlayerProgress[] => {
    const progressMap: Record<string, PlayerProgress> = {};

    // Add current user's progress
    if (userId) {
      const currentUserPercentage =
        calculateCompletionPercentageFromState(state);

      const finishTime: number | undefined = state.completed?.seconds;

      progressMap[userId] = {
        userId,
        nickname: 'You',
        percentage: currentUserPercentage,
        isCurrentUser: true,
        finishTime,
        isPuzzleCheated:
          currentUserPercentage === 100 && isPuzzleCheated(state.answerStack),
        statsDisplay: calculateStatsDisplayFromState?.(state),
        progressStatsDisplay: calculateProgressStatsDisplayFromState?.(state),
      };
    }

    // Add all other users from all parties
    Object.values(sessionParties).forEach((party) => {
      if (party?.memberSessions) {
        Object.entries(party.memberSessions).forEach(([memberId, session]) => {
          // Skip if this is the current user (already added)
          if (memberId === userId) return;

          // Skip if we've already processed this user
          if (progressMap[memberId]) return;

          const percentage = session
            ? calculateCompletionPercentageFromState(session.state)
            : 0;

          let finishTime: number | undefined = undefined;
          if (session?.state.completed) {
            finishTime = session.state.completed.seconds;
          }

          // Get the user's nickname from parties data, fallback to empty string
          const nickname = getNicknameByUserId(memberId) || '';
          if (nickname) {
            progressMap[memberId] = {
              userId: memberId,
              nickname,
              percentage,
              isCurrentUser: false,
              finishTime,
              isPuzzleCheated:
                percentage === 100 &&
                !!session &&
                isPuzzleCheated(session.state.answerStack),
              statsDisplay: session
                ? calculateStatsDisplayFromState?.(session.state)
                : undefined,
              progressStatsDisplay: session
                ? calculateProgressStatsDisplayFromState?.(session.state)
                : undefined,
            };
          }
        });
      }
    });

    // Convert to array and sort by percentage (highest first)
    return Object.values(progressMap).sort(
      (a, b) => b.percentage - a.percentage
    );
  }, [
    sessionParties,
    state,
    userId,
    getNicknameByUserId,
    calculateCompletionPercentageFromState,
    isPuzzleCheated,
    calculateStatsDisplayFromState,
    calculateProgressStatsDisplayFromState,
  ]);

  const finishedPlayers = useMemo(() => {
    return allPlayerProgress
      .filter((p) => !p.isPuzzleCheated && p.percentage === 100 && p.finishTime)
      .sort((a, b) => a.finishTime! - b.finishTime!);
  }, [allPlayerProgress]);

  const currentUserProgress = useMemo(() => {
    return allPlayerProgress.find((p) => p.isCurrentUser);
  }, [allPlayerProgress]);

  const isCompleted =
    currentUserProgress?.percentage === 100 &&
    !isPuzzleCheated(state.answerStack);

  return (
    <div className="mx-auto mb-2 mt-2 w-full max-w-xl lg:mr-0 lg:mt-4">
      {/* Compact race track design */}
      <div
        className="relative cursor-pointer"
        onClick={() => onClick && onClick()}
        title="Click to view friends"
      >
        {/* Main track */}
        <div className="relative h-10 overflow-visible rounded-lg bg-stone-100 lg:h-14 dark:bg-gray-800">
          {/* Track surface with center line */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Dashed center line */}
            <div
              className="absolute left-6 right-16 top-1/2 h-0.5 -translate-y-1/2 transform bg-white opacity-60"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to right, white 0px, white 6px, transparent 6px, transparent 12px)',
              }}
            ></div>
          </div>

          {/* START label inside track */}
          <div className="absolute left-1 top-1/2 -translate-y-1/2 transform">
            <span className="rounded bg-green-600 px-1.5 py-0.5 text-xs font-bold text-white">
              START
            </span>
          </div>

          {/* FINISH label and flag inside track */}
          <div className="absolute right-1 top-1/2 flex -translate-y-1/2 transform items-center">
            <span className="mr-1 rounded bg-red-600 px-1 py-0.5 text-xs font-bold text-white">
              FINISH
            </span>
            {/* Checkered flag */}
            <div
              className="h-3 w-4 border border-gray-800 bg-white"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, black 25%, transparent 25%),
                  linear-gradient(-45deg, black 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, black 75%),
                  linear-gradient(-45deg, transparent 75%, black 75%)
                `,
                backgroundSize: '2px 2px',
                backgroundPosition: '0 0, 0 1px, 1px -1px, -1px 0px',
              }}
            ></div>
          </div>

          {/* Progress tick marks */}
          {[25, 50, 75].map((tick) => (
            <div
              key={tick}
              className="absolute bottom-0 top-0 w-px bg-yellow-400 opacity-40"
              style={{ left: `${tick}%` }}
            ></div>
          ))}

          {/* Player karts */}
          {allPlayerProgress.map((player, index) => {
            const colorClass = getPlayerColor(
              player.userId,
              allUserIds,
              player.isCurrentUser
            );

            // Calculate vertical spacing within the track
            const totalPlayers = allPlayerProgress.length;
            const playerHeight = Math.min(8, trackHeight / totalPlayers);
            const verticalOffset = index * playerHeight + 2;

            return (
              <div
                key={player.userId}
                className="absolute transform transition-all duration-700 ease-out"
                style={{
                  left: `${Math.min(
                    Math.max(player.percentage * 0.83 + 12, 12),
                    95
                  )}%`, // Scale 0-100% to 12-95% of track
                  top: `${verticalOffset}px`,
                  transform: 'translateX(-50%)',
                }}
              >
                {/* Smaller kart */}
                <div
                  className={`h-3 w-5 ${colorClass} relative rounded border border-gray-800 shadow-sm dark:border-gray-200`}
                >
                  {/* Tiny wheels */}
                  <div className="absolute -left-0.5 top-0 h-0.5 w-0.5 rounded-full bg-gray-800 dark:bg-gray-200"></div>
                  <div className="absolute -right-0.5 top-0 h-0.5 w-0.5 rounded-full bg-gray-800 dark:bg-gray-200"></div>
                  <div className="absolute -left-0.5 bottom-0 h-0.5 w-0.5 rounded-full bg-gray-800 dark:bg-gray-200"></div>
                  <div className="absolute -right-0.5 bottom-0 h-0.5 w-0.5 rounded-full bg-gray-800 dark:bg-gray-200"></div>

                  {/* Driver dot */}
                  <div className="absolute left-1/2 top-0.5 h-1.5 w-1.5 -translate-x-1/2 transform rounded-full bg-yellow-300"></div>

                  {/* Crown for current user */}
                  {player.isCurrentUser && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 transform text-xs">
                      👑
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {(localAgentProgress ?? []).map((agent, index) => (
            <div
              key={`agent-${agent.agentId}`}
              className="absolute transform transition-all duration-700 ease-out"
              style={{
                left: `${Math.min(Math.max(Math.min(100, Math.max(0, agent.percentage)) * 0.83 + 12, 12), 95)}%`,
                top: `${(allPlayerProgress.length + index) * Math.min(8, trackHeight / Math.max(allPlayerProgress.length + (localAgentProgress?.length ?? 0), 1)) + 2}px`,
                transform: 'translateX(-50%)',
              }}
            >
              <div
                className="flex items-center justify-center text-sm"
                style={{ fontSize: '14px', lineHeight: 1 }}
              >
                {agent.emoji || '🤖'}
              </div>
            </div>
          ))}
        </div>

        {/* Compact horizontal player legend - lowest to highest percentage */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {[...allPlayerProgress].reverse().map((player) => {
            const colorClass = getPlayerColor(
              player.userId,
              allUserIds,
              player.isCurrentUser
            );

            return (
              <div
                key={`${player.userId}-info`}
                className="flex items-center gap-1"
              >
                {/* Color indicator */}
                <div className={`h-2 w-2 rounded-full ${colorClass}`}></div>
                {/* Player name with percentage */}
                <span
                  className={`font-medium ${
                    player.isCurrentUser
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {player.nickname}
                  {player.isCurrentUser && ' 👑'}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {player.progressStatsDisplay ?? `(${player.percentage}%)`}
                </span>
              </div>
            );
          })}

          {(localAgentProgress ?? []).map((agent) => (
            <div
              key={`agent-legend-${agent.agentId}`}
              className="flex items-center gap-1"
            >
              <span>{agent.emoji || '🤖'}</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {agent.name}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                ({Math.min(100, Math.max(0, agent.percentage))}%)
              </span>
            </div>
          ))}
        </div>

        {/* Leaderboard for finished players and agents */}
        {(() => {
          const finishedAgents = (localAgentProgress ?? []).filter(
            (a) => a.finishTime !== undefined
          );
          const leaderboard: Array<
            | { type: 'player'; data: PlayerProgress }
            | { type: 'agent'; data: (typeof finishedAgents)[0] }
          > = [
            ...finishedPlayers.map((p) => ({
              type: 'player' as const,
              data: p,
            })),
            ...finishedAgents.map((a) => ({ type: 'agent' as const, data: a })),
          ].sort((a, b) => a.data.finishTime! - b.data.finishTime!);

          if (leaderboard.length === 0) return null;

          return (
            <div className="mt-4">
              <div className="mt-2 overflow-hidden rounded-xl bg-stone-100 dark:bg-gray-800/80">
                {leaderboard.map((entry, index) => {
                  const isFirst = index === 0;
                  const isCurrentUser =
                    entry.type === 'player' && entry.data.isCurrentUser;
                  return (
                    <div
                      key={
                        entry.type === 'player'
                          ? entry.data.userId
                          : `agent-${entry.data.agentId}`
                      }
                      className={`flex items-center justify-between px-3 py-2 ${
                        isFirst
                          ? 'border-b border-stone-200 dark:border-gray-700'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-5 text-center text-sm font-semibold tabular-nums ${
                            isFirst
                              ? 'text-amber-500 dark:text-amber-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {index + 1}.
                        </span>
                        {entry.type === 'agent' ? (
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {entry.data.emoji || '🤖'} {entry.data.name}
                          </span>
                        ) : (
                          <>
                            <div
                              className={`h-2 w-2 shrink-0 rounded-full ${getPlayerColor(entry.data.userId, allUserIds, entry.data.isCurrentUser)}`}
                            ></div>
                            <span
                              className={`text-sm ${
                                isCurrentUser
                                  ? 'font-semibold text-gray-900 dark:text-white'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {entry.data.nickname}
                            </span>
                            {entry.data.statsDisplay && (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {entry.data.statsDisplay}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <span
                        className={`font-mono text-sm tabular-nums ${
                          isFirst
                            ? 'font-semibold text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {formatSeconds(entry.data.finishTime!)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {isCompleted && (
        <div className="mb-8 mt-5 space-y-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/?tab=${Tab.FRIENDS}`}
              className="bg-theme-primary hover:bg-theme-primary-dark inline-flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="mr-2" role="img" aria-label="trophy">
                🏆
              </span>
              Leaderboard
            </Link>
            <Link
              href="/book"
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-stone-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:scale-[1.02] hover:bg-stone-200 active:scale-[0.98] dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <span className="mr-2" role="img" aria-label="puzzle book">
                📖
              </span>
              Puzzle book
            </Link>
            {finishedPlayers.length !== allPlayerProgress.length && (
              <button
                onClick={refreshSessionParties}
                disabled={isPolling}
                title="Refresh scores"
                className="inline-flex cursor-pointer items-center rounded-xl bg-stone-100 p-2.5 text-gray-600 transition-all duration-200 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isPolling ? 'animate-spin' : ''}`}
                />
              </button>
            )}
          </div>

          {/* Challenge friends section */}
          {currentUserProgress?.finishTime && (
            <div className="rounded-xl bg-stone-100 p-4 dark:bg-gray-800/80">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    🏁 Challenge friends
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Your time:{' '}
                    <span className="font-mono tabular-nums">
                      {formatSeconds(currentUserProgress.finishTime)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onInviteFriends || onClick}
                  className="inline-flex shrink-0 cursor-pointer items-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-gray-700 active:scale-[0.98] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  <span className="mr-1.5" role="img" aria-label="racing">
                    🚀
                  </span>
                  Invite friends
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Prevent re-render on timer change
const MemoisedRaceTrack = memo(RaceTrack) as typeof RaceTrack;

export default MemoisedRaceTrack;
