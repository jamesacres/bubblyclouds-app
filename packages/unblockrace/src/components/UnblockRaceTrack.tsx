'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  LayoutGrid,
  RefreshCw,
  Trophy,
  Users,
} from 'lucide-react';
import { Parties, Session } from '@bubblyclouds-app/types/serverTypes';
import { Tab } from '@bubblyclouds-app/types/tabs';
import { useParties } from '@bubblyclouds-app/template/hooks/useParties';
import {
  getPlayerColor,
  getAllUserIds,
} from '@bubblyclouds-app/template/utils/playerColors';
import { ServerState } from '../types/state';
import { formatSecondsShort } from '../helpers/formatSecondsShort';
import { calculateCompletionPercentageFromState } from '../helpers/calculateCompletionPercentage';
import { calculateStatsDisplayFromState } from '../helpers/calculateStatsDisplay';
import { isPuzzleCheated } from '../helpers/cheatDetection';

interface UnblockRaceTrackProps {
  sessionParties: Parties<Session<ServerState>>;
  // The current user's live state, memoized by the parent so the memoised
  // track only re-renders on real progress changes
  state: ServerState;
  userId?: string;
  onClick?: () => void;
  refreshSessionParties: () => void;
  isPolling: boolean;
  onInviteFriends?: () => void;
}

interface PlayerProgress {
  userId: string;
  nickname: string;
  percentage: number;
  isCurrentUser: boolean;
  finishTime?: number;
  isPuzzleCheated: boolean;
  statsDisplay?: string;
}

// Unblock Race's own race strip. The shared @games RaceTrack keeps its kart
// styling for sudoku; this one matches the neon board — glass track surface,
// glowing car pills, chip legend — and links to Unblock Race's own routes
// (the shared track's puzzle-book link doesn't exist in this app).
const UnblockRaceTrack = ({
  sessionParties,
  state,
  userId,
  onClick,
  refreshSessionParties,
  isPolling,
  onInviteFriends,
}: UnblockRaceTrackProps) => {
  const { getNicknameByUserId, parties, refreshParties } = useParties();

  // Track height state for responsive layout (SSR-safe)
  const [trackHeight, setTrackHeight] = useState(48);

  // Track member IDs we've seen to avoid repeated refreshes
  const seenMemberIds = useRef(new Set<string>());

  useEffect(() => {
    const updateTrackHeight = () => {
      setTrackHeight(window.innerWidth >= 1024 ? 64 : 56);
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
        statsDisplay: calculateStatsDisplayFromState(state),
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
                ? calculateStatsDisplayFromState(session.state)
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
  }, [sessionParties, state, userId, getNicknameByUserId]);

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
      <div
        className="relative cursor-pointer"
        onClick={() => onClick && onClick()}
        title="Click to view friends"
      >
        {/* One card holds the labels, the driving lane and the legend so the
            whole strip reads as a single tappable race panel */}
        <div className="rounded-xl border border-stone-200/70 bg-white/60 p-2 backdrop-blur transition-transform duration-200 active:scale-[0.99] dark:border-white/10 dark:bg-zinc-900/60">
          {/* Start/Finish labels above the lane, out of the cars' way */}
          <div className="flex items-center justify-between px-0.5 pb-1">
            <span className="text-[0.6rem] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Start
            </span>
            <span className="flex items-center gap-1 text-[0.6rem] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
              Finish
              <span
                aria-hidden="true"
                className="h-3 w-3.5 rounded-[2px] border border-stone-400/60 bg-white dark:border-white/30"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, black 25%, transparent 25%),
                    linear-gradient(-45deg, black 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, black 75%),
                    linear-gradient(-45deg, transparent 75%, black 75%)
                  `,
                  backgroundSize: '3px 3px',
                  backgroundPosition: '0 0, 0 1.5px, 1.5px -1.5px, -1.5px 0px',
                }}
              />
            </span>
          </div>

          {/* Driving lane: proper asphalt in both themes — the dark strip
              against the glass card is what makes it read "road" at a
              glance — with edge lines, start lights and a checkered finish
              column */}
          <div className="relative h-14 overflow-hidden rounded-lg bg-gradient-to-r from-zinc-800 via-zinc-700/90 to-zinc-800 lg:h-16 dark:from-zinc-900 dark:via-zinc-800/80 dark:to-zinc-900">
            <style>{`
              @keyframes unblock-lane-shimmer {
                from { transform: translateX(-120%); }
                to { transform: translateX(520%); }
              }
              @media (prefers-reduced-motion: reduce) {
                .unblock-lane-shimmer { animation: none !important; opacity: 0 !important; }
              }
            `}</style>
            {/* Slow light sweep along the asphalt so the strip reads alive
                even before anyone has moved */}
            <div
              aria-hidden="true"
              className="unblock-lane-shimmer pointer-events-none absolute inset-y-0 w-1/4"
              style={{
                background:
                  'linear-gradient(105deg, transparent, rgba(255,255,255,0.07), transparent)',
                animation: 'unblock-lane-shimmer 5.5s linear infinite',
              }}
            />
            {/* Lane edge lines */}
            <div
              aria-hidden="true"
              className="absolute inset-x-1 top-1 h-px bg-white/20"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-1 bottom-1 h-px bg-white/20"
            />

            {/* Dashed centre line */}
            <div
              aria-hidden="true"
              className="absolute left-3 right-6 top-1/2 h-px -translate-y-1/2 text-white opacity-30"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to right, currentColor 0 8px, transparent 8px 16px)',
              }}
            />

            {/* Progress tick marks */}
            {[25, 50, 75].map((tick) => (
              <div
                key={tick}
                aria-hidden="true"
                className="absolute bottom-1.5 top-1.5 w-px bg-white/10"
                style={{ left: `${tick}%` }}
              />
            ))}

            {/* Start line */}
            <div
              aria-hidden="true"
              className="absolute bottom-0.5 top-0.5 flex gap-0.5"
              style={{ left: '3%' }}
            >
              <div className="w-px bg-emerald-400/80 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
              <div className="w-px bg-emerald-400/80" />
            </div>

            {/* Checkered finish column */}
            <div
              aria-hidden="true"
              className="absolute bottom-0.5 right-1 top-0.5 w-2.5 rounded-sm opacity-80"
              style={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                backgroundImage: `
                  linear-gradient(45deg, black 25%, transparent 25%),
                  linear-gradient(-45deg, black 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, black 75%),
                  linear-gradient(-45deg, transparent 75%, black 75%)
                `,
                backgroundSize: '5px 5px',
                backgroundPosition: '0 0, 0 2.5px, 2.5px -2.5px, -2.5px 0px',
              }}
            />

            {/* Solo hint inside the otherwise-empty lane; the whole card
                already opens the opponents lobby on tap. Pinned to the
                bottom edge so it never collides with the player's car
                driving the upper half of the lane. */}
            {allPlayerProgress.length <= 1 && (
              <div className="absolute inset-0 z-10 flex items-end justify-center pb-1">
                {/* Solid plaque so the lane's dashed centre line can't
                    strike through the words */}
                <span className="flex items-center gap-1 rounded-full bg-zinc-900/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-white/70 shadow-sm ring-1 ring-white/10">
                  Invite friends to race
                  <ChevronRight className="h-3 w-3" aria-hidden="true" />
                </span>
              </div>
            )}

            {/* Player cars: glowing pills in each player's colour with a
                motion trail; the current user gets a ring instead of a
                crown emoji */}
            {allPlayerProgress.map((player, index) => {
              const colorClass = getPlayerColor(
                player.userId,
                allUserIds,
                player.isCurrentUser
              );

              const totalPlayers = allPlayerProgress.length;
              const playerHeight = Math.min(12, trackHeight / totalPlayers);
              const verticalOffset = index * playerHeight + 6;

              return (
                <div
                  key={player.userId}
                  className="absolute transition-all duration-700 ease-out"
                  style={{
                    // Scale 0-100% progress to 6-94% of the lane, clear of
                    // the start line and finish column
                    left: `${player.percentage * 0.88 + 6}%`,
                    top: `${verticalOffset}px`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {/* Motion trail streaking back toward the start line */}
                  {player.percentage > 0 && (
                    <div
                      aria-hidden="true"
                      className={`absolute right-full top-1/2 h-1 w-5 -translate-y-1/2 rounded-full opacity-50 ${colorClass} [mask-image:linear-gradient(to_left,black,transparent)]`}
                    />
                  )}
                  <div
                    className={`relative h-4 w-7 rounded-[5px] ${colorClass} shadow-md ${
                      player.isCurrentUser ? 'ring-2 ring-white/70' : ''
                    }`}
                  >
                    {/* Windshield */}
                    <div className="absolute left-1/2 top-1/2 h-2 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-white/50" />
                    {/* Headlight on the leading edge */}
                    <div className="absolute -right-px top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-white shadow-[0_0_6px_2px_rgba(255,255,255,0.7)]" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend: one chip per racer, lowest to highest percentage, plus
              the tap-for-opponents affordance */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            {[...allPlayerProgress].reverse().map((player) => {
              const colorClass = getPlayerColor(
                player.userId,
                allUserIds,
                player.isCurrentUser
              );

              return (
                <span
                  key={`${player.userId}-info`}
                  className="flex items-center gap-1.5 rounded-full border border-stone-200/70 bg-white/60 px-2 py-0.5 dark:border-white/10 dark:bg-zinc-900/60"
                >
                  <span className={`h-2 w-2 rounded-full ${colorClass}`} />
                  <span
                    className={
                      player.isCurrentUser
                        ? 'font-semibold text-stone-900 dark:text-white'
                        : 'text-stone-600 dark:text-zinc-300'
                    }
                  >
                    {player.nickname}
                  </span>
                  {/* Position or finish time only — the live moves-vs-par
                      readout already lives in the HUD gauge */}
                  <span className="tabular-nums text-stone-400 dark:text-zinc-500">
                    {player.finishTime !== undefined && !player.isPuzzleCheated
                      ? formatSecondsShort(player.finishTime)
                      : `${player.percentage}%`}
                  </span>
                </span>
              );
            })}
            <span className="ml-auto flex items-center gap-1 text-[0.65rem] font-semibold text-stone-400 dark:text-zinc-500">
              <Users className="h-3 w-3" aria-hidden="true" />
              Opponents
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </span>
          </div>
        </div>

        {/* Leaderboard for finished players */}
        {finishedPlayers.length > 0 && (
          <div className="mt-4">
            <div className="mt-2 overflow-hidden rounded-xl border border-stone-200/70 bg-white/60 backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
              {finishedPlayers.map((player, index) => {
                const isFirst = index === 0;
                return (
                  <div
                    key={player.userId}
                    className={`flex items-center justify-between px-3 py-2 ${
                      isFirst
                        ? 'border-b border-stone-200 bg-gradient-to-r from-amber-400/15 via-amber-400/5 to-transparent dark:border-zinc-700'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-5 text-center text-sm font-semibold tabular-nums ${
                          isFirst
                            ? 'text-amber-500 dark:text-amber-400'
                            : 'text-stone-400 dark:text-zinc-500'
                        }`}
                      >
                        {index + 1}.
                      </span>
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${getPlayerColor(player.userId, allUserIds, player.isCurrentUser)}`}
                      />
                      <span
                        className={`text-sm ${
                          player.isCurrentUser
                            ? 'font-semibold text-stone-900 dark:text-white'
                            : 'text-stone-700 dark:text-zinc-300'
                        }`}
                      >
                        {player.nickname}
                      </span>
                      {player.statsDisplay && (
                        <span className="text-xs text-stone-400 dark:text-zinc-500">
                          {player.statsDisplay}
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-mono text-sm tabular-nums ${
                        isFirst
                          ? 'font-semibold text-stone-900 dark:text-white'
                          : 'text-stone-500 dark:text-zinc-400'
                      }`}
                    >
                      {formatSecondsShort(player.finishTime!)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isCompleted && (
        <div className="mb-8 mt-5 space-y-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/?tab=${Tab.FRIENDS}`}
              className="bg-theme-primary hover:bg-theme-primary-dark inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Trophy className="h-4 w-4" aria-hidden="true" />
              Leaderboard
            </Link>
            <Link
              href="/collection"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-stone-100 px-4 py-2.5 text-sm font-semibold text-stone-700 transition-all duration-200 hover:scale-[1.02] hover:bg-stone-200 active:scale-[0.98] dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              Collection
            </Link>
            {finishedPlayers.length !== allPlayerProgress.length && (
              <button
                onClick={refreshSessionParties}
                disabled={isPolling}
                title="Refresh scores"
                className="inline-flex cursor-pointer items-center rounded-xl bg-stone-100 p-2.5 text-stone-600 transition-all duration-200 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isPolling ? 'animate-spin' : ''}`}
                />
              </button>
            )}
          </div>

          {/* Challenge friends section */}
          {currentUserProgress?.finishTime && (
            <div className="rounded-xl border border-stone-200/70 bg-white/60 p-4 backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-stone-900 dark:text-white">
                    Challenge friends
                  </div>
                  <div className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
                    Your time:{' '}
                    <span className="font-mono tabular-nums">
                      {formatSecondsShort(currentUserProgress.finishTime)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onInviteFriends || onClick}
                  className="inline-flex shrink-0 cursor-pointer items-center rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-stone-700 active:scale-[0.98] dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
                >
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
const MemoisedUnblockRaceTrack = memo(UnblockRaceTrack);

export default MemoisedUnblockRaceTrack;
