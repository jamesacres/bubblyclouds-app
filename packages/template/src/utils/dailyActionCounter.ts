// Utility to track daily premium action usage (undo, check cell, check grid)
import { DAILY_LIMITS } from '../config/dailyLimits';

interface DailyActionData {
  date: string;
  undoCount: number;
  checkGridCount: number;
}

const STORAGE_KEY = 'daily-action-counter';

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
}

export function getDailyActionData(): DailyActionData {
  if (typeof window === 'undefined') {
    return {
      date: getTodayDateString(),
      undoCount: 0,
      checkGridCount: 0,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        date: getTodayDateString(),
        undoCount: 0,
        checkGridCount: 0,
      };
    }

    const data: DailyActionData = JSON.parse(stored);
    const today = getTodayDateString();

    // If it's a new day, reset counters
    if (data.date !== today) {
      return {
        date: today,
        undoCount: 0,
        checkGridCount: 0,
      };
    }

    return data;
  } catch (error) {
    console.warn('Error reading daily action data:', error);
    return {
      date: getTodayDateString(),
      undoCount: 0,
      checkGridCount: 0,
    };
  }
}

function saveDailyActionData(data: DailyActionData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Error saving daily action data:', error);
  }
}

export function incrementUndoCount(): number {
  const data = getDailyActionData();
  data.undoCount += 1;
  saveDailyActionData(data);
  return data.undoCount;
}

export function incrementCheckGridCount(): number {
  const data = getDailyActionData();
  data.checkGridCount += 1;
  saveDailyActionData(data);
  return data.checkGridCount;
}

export function getUndoCount(): number {
  return getDailyActionData().undoCount;
}

export function getCheckGridCount(): number {
  return getDailyActionData().checkGridCount;
}

export function canUseUndo(): boolean {
  return getUndoCount() < DAILY_LIMITS.UNDO;
}

export function canUseCheckGrid(): boolean {
  return getCheckGridCount() < DAILY_LIMITS.CHECK_GRID;
}

export function getRemainingUndos(): number {
  return Math.max(0, DAILY_LIMITS.UNDO - getUndoCount());
}

export function getRemainingCheckGrids(): number {
  return Math.max(0, DAILY_LIMITS.CHECK_GRID - getCheckGridCount());
}
