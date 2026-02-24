import { AgentProgress } from '@bubblyclouds-app/types/agentTypes';
import { ComponentType, useState } from 'react';
import { LogOut, Trash, Users } from 'lucide-react';
import { TimerDisplay } from '@bubblyclouds-app/ui/components/TimerDisplay';
import { BaseServerState } from '../types/state';
import { PartyMemberRow } from './PartyMemberRow';
import { PartyConfirmationDialog } from './PartyConfirmationDialog';

interface AgentPartyRowProps<State extends BaseServerState> {
  localAgentProgress: AgentProgress[];
  SimpleState: ComponentType<{ state: State }>;
  onRemoveAgent?: (agentId: string) => void;
  onLeaveParty?: () => void;
}

const AgentPartyRow = <State extends BaseServerState>({
  localAgentProgress,
  SimpleState,
  onRemoveAgent,
  onLeaveParty,
}: AgentPartyRowProps<State>) => {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'leave-agent-party' | 'remove-agent';
    agentId?: string;
    agentName?: string;
  }>({ isOpen: false, type: 'leave-agent-party' });

  return (
    <li>
      <div className="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-zinc-800/80">
        <div className="flex items-start justify-between">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start space-x-2">
              <h3 className="text-lg font-semibold leading-tight text-stone-800 dark:text-zinc-100">
                Local Agents
              </h3>
            </div>

            <div className="mt-3 flex items-center space-x-2">
              <Users className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {localAgentProgress.length} agents
              </span>
            </div>
          </div>

          {onLeaveParty && (
            <button
              type="button"
              className="ml-2 inline-flex flex-shrink-0 items-center rounded-md p-2 text-stone-400 transition-colors hover:text-red-500 focus:outline-none dark:text-zinc-500 dark:hover:text-red-400"
              onClick={() =>
                setConfirmDialog({ isOpen: true, type: 'leave-agent-party' })
              }
            >
              <Trash className="h-3 w-3" />
            </button>
          )}
        </div>

        <ul className="mt-4 space-y-4">
          {localAgentProgress.map((agent) => {
            const percentage = Math.min(100, Math.max(0, agent.percentage));
            const agentState = agent.state as State | undefined;

            return (
              <PartyMemberRow<State>
                key={agent.agentId}
                SimpleState={SimpleState}
                state={agentState}
                completionPercentage={
                  agent.finishTime === undefined ? percentage : undefined
                }
                header={
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {agent.emoji || '🤖'} {agent.name}
                  </span>
                }
                actions={
                  onRemoveAgent ? (
                    <button
                      type="button"
                      className="inline-flex items-center rounded-md p-1.5 text-stone-400 transition-colors hover:text-red-500 focus:outline-none dark:text-zinc-500 dark:hover:text-red-400"
                      onClick={() =>
                        setConfirmDialog({
                          isOpen: true,
                          type: 'remove-agent',
                          agentId: agent.agentId,
                          agentName: agent.name,
                        })
                      }
                    >
                      <LogOut className="h-3 w-3" />
                    </button>
                  ) : undefined
                }
                time={
                  agent.finishTime !== undefined ? (
                    <div className="text-theme-primary dark:text-theme-primary-light mt-2">
                      <TimerDisplay
                        seconds={agent.finishTime}
                        isComplete={true}
                      />
                    </div>
                  ) : undefined
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
        onConfirm={async () => {
          if (confirmDialog.type === 'remove-agent' && confirmDialog.agentId) {
            onRemoveAgent?.(confirmDialog.agentId);
          } else if (confirmDialog.type === 'leave-agent-party') {
            onLeaveParty?.();
          }
        }}
        type={confirmDialog.type}
        partyName="Local Agents"
        memberName={confirmDialog.agentName}
      />
    </li>
  );
};

export { AgentPartyRow };
