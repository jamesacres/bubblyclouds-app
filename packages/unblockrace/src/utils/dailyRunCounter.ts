// Daily run limit tracking (SPEC.md §6): mirrors sudoku's dailyPuzzleCounter
// id-set pattern so a run already started today (e.g. resumed after a
// refresh) never counts twice.
import { DAILY_LIMITS } from '../config/dailyLimits';

interface DailyRunData {
  date: string;
  runIds: string[];
}

const STORAGE_KEY = 'daily-run-ids';

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
}

export function getDailyRunIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();

    const data: DailyRunData = JSON.parse(stored);
    const today = getTodayDateString();

    // If it's a new day, reset run IDs
    if (data.date !== today) {
      return new Set();
    }

    return new Set(data.runIds);
  } catch (error) {
    console.warn('Error reading daily run IDs:', error);
    return new Set();
  }
}

export function addDailyRunId(runId: string): number {
  if (typeof window === 'undefined') return 0;

  try {
    const today = getTodayDateString();
    const currentRunIds = getDailyRunIds();

    currentRunIds.add(runId);

    const data: DailyRunData = {
      date: today,
      runIds: Array.from(currentRunIds),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return currentRunIds.size;
  } catch (error) {
    console.warn('Error adding daily run ID:', error);
    return 0;
  }
}

export function getDailyRunCount(): number {
  return getDailyRunIds().size;
}

export function canStartRun(runId: string): boolean {
  const runIds = getDailyRunIds();
  return runIds.has(runId) || runIds.size < DAILY_LIMITS.RUNS;
}

export function getRemainingRuns(): number {
  return Math.max(0, DAILY_LIMITS.RUNS - getDailyRunCount());
}
