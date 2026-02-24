import { BaseServerState } from '@bubblyclouds-app/template/types/state';
import { ServerStateResult } from '@bubblyclouds-app/types/serverTypes';

export interface DayActivity {
  label: string; // e.g. "M", "Tu"
  puzzleCount: number;
  isToday: boolean;
}

export interface ActivityStats {
  daysPlayedInThirtyDays: number;
  puzzlesPlayedInThirtyDays: number;
  currentStreak: number;
  lastSevenDays: DayActivity[];
}

const DAY_LABELS = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateActivityStats = (
  sessions: ServerStateResult<BaseServerState>[] | undefined
): ActivityStats => {
  const now = new Date();
  const todayString = toLocalDateString(now);

  const lastSevenDays: DayActivity[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    return {
      label: DAY_LABELS[date.getDay()],
      puzzleCount: 0,
      isToday: toLocalDateString(date) === todayString,
    };
  });

  if (!sessions || sessions.length === 0) {
    return {
      daysPlayedInThirtyDays: 0,
      puzzlesPlayedInThirtyDays: 0,
      currentStreak: 0,
      lastSevenDays,
    };
  }

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Map date string -> puzzle count for last 7 days
  const sevenDayDateStrings = lastSevenDays.map((_, i) =>
    toLocalDateString(new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000))
  );

  const playDates = new Set<string>();
  let puzzlesPlayedInThirtyDays = 0;

  sessions.forEach((session) => {
    const sessionDate = new Date(session.updatedAt);
    if (sessionDate >= thirtyDaysAgo) {
      const dateStr = toLocalDateString(sessionDate);
      playDates.add(dateStr);
      puzzlesPlayedInThirtyDays++;

      const idx = sevenDayDateStrings.indexOf(dateStr);
      if (idx !== -1) {
        lastSevenDays[idx].puzzleCount++;
      }
    }
  });

  const daysPlayedInThirtyDays = playDates.size;

  // Start from today; if today has no session, allow streak to continue from yesterday
  let currentStreak = 0;
  const startOffset = playDates.has(toLocalDateString(now)) ? 0 : 1;

  for (let i = startOffset; i < 30; i++) {
    const checkDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateString = toLocalDateString(checkDate);

    if (playDates.has(dateString)) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    daysPlayedInThirtyDays,
    puzzlesPlayedInThirtyDays,
    currentStreak,
    lastSevenDays,
  };
};
