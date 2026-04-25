import {
  memo,
  useContext,
  useEffect,
  useRef,
  ComponentType,
  ReactElement,
} from 'react';
import { Bot, Loader, RefreshCw, Users, X } from 'lucide-react';
import { PartyRow } from './PartyRow';
import { AgentPartyRow } from './AgentPartyRow';
import { Parties, Session } from '@bubblyclouds-app/types/serverTypes';
import { useParties } from '../hooks/useParties';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { RevenueCatContext } from '../providers/RevenueCatProvider';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';
import { BaseServerState } from '../types/state';
import { AgentProgress } from '@bubblyclouds-app/types/agentTypes';

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
  calculateCompletionPercentageFromState: (state: ServerState) => number;
  localAgentProgress?: AgentProgress[];
  onRemoveAgent?: (agentId: string) => void;
  onLeaveAgentParty?: () => void;
  onPickRivals?: () => void;
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
  calculateCompletionPercentageFromState,
  localAgentProgress,
  onRemoveAgent,
  onLeaveAgentParty,
  onPickRivals,
}: Arguments<ServerState>) => {
  const context = useContext(UserContext);
  const { user, loginRedirect } = context || {};
  const { isSubscribed, subscribeModal } = useContext(RevenueCatContext) || {};

  const {
    parties,
    isLoading,
    showCreateParty,
    setShowCreateParty,
    isSaving,
    memberNickname,
    setMemberNickname,
    partyName,
    setPartyName,
    saveParty,
    refreshParties,
  } = useParties({ refreshSessionParties });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showCreateParty) {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showCreateParty]);

  return (
    <>
      {showSidebar && (
        <div
          className="fixed left-0 top-0 z-50 h-full w-full bg-black/30 backdrop-blur-sm"
          onClick={() => {
            setShowSidebar(!showSidebar);
          }}
        ></div>
      )}
      <aside
        id="default-sidebar"
        className={`fixed left-0 top-0 z-50 h-screen w-72 pt-[var(--ion-safe-area-top)] xl:top-20 ${showSidebar ? '' : '-translate-x-full'} transition-transform xl:translate-x-0`}
        aria-label="Sidebar"
      >
        <div className="flex h-full flex-col rounded-r-3xl bg-stone-100 shadow-xl dark:bg-zinc-900/95">
          <div className="sticky top-0 z-10 rounded-tr-3xl bg-stone-100 px-4 pb-3 pt-5 dark:bg-zinc-900/95">
            <div
              className={`mb-4 flex-nowrap items-center`}
              role="group"
              aria-label="Button group"
            >
              <div className="flex w-full items-center justify-between px-1 py-2">
                <span className="text-lg font-semibold text-stone-800 dark:text-zinc-100">
                  Races
                </span>
                <button
                  onClick={() => {
                    setShowSidebar(!showSidebar);
                  }}
                  className="cursor-pointer text-stone-400 transition-colors hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  <X className={`ml-2 ${showSidebar ? '' : 'hidden'}`} />
                </button>
              </div>
            </div>
            <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">
              Challenge your friends and family to a race, who can solve it in
              the fastest time?
            </p>
            <div className="flex flex-col gap-2">
              {!showCreateParty && parties.length < 10 && (
                <button
                  className="bg-theme-primary hover:bg-theme-primary-dark relative flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 active:scale-[0.98]"
                  onClick={() => {
                    if (!user) {
                      loginRedirect && loginRedirect({ userInitiated: true });
                      return;
                    }

                    if (parties.length > 0 && !isSubscribed) {
                      subscribeModal?.showModalIfRequired(
                        () => setShowCreateParty(true),
                        () => {},
                        SubscriptionContext.MULTIPLE_PARTIES
                      );
                    } else {
                      setShowCreateParty(true);
                    }
                  }}
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
                    <Users size={15} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white">
                      Race Friends
                    </div>
                    <div className="text-xs text-white/70">
                      Share a link, race to finish
                    </div>
                  </div>
                  {parties.length > 0 && !isSubscribed && (
                    <span className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-white/30 text-[8px] font-semibold text-white">
                      ✨
                    </span>
                  )}
                </button>
              )}
              {!localAgentProgress?.length &&
                onPickRivals &&
                !showCreateParty && (
                  <button
                    className="hover:border-theme-primary/40 hover:bg-theme-primary/5 flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left transition-all duration-200 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:border-zinc-600"
                    onClick={onPickRivals}
                  >
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor:
                          'color-mix(in srgb, var(--theme-primary) 12%, transparent)',
                      }}
                    >
                      <Bot size={15} className="text-theme-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-stone-800 dark:text-zinc-100">
                        Pick Rivals
                      </div>
                      <div className="text-xs text-stone-500 dark:text-zinc-400">
                        Race AI opponents
                      </div>
                    </div>
                  </button>
                )}
            </div>
          </div>

          <div
            ref={scrollRef}
            className="pb-safe flex-grow overflow-y-auto px-4"
          >
            {showCreateParty && (
              <div className="mt-4 rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                  {parties.length === 0
                    ? "We recommend creating your first team for your family or friend group. All members can see each other's puzzles and compete."
                    : "All members can see each other's puzzles and compete."}
                </p>
                <form
                  className="w-full"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveParty({ memberNickname, partyName });
                  }}
                >
                  <label
                    className="my-2 block text-xs font-bold text-gray-700 dark:text-gray-300"
                    htmlFor="form-nickname"
                  >
                    What do the team members call you?
                  </label>
                  <input
                    id="form-nickname"
                    className={`${isSaving ? 'cursor-wait' : ''} focus:ring-theme-primary mr-0 w-full appearance-none rounded-xl border border-stone-300 bg-stone-50/80 px-3 py-2.5 leading-tight text-black backdrop-blur-sm focus:ring-2 dark:border-gray-600 dark:bg-zinc-800/80 dark:text-white`}
                    type="text"
                    placeholder="Nickname"
                    aria-label="Nickname"
                    disabled={isSaving}
                    value={memberNickname}
                    onChange={(event) => {
                      setMemberNickname(event.target.value);
                    }}
                  />
                  <label
                    className="my-2 mt-4 block text-xs font-bold text-gray-700 dark:text-gray-300"
                    htmlFor="form-party-name"
                  >
                    What shall we name this team?
                  </label>
                  <div className="flex items-center">
                    <input
                      id="form-party-name"
                      className={`${isSaving ? 'cursor-wait' : ''} focus:ring-theme-primary mr-0 w-full appearance-none rounded-xl border border-stone-300 bg-stone-50/80 px-3 py-2.5 leading-tight text-black backdrop-blur-sm focus:ring-2 dark:border-gray-600 dark:bg-zinc-800/80 dark:text-white`}
                      type="text"
                      placeholder="e.g. Family"
                      aria-label="Party name"
                      disabled={isSaving}
                      value={partyName}
                      onChange={(event) => {
                        setPartyName(event.target.value);
                      }}
                    />
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      className={`${isSaving ? 'cursor-wait' : 'cursor-pointer'} bg-theme-primary hover:bg-theme-primary-dark w-full rounded-xl px-4 py-2.5 font-medium text-white transition-all duration-200 active:scale-[0.98]`}
                      type="submit"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader className="mx-auto animate-spin" />
                      ) : (
                        'Create Racing Team'
                      )}
                    </button>
                    <button
                      className="cursor-pointer py-1.5 text-sm text-stone-400 transition-colors hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                      type="button"
                      disabled={isSaving}
                      onClick={() => setShowCreateParty(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {(!!localAgentProgress?.length || (user && !!parties.length)) && (
              <>
                <div className="my-6 h-px bg-stone-300 dark:bg-gray-700" />
                <div className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-stone-100 px-1 py-2 dark:bg-zinc-900/25">
                  <h2 className="text-base font-semibold text-stone-700 dark:text-zinc-200">
                    Opponents &amp; Teams
                  </h2>
                  {user && !!parties.length && (
                    <button
                      className={`${isLoading || isSaving ? 'cursor-wait' : ''} cursor-pointer rounded-md p-1.5 text-stone-400 transition-colors hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300`}
                      disabled={isLoading || isSaving}
                      onClick={() => refreshParties()}
                      aria-label="Refresh parties"
                    >
                      <RefreshCw
                        size={18}
                        className={`${isLoading ? 'animate-spin' : ''}`}
                      />
                    </button>
                  )}
                </div>

                {user && !!parties.length && (
                  <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">
                    Simply send your group an invite link and close this sidebar
                    to start solving! They can join now or in their own time.
                  </p>
                )}

                <ul className="space-y-4 pb-32">
                  {!!localAgentProgress?.length && (
                    <AgentPartyRow
                      localAgentProgress={localAgentProgress}
                      SimpleState={SimpleState}
                      onRemoveAgent={onRemoveAgent}
                      onLeaveParty={onLeaveAgentParty}
                    />
                  )}
                  {user &&
                    parties
                      .sort(
                        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
                      )
                      .map((party) => (
                        <PartyRow<ServerState>
                          key={party.partyId}
                          party={party}
                          sessionId={`${app}-${puzzleId}`}
                          redirectUri={redirectUri}
                          sessionParty={sessionParties[party.partyId]}
                          SimpleState={SimpleState}
                          calculateCompletionPercentageFromState={
                            calculateCompletionPercentageFromState
                          }
                          app={app}
                          appName={appName}
                          apiUrl={apiUrl}
                          appUrl={appUrl}
                        />
                      ))}
                </ul>
              </>
            )}
          </div>
        </div>
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
