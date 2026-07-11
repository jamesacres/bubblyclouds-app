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
import { AgentProgress } from '@bubblyclouds-app/types/agentTypes';
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
import { PlayerRunResult } from '../helpers/runResults';

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
  // Multi-stage runs only: each player's per-stage times and run total,
  // refreshed at the end of each stage. Replaces the single-stage finished
  // leaderboard so every stage's time (and the whole-run total) is visible.
  runResults?: PlayerRunResult[];
  // Local AI rivals racing this stage. They aren't party members (no user
  // id, no player colour) — their emoji is the kart.
  localAgentProgress?: AgentProgress<ServerState>[];
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

// One line of the single-stage finished list: humans (with their colour dot)
// and agents (with their emoji) merged and sorted by finish time.
interface FinishedRacer {
  key: string;
  userId?: string;
  nickname: string;
  isCurrentUser: boolean;
  statsDisplay?: string;
  finishTime: number;
  emoji?: string;
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
  runResults,
  localAgentProgress,
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

  const agentProgressList = useMemo(
    () => localAgentProgress ?? [],
    [localAgentProgress]
  );

  // Single-stage finished list: humans and finished agents in one order
  const finishedRacers = useMemo((): FinishedRacer[] => {
    const players = finishedPlayers.map(
      (player): FinishedRacer => ({
        key: player.userId,
        userId: player.userId,
        nickname: player.nickname,
        isCurrentUser: player.isCurrentUser,
        statsDisplay: player.statsDisplay,
        finishTime: player.finishTime!,
      })
    );
    const agents = agentProgressList
      .filter((agent) => agent.finishTime !== undefined)
      .map(
        (agent): FinishedRacer => ({
          key: `agent-${agent.agentId}`,
          nickname: agent.name,
          isCurrentUser: false,
          statsDisplay: agent.state
            ? calculateStatsDisplayFromState(agent.state)
            : undefined,
          finishTime: agent.finishTime!,
          emoji: agent.emoji || '🤖',
        })
      );
    return [...players, ...agents].sort((a, b) => a.finishTime - b.finishTime);
  }, [finishedPlayers, agentProgressList]);

  const currentUserProgress = useMemo(() => {
    return allPlayerProgress.find((p) => p.isCurrentUser);
  }, [allPlayerProgress]);

  // Resolve run-leaderboard names the same way the legend does: agents carry
  // their own display name, the current user is "You", opponents need a
  // party nickname to appear.
  const runLeaderboardRows = useMemo(
    () =>
      (runResults || [])
        .map((result) => ({
          ...result,
          nickname:
            result.nickname ??
            (result.isCurrentUser
              ? 'You'
              : getNicknameByUserId(result.userId) || ''),
        }))
        .filter((row) => row.nickname),
    [runResults, getNicknameByUserId]
  );

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
            {allPlayerProgress.length <= 1 &&
              agentProgressList.length === 0 && (
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

              const totalRacers =
                allPlayerProgress.length + agentProgressList.length;
              const playerHeight = Math.min(12, trackHeight / totalRacers);
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

            {/* AI rivals: their emoji is the kart — agents aren't party
                members, so they don't draw from the player colour pool */}
            {agentProgressList.map((agent, index) => {
              const totalRacers =
                allPlayerProgress.length + agentProgressList.length;
              const laneSlotHeight = Math.min(12, trackHeight / totalRacers);
              const verticalOffset =
                (allPlayerProgress.length + index) * laneSlotHeight + 6;
              const percentage = Math.min(100, Math.max(0, agent.percentage));

              return (
                <div
                  key={`agent-${agent.agentId}`}
                  data-testid={`agent-kart-${agent.agentId}`}
                  className="absolute transition-all duration-700 ease-out"
                  style={{
                    left: `${percentage * 0.88 + 6}%`,
                    top: `${verticalOffset}px`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <span
                    className="block"
                    style={{ fontSize: '14px', lineHeight: 1 }}
                  >
                    {agent.emoji || '🤖'}
                  </span>
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
            {agentProgressList.map((agent) => (
              <span
                key={`agent-legend-${agent.agentId}`}
                data-testid={`agent-legend-${agent.agentId}`}
                className="flex items-center gap-1.5 rounded-full border border-stone-200/70 bg-white/60 px-2 py-0.5 dark:border-white/10 dark:bg-zinc-900/60"
              >
                <span aria-hidden="true">{agent.emoji || '🤖'}</span>
                <span className="text-stone-600 dark:text-zinc-300">
                  {agent.name}
                </span>
                <span className="tabular-nums text-stone-400 dark:text-zinc-500">
                  {agent.finishTime !== undefined
                    ? formatSecondsShort(agent.finishTime)
                    : `${Math.min(100, Math.max(0, agent.percentage))}%`}
                </span>
              </span>
            ))}
            <span className="ml-auto flex items-center gap-1 text-[0.65rem] font-semibold text-stone-400 dark:text-zinc-500">
              <Users className="h-3 w-3" aria-hidden="true" />
              Opponents
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </span>
          </div>
        </div>

        {/* Leaderboard: multi-stage runs get the end-of-stage breakdown —
            each player's time per stage plus their run total — while single
            puzzles keep the finished-players list */}
        {runResults ? (
          runLeaderboardRows.length > 0 && (
            <div className="mt-4">
              <div
                data-testid="run-leaderboard"
                className="mt-2 overflow-hidden rounded-xl border border-stone-200/70 bg-white/60 backdrop-blur dark:border-white/10 dark:bg-zinc-900/60"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[0.6rem] font-black uppercase tracking-widest text-stone-400 dark:text-zinc-500">
                        <th scope="col" className="px-3 py-1.5 text-left">
                          Racer
                        </th>
                        {runLeaderboardRows[0].stageResults.map(
                          (_, stageIndex) => (
                            <th
                              key={stageIndex}
                              scope="col"
                              className="px-1.5 py-1.5 text-right"
                            >
                              S{stageIndex + 1}
                            </th>
                          )
                        )}
                        <th scope="col" className="px-3 py-1.5 text-right">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {runLeaderboardRows.map((row, index) => {
                        const isFirst = index === 0;
                        const runFinished =
                          row.completedStageCount === row.stageResults.length;
                        return (
                          <tr
                            key={row.userId}
                            data-testid={`run-leaderboard-row-${index}`}
                            className={
                              isFirst
                                ? 'border-b border-stone-200 bg-gradient-to-r from-amber-400/15 via-amber-400/5 to-transparent dark:border-zinc-700'
                                : ''
                            }
                          >
                            <td className="px-3 py-2">
                              <span className="flex items-center gap-2.5">
                                <span
                                  className={`w-5 text-center text-sm font-semibold tabular-nums ${
                                    isFirst
                                      ? 'text-amber-500 dark:text-amber-400'
                                      : 'text-stone-400 dark:text-zinc-500'
                                  }`}
                                >
                                  {index + 1}.
                                </span>
                                {row.isAgent ? (
                                  <span
                                    aria-hidden="true"
                                    className="shrink-0 text-sm leading-none"
                                  >
                                    {row.emoji || '🤖'}
                                  </span>
                                ) : (
                                  <span
                                    className={`h-2 w-2 shrink-0 rounded-full ${getPlayerColor(row.userId, allUserIds, row.isCurrentUser)}`}
                                  />
                                )}
                                <span
                                  className={`whitespace-nowrap text-sm ${
                                    row.isCurrentUser
                                      ? 'font-semibold text-stone-900 dark:text-white'
                                      : 'text-stone-700 dark:text-zinc-300'
                                  }`}
                                >
                                  {row.nickname}
                                </span>
                              </span>
                            </td>
                            {row.stageResults.map((stageResult, stageIndex) => {
                              const movesDelta =
                                stageResult?.movesMade !== undefined
                                  ? stageResult.movesMade -
                                    stageResult.movesRequired
                                  : undefined;
                              return (
                                <td
                                  key={stageIndex}
                                  className="px-1.5 py-2 text-right align-top"
                                >
                                  {stageResult ? (
                                    <>
                                      <span className="block font-mono text-xs tabular-nums text-stone-500 dark:text-zinc-400">
                                        {formatSecondsShort(
                                          stageResult.seconds
                                        )}
                                      </span>
                                      {/* Moves graded against par in the
                                          run's usual colours, with the
                                          golf-style delta saying exactly how
                                          far over or under */}
                                      {stageResult.movesMade !== undefined &&
                                        movesDelta !== undefined && (
                                          <span
                                            className={`block font-mono text-[0.65rem] tabular-nums ${
                                              movesDelta > 0
                                                ? 'text-amber-600 dark:text-amber-400'
                                                : movesDelta < 0
                                                  ? 'text-emerald-600 dark:text-emerald-400'
                                                  : 'text-stone-400 dark:text-zinc-500'
                                            }`}
                                          >
                                            {stageResult.movesMade}/
                                            {stageResult.movesRequired}
                                            {movesDelta !== 0 &&
                                              ` ${movesDelta > 0 ? '+' : ''}${movesDelta}`}
                                            <span className="sr-only">
                                              {` moves, ${
                                                movesDelta === 0
                                                  ? 'on par'
                                                  : `${Math.abs(movesDelta)} ${movesDelta > 0 ? 'over' : 'under'} par`
                                              }`}
                                            </span>
                                          </span>
                                        )}
                                    </>
                                  ) : (
                                    <span className="font-mono text-xs text-stone-400 dark:text-zinc-600">
                                      –
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-3 py-2 text-right align-top">
                              <span
                                className={`block font-mono text-sm tabular-nums ${
                                  runFinished
                                    ? 'font-semibold text-stone-900 dark:text-white'
                                    : 'text-stone-500 dark:text-zinc-400'
                                }`}
                              >
                                {formatSecondsShort(row.totalSeconds)}
                              </span>
                              {row.totalMoves > 0 && (
                                <span className="block text-[0.65rem] tabular-nums text-stone-400 dark:text-zinc-500">
                                  {row.totalMoves} moves
                                  {' · '}
                                  <span
                                    className={
                                      row.totalMovesDelta > 0
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : row.totalMovesDelta < 0
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : undefined
                                    }
                                  >
                                    {row.totalMovesDelta === 0
                                      ? 'par'
                                      : `${row.totalMovesDelta > 0 ? '+' : ''}${row.totalMovesDelta}`}
                                  </span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        ) : finishedRacers.length > 0 ? (
          <div className="mt-4">
            <div className="mt-2 overflow-hidden rounded-xl border border-stone-200/70 bg-white/60 backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
              {finishedRacers.map((racer, index) => {
                const isFirst = index === 0;
                return (
                  <div
                    key={racer.key}
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
                      {racer.userId !== undefined ? (
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${getPlayerColor(racer.userId, allUserIds, racer.isCurrentUser)}`}
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="shrink-0 text-sm leading-none"
                        >
                          {racer.emoji || '🤖'}
                        </span>
                      )}
                      <span
                        className={`text-sm ${
                          racer.isCurrentUser
                            ? 'font-semibold text-stone-900 dark:text-white'
                            : 'text-stone-700 dark:text-zinc-300'
                        }`}
                      >
                        {racer.nickname}
                      </span>
                      {racer.statsDisplay && (
                        <span className="text-xs text-stone-400 dark:text-zinc-500">
                          {racer.statsDisplay}
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
                      {formatSecondsShort(racer.finishTime)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
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
