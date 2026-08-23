import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ComponentType,
  ReactElement,
} from 'react';
import {
  Bot,
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
import { BaseServerState } from '../types/state';
import { AgentProgress } from '@bubblyclouds-app/types/agentTypes';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';
import { useServerStorage } from '../hooks/serverStorage';
import { useDocumentVisibility } from '../hooks/documentVisibility';
import { buildPartyInviteUrl } from '../helpers/inviteUrl';
import { HeroBackdrop } from './lobby/HeroBackdrop';
import { SectionHead } from './lobby/SectionHead';
import { PillButton } from './lobby/PillButton';
import { PlayerAvatar } from './lobby/PlayerAvatar';
import { fmtClock } from '../helpers/playerAvatar';
import { isIOS } from '../helpers/capacitor';
import { CopyButton } from '@bubblyclouds-app/ui/components/CopyButton';
import { PartyConfirmationDialog } from './PartyConfirmationDialog';
import { PuzzleHeader } from './lobby/PuzzleHeader';
import { TierBadge } from './lobby/TierBadge';
import { InviteSheet } from './lobby/InviteSheet';
import { AgentSelectSheet } from './lobby/AgentSelectSheet';
import type { AgentOption } from './lobby/AgentSelectSheet';
import { PartyTag } from './lobby/PartyTag';
import { FinishedBadge } from './lobby/FinishedBadge';
import { OnlinePlayerRow } from './lobby/OnlinePlayerRow';

const PARTY_POLL_INTERVAL_MS = 30_000;
const SCROLL_CONTAINER_BOTTOM_PADDING = 200;
const AWAY_THRESHOLD_MS = 30 * 60 * 1000;

interface Arguments<ServerState extends BaseServerState> {
  showLobby: boolean;
  setShowLobby: (value: boolean | ((prev: boolean) => boolean)) => void;
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
  agentOptions?: AgentOption[];
  defaultSelectedAgentNames?: string[];
  onAgentMode?: (selectedAgentNames: string[]) => void;
  puzzleDifficulty?: string;
  puzzleDifficultyBadgeColor?: string;
  puzzleMetaLabel?: string;
  initialState?: ServerState;
  onStartRace?: () => void;
  // Multi-stage runs only: each opponent's completed-stage count and time
  // total, keyed by user id — replaces the per-stage percentage/finish time
  // in each row with "Stage N of M" / the run total, and surfaces opponents
  // who've moved on to a stage we have no live session for (they'd
  // otherwise vanish from the list once they leave sessionParties, which is
  // scoped to the current stage only).
  runProgressByUserId?: Record<
    string,
    { completedStageCount: number; totalSeconds: number }
  >;
  totalStages?: number;
  // Multi-stage runs only: each OTHER party member's most recent session
  // updatedAt across every stage we have data for, not just the current
  // one — online/away is decided from this instead of the current stage's
  // own session alone, since a friend can go stale on OUR stage (moved on
  // without us ever seeing them complete it) while actively playing a later
  // one right now.
  mostRecentUpdatedAtByUserId?: Map<string, Date>;
  // True once the current stage's own server session GET has resolved at
  // least once. The immediate-on-open other-stage fetch below waits on this
  // (when provided) rather than firing the instant the Lobby opens: on a
  // hard reload landing directly on the Lobby (the default), firing before
  // this resolves would just have nothing new to report yet. Single-puzzle
  // games (sudoku, or unblockrace runs where this isn't wired up) omit it
  // and keep the old immediate-on-open behaviour.
  hasSessionPartiesFromServer?: boolean;
}

const AgentAvatar = ({ name, emoji }: { name: string; emoji?: string }) => {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div
      className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{
        background: 'rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
      }}
    >
      {!imgFailed && (
        <img
          className="h-full w-full object-cover"
          src={`/opponents/${name.toLowerCase()}.webp`}
          alt={name}
          onError={() => setImgFailed(true)}
        />
      )}
      {imgFailed && (
        <span
          className="flex h-full w-full items-center justify-center text-xl"
          aria-hidden="true"
        >
          {emoji || '🤖'}
        </span>
      )}
    </div>
  );
};

const Lobby = <ServerState extends BaseServerState>({
  showLobby,
  setShowLobby,
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
  agentOptions = [],
  defaultSelectedAgentNames = [],
  onAgentMode,
  puzzleDifficulty,
  puzzleDifficultyBadgeColor,
  puzzleMetaLabel,
  initialState,
  onStartRace,
  runProgressByUserId,
  totalStages,
  mostRecentUpdatedAtByUserId,
  hasSessionPartiesFromServer,
}: Arguments<ServerState>) => {
  const context = useContext(UserContext);
  const { user, showLoginModal } = context || {};
  const { isSubscribed, subscribeModal } = useContext(RevenueCatContext) || {};

  const {
    parties,
    isLoading,
    refreshParties,
    removeMember,
    memberNickname,
    saveParty,
    updateParty,
    leaveParty,
    deleteParty,
  } = useParties({ refreshSessionParties });

  const isDocumentVisible = useDocumentVisibility();

  const [now, setNow] = useState<number>(() => Date.now());

  // Fires refreshParties exactly once per Lobby-open (not on every isLoading
  // transition, which refreshParties itself causes — see below), so it
  // doesn't self-trigger in a loop.
  const hasKickedOffOpenRefreshRef = useRef(false);
  useEffect(() => {
    if (!showLobby) {
      hasKickedOffOpenRefreshRef.current = false;
    }
  }, [showLobby]);

  useEffect(() => {
    if (!showLobby || !isDocumentVisible) return;
    // Fire immediately on open (once useParties' own initial lazyLoadParties
    // has finished, not racing it — refreshParties silently no-ops while
    // isLoading is already true, so calling it before that first load
    // settles would skip refreshSessionParties on this render and wait for
    // the interval instead), not just on the first interval tick — the
    // Lobby is the only screen that fetches other-stage friend sessions
    // while it's open (RaceTrack's own poll stops while showLobby is true),
    // so without this a friend who's already finished stages we haven't
    // reached shows as stuck on whatever stage we last knew about them on
    // until either 30s pass or the manual refresh button is pressed. Gated
    // on a ref, not just isLoading, because refreshParties itself flips
    // isLoading true then false around its own work — depending on isLoading
    // directly would re-fire this effect (and call refreshParties again)
    // every time that happens, looping forever.
    //
    // Also requires `user`: on a hard page reload, auth hasn't resolved yet
    // when this first runs, so isLoading is still false (lazyLoadParties
    // itself requires `user` and no-ops without it) — without this check,
    // refreshParties() would fire while `user` is still undefined, itself
    // silently no-op (PartiesProvider.refreshParties also requires `user`),
    // and permanently mark the ref as "already fired," so the real fetch
    // once auth resolves moments later would never happen. Navigating from
    // within the app (user already resolved from a prior page) never hit
    // this, which is why it only reproduced on a fresh reload.
    //
    // Also waits on hasSessionPartiesFromServer (when the caller provides
    // it — multi-stage runs only): on a hard reload landing directly on the
    // Lobby (the default), the current stage's own session data hasn't
    // loaded yet at this instant — firing the one-shot other-stage fetch
    // anyway would just do so with nothing new to report, missing whatever
    // the server GET was about to bring back until the next manual refresh
    // or 30s poll tick.
    if (
      !isLoading &&
      user &&
      hasSessionPartiesFromServer !== false &&
      !hasKickedOffOpenRefreshRef.current
    ) {
      hasKickedOffOpenRefreshRef.current = true;
      refreshParties();
    }
    const id = setInterval(() => {
      refreshParties();
      setNow(Date.now());
    }, PARTY_POLL_INTERVAL_MS);
    return () => {
      clearInterval(id);
    };
  }, [
    showLobby,
    isDocumentVisible,
    isLoading,
    user,
    hasSessionPartiesFromServer,
    refreshParties,
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [showAgentSheet, setShowAgentSheet] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{
    userId: string;
    memberNickname: string;
    ownedParties: { partyId: string; partyName: string }[];
  } | null>(null);
  const offlineInviteUrlCacheRef = useRef<Record<string, string>>({});
  const { createInvite } = useServerStorage({ app, apiUrl });

  const getPartyInviteUrl = useCallback(
    (partyId: string, partyName: string): Promise<string> =>
      buildPartyInviteUrl({
        partyId,
        partyName,
        sessionId: `${app}-${puzzleId}`,
        redirectUri,
        appUrl,
        cacheRef: offlineInviteUrlCacheRef.current,
        createInvite,
      }),
    [app, puzzleId, redirectUri, appUrl, createInvite]
  );

  // A member's most recent known activity, for the active/away split —
  // mostRecentUpdatedAtByUserId (built across every stage we have data for,
  // multi-stage runs only) takes priority over the current stage's own
  // session: a friend can go stale on OUR stage (moved on without us ever
  // seeing them complete it) while actively playing a later one right now,
  // and judging them by the current stage's staleness alone would
  // misclassify them as away indefinitely. Falls back to the current-stage
  // session's own updatedAt for single-puzzle games, where no such map
  // exists.
  const mostRecentActivityAt = useCallback(
    (userId: string, currentStageSession?: Session<ServerState>) => {
      const acrossStages = mostRecentUpdatedAtByUserId?.get(userId);
      if (acrossStages) {
        return acrossStages.getTime();
      }
      if (!currentStageSession) {
        return undefined;
      }
      return currentStageSession.updatedAt instanceof Date
        ? currentStageSession.updatedAt.getTime()
        : new Date(currentStageSession.updatedAt).getTime();
    },
    [mostRecentUpdatedAtByUserId]
  );

  // Every other party member known to be part of this run, whether or not
  // they have a live session on the CURRENT stage — a session here is only
  // used for the richer OnlinePlayerRow display (board preview, timer);
  // absence of one just means they're on a different stage right now.
  const onlineMembers = useMemo(() => {
    const byUser = new Map<
      string,
      {
        userId: string;
        memberNickname: string;
        session?: Session<ServerState>;
        parties: { partyId: string; partyName: string; isOwner: boolean }[];
      }
    >();
    for (const party of parties) {
      const sessionParty = sessionParties[party.partyId];
      for (const m of party.members) {
        if (m.isUser) continue;
        const session = sessionParty?.memberSessions[m.userId];
        const isKnownRunParticipant = !!runProgressByUserId?.[m.userId];
        if (!session && !isKnownRunParticipant) continue;
        const existing = byUser.get(m.userId);
        if (existing) {
          existing.parties.push({
            partyId: party.partyId,
            partyName: party.partyName,
            isOwner: party.isOwner,
          });
          existing.session = existing.session ?? session;
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
  }, [parties, sessionParties, runProgressByUserId]);

  // Split online members into active (playing/finished) and away (idle 30+
  // min) by their actual most recent activity — not by whether they happen
  // to have a session on the CURRENT stage. A member with no current-stage
  // session (racing a different stage — OnlinePlayerRow falls back to the
  // runProgress-only "Stage N of M" display for these) still gets an
  // active/away verdict from mostRecentActivityAt when we have cross-stage
  // data for them; only truly unknown recency (no map entry at all) skips
  // straight to runOnly-active, since there's nothing to time out.
  const { activePlayers, awayPlayers, runOnlyMembers, runOnlyAwayMembers } =
    useMemo(() => {
      const active: {
        userId: string;
        memberNickname: string;
        session: Session<ServerState>;
        parties: { partyId: string; partyName: string; isOwner: boolean }[];
      }[] = [];
      const away: typeof active = [];
      const runOnly: {
        userId: string;
        memberNickname: string;
        parties: { partyId: string; partyName: string; isOwner: boolean }[];
        lastActiveAt?: Date;
      }[] = [];
      const runOnlyAway: typeof runOnly = [];
      for (const m of onlineMembers) {
        const activityAt = mostRecentActivityAt(m.userId, m.session);
        const isRecentlyActive =
          activityAt === undefined || now - activityAt < AWAY_THRESHOLD_MS;
        if (m.session) {
          if (isRecentlyActive) {
            active.push({ ...m, session: m.session });
          } else {
            away.push({ ...m, session: m.session });
          }
        } else {
          const row = {
            userId: m.userId,
            memberNickname: m.memberNickname,
            parties: m.parties,
            lastActiveAt: mostRecentUpdatedAtByUserId?.get(m.userId),
          };
          if (isRecentlyActive) {
            runOnly.push(row);
          } else {
            runOnlyAway.push(row);
          }
        }
      }
      return {
        activePlayers: active,
        awayPlayers: away,
        runOnlyMembers: runOnly,
        runOnlyAwayMembers: runOnlyAway,
      };
    }, [onlineMembers, now, mostRecentActivityAt, mostRecentUpdatedAtByUserId]);
  const runOnlyMemberIds = useMemo(
    () =>
      new Set([...runOnlyMembers, ...runOnlyAwayMembers].map((m) => m.userId)),
    [runOnlyMembers, runOnlyAwayMembers]
  );

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
        if (runOnlyMemberIds.has(m.userId)) continue;
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
  }, [parties, sessionParties, runOnlyMemberIds]);

  const runProgressForRow = useCallback(
    (
      memberUserId: string
    ):
      | {
          completedStageCount: number;
          totalStages: number;
          totalSeconds: number;
        }
      | undefined => {
      const progress = runProgressByUserId?.[memberUserId];
      if (!progress || !totalStages) {
        return undefined;
      }
      return { ...progress, totalStages };
    },
    [runProgressByUserId, totalStages]
  );

  // The "Online opponents" section header count must match what's actually
  // rendered under it (activePlayers + runOnlyMembers) — awayPlayers get
  // their own separate "Away" section/count below, so including them here
  // too made the header read as "N online" while the Online list itself was
  // empty and everyone sat in Away, which looked like a bug even though the
  // number was a (differently-scoped) total.
  const onlineOpponentCount = activePlayers.length + runOnlyMembers.length;
  const totalKnownOpponentCount =
    activePlayers.length +
    awayPlayers.length +
    runOnlyMembers.length +
    runOnlyAwayMembers.length;
  const aiCount = localAgentProgress?.length ?? 0;
  const humanRivals = totalKnownOpponentCount;
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
      {showLobby && (
        <div
          className="fixed inset-0 z-50"
          style={{
            background: 'rgba(4,2,15,0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={() => {
            onStartRace?.();
            setShowLobby(false);
          }}
        />
      )}

      <aside
        id="default-lobby"
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto h-[88%] w-full max-w-lg transition-[transform,opacity] duration-[320ms] ease-[cubic-bezier(0.34,1.2,0.64,1)] md:bottom-auto md:top-1/2 md:h-[85%] md:max-h-[720px] md:-translate-y-1/2 md:rounded-b-[26px] ${
          showLobby
            ? 'translate-y-0 md:scale-100 md:opacity-100'
            : 'pointer-events-none translate-y-full md:scale-95 md:opacity-0'
        }`}
        style={{
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          background: 'linear-gradient(180deg,#1a1340 0%,#0c091e 100%)',
          borderTop: '1px solid rgba(167,139,250,0.22)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
        aria-label="Race Lobby"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <HeroBackdrop />
        </div>

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
                setShowLobby(false);
              }}
              className="cursor-pointer"
              aria-label="Close lobby"
            >
              <X size={20} color="rgba(255,255,255,0.5)" />
            </button>
          </div>
        </div>

        <div
          className="relative z-10 flex h-full flex-col"
          style={{ paddingBottom: SCROLL_CONTAINER_BOTTOM_PADDING }}
        >
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4">
            {/* Puzzle header */}
            {(puzzleDifficulty || initialState) && (
              <div className="mb-5">
                <PuzzleHeader
                  difficulty={puzzleDifficulty}
                  difficultyBadgeColor={puzzleDifficultyBadgeColor}
                  metaLabel={puzzleMetaLabel}
                  initialState={initialState}
                  CompactSimpleState={CompactSimpleState}
                />
              </div>
            )}

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
                        showLoginModal?.(undefined, LoginContext.RACE_LOBBY);
                        return;
                      }
                      setShowInviteSheet(true);
                    }}
                  >
                    Invite
                  </PillButton>
                </div>
              }
            />

            <div className="mb-4 flex flex-col gap-2.5">
              {activePlayers.length > 0 || runOnlyMembers.length > 0 ? (
                <>
                  {activePlayers.map((m) => (
                    <OnlinePlayerRow
                      key={m.userId}
                      userId={m.userId}
                      memberNickname={m.memberNickname}
                      session={m.session}
                      parties={m.parties}
                      now={now}
                      isAway={false}
                      calculateCompletionPercentageFromState={
                        calculateCompletionPercentageFromState
                      }
                      CompactSimpleState={CompactSimpleState}
                      onSetConfirmRemove={setConfirmRemove}
                      runProgress={runProgressForRow(m.userId)}
                    />
                  ))}
                  {/* Racing another stage: no live session for the current
                      stage, so OnlinePlayerRow falls back to the
                      runProgress-only "Stage N of M" display */}
                  {runOnlyMembers.map((m) => (
                    <OnlinePlayerRow
                      key={m.userId}
                      userId={m.userId}
                      memberNickname={m.memberNickname}
                      parties={m.parties}
                      now={now}
                      isAway={false}
                      calculateCompletionPercentageFromState={
                        calculateCompletionPercentageFromState
                      }
                      CompactSimpleState={CompactSimpleState}
                      onSetConfirmRemove={setConfirmRemove}
                      runProgress={runProgressForRow(m.userId)}
                      lastActiveAt={m.lastActiveAt}
                    />
                  ))}
                </>
              ) : totalKnownOpponentCount === 0 ? (
                <p
                  className="text-sm italic"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  No opponents online — invite friends to race!
                </p>
              ) : null}
            </div>

            {awayPlayers.length + runOnlyAwayMembers.length > 0 && (
              <div className="mb-5">
                <SectionHead
                  icon={Moon}
                  title="Away"
                  count={awayPlayers.length + runOnlyAwayMembers.length}
                />
                <div className="flex flex-col gap-2.5">
                  {awayPlayers.map((m) => (
                    <OnlinePlayerRow
                      key={m.userId}
                      userId={m.userId}
                      memberNickname={m.memberNickname}
                      session={m.session}
                      parties={m.parties}
                      now={now}
                      isAway={true}
                      calculateCompletionPercentageFromState={
                        calculateCompletionPercentageFromState
                      }
                      CompactSimpleState={CompactSimpleState}
                      onSetConfirmRemove={setConfirmRemove}
                      runProgress={runProgressForRow(m.userId)}
                    />
                  ))}
                  {/* Racing another stage but idle there too (no session for
                      the current stage, so no board preview) */}
                  {runOnlyAwayMembers.map((m) => (
                    <OnlinePlayerRow
                      key={m.userId}
                      userId={m.userId}
                      memberNickname={m.memberNickname}
                      parties={m.parties}
                      now={now}
                      isAway={true}
                      calculateCompletionPercentageFromState={
                        calculateCompletionPercentageFromState
                      }
                      CompactSimpleState={CompactSimpleState}
                      onSetConfirmRemove={setConfirmRemove}
                      runProgress={runProgressForRow(m.userId)}
                      lastActiveAt={m.lastActiveAt}
                    />
                  ))}
                </div>
              </div>
            )}

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

            <SectionHead
              icon={Bot}
              title="AI opponents"
              count={aiCount}
              action={
                onAgentMode && (
                  <PillButton
                    icon={Plus}
                    tone="violet"
                    onClick={() => setShowAgentSheet(true)}
                  >
                    Add
                  </PillButton>
                )
              }
            />
            {aiCount > 0 ? (
              <div className="mb-4 flex flex-col gap-2.5">
                {localAgentProgress?.map((agent) => {
                  // Multi-stage runs: mirror OnlinePlayerRow — "finished"
                  // means the whole run, not just the current stage, and the
                  // label is "Stage N of M" rather than a raw percentage
                  // that resets each time the agent advances a stage.
                  const runProgress = runProgressForRow(agent.agentId);
                  const isRunComplete = runProgress
                    ? runProgress.completedStageCount >= runProgress.totalStages
                    : undefined;
                  const isFinished = isRunComplete ?? agent.percentage >= 100;
                  const isRacing = runProgress ? true : agent.percentage > 0;
                  const elapsedSeconds =
                    runProgress && isFinished
                      ? runProgress.totalSeconds
                      : agent.finishTime;
                  const progressLabel = runProgress
                    ? `Stage ${Math.min(runProgress.completedStageCount + 1, runProgress.totalStages)} of ${runProgress.totalStages}`
                    : `${Math.round(agent.percentage)}%`;
                  return (
                    <div
                      key={agent.agentId}
                      className="flex items-center gap-3 rounded-2xl p-3"
                      style={{
                        background: 'rgba(255,255,255,0.035)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <AgentAvatar name={agent.name} emoji={agent.emoji} />
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
                            {isFinished && <FinishedBadge />}
                            <span
                              className="inline-flex items-center gap-1 text-[12.5px] font-bold"
                              style={{
                                color: 'rgba(255,255,255,0.62)',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              <Clock size={12} color="rgba(255,255,255,0.45)" />
                              {isFinished && elapsedSeconds != null
                                ? runProgress
                                  ? `Finished the run in ${fmtClock(elapsedSeconds)}`
                                  : `Solved in ${fmtClock(elapsedSeconds)}`
                                : progressLabel}
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
                onClick={() => setShowAgentSheet(true)}
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

        <div
          className="absolute bottom-0 left-0 right-0 z-20 px-4 md:pb-[26px]"
          style={{
            paddingTop: 14,
            paddingBottom: 'max(26px, var(--ion-safe-area-bottom, 0px))',
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
              setShowLobby(false);
            }}
            className="bg-theme-primary hover:bg-theme-primary-dark inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-[18px] text-xl font-bold tracking-tight text-white transition-transform active:scale-[0.97]"
            style={{ height: 60 }}
          >
            Start Solving
            <Play size={20} color="white" />
          </button>
        </div>

        {confirmRemove && (
          <PartyConfirmationDialog
            isOpen={true}
            onClose={() => setConfirmRemove(null)}
            type="remove"
            partyName={confirmRemove.ownedParties
              .map((p) => p.partyName)
              .join(' and ')}
            memberName={confirmRemove.memberNickname}
            onConfirm={async () => {
              await Promise.all(
                confirmRemove.ownedParties.map((p) =>
                  removeMember(p.partyId, confirmRemove.userId)
                )
              );
            }}
            dialogClassName="relative z-[110]"
          />
        )}

        {onAgentMode && (
          <AgentSelectSheet
            key={showAgentSheet ? 'open' : 'closed'}
            open={showAgentSheet}
            onClose={() => setShowAgentSheet(false)}
            agentOptions={agentOptions}
            defaultSelectedAgentNames={defaultSelectedAgentNames}
            onAgentMode={(selected) => {
              onAgentMode(selected);
              setShowAgentSheet(false);
            }}
          />
        )}

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
          defaultDisplayName={memberNickname || user?.name || undefined}
          saveParty={saveParty}
          updateParty={updateParty}
          leaveParty={leaveParty}
          deleteParty={deleteParty}
          isSubscribed={isSubscribed}
          subscribeModal={subscribeModal}
        />
      </aside>
    </>
  );
};

const MemoisedLobby = memo(function MemoisedLobby<
  ServerState extends BaseServerState,
>(args: Arguments<ServerState>) {
  return Lobby(args);
}) as <ServerState extends BaseServerState>(
  args: Arguments<ServerState>
) => ReactElement;

export default MemoisedLobby;
