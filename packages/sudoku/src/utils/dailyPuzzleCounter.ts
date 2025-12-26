// Utility to track daily puzzle IDs
interface DailyPuzzleData {
  date: string;
  puzzleIds: string[];
}

const STORAGE_KEY = 'daily-puzzle-ids';

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
}

export function getDailyPuzzleIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();

    const data: DailyPuzzleData = JSON.parse(stored);
    const today = getTodayDateString();

    // If it's a new day, reset puzzle IDs
    if (data.date !== today) {
      return new Set();
    }

    return new Set(data.puzzleIds);
  } catch (error) {
    console.warn('Error reading daily puzzle IDs:', error);
    return new Set();
  }
}

export function addDailyPuzzleId(puzzleId: string): number {
  if (typeof window === 'undefined') return 0;

  try {
    const today = getTodayDateString();
    const currentPuzzleIds = getDailyPuzzleIds();

    // Add to set (automatically handles duplicates)
    currentPuzzleIds.add(puzzleId);

    const data: DailyPuzzleData = {
      date: today,
      puzzleIds: Array.from(currentPuzzleIds),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return currentPuzzleIds.size;
  } catch (error) {
    console.warn('Error adding daily puzzle ID:', error);
    return 0;
  }
}

export function getDailyPuzzleCount(): number {
  return getDailyPuzzleIds().size;
}
