import { ComponentType } from 'react';
import { Clock, Trash } from 'lucide-react';
import { Session } from '@bubblyclouds-app/types/serverTypes';
import { BaseServerState } from '../../types/state';
import { PlayerAvatar } from './PlayerAvatar';
import { PartyTag } from './PartyTag';
import { FinishedBadge } from './FinishedBadge';
import { fmtClock, fmtElapsed } from '../../helpers/playerAvatar';

interface Props<ServerState extends BaseServerState> {
  userId: string;
  memberNickname: string;
  session: Session<ServerState>;
  parties: { partyId: string; partyName: string; isOwner: boolean }[];
  now: number;
  isAway: boolean;
  calculateCompletionPercentageFromState: (state: ServerState) => number;
  CompactSimpleState: ComponentType<{ state: ServerState }>;
  onSetConfirmRemove: (data: {
    userId: string;
    memberNickname: string;
    ownedParties: { partyId: string; partyName: string }[];
  }) => void;
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
}: Props<ServerState>) {
  const pct = calculateCompletionPercentageFromState(session.state);
  const isFinished = !!session.state.completed;
  const elapsedSeconds =
    session.state.completed?.seconds ?? session.state.timer?.seconds ?? 0;
  const ownedParties = parties.filter((p) => p.isOwner);
  const hasStarted =
    !isAway && !!session.state.timer && session.state.timer.seconds > 0;
  const isInLobby = !isAway && !isFinished && !hasStarted;

  const updatedAtMs =
    session.updatedAt instanceof Date
      ? session.updatedAt.getTime()
      : new Date(session.updatedAt).getTime();
  const lastSeenLabel = isAway ? fmtElapsed(now - updatedAtMs) : null;

  const cardBg = isAway ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.04)';
  const cardBorder = isAway
    ? '1px solid rgba(255,255,255,0.07)'
    : '1px solid rgba(255,255,255,0.09)';

  const clockLabel = isFinished
    ? `Solved in ${fmtClock(elapsedSeconds)}`
    : isAway
      ? `${Math.round(pct)}% · ${fmtClock(elapsedSeconds)} · last seen ${lastSeenLabel}`
      : `${Math.round(pct)}% · ${fmtClock(elapsedSeconds)}`;

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
        </div>
      </div>
      {!isInLobby && (
        <div
          className={`pointer-events-none flex-shrink-0 overflow-hidden rounded-lg${
            isAway && !isFinished ? ' opacity-50' : ''
          }`}
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
