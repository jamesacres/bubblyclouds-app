import {
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ComponentType,
  ReactElement,
  SyntheticEvent,
} from 'react';
import {
  Bot,
  Check,
  Clock,
  Moon,
  Play,
  Plus,
  RefreshCw,
  Trash,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Parties, Session } from '@bubblyclouds-app/types/serverTypes';
import { useParties } from '../hooks/useParties';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { RevenueCatContext } from '../providers/RevenueCatProvider';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';
import { BaseServerState } from '../types/state';
import { AgentProgress } from '@bubblyclouds-app/types/agentTypes';
import { useServerStorage } from '../hooks/serverStorage';
import { useDocumentVisibility } from '../hooks/documentVisibility';
import { buildPartyInviteUrl } from '../helpers/inviteUrl';
import { HeroBackdrop } from './sidebar/HeroBackdrop';
import { SectionHead } from './sidebar/SectionHead';
import { PillButton } from './sidebar/PillButton';
import { PlayerAvatar } from './sidebar/PlayerAvatar';
import { fmtClock, fmtElapsed } from '../helpers/playerAvatar';
import { isIOS } from '../helpers/capacitor';
import { CopyButton } from '@bubblyclouds-app/ui/components/CopyButton';
import { PartyConfirmationDialog } from './PartyConfirmationDialog';
import { PuzzleHeader } from './sidebar/PuzzleHeader';
import { TierBadge } from './sidebar/TierBadge';
import { InviteSheet } from './sidebar/InviteSheet';
import { PartyTag } from './sidebar/PartyTag';

const PARTY_POLL_INTERVAL_MS = 30_000;
const SCROLL_CONTAINER_BOTTOM_PADDING = 200;
const AWAY_THRESHOLD_MS = 30 * 60 * 1000;

interface Arguments<ServerState extends BaseServerState> {
  showSidebar: boolean;
  setShowSidebar: (showSidebar: boolean) => void;
  puzzleId: string;
  redirectUri: string;
  refreshSessionParties: () => Promise<void>;
  sessionParties: Parties<Session<ServerState>>;
  app: string;
  appName: string;
  apiUrl: string;
  appUrl: string;
  SimpleState: ComponentType<{ state: ServerState }>;
  CompactSimpleState?: ComponentType<{ state: ServerState }>;
  calculateCompletionPercentageFromState: (state: ServerState) => number;
  localAgentProgress?: AgentProgress<ServerState>[];
  onRemoveAgent?: (agentId: string) => void;
  onPickRivals?: () => void;
  puzzleDifficulty?: string;
  puzzleDifficultyBadgeColor?: string;
  puzzleTitle?: string;
  puzzleMetaLabel?: string;
  initialState?: ServerState;
  onStartRace?: () => void;
}

const Sidebar = <ServerState extends BaseServerState>({
  showSidebar,
  setShowSidebar,
  puzzleId,
  redirectUri,
  refreshSessionParties,
  sessionParties,
  app,
  appName,
  apiUrl,
  appUrl,
  SimpleState,
  CompactSimpleState = SimpleState,
  calculateCompletionPercentageFromState,
  localAgentProgress,
  onRemoveAgent,
  onPickRivals,
  puzzleDifficulty,
  puzzleDifficultyBadgeColor,
  puzzleTitle,
  puzzleMetaLabel,
  initialState,
  onStartRace,
}: Arguments<ServerState>) => {
  const context = useContext(UserContext);
  const { user, loginRedirect } = context || {};
  const { isSubscribed, subscribeModal } = useContext(RevenueCatContext) || {};

  const { parties, isLoading, refreshParties, removeMember, memberNickname } =
    useParties({ refreshSessionParties });

  const isDocumentVisible = useDocumentVisibility();

  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!showSidebar || !isDocumentVisible) return;
    const id = setInterval(() => {
      refreshParties();
      setNow(Date.now());
    }, PARTY_POLL_INTERVAL_MS);
    return () => {
      clearInterval(id);
    };
  }, [showSidebar, isDocumentVisible, refreshParties]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{
    userId: string;
    memberNickname: string;
    ownedParties: { partyId: string; partyName: string }[];
  } | null>(null);
  const offlineInviteUrlCacheRef = useRef<Record<string, string>>({});
  const { createInvite } = useServerStorage({ app, apiUrl });

  const getPartyInviteUrl = (
    partyId: string,
    partyName: string
  ): Promise<string> =>
    buildPartyInviteUrl({
      partyId,
      partyName,
      sessionId: `${app}-${puzzleId}`,
      redirectUri,
      appUrl,
      cacheRef: offlineInviteUrlCacheRef.current,
      createInvite,
    });

  // Online opponents: members with an active session, excluding yourself.
  // Collect all party memberships per user so we can show labels and remove buttons.
  const onlineMembers = useMemo(() => {
    const byUser = new Map<
      string,
      {
        userId: string;
        memberNickname: string;
        session: Session<ServerState>;
        parties: { partyId: string; partyName: string; isOwner: boolean }[];
      }
    >();
    for (const party of parties) {
      const sessionParty = sessionParties[party.partyId];
      if (!sessionParty) continue;
      for (const m of party.members) {
        if (m.isUser) continue;
        const session = sessionParty.memberSessions[m.userId];
        if (!session) continue;
        const existing = byUser.get(m.userId);
        if (existing) {
          existing.parties.push({
            partyId: party.partyId,
            partyName: party.partyName,
            isOwner: party.isOwner,
          });
        } else {
          byUser.set(m.userId, {
            userId: m.userId,
            memberNickname: m.memberNickname,
            session,
            parties: [
              {
                partyId: party.partyId,
                partyName: party.partyName,
                isOwner: party.isOwner,
              },
            ],
          });
        }
      }
    }
    return Array.from(byUser.values());
  }, [parties, sessionParties]);

  // Split online members into active (playing/finished) and away (idle 30+ min)
  const { activePlayers, awayPlayers } = useMemo(() => {
    const active: typeof onlineMembers = [];
    const away: typeof onlineMembers = [];
    for (const m of onlineMembers) {
      const updatedAt =
        m.session.updatedAt instanceof Date
          ? m.session.updatedAt.getTime()
          : new Date(m.session.updatedAt).getTime();
      if (now - updatedAt < AWAY_THRESHOLD_MS) {
        active.push(m);
      } else {
        away.push(m);
      }
    }
    return { activePlayers: active, awayPlayers: away };
  }, [onlineMembers, now]);

  // Offline party members: members with no active session, grouped by userId.
  const offlineMembers = useMemo(() => {
    const byUser = new Map<
      string,
      {
        userId: string;
        memberNickname: string;
        parties: { partyId: string; partyName: string; isOwner: boolean }[];
      }
    >();
    for (const party of parties) {
      const sessionParty = sessionParties[party.partyId];
      for (const m of party.members) {
        if (m.isUser) continue;
        if (sessionParty && sessionParty.memberSessions[m.userId]) continue;
        const existing = byUser.get(m.userId);
        if (existing) {
          existing.parties.push({
            partyId: party.partyId,
            partyName: party.partyName,
            isOwner: party.isOwner,
          });
        } else {
          byUser.set(m.userId, {
            userId: m.userId,
            memberNickname: m.memberNickname,
            parties: [
              {
                partyId: party.partyId,
                partyName: party.partyName,
                isOwner: party.isOwner,
              },
            ],
          });
        }
      }
    }
    return Array.from(byUser.values());
  }, [parties, sessionParties]);

  const onlineOpponentCount = activePlayers.length + awayPlayers.length;
  const aiCount = localAgentProgress?.length ?? 0;
  const humanRivals = onlineOpponentCount;
  const totalRivals = humanRivals + aiCount;

  let raceSummary: string;
  if (!totalRivals) {
    raceSummary = 'Solo race — just you and the clock';
  } else {
    const parts: string[] = [];
    if (humanRivals)
      parts.push(`${humanRivals} friend${humanRivals === 1 ? '' : 's'}`);
    if (aiCount)
      parts.push(`${aiCount} AI opponent${aiCount === 1 ? '' : 's'}`);
    raceSummary = `Racing ${parts.join(' and ')}`;
  }

  return (
    <>
      {showSidebar && (
        <div
          className="fixed inset-0 z-50"
          style={{
            background: 'rgba(4,2,15,0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={() => {
            onStartRace?.();
            setShowSidebar(false);
          }}
        />
      )}

      <aside
        id="default-sidebar"
        className="fixed bottom-0 left-0 right-0 z-50 mx-auto h-[88%] w-full max-w-lg"
        style={{
          transform: showSidebar ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform .32s cubic-bezier(0.34,1.2,0.64,1)',
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          background: 'linear-gradient(180deg,#1a1340 0%,#0c091e 100%)',
          borderTop: '1px solid rgba(167,139,250,0.22)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
        aria-label="Race Lobby"
      >
        {/* Absolute backdrop effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <HeroBackdrop />
        </div>

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inset-0 rounded-full"
                style={{ background: '#4ade80', boxShadow: '0 0 10px #4ade80' }}
              />
            </span>
            <span
              className="text-[11px] font-extrabold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Race Lobby
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onStartRace?.();
                setShowSidebar(false);
              }}
              className="cursor-pointer"
              aria-label="Close lobby"
            >
              <X size={20} color="rgba(255,255,255,0.5)" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          className="relative z-10 flex h-full flex-col"
          style={{ paddingBottom: SCROLL_CONTAINER_BOTTOM_PADDING }}
        >
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4">
            {/* Puzzle header */}
            {(puzzleDifficulty || puzzleTitle || initialState) && (
              <div className="mb-5">
                <PuzzleHeader
                  difficulty={puzzleDifficulty}
                  difficultyBadgeColor={puzzleDifficultyBadgeColor}
                  title={puzzleTitle}
                  metaLabel={puzzleMetaLabel}
                  initialState={initialState}
                  CompactSimpleState={CompactSimpleState}
                />
              </div>
            )}

            {/* Online opponents */}
            <SectionHead
              icon={Users}
              title="Online opponents"
              count={onlineOpponentCount}
              action={
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => refreshParties()}
                    disabled={isLoading}
                    aria-label="Refresh online opponents"
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full"
                    style={{
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <RefreshCw
                      size={15}
                      color="rgba(255,255,255,0.6)"
                      className={isLoading ? 'animate-spin' : ''}
                    />
                  </button>
                  <PillButton
                    icon={UserPlus}
                    onClick={() => {
                      if (!user) {
                        loginRedirect?.({ userInitiated: true });
                        return;
                      }
                      if (parties.length > 0 && !isSubscribed) {
                        subscribeModal?.showModalIfRequired(
                          () => setShowInviteSheet(true),
                          () => {},
                          SubscriptionContext.MULTIPLE_PARTIES
                        );
                      } else {
                        setShowInviteSheet(true);
                      }
                    }}
                  >
                    Invite
                  </PillButton>
                </div>
              }
            />

            <div className="mb-4 flex flex-col gap-2.5">
              {activePlayers.length > 0 ? (
                activePlayers.map((m) => {
                  const pct = calculateCompletionPercentageFromState(
                    m.session.state
                  );
                  const isFinished = !!m.session.state.completed;
                  const hasStarted =
                    !!m.session.state.timer &&
                    m.session.state.timer.seconds > 0;
                  const isInLobby = !isFinished && !hasStarted;
                  const elapsedSeconds =
                    m.session.state.completed?.seconds ??
                    m.session.state.timer?.seconds ??
                    0;
                  const ownedParties = m.parties.filter((p) => p.isOwner);
                  return (
                    <div
                      key={m.userId}
                      className="flex items-center gap-3 rounded-2xl p-3"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.09)',
                      }}
                    >
                      <PlayerAvatar name={m.memberNickname} />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {m.memberNickname}
                          </span>
                          {m.parties.map((p) => (
                            <PartyTag key={p.partyId} partyName={p.partyName} />
                          ))}
                          {ownedParties.length > 0 && (
                            <button
                              onClick={() =>
                                setConfirmRemove({
                                  userId: m.userId,
                                  memberNickname: m.memberNickname,
                                  ownedParties,
                                })
                              }
                              className="inline-flex cursor-pointer items-center justify-center"
                              style={{
                                background: 'transparent',
                                border: 'none',
                              }}
                              aria-label={`Remove ${m.memberNickname}`}
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
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold"
                              style={{
                                color: '#6ee7b7',
                                background: 'rgba(16,185,129,0.16)',
                                border: '1px solid rgba(52,211,153,0.4)',
                              }}
                            >
                              <Check size={12} color="#6ee7b7" />
                              Finished
                            </span>
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
                              {isFinished
                                ? `Solved in ${fmtClock(elapsedSeconds)}`
                                : `${Math.round(pct)}% · ${fmtClock(elapsedSeconds)}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                        {!isInLobby && (
                          <div
                            className="pointer-events-none overflow-hidden rounded-lg"
                            style={{
                              width: 72,
                              height: 72,
                              background: 'rgba(0,0,0,0.25)',
                              padding: 2,
                            }}
                          >
                            <CompactSimpleState state={m.session.state} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p
                  className="text-sm italic"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  No opponents online — invite friends to race!
                </p>
              )}
            </div>

            {/* Away section */}
            {awayPlayers.length > 0 && (
              <div className="mb-5">
                <SectionHead
                  icon={Moon}
                  title="Away"
                  count={awayPlayers.length}
                />
                <div className="flex flex-col gap-2.5">
                  {awayPlayers.map((m) => {
                    const pct = calculateCompletionPercentageFromState(
                      m.session.state
                    );
                    const isFinished = !!m.session.state.completed;
                    const elapsedSeconds =
                      m.session.state.completed?.seconds ??
                      m.session.state.timer?.seconds ??
                      0;
                    const updatedAt =
                      m.session.updatedAt instanceof Date
                        ? m.session.updatedAt.getTime()
                        : new Date(m.session.updatedAt).getTime();
                    const elapsedMs = now - updatedAt;
                    const lastSeenLabel = fmtElapsed(elapsedMs);
                    const ownedParties = m.parties.filter((p) => p.isOwner);
                    return (
                      <div
                        key={m.userId}
                        className="flex items-center gap-3 rounded-2xl p-3"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        <PlayerAvatar
                          name={m.memberNickname}
                          muted={!isFinished}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {m.memberNickname}
                            </span>
                            {m.parties.map((p) => (
                              <PartyTag
                                key={p.partyId}
                                partyName={p.partyName}
                              />
                            ))}
                            {ownedParties.length > 0 && (
                              <button
                                onClick={() =>
                                  setConfirmRemove({
                                    userId: m.userId,
                                    memberNickname: m.memberNickname,
                                    ownedParties,
                                  })
                                }
                                className="inline-flex cursor-pointer items-center justify-center"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                }}
                                aria-label={`Remove ${m.memberNickname}`}
                              >
                                <Trash
                                  size={14}
                                  color="rgba(255,255,255,0.35)"
                                />
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {isFinished && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold"
                                style={{
                                  color: '#6ee7b7',
                                  background: 'rgba(16,185,129,0.16)',
                                  border: '1px solid rgba(52,211,153,0.4)',
                                }}
                              >
                                <Check size={12} color="#6ee7b7" />
                                Finished
                              </span>
                            )}
                            <span
                              className="inline-flex items-center gap-1 text-[12.5px] font-bold"
                              style={{
                                color: 'rgba(255,255,255,0.62)',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              <Clock size={12} color="rgba(255,255,255,0.45)" />
                              {isFinished
                                ? `Solved in ${fmtClock(elapsedSeconds)}`
                                : `${Math.round(pct)}% · ${fmtClock(elapsedSeconds)} · last seen ${lastSeenLabel}`}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`pointer-events-none flex-shrink-0 overflow-hidden rounded-lg ${isFinished ? '' : 'opacity-50'}`}
                          style={{
                            width: 72,
                            height: 72,
                            background: 'rgba(0,0,0,0.25)',
                            padding: 2,
                          }}
                        >
                          <CompactSimpleState state={m.session.state} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Offline party members */}
            {offlineMembers.length > 0 && (
              <div className="mb-6">
                <SectionHead
                  icon={Moon}
                  title="Offline · in your teams"
                  count={offlineMembers.length}
                />
                <div className="flex flex-col gap-2">
                  {offlineMembers.map((m) => {
                    const ownedParties = m.parties.filter((p) => p.isOwner);
                    const firstOwnedParty = ownedParties[0];
                    return (
                      <div
                        key={m.userId}
                        className="flex items-center gap-2 rounded-2xl p-2.5"
                        style={{
                          border: '1px solid rgba(255,255,255,0.07)',
                          background: 'rgba(255,255,255,0.03)',
                        }}
                      >
                        <PlayerAvatar name={m.memberNickname} muted />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className="text-[13px] font-semibold"
                              style={{ color: 'rgba(255,255,255,0.75)' }}
                            >
                              {m.memberNickname}
                            </span>
                            {m.parties.map((p) => (
                              <PartyTag
                                key={p.partyId}
                                partyName={p.partyName}
                              />
                            ))}
                            {ownedParties.length > 0 && (
                              <button
                                onClick={() =>
                                  setConfirmRemove({
                                    userId: m.userId,
                                    memberNickname: m.memberNickname,
                                    ownedParties,
                                  })
                                }
                                className="inline-flex cursor-pointer items-center justify-center"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                }}
                                aria-label={`Remove ${m.memberNickname}`}
                              >
                                <Trash
                                  size={14}
                                  color="rgba(255,255,255,0.35)"
                                />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-1.5">
                          <CopyButton
                            getText={() =>
                              firstOwnedParty
                                ? getPartyInviteUrl(
                                    firstOwnedParty.partyId,
                                    firstOwnedParty.partyName
                                  )
                                : Promise.resolve(`${appUrl}${redirectUri}`)
                            }
                            extraSmall
                            appName={appName}
                            isIOS={isIOS}
                            partyName={firstOwnedParty?.partyName}
                            className="inline-flex h-[34px] flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-[14px] text-xs font-semibold transition-transform active:scale-95"
                            style={{
                              background:
                                'color-mix(in srgb, var(--theme-primary-light) 14%, transparent)',
                              border:
                                '1px solid color-mix(in srgb, var(--theme-primary-light) 40%, transparent)',
                              color: 'var(--theme-primary-light)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI opponents */}
            <SectionHead
              icon={Bot}
              title="AI opponents"
              count={aiCount}
              action={
                onPickRivals && (
                  <PillButton icon={Plus} tone="violet" onClick={onPickRivals}>
                    Add
                  </PillButton>
                )
              }
            />
            {aiCount > 0 ? (
              <div className="mb-4 flex flex-col gap-2.5">
                {localAgentProgress?.map((agent) => {
                  const isFinished = agent.percentage >= 100;
                  const isRacing = agent.percentage > 0;
                  return (
                    <div
                      key={agent.agentId}
                      className="flex items-center gap-3 rounded-2xl p-3"
                      style={{
                        background: 'rgba(255,255,255,0.035)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <div
                        className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center overflow-hidden rounded-full"
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                        }}
                      >
                        <img
                          className="h-full w-full object-cover"
                          src={`/opponents/${agent.name.toLowerCase()}.webp`}
                          alt={agent.name}
                          onError={(e: SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.style.display = 'none';
                            const sibling = e.currentTarget.nextElementSibling;
                            if (sibling instanceof HTMLElement) {
                              sibling.style.setProperty('display', 'flex');
                            }
                          }}
                        />
                        <span
                          className="hidden h-full w-full items-center justify-center text-xl"
                          aria-hidden="true"
                        >
                          {agent.emoji || '🤖'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-[15.5px] font-bold text-white">
                            {agent.name}
                          </span>
                          {agent.skillLevel && (
                            <TierBadge skillLevel={agent.skillLevel} />
                          )}
                        </div>
                        {isRacing && (
                          <div className="flex flex-wrap items-center gap-2">
                            {isFinished && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold"
                                style={{
                                  color: '#6ee7b7',
                                  background: 'rgba(16,185,129,0.16)',
                                  border: '1px solid rgba(52,211,153,0.4)',
                                }}
                              >
                                <Check size={12} color="#6ee7b7" />
                                Finished
                              </span>
                            )}
                            <span
                              className="inline-flex items-center gap-1 text-[12.5px] font-bold"
                              style={{
                                color: 'rgba(255,255,255,0.62)',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              <Clock size={12} color="rgba(255,255,255,0.45)" />
                              {isFinished && agent.finishTime != null
                                ? `Solved in ${fmtClock(agent.finishTime)}`
                                : `${Math.round(agent.percentage)}%`}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        {isRacing && agent.state != null && (
                          <div
                            className="pointer-events-none overflow-hidden rounded-lg"
                            style={{
                              width: 72,
                              height: 72,
                              background: 'rgba(0,0,0,0.25)',
                              padding: 2,
                            }}
                          >
                            <CompactSimpleState state={agent.state} />
                          </div>
                        )}
                        {!isFinished && onRemoveAgent && (
                          <button
                            onClick={() => onRemoveAgent(agent.agentId)}
                            className="inline-flex cursor-pointer items-center justify-center"
                            style={{
                              background: 'transparent',
                              border: 'none',
                            }}
                            aria-label={`Remove ${agent.name}`}
                          >
                            <Trash size={14} color="rgba(255,255,255,0.35)" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <button
                onClick={onPickRivals}
                className="mb-4 w-full cursor-pointer rounded-2xl py-4 text-sm font-semibold"
                style={{
                  border: '1.5px dashed rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.02)',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                No AI opponents yet — add one to always have someone to race.
              </button>
            )}
          </div>
        </div>

        {/* Sticky start bar */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 px-4"
          style={{
            paddingTop: 14,
            paddingBottom: 'max(26px, env(safe-area-inset-bottom))',
            background: 'rgba(12,9,28,0.28)',
            backdropFilter: 'blur(24px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <div className="mb-2.5 flex items-center justify-center">
            <span
              className="text-xs font-semibold"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              {raceSummary}
            </span>
          </div>
          <p
            className="mb-3 text-center text-xs"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Each player races on their own clock
          </p>
          <button
            onClick={() => {
              onStartRace?.();
              setShowSidebar(false);
            }}
            className="bg-theme-primary hover:bg-theme-primary-dark inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-[18px] text-xl font-bold tracking-tight text-white transition-transform active:scale-[0.97]"
            style={{ height: 60 }}
          >
            Start Solving
            <Play size={20} color="white" />
          </button>
        </div>

        <PartyConfirmationDialog
          isOpen={confirmRemove !== null}
          onClose={() => setConfirmRemove(null)}
          type="remove"
          partyName={
            confirmRemove?.ownedParties.map((p) => p.partyName).join(' and ') ??
            ''
          }
          memberName={confirmRemove?.memberNickname}
          onConfirm={async () => {
            await Promise.all(
              confirmRemove!.ownedParties.map((p) =>
                removeMember(p.partyId, confirmRemove!.userId)
              )
            );
          }}
          dialogClassName="relative z-[110]"
        />

        {/* Invite sheet overlay */}
        <InviteSheet
          open={showInviteSheet}
          onClose={() => setShowInviteSheet(false)}
          parties={parties.map((p) => ({
            partyId: p.partyId,
            partyName: p.partyName,
            members: p.members,
            maxSize: p.maxSize,
            isOwner: p.isOwner,
          }))}
          onCreateTeam={() => setShowInviteSheet(false)}
          sessionId={`${app}-${puzzleId}`}
          redirectUri={redirectUri}
          app={app}
          appName={appName}
          apiUrl={apiUrl}
          appUrl={appUrl}
          defaultDisplayName={memberNickname || undefined}
        />
      </aside>
    </>
  );
};

const MemoisedSidebar = memo(function MemoisedSidebar<
  ServerState extends BaseServerState,
>(args: Arguments<ServerState>) {
  return Sidebar(args);
}) as <ServerState extends BaseServerState>(
  args: Arguments<ServerState>
) => ReactElement;

export default MemoisedSidebar;
