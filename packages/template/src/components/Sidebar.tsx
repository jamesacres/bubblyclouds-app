import {
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
  ComponentType,
  CSSProperties,
  ReactElement,
  ReactNode,
} from 'react';
import {
  Bot,
  Check,
  Clock,
  Edit3,
  Link2,
  Loader,
  LogOut,
  Moon,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
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
  localAgentProgress?: AgentProgress[];
  onRemoveAgent?: (agentId: string) => void;
  onLeaveAgentParty?: () => void;
  onPickRivals?: () => void;
  puzzleDifficulty?: string;
  puzzleDifficultyBadgeColor?: string;
  puzzleTitle?: string;
  puzzleMetaLabel?: string;
  initialState?: ServerState;
  onStartRace?: () => void;
}

function HeroBackdrop() {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute rounded-full"
          style={{
            left: -90,
            top: -110,
            width: 360,
            height: 360,
            background: 'rgba(124,58,237,0.32)',
            filter: 'blur(90px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            right: -50,
            top: 30,
            width: 230,
            height: 230,
            background: 'rgba(34,211,238,0.22)',
            filter: 'blur(75px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: 40,
            left: '25%',
            width: 280,
            height: 200,
            background: 'rgba(217,70,239,0.18)',
            filter: 'blur(80px)',
          }}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(rgba(167,139,250,0.16) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.16) 2px,rgba(0,0,0,0.16) 4px)',
        }}
      />
    </>
  );
}

function SectionHead({
  icon: Icon,
  title,
  count,
  action,
}: {
  icon?: ComponentType<{ size?: number; color?: string }>;
  title: string;
  count?: number;
  action?: ReactElement<any>;
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      {Icon && <Icon size={17} color="var(--theme-primary-light)" />}
      <h2 className="m-0 text-base font-bold tracking-tight text-white">
        {title}
      </h2>
      {count != null && (
        <span
          className="inline-flex items-center justify-center rounded-full px-1.5 text-xs font-extrabold"
          style={{
            minWidth: 22,
            height: 22,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          {count}
        </span>
      )}
      <div className="flex-1" />
      {action}
    </div>
  );
}

function PillButton({
  icon: Icon,
  children,
  onClick,
  tone = 'theme',
}: {
  icon?: ComponentType<{ size?: number; color?: string }>;
  children: ReactNode;
  onClick?: () => void;
  tone?: 'theme' | 'violet';
}) {
  const themed = tone === 'theme';
  return (
    <button
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full text-xs font-semibold transition-transform active:scale-95"
      style={{
        height: 34,
        padding: '0 14px',
        border: `1px solid ${themed ? 'color-mix(in srgb, var(--theme-primary-light) 40%, transparent)' : 'rgba(167,139,250,0.4)'}`,
        background: themed
          ? 'color-mix(in srgb, var(--theme-primary-light) 14%, transparent)'
          : 'rgba(139,92,246,0.18)',
        color: themed ? 'var(--theme-primary-light)' : '#c4b5fd',
      }}
    >
      {Icon && (
        <Icon
          size={15}
          color={themed ? 'var(--theme-primary-light)' : '#c4b5fd'}
        />
      )}
      {children}
    </button>
  );
}

function fmtClock(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(150deg,#4b5563,#374151)',
  'linear-gradient(150deg,#6b7280,#4b5563)',
  'linear-gradient(150deg,#374151,#1f2937)',
  'linear-gradient(150deg,#52525b,#3f3f46)',
];

function avatarGradient(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = (h * 31 + name.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[h];
}

function PlayerAvatar({
  name,
  muted = false,
}: {
  name: string;
  muted?: boolean;
}) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: 42,
        height: 42,
        fontSize: 17,
        background: avatarGradient(name),
        opacity: muted ? 0.55 : 1,
        boxShadow:
          '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)',
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function PuzzleHeader<ServerState extends BaseServerState>({
  difficulty,
  difficultyBadgeColor,
  title,
  metaLabel,
  initialState,
  CompactSimpleState,
}: {
  difficulty?: string;
  difficultyBadgeColor?: string;
  title?: string;
  metaLabel?: string;
  initialState?: ServerState;
  CompactSimpleState?: ComponentType<{ state: ServerState }>;
}) {
  if (!difficulty && !title && !initialState) return null;

  return (
    <div
      className="flex items-center gap-3.5 rounded-[18px] p-3"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      {initialState && CompactSimpleState && (
        <div
          className="pointer-events-none flex-shrink-0 overflow-hidden rounded-lg p-1"
          style={{ width: 84, height: 84, background: 'rgba(0,0,0,0.25)' }}
        >
          <CompactSimpleState state={initialState} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        {metaLabel && (
          <div
            className="mb-1 text-[10.5px] font-extrabold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {metaLabel}
          </div>
        )}
        {title && (
          <div className="mb-1.5 text-lg font-extrabold tracking-tight text-white">
            {title}
          </div>
        )}
        {difficulty && (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider ${difficultyBadgeColor ?? ''}`}
            >
              {difficulty}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const TIER_COLORS: Record<string, { fg: string; bg: string; bd: string }> = {
  novice: {
    fg: '#6ee7b7',
    bg: 'rgba(16,185,129,0.16)',
    bd: 'rgba(52,211,153,0.4)',
  },
  advancedBeginner: {
    fg: '#fcd34d',
    bg: 'rgba(245,158,11,0.16)',
    bd: 'rgba(251,191,36,0.4)',
  },
  competent: {
    fg: '#fdba74',
    bg: 'rgba(249,115,22,0.16)',
    bd: 'rgba(251,146,60,0.42)',
  },
  proficient: {
    fg: '#c4b5fd',
    bg: 'rgba(139,92,246,0.16)',
    bd: 'rgba(167,139,250,0.4)',
  },
  expert: {
    fg: '#f0abfc',
    bg: 'rgba(217,70,239,0.16)',
    bd: 'rgba(232,121,249,0.4)',
  },
};

const TIER_LABELS: Record<string, string> = {
  novice: 'Novice',
  advancedBeginner: 'Beginner',
  competent: 'Competent',
  proficient: 'Proficient',
  expert: 'Expert',
};

function TierBadge({ skillLevel }: { skillLevel: string }) {
  const c = TIER_COLORS[skillLevel] ?? TIER_COLORS.novice;
  const label = TIER_LABELS[skillLevel] ?? skillLevel;
  return (
    <span
      className="inline-flex items-center rounded-full text-[9px] font-extrabold uppercase tracking-wider"
      style={{
        padding: '4px 8px',
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.bd}`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function InviteSheet({
  open,
  onClose,
  parties,
  onCreateTeam,
  sessionId,
  redirectUri,
  app,
  apiUrl,
  appUrl,
  defaultDisplayName,
}: {
  open: boolean;
  onClose: () => void;
  parties: {
    partyId: string;
    partyName: string;
    members: unknown[];
    maxSize?: number;
    isOwner: boolean;
  }[];
  onCreateTeam: (partyName: string, memberNickname: string) => void;
  sessionId: string;
  redirectUri: string;
  app: string;
  appName: string;
  apiUrl: string;
  appUrl: string;
  defaultDisplayName?: string;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [display, setDisplay] = useState(defaultDisplayName ?? '');
  const [teamName, setTeamName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [confirmLeave, setConfirmLeave] = useState<{
    partyId: string;
    partyName: string;
    isOwner: boolean;
  } | null>(null);
  const inviteUrlCacheRef = useRef<Record<string, string>>({});

  const { saveParty, updateParty, leaveParty, deleteParty } = useParties({
    refreshSessionParties: async () => {},
  });
  const { createInvite } = useServerStorage({ app, apiUrl });

  const handleClose = () => {
    setCopiedId(null);
    setDisplay('');
    setTeamName('');
    onClose();
  };

  const getInviteUrl = async (
    partyId: string,
    partyName: string
  ): Promise<string> => {
    if (inviteUrlCacheRef.current[partyId])
      return inviteUrlCacheRef.current[partyId];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const invite = await createInvite({
      sessionId,
      redirectUri,
      expiresAt: expiresAt.toISOString(),
      description: partyName,
      resourceId: `party-${partyId}`,
    });
    const url = invite
      ? `${appUrl}/invite?inviteId=${invite.inviteId}`
      : window.location.href;
    inviteUrlCacheRef.current[partyId] = url;
    return url;
  };

  const shareUrl = (url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
    if (navigator.share) {
      navigator.share({ url }).catch(() => {});
    }
  };

  const copyTeam = async (partyId: string, partyName: string) => {
    const url = await getInviteUrl(partyId, partyName);
    shareUrl(url);
    setCopiedId(partyId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const create = async () => {
    const nm = teamName.trim() || 'New team';
    const dn = display.trim() || 'Player';
    setIsSaving(true);
    const party = await saveParty({ memberNickname: dn, partyName: nm });
    if (party?.partyId) {
      const url = await getInviteUrl(party.partyId, nm);
      shareUrl(url);
    }
    onCreateTeam(nm, dn);
    setIsSaving(false);
    onClose();
  };

  const inputStyle: CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    height: 52,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    padding: '0 16px',
    fontSize: 15,
    fontWeight: 500,
    color: '#fff',
    outline: 'none',
  };

  return (
    <div
      className="absolute inset-0 z-[90]"
      style={{ pointerEvents: open ? 'auto' : 'none' }}
    >
      <div
        onClick={handleClose}
        className="absolute inset-0"
        style={{
          background: 'rgba(2,1,8,0.66)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          opacity: open ? 1 : 0,
          transition: 'opacity .26s ease',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col overflow-hidden"
        style={{
          maxHeight: '88%',
          transform: open ? 'translateY(0)' : 'translateY(101%)',
          transition: 'transform .32s cubic-bezier(0.34,1.2,0.64,1)',
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          background: 'linear-gradient(180deg,#15102e 0%,#0c0a1c 100%)',
          borderTop: '1px solid rgba(167,139,250,0.22)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.55)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 pb-4 pt-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div>
            <div
              className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-widest"
              style={{ color: 'var(--theme-primary-light)' }}
            >
              Build your race
            </div>
            <h2 className="m-0 text-2xl font-bold tracking-tight text-white">
              Invite opponents
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full"
            style={{
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            <X size={18} color="rgba(255,255,255,0.7)" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 py-4">
          {parties.length > 0 && (
            <>
              <div
                className="mb-2.5 text-[11px] font-extrabold uppercase tracking-wider"
                style={{ color: 'var(--theme-primary-light)' }}
              >
                Invite to existing team
              </div>
              <div className="mb-5 flex flex-col gap-2.5">
                {parties.map((party) => {
                  const copied = copiedId === party.partyId;
                  const isEditingName = editingNameId === party.partyId;
                  const DEFAULT_MAX = 5;
                  return (
                    <div
                      key={party.partyId}
                      className="rounded-2xl p-3.5"
                      style={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.04)',
                      }}
                    >
                      {/* Name + delete/leave */}
                      <div className="mb-1.5 flex items-center gap-2">
                        {party.isOwner && isEditingName ? (
                          <input
                            autoFocus
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onBlur={async () => {
                              if (editNameValue.trim()) {
                                await updateParty(party.partyId, {
                                  partyName: editNameValue.trim(),
                                });
                              }
                              setEditingNameId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter')
                                (e.target as HTMLInputElement).blur();
                              if (e.key === 'Escape') setEditingNameId(null);
                            }}
                            className="min-w-0 flex-1 rounded-lg px-2 py-1 text-sm font-bold text-white outline-none"
                            style={{
                              background: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.2)',
                            }}
                          />
                        ) : (
                          <span className="min-w-0 text-sm font-bold text-white">
                            {party.partyName}
                          </span>
                        )}
                        {party.isOwner && !isEditingName && (
                          <button
                            onClick={() => {
                              setEditingNameId(party.partyId);
                              setEditNameValue(party.partyName);
                            }}
                            className="flex-shrink-0 cursor-pointer p-1"
                            style={{ color: 'rgba(255,255,255,0.35)' }}
                            aria-label="Edit team name"
                          >
                            <Edit3 size={13} />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setConfirmLeave({
                              partyId: party.partyId,
                              partyName: party.partyName,
                              isOwner: party.isOwner,
                            })
                          }
                          className="flex-shrink-0 cursor-pointer p-1 transition-colors hover:text-red-400"
                          style={{ color: 'rgba(255,255,255,0.3)' }}
                          aria-label={
                            party.isOwner ? 'Delete team' : 'Leave team'
                          }
                        >
                          {party.isOwner ? (
                            <Trash size={13} />
                          ) : (
                            <LogOut size={13} />
                          )}
                        </button>
                      </div>

                      {/* Members + max size + copy link */}
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: 'rgba(255,255,255,0.45)' }}
                        >
                          {party.members.length} /
                        </span>
                        {party.isOwner ? (
                          <select
                            value={party.maxSize ?? DEFAULT_MAX}
                            onChange={(e) =>
                              updateParty(party.partyId, {
                                maxSize: parseInt(e.target.value),
                              })
                            }
                            className="cursor-pointer rounded-md px-1.5 py-0.5 text-xs font-semibold outline-none"
                            style={{
                              background: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              color: 'rgba(255,255,255,0.6)',
                            }}
                          >
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                              <option key={n} value={n}>
                                {n} members
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className="text-xs font-semibold"
                            style={{ color: 'rgba(255,255,255,0.45)' }}
                          >
                            {party.maxSize ?? DEFAULT_MAX} members
                          </span>
                        )}
                        <div className="flex-1" />
                        {party.isOwner && (
                          <button
                            onClick={() =>
                              copyTeam(party.partyId, party.partyName)
                            }
                            className="inline-flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-full text-xs font-semibold transition-transform active:scale-95"
                            style={{
                              height: 34,
                              padding: '0 14px',
                              background: copied
                                ? 'rgba(16,185,129,0.15)'
                                : 'color-mix(in srgb, var(--theme-primary-light) 14%, transparent)',
                              border: copied
                                ? '1px solid rgba(52,211,153,0.4)'
                                : '1px solid color-mix(in srgb, var(--theme-primary-light) 40%, transparent)',
                            }}
                          >
                            <span
                              style={{
                                color: copied
                                  ? '#6ee7b7'
                                  : 'var(--theme-primary-light)',
                              }}
                            >
                              {copied ? 'Copied!' : 'Copy link'}
                            </span>
                            {copied ? (
                              <Check size={13} color="#6ee7b7" />
                            ) : (
                              <Link2
                                size={13}
                                color="var(--theme-primary-light)"
                              />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Confirm leave/delete dialog */}
              {confirmLeave && (
                <div
                  className="fixed inset-0 z-[100] flex items-end justify-center p-4"
                  style={{
                    background: 'rgba(2,1,8,0.7)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <div
                    className="w-full max-w-sm rounded-2xl p-5"
                    style={{
                      background: '#1a1340',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    <p className="mb-1 text-base font-bold text-white">
                      {confirmLeave.isOwner ? 'Delete team?' : 'Leave team?'}
                    </p>
                    <p
                      className="mb-5 text-sm"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      {confirmLeave.isOwner
                        ? `"${confirmLeave.partyName}" and all its members will be removed.`
                        : `You'll leave "${confirmLeave.partyName}".`}
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-semibold"
                        style={{
                          background: 'rgba(255,255,255,0.07)',
                          color: 'rgba(255,255,255,0.7)',
                        }}
                        onClick={() => setConfirmLeave(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold text-white"
                        style={{ background: 'rgba(239,68,68,0.8)' }}
                        onClick={async () => {
                          if (confirmLeave.isOwner) {
                            await deleteParty(confirmLeave.partyId);
                          } else {
                            await leaveParty(confirmLeave.partyId);
                          }
                          setConfirmLeave(null);
                        }}
                      >
                        {confirmLeave.isOwner ? 'Delete' : 'Leave'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div
                className="mb-5"
                style={{ height: 1, background: 'rgba(255,255,255,0.08)' }}
              />
            </>
          )}

          <div
            className="mb-3.5 text-[11px] font-extrabold uppercase tracking-wider"
            style={{ color: '#fcd34d' }}
          >
            Create new racing team
          </div>

          <label
            className="mb-2 block text-xs font-semibold"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            What do team members call you?
          </label>
          <input
            value={display}
            onChange={(e) => setDisplay(e.target.value)}
            placeholder="Display name"
            style={inputStyle}
          />

          <label
            className="mb-2 mt-4 block text-xs font-semibold"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            What shall we name this team?
          </label>
          <input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team name (e.g. Family)"
            style={inputStyle}
          />

          <button
            onClick={create}
            disabled={isSaving}
            className="bg-theme-primary hover:bg-theme-primary-dark mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl text-base font-bold text-white"
            style={{ height: 54 }}
          >
            {isSaving ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <>
                <Sparkles size={18} color="white" /> Create &amp; copy link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const AWAY_THRESHOLD_MS = 30 * 60 * 1000;

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

  useEffect(() => {
    if (!showSidebar || !isDocumentVisible) return;
    console.info('Sidebar setting up polling..');
    const id = setInterval(() => {
      console.info('Sidebar polling parties..');
      refreshParties();
    }, 30000);
    return () => {
      console.info('Sidebar clearing polling..');
      clearInterval(id);
    };
  }, [showSidebar, isDocumentVisible, refreshParties]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [now] = useState<number>(() => Date.now());

  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [copiedOfflineId, setCopiedOfflineId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{
    userId: string;
    memberNickname: string;
    ownedParties: { partyId: string; partyName: string }[];
  } | null>(null);
  const offlineInviteUrlCacheRef = useRef<Record<string, string>>({});
  const { createInvite } = useServerStorage({ app, apiUrl });

  const getPartyInviteUrl = async (
    partyId: string,
    partyName: string
  ): Promise<string> => {
    if (offlineInviteUrlCacheRef.current[partyId])
      return offlineInviteUrlCacheRef.current[partyId];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const invite = await createInvite({
      sessionId: `${app}-${puzzleId}`,
      redirectUri,
      expiresAt: expiresAt.toISOString(),
      description: partyName,
      resourceId: `party-${partyId}`,
    });
    const url = invite
      ? `${appUrl}/invite?inviteId=${invite.inviteId}`
      : window.location.href;
    offlineInviteUrlCacheRef.current[partyId] = url;
    return url;
  };

  // Online opponents: members with an active session, excluding yourself.
  // Collect all party memberships per user so we can show labels and remove buttons.
  const onlineMembers = (() => {
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
  })();

  // Split online members into active (playing/finished) and away (idle 30+ min)
  const activePlayers = onlineMembers.filter((m) => {
    const updatedAt =
      m.session.updatedAt instanceof Date
        ? m.session.updatedAt.getTime()
        : new Date(m.session.updatedAt).getTime();
    return now - updatedAt < AWAY_THRESHOLD_MS;
  });

  const awayPlayers = onlineMembers.filter((m) => {
    const updatedAt =
      m.session.updatedAt instanceof Date
        ? m.session.updatedAt.getTime()
        : new Date(m.session.updatedAt).getTime();
    return now - updatedAt >= AWAY_THRESHOLD_MS;
  });

  // Offline party members: members with no active session, grouped by userId.
  const offlineMembers = (() => {
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
  })();

  const onlineOpponentCount = activePlayers.length + awayPlayers.length;
  const aiCount = localAgentProgress?.length ?? 0;
  const humanRivals = onlineOpponentCount;
  const totalRivals = humanRivals + aiCount;

  const raceSummary = (() => {
    if (!totalRivals) return 'Solo race — just you and the clock';
    const parts: string[] = [];
    if (humanRivals)
      parts.push(`${humanRivals} friend${humanRivals === 1 ? '' : 's'}`);
    if (aiCount)
      parts.push(`${aiCount} AI opponent${aiCount === 1 ? '' : 's'}`);
    return `Racing ${parts.join(' and ')}`;
  })();

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
          style={{ paddingBottom: 200 }}
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
                            <span
                              key={p.partyId}
                              className="inline-flex items-center rounded-full text-[9.5px] font-semibold"
                              style={{
                                padding: '2px 7px',
                                background: 'rgba(255,255,255,0.07)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                color: 'rgba(255,255,255,0.5)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {p.partyName}
                            </span>
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
                    const lastSeenLabel = (() => {
                      const mins = Math.round(elapsedMs / 60000);
                      if (mins < 60) return `${mins}m ago`;
                      const hours = Math.round(elapsedMs / 3600000);
                      if (hours < 48) return `${hours}h ago`;
                      return `${Math.round(elapsedMs / 86400000)}d ago`;
                    })();
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
                              <span
                                key={p.partyId}
                                className="inline-flex items-center rounded-full text-[9.5px] font-semibold"
                                style={{
                                  padding: '2px 7px',
                                  background: 'rgba(255,255,255,0.07)',
                                  border: '1px solid rgba(255,255,255,0.12)',
                                  color: 'rgba(255,255,255,0.5)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {p.partyName}
                              </span>
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
                <div className="mb-2.5 flex items-center gap-2">
                  <Moon size={15} color="rgba(255,255,255,0.4)" />
                  <span
                    className="text-[10.5px] font-extrabold uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    Offline · in your teams
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {offlineMembers.map((m) => {
                    const copied = copiedOfflineId === m.userId;
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
                        <span
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                          style={{
                            background: avatarGradient(m.memberNickname),
                            color: '#fff',
                            opacity: 0.7,
                          }}
                        >
                          {m.memberNickname.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className="text-[13px] font-semibold"
                              style={{ color: 'rgba(255,255,255,0.75)' }}
                            >
                              {m.memberNickname}
                            </span>
                            {m.parties.map((p) => (
                              <span
                                key={p.partyId}
                                className="inline-flex items-center rounded-full text-[9.5px] font-semibold"
                                style={{
                                  padding: '2px 7px',
                                  background: 'rgba(255,255,255,0.07)',
                                  border: '1px solid rgba(255,255,255,0.12)',
                                  color: 'rgba(255,255,255,0.5)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {p.partyName}
                              </span>
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
                          <button
                            onClick={async () => {
                              const url = firstOwnedParty
                                ? await getPartyInviteUrl(
                                    firstOwnedParty.partyId,
                                    firstOwnedParty.partyName
                                  )
                                : `${appUrl}${redirectUri}`;
                              navigator.clipboard
                                .writeText(url)
                                .catch(() => {});
                              if (navigator.share) {
                                navigator.share({ url }).catch(() => {});
                              }
                              setCopiedOfflineId(m.userId);
                              setTimeout(() => setCopiedOfflineId(null), 2000);
                            }}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full text-xs font-semibold transition-transform active:scale-95"
                            style={{
                              height: 34,
                              padding: '0 14px',
                              border: copied
                                ? '1px solid rgba(52,211,153,0.4)'
                                : '1px solid color-mix(in srgb, var(--theme-primary-light) 40%, transparent)',
                              background: copied
                                ? 'rgba(16,185,129,0.14)'
                                : 'color-mix(in srgb, var(--theme-primary-light) 14%, transparent)',
                              color: copied
                                ? '#6ee7b7'
                                : 'var(--theme-primary-light)',
                            }}
                            aria-label={`Send invite to ${m.memberNickname}`}
                          >
                            {copied ? (
                              <Check size={11} color="#6ee7b7" />
                            ) : (
                              <Link2
                                size={11}
                                color="var(--theme-primary-light)"
                              />
                            )}
                            {copied ? 'Copied!' : 'Copy link'}
                          </button>
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
                          onError={(e) => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.display = 'none';
                            (
                              e.currentTarget
                                .nextElementSibling as HTMLElement | null
                            )?.style.setProperty('display', 'flex');
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
                            <CompactSimpleState
                              state={agent.state as ServerState}
                            />
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

        {/* Remove member confirm dialog */}
        {confirmRemove && (
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center p-4"
            style={{
              background: 'rgba(2,1,8,0.7)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              className="w-full max-w-sm rounded-2xl p-5"
              style={{
                background: '#1a1340',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <p className="mb-1 text-base font-bold text-white">
                Remove {confirmRemove.memberNickname}?
              </p>
              <p
                className="mb-5 text-sm"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                {`"${confirmRemove.memberNickname}" will be removed from ${confirmRemove.ownedParties.map((p) => `"${p.partyName}"`).join(' and ')}.`}
              </p>
              <div className="flex gap-2">
                <button
                  className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-semibold"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                  onClick={() => setConfirmRemove(null)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold text-white"
                  style={{ background: 'rgba(239,68,68,0.8)' }}
                  onClick={async () => {
                    await Promise.all(
                      confirmRemove.ownedParties.map((p) =>
                        removeMember(p.partyId, confirmRemove.userId)
                      )
                    );
                    setConfirmRemove(null);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

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
) => ReactElement<any>;

export default MemoisedSidebar;
