import { TimerDisplay } from '@sudoku-web/ui/components/TimerDisplay';
import { useParties } from '../hooks/useParties';
import { Party, SessionParty, Session } from '@sudoku-web/types/serverTypes';
import { calculateSeconds } from '../helpers/calculateSeconds';
import {
  UserContext,
  UserContextInterface,
} from '@sudoku-web/auth/providers/AuthProvider';
import { RevenueCatContext } from '../providers/RevenueCatProvider';
import { SubscriptionContext } from '@sudoku-web/types/subscriptionContext';
import { getPlayerColor, getAllUserIds } from '../utils/playerColors';
import { PartyInviteButton } from './PartyInviteButton';
import { CopyButton } from '@sudoku-web/ui/components/CopyButton';
import { ComponentType, useContext, useState } from 'react';
import { PartyConfirmationDialog } from './PartyConfirmationDialog';
import { LogOut, Trash, UserMinus, Edit3, Users } from 'react-feather';
import { isIOS } from '../helpers/capacitor';
import { BaseServerState } from '../types/gameState';

const DEFAULT_MAX_SIZE = 5;

interface PartyRowProps<TState extends BaseServerState = BaseServerState> {
  party: Party;
  puzzleId: string;
  redirectUri: string;
  sessionParty?: SessionParty<Session<TState>>;
  SimpleState: ComponentType<{ state: TState }>;
  calculateCompletionPercentageFromState: (state: TState) => number;
  app: string;
}

const PartyRow = <TState extends BaseServerState = BaseServerState>({
  party: { partyName, isOwner, members, partyId, maxSize },
  puzzleId,
  redirectUri,
  sessionParty,
  SimpleState,
  calculateCompletionPercentageFromState,
  app,
}: PartyRowProps<TState>) => {
  const { parties, leaveParty, removeMember, deleteParty, updateParty } =
    useParties();
  const context = useContext(UserContext) as UserContextInterface | undefined;
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
      <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-zinc-800/80">
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
                  className="px-2 py-1 text-xs text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Cancel"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <h3 className="text-theme-primary dark:text-theme-primary-light text-xl leading-tight font-semibold">
                  {partyName}
                </h3>
                {isOwner && (
                  <button
                    onClick={handleEditPartyName}
                    className="mt-0.5 flex-shrink-0 p-1 text-blue-500 transition-colors hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Edit party name"
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
                    <option value={2}>2 members</option>
                    <option value={3}>3 members</option>
                    <option value={4}>4 members</option>
                    <option value={5}>5 members</option>
                    <option value={6}>
                      6 members {!isSubscribed ? '✨ Premium' : ''}
                    </option>
                    <option value={7}>
                      7 members {!isSubscribed ? '✨ Premium' : ''}
                    </option>
                    <option value={8}>
                      8 members {!isSubscribed ? '✨ Premium' : ''}
                    </option>
                    <option value={9}>
                      9 members {!isSubscribed ? '✨ Premium' : ''}
                    </option>
                    <option value={10}>
                      10 members {!isSubscribed ? '✨ Premium' : ''}
                    </option>
                    <option value={11}>
                      11 members {!isSubscribed ? '✨ Premium' : ''}
                    </option>
                    <option value={12}>
                      12 members {!isSubscribed ? '✨ Premium' : ''}
                    </option>
                    <option value={13}>
                      13 members {!isSubscribed ? '✨ Premium' : ''}
                    </option>
                    <option value={14}>
                      14 members {!isSubscribed ? '✨ Premium' : ''}
                    </option>
                    <option value={15}>
                      15 members {!isSubscribed ? '✨ Premium' : ''}
                    </option>
                  </select>
                  <button
                    onClick={handleCancelEditMaxSize}
                    className="px-2 py-1 text-xs text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Cancel"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {members.length}/{maxSize || DEFAULT_MAX_SIZE} members
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
                      className="ml-2 p-1 text-blue-500 transition-colors hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Edit max members"
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
            className={`ml-2 inline-flex flex-shrink-0 items-center rounded-md border border-transparent px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${'bg-red-100 text-red-700 hover:bg-red-200 focus-visible:ring-red-500 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'}`}
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
              puzzleId={puzzleId}
              redirectUri={redirectUri}
              partyId={partyId}
              partyName={partyName}
              app={app}
            />
          </div>
        )}

        {!isOwner && (
          <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">
              Share this link with current team members to join this puzzle
            </p>
            <CopyButton
              getText={() =>
                `https://${app}.bubblyclouds.com${window.location.pathname}${window.location.search}`
              }
              partyName={partyName}
              isIOS={isIOS}
            />
          </div>
        )}

        <ul className="mt-4 space-y-4">
          {members.map(({ memberNickname, userId, isUser }) => {
            // Calculate completion percentage if session data exists
            const memberSession = sessionParty?.memberSessions[userId];
            const completionPercentage = memberSession
              ? calculateCompletionPercentageFromState(memberSession.state)
              : 0;

            // Get the player color for consistency with RaceTrack
            const playerColor = getPlayerColor(
              userId,
              allUserIds,
              userId === user?.sub
            );

            return (
              <li
                key={userId}
                className="rounded-xl bg-gray-50 p-3 dark:bg-zinc-700/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`mr-2 h-3 w-3 rounded-full ${playerColor}`}
                    ></div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {memberNickname}
                      {isUser && ' (you)'}
                    </span>
                  </div>

                  {isOwner && !isUser && (
                    <button
                      type="button"
                      className="relative inline-flex items-center rounded-md border border-transparent bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
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
                        <span className="absolute -top-0.5 -right-0.5 z-10 inline-flex h-3 w-3 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-[6px] font-semibold text-white shadow-lg">
                          ✨
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {!isUser && !sessionParty?.memberSessions[userId] && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 italic dark:text-gray-400">
                      Not started! Ask them to play
                    </p>
                    {isOwner ? (
                      <PartyInviteButton
                        puzzleId={puzzleId}
                        redirectUri={redirectUri}
                        partyId={partyId}
                        partyName={partyName}
                        extraSmall={true}
                        app={app}
                      />
                    ) : (
                      <div className="mt-1">
                        <CopyButton
                          getText={() =>
                            `https://${app}.bubblyclouds.com${window.location.pathname}${window.location.search}`
                          }
                          extraSmall={true}
                          partyName={partyName}
                          isIOS={isIOS}
                        />
                      </div>
                    )}
                  </div>
                )}

                {sessionParty?.memberSessions[userId]?.state.timer && (
                  <div className="text-theme-primary dark:text-theme-primary-light mt-2">
                    <TimerDisplay
                      seconds={calculateSeconds(
                        sessionParty?.memberSessions[userId]?.state.timer!
                      )}
                      isComplete={
                        !!sessionParty?.memberSessions[userId]?.state.completed
                      }
                    />
                  </div>
                )}

                {memberSession && (
                  <div className="mt-2 flex items-center">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-600">
                      <div
                        className="bg-theme-primary dark:bg-theme-primary-light h-full"
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                      {completionPercentage}%
                    </span>
                  </div>
                )}

                {!isUser && sessionParty?.memberSessions[userId] && (
                  <div className="mt-3 rounded-lg bg-stone-50 p-2 shadow-sm dark:bg-zinc-800">
                    <SimpleState
                      state={sessionParty.memberSessions[userId]!.state}
                    />
                  </div>
                )}
              </li>
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
