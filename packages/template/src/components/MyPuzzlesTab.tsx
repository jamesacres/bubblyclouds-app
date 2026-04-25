'use client';
import { ComponentType } from 'react';
import { Award } from 'lucide-react';
import { ServerStateResult } from '@bubblyclouds-app/types/serverTypes';
import IntegratedSessionRow from './IntegratedSessionRow';
import { BaseServerState } from '../types/state';

interface MyPuzzlesTabProps<State extends BaseServerState = BaseServerState> {
  sessions?: ServerStateResult<State>[];
  SimpleState: ComponentType<{ state: State }>;
  calculateCompletionPercentageFromState: (state: State) => number;
  isPuzzleCheated: (state: State) => boolean;
  buildPuzzleUrlFromState: (state: State, isCompleted?: boolean) => string;
  getDifficultyDisplay: (difficulty: string) => {
    name: string;
    badgeColor: string;
  };
}

export const MyPuzzlesTab = <State extends BaseServerState = BaseServerState>({
  sessions,
  SimpleState,
  calculateCompletionPercentageFromState,
  isPuzzleCheated,
  buildPuzzleUrlFromState,
  getDifficultyDisplay,
}: MyPuzzlesTabProps<State>) => {
  const allSessions = sessions?.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="mb-4">
      {allSessions?.length ? (
        <div className="mb-4">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {allSessions.map((session) => (
              <IntegratedSessionRow<State>
                key={session.sessionId}
                session={session}
                SimpleState={SimpleState}
                calculateCompletionPercentageFromState={
                  calculateCompletionPercentageFromState
                }
                isPuzzleCheated={isPuzzleCheated}
                buildPuzzleUrlFromState={buildPuzzleUrlFromState}
                getDifficultyDisplay={getDifficultyDisplay}
              />
            ))}
          </ul>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-zinc-50 py-16 text-center dark:border-zinc-800 dark:bg-zinc-800/40">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            <Award className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
          </div>
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            No puzzles yet
          </p>
          <p className="mt-1 max-w-[220px] text-xs text-zinc-400 dark:text-zinc-500">
            Head to Start Race to solve your first puzzle
          </p>
        </div>
      )}
    </div>
  );
};

export default MyPuzzlesTab;
