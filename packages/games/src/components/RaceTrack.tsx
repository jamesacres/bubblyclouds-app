'use client';
import { Parties, Session } from '@bubblyclouds-app/types/serverTypes';
import { useParties } from '@bubblyclouds-app/template/hooks/useParties';
import { memo, ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { getAllUserIds } from '@bubblyclouds-app/template/utils/playerColors';
import { getRaceCarColor } from '@bubblyclouds-app/template/utils/raceCarColors';
import { useThemeColorName } from '@bubblyclouds-app/ui/hooks/useThemeColorName';
import { formatSeconds } from '@bubblyclouds-app/ui/helpers/formatSeconds';
import { Tab } from '@bubblyclouds-app/types/tabs';
import Link from 'next/link';
import {
  ChevronRight,
  LayoutGrid,
  RefreshCw,
  Trophy,
  Users,
} from 'lucide-react';
import { BaseState } from '@bubblyclouds-app/template/types/state';
import { AgentProgress } from '@bubblyclouds-app/types/agentTypes';
import { RateAppButton } from '@bubblyclouds-app/template/components/RateAppButton';
import { PlayerRunResult, PlayerStageResult } from '../types/scoringTypes';

interface Arguments<
  State extends {
    answerStack: unknown[];
    completed?: BaseState['completed'];
  },
  Score = unknown,
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
  // Local AI rivals racing this puzzle. They aren't party members (no user
  // id, no player colour) — their emoji is the kart.
  localAgentProgress?: AgentProgress<State>[];
  onInviteFriends?: () => void;
  // Optional short stats string (e.g. "12 moves") shown next to each
  // finished player's time on the leaderboard. Games without a move-count
  // concept (sudoku) can omit this — undefined return values are hidden.
  calculateStatsDisplayFromState?: (state: State) => string | undefined;
  // Optional live progress label (e.g. "3/24 moves ⚡") shown in place of the
  // percentage in the inline legend, from move zero. Games without a
  // move-count concept (sudoku) omit this and keep showing the percentage.
  calculateProgressStatsDisplayFromState?: (state: State) => string | undefined;
  // Optional rate-app prompt shown on the completed block. Games that pass it
  // render a Rate-it button below the "Challenge friends" card; omitting it
  // leaves the completed block unchanged.
  rateApp?: { appName: string; appStoreUrl: string; googlePlayUrl: string };
  // Multi-stage runs only: each player's per-stage times and run total,
  // refreshed at the end of each stage. When provided it replaces the
  // single-stage finished leaderboard with the per-stage breakdown so every
  // stage's time (and the whole-run total) is visible. Single-puzzle games
  // (sudoku) omit it and keep the finished-players list. Also drives the live
  // track: with runResults present, kart position is the whole-run fraction
  // (stages completed + progress on the current one) instead of just the
  // current stage's percentage, so a player who has moved on to a later
  // stage doesn't appear to snap back to the start.
  runResults?: PlayerRunResult<Score>[];
  // Total stages in the run, required alongside runResults to normalise the
  // whole-run fraction. Omit for single-puzzle games.
  totalStages?: number;
  // Optional per-stage score readout under the time in the leaderboard table
  // (e.g. Unblock Race's "4/3 +1" moves-vs-par line). Games whose Score has
  // nothing to show here (or that don't pass runResults) omit it.
  renderStageScore?: (score: Score) => ReactNode;
  // Optional run-total score readout under the total time in the
  // leaderboard's last column (e.g. Unblock Race's "7 moves · +1"). Takes
  // every completed stage result for the row so the total can be derived
  // from them, mirroring how the caller derives it elsewhere.
  renderTotalScore?: (
    stageResults: (PlayerStageResult<Score> | undefined)[]
  ) => ReactNode;
  // Multi-stage runs only: which stage (0-based) each OTHER player has been
  // seen on, completed or still in progress — unlike runResults (which only
  // ever records a stage once finished), this also covers a player actively
  // racing a stage for the first time. Without it, a brand new opponent who
  // starts a stage the current user has already passed (zero completed
  // stages, so absent from runResults) would never appear on the track at
  // all.
  presenceStageByUserId?: Map<string, number>;
  // Second CTA link on the completed block. Defaults to the puzzle book;
  // games with their own browse route (e.g. Unblock Race's collection) pass
  // their own href/label/icon.
  secondaryCta?: { href: string; label: string; icon?: 'book' | 'collection' };
  // Formats finish/stage times in the leaderboard and legend. Defaults to the
  // shared zero-padded hh:mm:ss; games can pass a compact form.
  formatFinishTime?: (seconds: number) => string;
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
  // Multi-stage runs only (runResults provided): which stage this player is
  // currently on, 1-based, for the "Stage N" badge next to their kart.
  currentStageNumber?: number;
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

// Combines a player's completed-stage count with their live percentage on
// the stage they're currently on (0 when unknown, e.g. an opponent who has
// moved to a stage we have no live session for) into one whole-run
// percentage. completedStageCount only ever increases, so this can never
// move a player backwards even though their in-stage percentage resets to 0
// at the start of each new stage. Kept outside the component (rather than a
// closure) so it isn't itself a render-scoped dependency.
const toRunPercentage = <Score,>(
  userId: string,
  currentStagePercentage: number,
  runResultsByUserId: Map<string, PlayerRunResult<Score>>,
  totalStages: number
): { percentage: number; currentStageNumber: number } => {
  const completedStageCount =
    runResultsByUserId.get(userId)?.completedStageCount ?? 0;
  if (completedStageCount >= totalStages) {
    return { percentage: 100, currentStageNumber: totalStages };
  }
  const runFraction =
    (completedStageCount + currentStagePercentage / 100) / totalStages;
  return {
    percentage: Math.min(99, Math.round(runFraction * 100)),
    currentStageNumber: completedStageCount + 1,
  };
};

// Both the player pill and the agent emoji are ~16px tall, so every lane
// needs at least that much room plus a little breathing space between
// karts. Used to size and clamp each racer's vertical slot in the lane so
// the pack fills the track from top to bottom without any kart's bottom
// edge ever clipping past the (overflow-hidden) driving lane, however many
// racers there are.
const KART_SLOT_PX = 16;

// Evenly distributes `totalRacers` karts down the driving lane, from just
// below the top edge to just above the bottom edge, so they spread out
// (never overlapping while there's room) but can never push a kart's
// bottom edge past `trackHeight` (never overflow, whatever the race size).
const laneVerticalOffset = (
  index: number,
  totalRacers: number,
  trackHeight: number
): number => {
  const usableHeight = Math.max(trackHeight - KART_SLOT_PX, 0);
  if (totalRacers <= 1) {
    return usableHeight / 2;
  }
  const step = usableHeight / totalRacers;
  return Math.min(index * step, usableHeight);
};

const RaceTrack = <
  State extends {
    answerStack: unknown[];
    completed?: BaseState['completed'];
  },
  Score = unknown,
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
  rateApp,
  runResults,
  totalStages,
  renderStageScore,
  renderTotalScore,
  presenceStageByUserId,
  secondaryCta,
  formatFinishTime,
}: Arguments<State, Score>) => {
  // Games that pass a formatter want finish times in the compact race chrome
  // (legend chips); games that omit it keep the percentage in the legend and
  // use the shared zero-padded hh:mm:ss on the leaderboard.
  const formatTime = formatFinishTime ?? formatSeconds;
  const showFinishTimeInLegend = formatFinishTime !== undefined;
  const { getNicknameByUserId, parties, refreshParties } = useParties();
  const themeColor = useThemeColorName();

  // Track height state for responsive layout (SSR-safe)
  const [trackHeight, setTrackHeight] = useState(56);

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

  // Multi-stage runs only: each player's completed-stage count, from the
  // same run leaderboard data as the table below. Used to turn a per-stage
  // percentage into a whole-run position so a player who has moved on to a
  // later stage doesn't appear to snap back to the start of the track.
  const runResultsByUserId = useMemo(() => {
    const map = new Map<string, PlayerRunResult<Score>>();
    (runResults || []).forEach((result) => map.set(result.userId, result));
    return map;
  }, [runResults]);
  const isRunAware = !!runResults && !!totalStages && totalStages > 1;

  // Calculate and collect progress for all unique users
  const allPlayerProgress = useMemo((): PlayerProgress[] => {
    const progressMap: Record<string, PlayerProgress> = {};

    // Add current user's progress
    if (userId) {
      const currentStagePercentage =
        calculateCompletionPercentageFromState(state);
      const { percentage: currentUserPercentage, currentStageNumber } =
        isRunAware
          ? toRunPercentage(
              userId,
              currentStagePercentage,
              runResultsByUserId,
              totalStages!
            )
          : {
              percentage: currentStagePercentage,
              currentStageNumber: undefined,
            };

      const finishTime: number | undefined = state.completed?.seconds;

      progressMap[userId] = {
        userId,
        nickname: 'You',
        percentage: currentUserPercentage,
        isCurrentUser: true,
        finishTime,
        isPuzzleCheated:
          currentStagePercentage === 100 && isPuzzleCheated(state.answerStack),
        statsDisplay: calculateStatsDisplayFromState?.(state),
        progressStatsDisplay: calculateProgressStatsDisplayFromState?.(state),
        currentStageNumber,
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

          const currentStagePercentage = session
            ? calculateCompletionPercentageFromState(session.state)
            : 0;
          const { percentage, currentStageNumber } = isRunAware
            ? toRunPercentage(
                memberId,
                currentStagePercentage,
                runResultsByUserId,
                totalStages!
              )
            : {
                percentage: currentStagePercentage,
                currentStageNumber: undefined,
              };

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
                currentStagePercentage === 100 &&
                !!session &&
                isPuzzleCheated(session.state.answerStack),
              statsDisplay: session
                ? calculateStatsDisplayFromState?.(session.state)
                : undefined,
              progressStatsDisplay: session
                ? calculateProgressStatsDisplayFromState?.(session.state)
                : undefined,
              currentStageNumber,
            };
          }
        });
      }
    });

    // Multi-stage runs only: an opponent who has moved past the stage we
    // have a live session for (or who we've never shared a stage's
    // sessionParties with) still has a leaderboard line once they've
    // completed at least one stage — surface them on the track too, docked
    // at the start of their current stage since we have no live in-stage
    // percentage for them.
    if (isRunAware) {
      runResultsByUserId.forEach((result, memberId) => {
        if (progressMap[memberId] || result.isAgent) return;
        const nickname = getNicknameByUserId(memberId) || '';
        if (!nickname) return;
        const { percentage, currentStageNumber } = toRunPercentage(
          memberId,
          0,
          runResultsByUserId,
          totalStages!
        );
        progressMap[memberId] = {
          userId: memberId,
          nickname,
          percentage,
          isCurrentUser: false,
          isPuzzleCheated: false,
          currentStageNumber,
        };
      });
    }

    // Multi-stage runs only: an opponent present on some stage (racing it
    // for the first time, or already finished it) but with zero completed
    // stages overall has no line in runResultsByUserId (calculateRunResults
    // omits anyone with completedStageCount 0) — without this they'd be
    // invisible on the track entirely. Docked at the start of their stage,
    // same as the runResultsByUserId fallback above, since we have no live
    // in-stage percentage for them either.
    if (isRunAware && presenceStageByUserId) {
      presenceStageByUserId.forEach((stageIndex, memberId) => {
        if (progressMap[memberId]) return;
        const nickname = getNicknameByUserId(memberId) || '';
        if (!nickname) return;
        const percentage = Math.min(
          99,
          Math.round((stageIndex / totalStages!) * 100)
        );
        progressMap[memberId] = {
          userId: memberId,
          nickname,
          percentage,
          isCurrentUser: false,
          isPuzzleCheated: false,
          currentStageNumber: stageIndex + 1,
        };
      });
    }

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
    isRunAware,
    runResultsByUserId,
    totalStages,
    presenceStageByUserId,
  ]);

  const finishedPlayers = useMemo(() => {
    return allPlayerProgress
      .filter((p) => !p.isPuzzleCheated && p.percentage === 100 && p.finishTime)
      .sort((a, b) => a.finishTime! - b.finishTime!);
  }, [allPlayerProgress]);

  // Agents follow the same whole-run positioning as human players: with
  // runResults present, their kart position and stage badge come from their
  // completed-stage count (agent rows are keyed by agentId in runResults),
  // not their raw per-stage percentage, so they don't snap back to the
  // start of the track when they advance to a new stage either.
  const agentProgressList = useMemo(() => {
    return (localAgentProgress ?? []).map((agent) => {
      if (!isRunAware) {
        return { ...agent, currentStageNumber: undefined };
      }
      const { percentage, currentStageNumber } = toRunPercentage(
        agent.agentId,
        agent.percentage,
        runResultsByUserId,
        totalStages!
      );
      return { ...agent, percentage, currentStageNumber };
    });
  }, [localAgentProgress, isRunAware, runResultsByUserId, totalStages]);

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
            ? calculateStatsDisplayFromState?.(agent.state)
            : undefined,
          finishTime: agent.finishTime!,
          emoji: agent.emoji || '🤖',
        })
      );
    return [...players, ...agents].sort((a, b) => a.finishTime - b.finishTime);
  }, [finishedPlayers, agentProgressList, calculateStatsDisplayFromState]);

  const currentUserProgress = useMemo(() => {
    return allPlayerProgress.find((p) => p.isCurrentUser);
  }, [allPlayerProgress]);

  // Resolve run-leaderboard names the same way the legend does: agents carry
  // their own display name, the current user is "You", opponents need a
  // party nickname to appear. Also folds in presence-only opponents — no
  // completed stage yet, so calculateRunResults has no line for them, but
  // the table already renders "–" for any stage without a result, so a
  // presence-only row (dashes all the way across) is consistent with how
  // every other unfinished stage already displays.
  const runLeaderboardRows = useMemo(() => {
    const rows = (runResults || []).map((result) => ({
      ...result,
      nickname:
        result.nickname ??
        (result.isCurrentUser
          ? 'You'
          : getNicknameByUserId(result.userId) || ''),
    }));
    const knownUserIds = new Set(rows.map((row) => row.userId));
    if (presenceStageByUserId && totalStages) {
      presenceStageByUserId.forEach((_stageIndex, memberId) => {
        if (knownUserIds.has(memberId)) return;
        const nickname = getNicknameByUserId(memberId) || '';
        if (!nickname) return;
        rows.push({
          userId: memberId,
          isCurrentUser: false,
          stageResults: new Array(totalStages).fill(undefined),
          totalSeconds: 0,
          completedStageCount: 0,
          nickname,
        });
      });
    }
    return rows.filter((row) => row.nickname);
  }, [runResults, getNicknameByUserId, presenceStageByUserId, totalStages]);

  const isCompleted =
    currentUserProgress?.percentage === 100 &&
    !isPuzzleCheated(state.answerStack);

  const SecondaryCtaIcon =
    secondaryCta?.icon === 'collection' ? LayoutGrid : undefined;

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

          {/* Driving lane: pale near-white asphalt in light mode, dark
              asphalt in dark mode — with edge lines, start lights and a
              checkered finish column. Line/tick markings flip from
              dark-on-light to light-on-dark so they stay legible in both. */}
          <div className="relative h-14 overflow-hidden rounded-lg bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 lg:h-16 dark:from-zinc-900 dark:via-zinc-800/80 dark:to-zinc-900">
            <style>{`
              @keyframes race-lane-shimmer {
                from { transform: translateX(-120%); }
                to { transform: translateX(520%); }
              }
              @media (prefers-reduced-motion: reduce) {
                .race-lane-shimmer { animation: none !important; opacity: 0 !important; }
              }
            `}</style>
            {/* Slow light sweep along the asphalt so the strip reads alive
                even before anyone has moved */}
            <div
              aria-hidden="true"
              className="race-lane-shimmer pointer-events-none absolute inset-y-0 w-1/4"
              style={{
                background:
                  'linear-gradient(105deg, transparent, rgba(0,0,0,0.05), transparent)',
                animation: 'race-lane-shimmer 5.5s linear infinite',
              }}
            />
            <div
              aria-hidden="true"
              className="race-lane-shimmer pointer-events-none absolute inset-y-0 hidden w-1/4 dark:block"
              style={{
                background:
                  'linear-gradient(105deg, transparent, rgba(255,255,255,0.07), transparent)',
                animation: 'race-lane-shimmer 5.5s linear infinite',
              }}
            />
            {/* Lane edge lines */}
            <div
              aria-hidden="true"
              className="absolute inset-x-1 top-1 h-px bg-stone-400/40 dark:bg-white/20"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-1 bottom-1 h-px bg-stone-400/40 dark:bg-white/20"
            />

            {/* Dashed centre line */}
            <div
              aria-hidden="true"
              className="absolute left-3 right-6 top-1/2 h-px -translate-y-1/2 text-stone-500/50 dark:text-white dark:opacity-30"
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
                className="absolute bottom-1.5 top-1.5 w-px bg-stone-400/30 dark:bg-white/10"
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
                  <span className="flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-stone-500/80 shadow-sm ring-1 ring-stone-400/20 dark:bg-zinc-900/85 dark:text-white/70 dark:ring-white/10">
                    Invite friends to race
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                  </span>
                </div>
              )}

            {/* Player cars: glowing pills in each player's colour with a
                motion trail; the current user gets a ring instead of a
                crown emoji */}
            {allPlayerProgress.map((player, index) => {
              const colorClass = getRaceCarColor(
                player.userId,
                allUserIds,
                player.isCurrentUser,
                themeColor
              );

              const totalRacers =
                allPlayerProgress.length + agentProgressList.length;
              const verticalOffset = laneVerticalOffset(
                index,
                totalRacers,
                trackHeight
              );
              const percentage = Math.min(100, Math.max(0, player.percentage));

              return (
                <div
                  key={player.userId}
                  className="absolute transition-all duration-700 ease-out"
                  style={{
                    // Scale 0-100% progress to 6-94% of the lane, clear of
                    // the start line and finish column
                    left: `${percentage * 0.88 + 6}%`,
                    top: `${verticalOffset}px`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {/* Motion trail streaking back toward the start line */}
                  {percentage > 0 && (
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
              const verticalOffset = laneVerticalOffset(
                allPlayerProgress.length + index,
                totalRacers,
                trackHeight
              );
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
              const colorClass = getRaceCarColor(
                player.userId,
                allUserIds,
                player.isCurrentUser,
                themeColor
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
                  {/* Multi-stage runs only: which stage this racer is
                      currently on, so their position on the whole-run track
                      doesn't read as "behind" when they're really ahead on a
                      later stage */}
                  {player.currentStageNumber !== undefined && (
                    <span
                      data-testid={`stage-badge-${player.userId}`}
                      className="rounded-full bg-stone-200/80 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-stone-500 dark:bg-white/10 dark:text-zinc-400"
                    >
                      S{player.currentStageNumber}
                    </span>
                  )}
                  {/* Live progress label if the game provides one, otherwise
                      the finish time once done (games that pass a formatter),
                      else the raw percentage */}
                  <span className="tabular-nums text-stone-400 dark:text-zinc-500">
                    {player.progressStatsDisplay ??
                      (showFinishTimeInLegend &&
                      player.finishTime !== undefined &&
                      !player.isPuzzleCheated
                        ? formatTime(player.finishTime)
                        : `(${player.percentage}%)`)}
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
                {agent.currentStageNumber !== undefined && (
                  <span
                    data-testid={`stage-badge-${agent.agentId}`}
                    className="rounded-full bg-stone-200/80 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-stone-500 dark:bg-white/10 dark:text-zinc-400"
                  >
                    S{agent.currentStageNumber}
                  </span>
                )}
                <span className="tabular-nums text-stone-400 dark:text-zinc-500">
                  {showFinishTimeInLegend && agent.finishTime !== undefined
                    ? formatTime(agent.finishTime)
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
                                    className={`h-2 w-2 shrink-0 rounded-full ${getRaceCarColor(row.userId, allUserIds, row.isCurrentUser, themeColor)}`}
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
                            {row.stageResults.map((stageResult, stageIndex) => (
                              <td
                                key={stageIndex}
                                className="px-1.5 py-2 text-right align-top"
                              >
                                {stageResult ? (
                                  <>
                                    <span className="block font-mono text-xs tabular-nums text-stone-500 dark:text-zinc-400">
                                      {formatTime(stageResult.seconds)}
                                    </span>
                                    {renderStageScore?.(stageResult.score)}
                                  </>
                                ) : (
                                  <span className="font-mono text-xs text-stone-400 dark:text-zinc-600">
                                    –
                                  </span>
                                )}
                              </td>
                            ))}
                            <td className="px-3 py-2 text-right align-top">
                              <span
                                className={`block font-mono text-sm tabular-nums ${
                                  runFinished
                                    ? 'font-semibold text-stone-900 dark:text-white'
                                    : 'text-stone-500 dark:text-zinc-400'
                                }`}
                              >
                                {formatTime(row.totalSeconds)}
                              </span>
                              {renderTotalScore?.(row.stageResults)}
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
                          className={`h-2 w-2 shrink-0 rounded-full ${getRaceCarColor(racer.userId, allUserIds, racer.isCurrentUser, themeColor)}`}
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
                      {formatTime(racer.finishTime)}
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
              href={secondaryCta?.href ?? '/book'}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-stone-100 px-4 py-2.5 text-sm font-semibold text-stone-700 transition-all duration-200 hover:scale-[1.02] hover:bg-stone-200 active:scale-[0.98] dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {SecondaryCtaIcon ? (
                <SecondaryCtaIcon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <span className="mr-1" role="img" aria-label="puzzle book">
                  📖
                </span>
              )}
              {secondaryCta?.label ?? 'Puzzle book'}
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
                    🏁 Challenge friends
                  </div>
                  <div className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
                    Your time:{' '}
                    <span className="font-mono tabular-nums">
                      {formatTime(currentUserProgress.finishTime)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onInviteFriends || onClick}
                  className="inline-flex shrink-0 cursor-pointer items-center rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-stone-700 active:scale-[0.98] dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
                >
                  <span className="mr-1.5" role="img" aria-label="racing">
                    🚀
                  </span>
                  Invite friends
                </button>
              </div>
            </div>
          )}

          {rateApp && (
            <RateAppButton
              variant="inline"
              appName={rateApp.appName}
              appStoreUrl={rateApp.appStoreUrl}
              googlePlayUrl={rateApp.googlePlayUrl}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Prevent re-render on timer change
const MemoisedRaceTrack = memo(RaceTrack) as typeof RaceTrack;

export default MemoisedRaceTrack;
