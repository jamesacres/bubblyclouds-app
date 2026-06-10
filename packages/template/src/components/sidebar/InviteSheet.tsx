import { useState, useRef } from 'react';
import { Edit3, Loader, LogOut, Sparkles, Trash, X } from 'lucide-react';
import { useParties } from '../../hooks/useParties';
import { useServerStorage } from '../../hooks/serverStorage';
import { buildPartyInviteUrl } from '../../helpers/inviteUrl';
import { CopyButton } from '@bubblyclouds-app/ui/components/CopyButton';
import { shareOrCopyUrl } from '@bubblyclouds-app/ui/helpers/share';
import { isIOS } from '../../helpers/capacitor';
import { PartyConfirmationDialog } from '../PartyConfirmationDialog';

const DEFAULT_MAX = 5;
const refreshSessionPartiesNoop: () => Promise<void> = async () => {};

const copyButtonClassName =
  'inline-flex h-[34px] flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-[14px] text-xs font-semibold transition-transform active:scale-95';
const copyButtonStyle = {
  background: 'color-mix(in srgb, var(--theme-primary-light) 14%, transparent)',
  border:
    '1px solid color-mix(in srgb, var(--theme-primary-light) 40%, transparent)',
  color: 'var(--theme-primary-light)',
};

export function InviteSheet({
  open,
  onClose,
  parties,
  onCreateTeam,
  sessionId,
  redirectUri,
  app,
  appName,
  apiUrl,
  appUrl,
  defaultDisplayName,
}: {
  open: boolean;
  onClose: () => void;
  parties: {
    partyId: string;
    partyName: string;
    members: { userId: string }[];
    maxSize?: number;
    isOwner: boolean;
  }[];
  onCreateTeam: () => void;
  sessionId: string;
  redirectUri: string;
  app: string;
  appName: string;
  apiUrl: string;
  appUrl: string;
  defaultDisplayName?: string;
}) {
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
    refreshSessionParties: refreshSessionPartiesNoop,
  });
  const { createInvite } = useServerStorage({ app, apiUrl });

  const handleClose = () => {
    setDisplay(defaultDisplayName ?? '');
    setTeamName('');
    onClose();
  };

  const getInviteUrl = (partyId: string, partyName: string): Promise<string> =>
    buildPartyInviteUrl({
      partyId,
      partyName,
      sessionId,
      redirectUri,
      appUrl,
      cacheRef: inviteUrlCacheRef.current,
      createInvite,
    });

  const create = async () => {
    const nm = teamName.trim() || 'New team';
    const dn = display.trim() || 'Player';
    setIsSaving(true);
    try {
      const party = await saveParty({ memberNickname: dn, partyName: nm });
      if (party?.partyId) {
        const url = await getInviteUrl(party.partyId, nm);
        await shareOrCopyUrl({ url, appName, partyName: nm });
      }
      onCreateTeam();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const inputClassName =
    'w-full h-[52px] rounded-[14px] border border-white/[0.12] bg-white/[0.04] px-4 text-[15px] font-medium text-white outline-none';

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
                  const isEditingName = editingNameId === party.partyId;
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
                              try {
                                if (editNameValue.trim()) {
                                  await updateParty(party.partyId, {
                                    partyName: editNameValue.trim(),
                                  });
                                }
                              } finally {
                                setEditingNameId(null);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur();
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
                            onChange={async (e) => {
                              await updateParty(party.partyId, {
                                maxSize: parseInt(e.target.value, 10),
                              });
                            }}
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
                          <CopyButton
                            getText={() =>
                              getInviteUrl(party.partyId, party.partyName)
                            }
                            extraSmall
                            appName={appName}
                            isIOS={isIOS}
                            partyName={party.partyName}
                            className={copyButtonClassName}
                            style={copyButtonStyle}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
            className={inputClassName}
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
            className={inputClassName}
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

      <PartyConfirmationDialog
        isOpen={confirmLeave !== null}
        onClose={() => setConfirmLeave(null)}
        type="leave"
        partyName={confirmLeave?.partyName ?? ''}
        isOwner={confirmLeave?.isOwner ?? false}
        onConfirm={async () => {
          if (confirmLeave!.isOwner) {
            await deleteParty(confirmLeave!.partyId);
          } else {
            await leaveParty(confirmLeave!.partyId);
          }
        }}
        dialogClassName="relative z-[110]"
      />
    </div>
  );
}
