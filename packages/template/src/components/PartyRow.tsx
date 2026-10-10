import { TimerDisplay } from '@bubblyclouds-app/ui/components/TimerDisplay';
import { useParties } from '../hooks/useParties';
import {
  Party,
  SessionParty,
  Session,
} from '@bubblyclouds-app/types/serverTypes';
import { calculateSeconds } from '../helpers/calculateSeconds';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { RevenueCatContext } from '../providers/RevenueCatProvider';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';
import { getPlayerColor, getAllUserIds } from '../utils/playerColors';
import { PartyInviteButton } from './PartyInviteButton';
import { CopyButton } from '@bubblyclouds-app/ui/components/CopyButton';
import { ComponentType, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PartyConfirmationDialog } from './PartyConfirmationDialog';
import { LogOut, Trash, UserMinus, Edit3, Users } from 'lucide-react';
import { isIOS } from '../helpers/capacitor';
import { BaseServerState } from '../types/state';
import { PartyMemberRow } from './PartyMemberRow';

const DEFAULT_MAX_SIZE = 5;
const MAX_SIZE_OPTIONS = Array.from({ length: 14 }, (_, i) => i + 2);

interface PartyRowProps<State extends BaseServerState = BaseServerState> {
  party: Party;
  sessionId: string;
  redirectUri: string;
  sessionParty?: SessionParty<Session<State>>;
  SimpleState: ComponentType<{ state: State }>;
  calculateCompletionPercentageFromState: (state: State) => number;
  app: string;
  appName: string;
  apiUrl: string;
  appUrl: string;
}

const PartyRow = <State extends BaseServerState = BaseServerState>({
  party: { partyName, isOwner, members, partyId, maxSize },
  sessionId,
  redirectUri,
  sessionParty,
  SimpleState,
  calculateCompletionPercentageFromState,
  app,
  appName,
  apiUrl,
  appUrl,
}: PartyRowProps<State>) => {
  const { t } = useTranslation('template');
  const { parties, leaveParty, removeMember, deleteParty, updateParty } =
    useParties();
  const context = useContext(UserContext);
  const { user } = context || {};
  const { isSubscribed, subscribeModal } = useContext(RevenueCatContext) || {};
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'leave' | 'remove';
    memberName?: string;
    userId?: string;
  }>({ isOpen: false, type: 'leave' });

  const [isEditingMaxSize, setIsEditingMaxSize] = useState(false);
  const [editMaxSize, setEditMaxSize] = useState(maxSize || DEFAULT_MAX_SIZE);

  const [isEditingPartyName, setIsEditingPartyName] = useState(false);
  const [editPartyName, setEditPartyName] = useState(partyName);

  // Get consistent ordering of all user IDs for color assignment
  const allUserIds = getAllUserIds(parties);

  const handleDeleteParty = async () => {
    await deleteParty(partyId);
  };

  const handleLeaveParty = async () => {
    await leaveParty(partyId);
  };

  const handleRemoveMember = async () => {
    if (confirmDialog.userId) {
      await removeMember(partyId, confirmDialog.userId);
    }
  };

  const handleMaxSizeChange = async (newMaxSize: number) => {
    if (newMaxSize > DEFAULT_MAX_SIZE && !isSubscribed) {
      subscribeModal?.showModalIfRequired(
        async () => {
          const success = await updateParty(partyId, { maxSize: newMaxSize });
          if (success) {
            setIsEditingMaxSize(false);
          }
        },
        () => {
          setEditMaxSize(maxSize || DEFAULT_MAX_SIZE); // Reset to original value
        },
        SubscriptionContext.PARTY_MAX_SIZE
      );
    } else {
      const success = await updateParty(partyId, { maxSize: newMaxSize });
      if (success) {
        setIsEditingMaxSize(false);
      }
    }
  };

  const handleCancelEditMaxSize = () => {
    setEditMaxSize(maxSize || DEFAULT_MAX_SIZE);
    setIsEditingMaxSize(false);
  };

  const handleEditMaxSize = () => {
    setIsEditingMaxSize(true);
  };

  const handlePartyNameChange = async (newPartyName: string) => {
    const success = await updateParty(partyId, { partyName: newPartyName });
    if (success) {
      setIsEditingPartyName(false);
    }
  };

  const handleCancelEditPartyName = () => {
    setEditPartyName(partyName);
    setIsEditingPartyName(false);
  };

  const handleEditPartyName = () => {
    setIsEditingPartyName(true);
  };

  return (
    <li>
      <div className="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-zinc-800/80">
        <div className="flex items-start justify-between">
          <div className="flex min-w-0 flex-1 flex-col">
            {isOwner && isEditingPartyName ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editPartyName}
                  onChange={(e) => setEditPartyName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePartyNameChange(editPartyName);
                    } else if (e.key === 'Escape') {
                      handleCancelEditPartyName();
                    }
                  }}
                  onBlur={() => handlePartyNameChange(editPartyName)}
                  autoFocus
                  className="text-theme-primary dark:text-theme-primary-light w-full rounded border border-gray-300 bg-white px-2 py-1 text-xl font-semibold focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-zinc-700"
                />
                <button
                  onClick={handleCancelEditPartyName}
                  className="px-2 py-1 text-xs text-stone-400 transition-colors hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  title={t('party.cancel')}
                >
                  {t('party.cancel')}
                </button>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <h3 className="text-lg font-semibold leading-tight text-stone-800 dark:text-zinc-100">
                  {partyName}
                </h3>
                {isOwner && (
                  <button
                    onClick={handleEditPartyName}
                    className="mt-0.5 flex-shrink-0 p-1 text-stone-400 transition-colors hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                    title={t('party.editName')}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Max Size Display/Editor */}
            <div className="mt-3 flex items-center space-x-2">
              <Users className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
              {isOwner && isEditingMaxSize ? (
                <div className="flex flex-wrap items-center space-x-2">
                  <select
                    value={editMaxSize}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      setEditMaxSize(newValue);
                      handleMaxSizeChange(newValue);
                    }}
                    onBlur={handleCancelEditMaxSize}
                    autoFocus
                    className="min-w-0 rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-zinc-700 dark:text-gray-200"
                  >
                    {MAX_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size > DEFAULT_MAX_SIZE && !isSubscribed
                          ? t('party.memberCountPremium', { count: size })
                          : t('party.memberCount', { count: size })}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleCancelEditMaxSize}
                    className="px-2 py-1 text-xs text-stone-400 transition-colors hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                    title={t('party.cancel')}
                  >
                    {t('party.cancel')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('party.membersOf', {
                      current: members.length,
                      count: maxSize || DEFAULT_MAX_SIZE,
                    })}
                  </span>
                  {isOwner &&
                    maxSize &&
                    maxSize > DEFAULT_MAX_SIZE &&
                    !isSubscribed && (
                      <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-[6px] font-semibold text-white shadow-lg">
                        ✨
                      </span>
                    )}
                  {isOwner && (
                    <button
                      onClick={handleEditMaxSize}
                      className="ml-2 p-1 text-stone-400 transition-colors hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                      title={t('party.editMaxMembers')}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="ml-2 inline-flex flex-shrink-0 items-center rounded-md p-2 text-stone-400 transition-colors hover:text-red-500 focus:outline-none dark:text-zinc-500 dark:hover:text-red-400"
            onClick={() => setConfirmDialog({ isOpen: true, type: 'leave' })}
          >
            {isOwner ? (
              <Trash className="h-3 w-3" />
            ) : (
              <LogOut className="h-3 w-3" />
            )}
          </button>
        </div>

        {isOwner && members.length < (maxSize || DEFAULT_MAX_SIZE) && (
          <div className="mt-2">
            <PartyInviteButton
              sessionId={sessionId}
              redirectUri={redirectUri}
              partyId={partyId}
              partyName={partyName}
              app={app}
              appName={appName}
              apiUrl={apiUrl}
              appUrl={appUrl}
            />
          </div>
        )}

        {!isOwner && (
          <div className="mt-2 rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
            <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">
              {t('party.shareLink')}
            </p>
            <CopyButton
              getText={() =>
                `${appUrl}${window.location.pathname}${window.location.search}`
              }
              partyName={partyName}
              isIOS={isIOS}
              appName={appName}
            />
          </div>
        )}

        <ul className="mt-4 space-y-4">
          {members.map(({ memberNickname, userId, isUser }) => {
            const memberSession = sessionParty?.memberSessions[userId];
            const completionPercentage = memberSession
              ? calculateCompletionPercentageFromState(memberSession.state)
              : undefined;

            const playerColor = getPlayerColor(
              userId,
              allUserIds,
              userId === user?.sub
            );

            return (
              <PartyMemberRow<State>
                key={userId}
                isUser={isUser}
                SimpleState={SimpleState}
                state={memberSession?.state}
                completionPercentage={
                  memberSession ? completionPercentage : undefined
                }
                header={
                  <div className="flex items-center">
                    <div
                      className={`mr-2 h-3 w-3 rounded-full ${playerColor}`}
                    ></div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {memberNickname}
                      {isUser && ` ${t('party.you')}`}
                    </span>
                  </div>
                }
                actions={
                  isOwner && !isUser ? (
                    <button
                      type="button"
                      className="relative inline-flex items-center rounded-md p-1.5 text-stone-400 transition-colors hover:text-red-500 focus:outline-none dark:text-zinc-500 dark:hover:text-red-400"
                      onClick={() => {
                        if (isSubscribed) {
                          setConfirmDialog({
                            isOpen: true,
                            type: 'remove',
                            memberName: memberNickname,
                            userId,
                          });
                        } else {
                          subscribeModal?.showModalIfRequired(
                            () => {
                              setConfirmDialog({
                                isOpen: true,
                                type: 'remove',
                                memberName: memberNickname,
                                userId,
                              });
                            },
                            () => {},
                            SubscriptionContext.REMOVE_MEMBER
                          );
                        }
                      }}
                    >
                      <UserMinus className="h-3 w-3" />
                      {!isSubscribed && (
                        <span className="absolute -right-0.5 -top-0.5 z-10 inline-flex h-3 w-3 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-[6px] font-semibold text-white shadow-lg">
                          ✨
                        </span>
                      )}
                    </button>
                  ) : undefined
                }
                time={
                  <>
                    {!isUser && !memberSession && (
                      <div className="mt-2">
                        <p className="text-sm italic text-gray-500 dark:text-gray-400">
                          {t('party.notStarted')}
                        </p>
                        {isOwner ? (
                          <PartyInviteButton
                            sessionId={sessionId}
                            redirectUri={redirectUri}
                            partyId={partyId}
                            partyName={partyName}
                            extraSmall={true}
                            app={app}
                            appName={appName}
                            apiUrl={apiUrl}
                            appUrl={appUrl}
                          />
                        ) : (
                          <div className="mt-1">
                            <CopyButton
                              getText={() =>
                                `${appUrl}${window.location.pathname}${window.location.search}`
                              }
                              extraSmall={true}
                              partyName={partyName}
                              isIOS={isIOS}
                              appName={appName}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {memberSession?.state.timer && (
                      <div className="text-theme-primary dark:text-theme-primary-light mt-2">
                        <TimerDisplay
                          seconds={calculateSeconds(memberSession.state.timer)}
                          isComplete={!!memberSession.state.completed}
                        />
                      </div>
                    )}
                  </>
                }
              />
            );
          })}
        </ul>
      </div>

      <PartyConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog({ isOpen: false, type: confirmDialog.type })
        }
        onConfirm={
          confirmDialog.type === 'leave'
            ? isOwner
              ? handleDeleteParty
              : handleLeaveParty
            : handleRemoveMember
        }
        type={confirmDialog.type}
        partyName={partyName}
        memberName={confirmDialog.memberName}
        isOwner={isOwner}
      />
    </li>
  );
};

export { PartyRow };
