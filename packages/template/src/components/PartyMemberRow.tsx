import { ComponentType, ReactNode } from 'react';
import { BaseServerState } from '../types/state';

interface PartyMemberRowProps<State extends BaseServerState> {
  header: ReactNode;
  avatar?: ReactNode;
  actions?: ReactNode;
  time?: ReactNode;
  completionPercentage?: number;
  state?: State;
  SimpleState: ComponentType<{ state: State }>;
  isUser?: boolean;
}

const PartyMemberRow = <State extends BaseServerState>({
  header,
  avatar,
  actions,
  time,
  completionPercentage,
  state,
  SimpleState,
  isUser,
}: PartyMemberRowProps<State>) => {
  return (
    <li className="rounded-xl bg-stone-50 p-3 dark:bg-zinc-700/40">
      <div className="flex items-center justify-between">
        {header}
        {actions}
      </div>

      {time}

      {completionPercentage !== undefined && (
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

      {!isUser && state && !avatar && (
        <div className="mt-3 rounded-lg bg-stone-50 p-2 shadow-sm dark:bg-zinc-800">
          <SimpleState state={state} />
        </div>
      )}

      {!isUser && avatar && (
        <div className="mt-3 flex gap-2">
          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
            {avatar}
          </div>
          {state && (
            <div className="h-24 w-24 overflow-hidden rounded-lg bg-stone-50 shadow-sm dark:bg-zinc-800">
              <SimpleState state={state} />
            </div>
          )}
        </div>
      )}
    </li>
  );
};

export { PartyMemberRow };
