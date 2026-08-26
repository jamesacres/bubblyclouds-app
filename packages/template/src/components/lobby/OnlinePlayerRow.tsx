import { ComponentType } from 'react';
import { Clock, Trash } from 'lucide-react';
import { Session } from '@bubblyclouds-app/types/serverTypes';
import { StarRating } from '@bubblyclouds-app/ui/components/StarRating';
import { BaseServerState } from '../../types/state';
import { PlayerAvatar } from './PlayerAvatar';
import { PartyTag } from './PartyTag';
import { FinishedBadge } from './FinishedBadge';
import { MovesDisplay } from '../MovesDisplay';
import { fmtClock, fmtElapsed } from '../../helpers/playerAvatar';

interface Props<ServerState extends BaseServerState> {
  userId: string;
  memberNickname: string;
  // Absent for a player we have no live session for — multi-stage runs
  // only, when they're racing a stage other than the one sessionParties
  // covers (see runProgress below). Every session-derived field (percentage,
  // away/lobby state, last-seen, board preview) is skipped in that case;
  // runProgress carries everything we do know about them instead.
  session?: Session<ServerState>;
  parties: { partyId: string; partyName: string; isOwner: boolean }[];
  now: number;
  isAway: boolean;
  calculateCompletionPercentageFromState: (state: ServerState) => number;
  CompactSimpleState: ComponentType<{ state: ServerState }>;
  // Game-specific move count vs par (e.g. unblockrace's movesMade/
  // movesRequired metadata), live while racing and once finished. Games
  // with no moves concept (sudoku) simply omit this.
  getMovesDisplay?: (
    state: ServerState
  ) => { movesMade: number; movesRequired: number } | undefined;
  // Game-specific star rating for a completed session; shown alongside the
  // moves chip once finished.
  getStarRating?: (state: ServerState) => number | undefined;
  onSetConfirmRemove: (data: {
    userId: string;
    memberNickname: string;
    ownedParties: { partyId: string; partyName: string }[];
  }) => void;
  // Multi-stage runs only: how many stages this player has completed so
  // far (and their summed time across those stages), out of the run's
  // total. session/pct above are scoped to whichever stage `session`
  // belongs to, so once provided this replaces the percentage and the
  // finish time in the clock label — the raw in-stage percentage isn't a
  // meaningful "how far through the run" figure once players are spread
  // across different stages, and the current stage's own completed.seconds
  // isn't the run's total time.
  runProgress?: {
    completedStageCount: number;
    totalStages: number;
    totalSeconds: number;
  };
  // Multi-stage runs only: this player's most recent known activity across
  // EVERY stage, not just whichever one `session` belongs to — used for the
  // "last seen" label when away. Falls back to session.updatedAt when
  // absent (single-puzzle games, or no cross-stage data available), and is
  // required to show "last seen" at all when there's no session (a run-only
  // row racing a different stage) since there's nothing else to time from.
  lastActiveAt?: Date;
}

export function OnlinePlayerRow<ServerState extends BaseServerState>({
  userId,
  memberNickname,
  session,
  parties,
  now,
  isAway,
  calculateCompletionPercentageFromState,
  CompactSimpleState,
  onSetConfirmRemove,
  runProgress,
  lastActiveAt,
  getMovesDisplay,
  getStarRating,
}: Props<ServerState>) {
  const pct = session
    ? calculateCompletionPercentageFromState(session.state)
    : 0;
  const moves = session ? getMovesDisplay?.(session.state) : undefined;
  const stars = session ? getStarRating?.(session.state) : undefined;
  const isRunComplete = runProgress
    ? runProgress.completedStageCount >= runProgress.totalStages
    : undefined;
  const isFinished = isRunComplete ?? !!session?.state.completed;
  const elapsedSeconds =
    runProgress && isFinished
      ? runProgress.totalSeconds
      : (session?.state.completed?.seconds ??
        session?.state.timer?.seconds ??
        0);
  const ownedParties = parties.filter((p) => p.isOwner);
  const hasStarted =
    !isAway && !!session?.state.timer && session.state.timer.seconds > 0;
  // No live session (racing a stage sessionParties doesn't cover): they're
  // definitely not sitting in the lobby, and there's nothing to call "away"
  // relative to, so this always reads as actively racing.
  const isInLobby = !!session && !isAway && !isFinished && !hasStarted;

  const updatedAtMs = lastActiveAt
    ? lastActiveAt.getTime()
    : session
      ? session.updatedAt instanceof Date
        ? session.updatedAt.getTime()
        : new Date(session.updatedAt).getTime()
      : undefined;
  const lastSeenLabel =
    isAway && updatedAtMs !== undefined ? fmtElapsed(now - updatedAtMs) : null;

  const cardBg = isAway ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.04)';
  const cardBorder = isAway
    ? '1px solid rgba(255,255,255,0.07)'
    : '1px solid rgba(255,255,255,0.09)';

  // Multi-stage runs: "Stage N of M" instead of a raw percentage, since the
  // percentage only ever describes progress on whichever single stage
  // `session` happens to be for.
  const progressLabel = runProgress
    ? `Stage ${Math.min(runProgress.completedStageCount + 1, runProgress.totalStages)} of ${runProgress.totalStages}`
    : `${Math.round(pct)}%`;

  const clockLabel = isFinished
    ? runProgress
      ? `Finished the run in ${fmtClock(elapsedSeconds)}`
      : `Solved in ${fmtClock(elapsedSeconds)}`
    : isAway
      ? `${progressLabel} · ${fmtClock(elapsedSeconds)} · last seen ${lastSeenLabel}`
      : `${progressLabel} · ${fmtClock(elapsedSeconds)}`;

  return (
    <div
      className="flex items-center gap-3 rounded-2xl p-3"
      style={{ background: cardBg, border: cardBorder }}
    >
      <PlayerAvatar name={memberNickname} muted={isAway && !isFinished} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-bold text-white">{memberNickname}</span>
          {parties.map((p) => (
            <PartyTag key={p.partyId} partyName={p.partyName} />
          ))}
          {ownedParties.length > 0 && (
            <button
              onClick={() =>
                onSetConfirmRemove({ userId, memberNickname, ownedParties })
              }
              className="inline-flex cursor-pointer items-center justify-center"
              style={{ background: 'transparent', border: 'none' }}
              aria-label={`Remove ${memberNickname}`}
            >
              <Trash size={14} color="rgba(255,255,255,0.35)" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isInLobby ? (
            <span
              className="text-[12px] font-bold"
              style={{ color: 'var(--theme-primary-light)' }}
            >
              In lobby
            </span>
          ) : isFinished ? (
            <FinishedBadge />
          ) : null}
          {!isInLobby && (
            <span
              className="inline-flex items-center gap-1 text-[12.5px] font-bold"
              style={{
                color: 'rgba(255,255,255,0.62)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <Clock size={12} color="rgba(255,255,255,0.45)" />
              {clockLabel}
            </span>
          )}
          {!isInLobby && moves && (
            <span className="text-[12.5px] font-bold">
              <MovesDisplay moves={moves} />
            </span>
          )}
          {isFinished && stars !== undefined && (
            <StarRating rating={stars} size="sm" />
          )}
        </div>
      </div>
      {!isInLobby && session && (
        <div
          className={[
            'pointer-events-none flex-shrink-0 overflow-hidden rounded-lg',
            isAway && !isFinished ? 'opacity-50' : '',
          ].join(' ')}
          style={{
            width: 72,
            height: 72,
            background: 'rgba(0,0,0,0.25)',
            padding: 2,
          }}
        >
          <CompactSimpleState state={session.state} />
        </div>
      )}
    </div>
  );
}
