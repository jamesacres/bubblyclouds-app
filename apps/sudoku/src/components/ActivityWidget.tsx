'use client';
import { ServerStateResult } from '@sudoku-web/types/serverTypes';
import { ServerState } from '@sudoku-web/sudoku/types/state';
import { Calendar, Activity } from 'react-feather';

interface ActivityWidgetProps {
  sessions: ServerStateResult<ServerState>[] | undefined;
}

const ActivityWidget = ({ sessions }: ActivityWidgetProps) => {
  const calculateActivityStats = () => {
    if (!sessions || sessions.length === 0) {
      return { daysPlayedInThirtyDays: 0, currentStreak: 0 };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get unique days when puzzles were started or updated in the past 30 days
    const playDates = new Set<string>();
    sessions.forEach((session) => {
      const sessionDate = new Date(session.updatedAt);
      if (sessionDate >= thirtyDaysAgo) {
        // Use date string (YYYY-MM-DD) to track unique days
        playDates.add(sessionDate.toISOString().split('T')[0]);
      }
    });

    const daysPlayedInThirtyDays = playDates.size;

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();

    // Check each day going backwards from today
    for (let i = 0; i < 365; i++) {
      // Max reasonable streak check
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = checkDate.toISOString().split('T')[0];

      if (playDates.has(dateString)) {
        currentStreak++;
      } else {
        // If we haven't played today, check if we played yesterday before breaking
        if (i === 0) {
          continue; // Skip today, check yesterday
        }
        break; // Streak broken
      }
    }

    return { daysPlayedInThirtyDays, currentStreak };
  };

  const { daysPlayedInThirtyDays, currentStreak } = calculateActivityStats();

  return (
    <div className="mb-3 w-fit rounded-xl border border-stone-200 bg-gradient-to-br from-stone-50/80 to-stone-100/80 p-3 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:from-zinc-800/80 dark:to-zinc-900/80">
      <h2 className="mb-2 text-lg font-bold text-gray-800 dark:text-white">
        Activity Stats
      </h2>

      <div className="flex gap-6">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
            <Calendar
              className="h-4 w-4 text-blue-600 dark:text-blue-400"
              data-testid="calendar-icon"
            />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              {daysPlayedInThirtyDays}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Days played in past 30 days
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50">
            <Activity
              className="h-4 w-4 text-orange-600 dark:text-orange-400"
              data-testid="activity-icon"
            />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              {currentStreak}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Day streak
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityWidget;
