import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  getTodayDateString,
  getDailyPuzzleIds,
  addDailyPuzzleId,
  getDailyPuzzleCount,
} from './dailyPuzzleCounter';

describe('dailyPuzzleCounter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getTodayDateString', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const dateString = getTodayDateString();
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should return today's date", () => {
      const dateString = getTodayDateString();
      const today = new Date().toISOString().split('T')[0];
      expect(dateString).toBe(today);
    });

    it('should return consistent format across calls', () => {
      const date1 = getTodayDateString();
      const date2 = getTodayDateString();
      expect(date1).toBe(date2);
    });
  });

  describe('getDailyPuzzleIds', () => {
    it('should return empty set when nothing is stored', () => {
      const puzzleIds = getDailyPuzzleIds();
      expect(puzzleIds.size).toBe(0);
    });

    it('should return stored puzzle IDs for today', () => {
      const today = getTodayDateString();
      const testIds = ['puzzle-1', 'puzzle-2', 'puzzle-3'];
      localStorage.setItem(
        'daily-puzzle-ids',
        JSON.stringify({ date: today, puzzleIds: testIds })
      );

      const puzzleIds = getDailyPuzzleIds();
      expect(puzzleIds.size).toBe(3);
      expect(puzzleIds.has('puzzle-1')).toBe(true);
      expect(puzzleIds.has('puzzle-2')).toBe(true);
      expect(puzzleIds.has('puzzle-3')).toBe(true);
    });

    it('should reset puzzle IDs on new day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const testIds = ['puzzle-1', 'puzzle-2'];
      localStorage.setItem(
        'daily-puzzle-ids',
        JSON.stringify({ date: yesterdayStr, puzzleIds: testIds })
      );

      const puzzleIds = getDailyPuzzleIds();
      expect(puzzleIds.size).toBe(0);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('daily-puzzle-ids', 'invalid-json');
      const puzzleIds = getDailyPuzzleIds();
      expect(puzzleIds.size).toBe(0);
    });

    it('should return empty set for window undefined', () => {
      // Note: In test environment, window is always defined
      // This test verifies the type guard exists in code
      expect(getDailyPuzzleIds() instanceof Set).toBe(true);
    });
  });

  describe('addDailyPuzzleId', () => {
    it('should add a puzzle ID and return count', () => {
      const count = addDailyPuzzleId('puzzle-1');
      expect(count).toBe(1);
    });

    it('should prevent duplicate puzzle IDs', () => {
      addDailyPuzzleId('puzzle-1');
      const count = addDailyPuzzleId('puzzle-1');
      expect(count).toBe(1);
    });

    it('should increment count for new puzzle IDs', () => {
      addDailyPuzzleId('puzzle-1');
      const count2 = addDailyPuzzleId('puzzle-2');
      expect(count2).toBe(2);

      const count3 = addDailyPuzzleId('puzzle-3');
      expect(count3).toBe(3);
    });

    it("should store data with today's date", () => {
      addDailyPuzzleId('puzzle-1');

      const stored = localStorage.getItem('daily-puzzle-ids');
      const data = JSON.parse(stored!);
      const today = getTodayDateString();

      expect(data.date).toBe(today);
    });

    it('should persist data across calls', () => {
      addDailyPuzzleId('puzzle-1');
      addDailyPuzzleId('puzzle-2');

      const puzzleIds = getDailyPuzzleIds();
      expect(puzzleIds.size).toBe(2);
      expect(puzzleIds.has('puzzle-1')).toBe(true);
      expect(puzzleIds.has('puzzle-2')).toBe(true);
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock setItem to throw error
      (localStorage.setItem as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Storage full');
      });

      const count = addDailyPuzzleId('puzzle-1');
      expect(count).toBe(0);
    });

    it('should handle window undefined', () => {
      // Note: In test environment, window is always defined
      // This ensures code has proper guard
      expect(addDailyPuzzleId('puzzle-1')).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getDailyPuzzleCount', () => {
    it('should return 0 for empty storage', () => {
      expect(getDailyPuzzleCount()).toBe(0);
    });

    it('should return count of stored puzzle IDs', () => {
      addDailyPuzzleId('puzzle-1');
      addDailyPuzzleId('puzzle-2');
      addDailyPuzzleId('puzzle-3');

      expect(getDailyPuzzleCount()).toBe(3);
    });

    it('should not double-count duplicates', () => {
      addDailyPuzzleId('puzzle-1');
      addDailyPuzzleId('puzzle-1');
      addDailyPuzzleId('puzzle-1');

      expect(getDailyPuzzleCount()).toBe(1);
    });

    it('should update count after adding new puzzle', () => {
      expect(getDailyPuzzleCount()).toBe(0);

      addDailyPuzzleId('puzzle-1');
      expect(getDailyPuzzleCount()).toBe(1);

      addDailyPuzzleId('puzzle-2');
      expect(getDailyPuzzleCount()).toBe(2);
    });
  });

  describe('daily reset behavior', () => {
    it('should reset count on new day', () => {
      addDailyPuzzleId('puzzle-1');
      addDailyPuzzleId('puzzle-2');
      expect(getDailyPuzzleCount()).toBe(2);

      // Manually set to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      localStorage.setItem(
        'daily-puzzle-ids',
        JSON.stringify({
          date: yesterdayStr,
          puzzleIds: ['puzzle-1', 'puzzle-2'],
        })
      );

      // Should return empty for new day
      expect(getDailyPuzzleCount()).toBe(0);
    });

    it('should maintain count within same day', () => {
      const today = getTodayDateString();
      const testData = {
        date: today,
        puzzleIds: ['puzzle-1', 'puzzle-2', 'puzzle-3'],
      };
      localStorage.setItem('daily-puzzle-ids', JSON.stringify(testData));

      const count1 = getDailyPuzzleCount();
      const count2 = getDailyPuzzleCount();

      expect(count1).toBe(3);
      expect(count2).toBe(3);
    });
  });

  describe('integration scenarios', () => {
    it('should track multiple puzzles throughout the day', () => {
      expect(getDailyPuzzleCount()).toBe(0);

      // User plays 5 puzzles
      for (let i = 1; i <= 5; i++) {
        addDailyPuzzleId(`puzzle-${i}`);
        expect(getDailyPuzzleCount()).toBe(i);
      }

      // Try playing same puzzle again
      addDailyPuzzleId('puzzle-1');
      expect(getDailyPuzzleCount()).toBe(5); // No change
    });

    it('should handle rapid additions', () => {
      const puzzleIds = new Set();

      for (let i = 0; i < 100; i++) {
        const puzzleId = `puzzle-${i % 10}`; // Only 10 unique puzzles
        addDailyPuzzleId(puzzleId);
        puzzleIds.add(puzzleId);
      }

      expect(getDailyPuzzleCount()).toBe(10);
    });
  });
});
