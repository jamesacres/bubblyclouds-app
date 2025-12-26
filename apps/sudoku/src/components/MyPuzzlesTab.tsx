'use client';
import { ServerStateResult } from '@sudoku-web/types/serverTypes';
import { ServerState } from '@sudoku-web/sudoku/types/state';
import IntegratedSessionRow from './IntegratedSessionRow';

interface MyPuzzlesTabProps {
  sessions?: ServerStateResult<ServerState>[];
}

export const MyPuzzlesTab = ({ sessions }: MyPuzzlesTabProps) => {
  // Sort all sessions by most recently played (updatedAt descending)
  const allSessions = sessions?.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="mb-4">
      <h1 className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-4xl font-bold text-transparent">
        My Puzzles
      </h1>
      <p className="my-4">
        This page lists puzzles you have played in the past 30 days.
      </p>
      <p className="my-4">
        Press Start Race in the bottom navigation to find a new puzzle to solve
        or resume a previous one below.
      </p>

      {!!allSessions?.length && (
        <div className="mb-4">
          <h2 className="mb-2 text-2xl font-extrabold">Recent Puzzles</h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {allSessions?.map((session) => (
              <IntegratedSessionRow key={session.sessionId} session={session} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MyPuzzlesTab;
