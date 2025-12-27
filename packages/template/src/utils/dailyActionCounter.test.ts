import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  getTodayDateString,
  getDailyActionData,
  incrementUndoCount,
  incrementCheckGridCount,
  getUndoCount,
  getCheckGridCount,
  getRemainingUndos,
  getRemainingCheckGrids,
} from '../utils/dailyActionCounter';
import { canUseUndo, canUseCheckGrid } from './dailyActionCounter';
import { DAILY_LIMITS } from '../config/dailyLimits';

describe('dailyActionCounter', () => {
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
  });

  describe('getDailyActionData', () => {
    it('should return fresh data when nothing is stored', () => {
      const data = getDailyActionData();

      expect(data).toEqual({
        date: getTodayDateString(),
        undoCount: 0,
        checkGridCount: 0,
      });
    });

    it('should return stored data for today', () => {
      const today = getTodayDateString();
      const testData = {
        date: today,
        undoCount: 3,
        checkGridCount: 2,
      };

      localStorage.setItem('daily-action-counter', JSON.stringify(testData));

      const data = getDailyActionData();
      expect(data).toEqual(testData);
    });

    it('should reset data on new day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const oldData = {
        date: yesterdayStr,
        undoCount: 5,
        checkGridCount: 5,
      };

      localStorage.setItem('daily-action-counter', JSON.stringify(oldData));

      const data = getDailyActionData();

      expect(data.date).toBe(getTodayDateString());
      expect(data.undoCount).toBe(0);
      expect(data.checkGridCount).toBe(0);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('daily-action-counter', 'invalid-json');

      const data = getDailyActionData();

      expect(data.undoCount).toBe(0);
      expect(data.checkGridCount).toBe(0);
    });
  });

  describe('incrementUndoCount', () => {
    it('should increment undo count from 0', () => {
      const count = incrementUndoCount();
      expect(count).toBe(1);
    });

    it('should increment undo count multiple times', () => {
      incrementUndoCount();
      incrementUndoCount();
      const count = incrementUndoCount();

      expect(count).toBe(3);
    });

    it('should persist undo count to storage', () => {
      incrementUndoCount();
      incrementUndoCount();

      const data = getDailyActionData();
      expect(data.undoCount).toBe(2);
    });

    it('should not affect check grid count', () => {
      incrementUndoCount();
      incrementUndoCount();

      const data = getDailyActionData();
      expect(data.checkGridCount).toBe(0);
    });

    it('should allow incrementing beyond limits', () => {
      for (let i = 0; i < 10; i++) {
        incrementUndoCount();
      }

      const count = getUndoCount();
      expect(count).toBe(10);
    });
  });

  describe('incrementCheckGridCount', () => {
    it('should increment check grid count from 0', () => {
      const count = incrementCheckGridCount();
      expect(count).toBe(1);
    });

    it('should increment check grid count multiple times', () => {
      incrementCheckGridCount();
      incrementCheckGridCount();
      const count = incrementCheckGridCount();

      expect(count).toBe(3);
    });

    it('should persist check grid count to storage', () => {
      incrementCheckGridCount();
      incrementCheckGridCount();

      const data = getDailyActionData();
      expect(data.checkGridCount).toBe(2);
    });

    it('should not affect undo count', () => {
      incrementCheckGridCount();
      incrementCheckGridCount();

      const data = getDailyActionData();
      expect(data.undoCount).toBe(0);
    });

    it('should allow incrementing beyond limits', () => {
      for (let i = 0; i < 10; i++) {
        incrementCheckGridCount();
      }

      const count = getCheckGridCount();
      expect(count).toBe(10);
    });
  });

  describe('getUndoCount', () => {
    it('should return 0 when not set', () => {
      expect(getUndoCount()).toBe(0);
    });

    it('should return current undo count', () => {
      incrementUndoCount();
      incrementUndoCount();
      incrementUndoCount();

      expect(getUndoCount()).toBe(3);
    });

    it('should return count from storage', () => {
      const today = getTodayDateString();
      localStorage.setItem(
        'daily-action-counter',
        JSON.stringify({
          date: today,
          undoCount: 7,
          checkGridCount: 2,
        })
      );

      expect(getUndoCount()).toBe(7);
    });
  });

  describe('getCheckGridCount', () => {
    it('should return 0 when not set', () => {
      expect(getCheckGridCount()).toBe(0);
    });

    it('should return current check grid count', () => {
      incrementCheckGridCount();
      incrementCheckGridCount();

      expect(getCheckGridCount()).toBe(2);
    });

    it('should return count from storage', () => {
      const today = getTodayDateString();
      localStorage.setItem(
        'daily-action-counter',
        JSON.stringify({
          date: today,
          undoCount: 2,
          checkGridCount: 4,
        })
      );

      expect(getCheckGridCount()).toBe(4);
    });
  });

  describe('canUseUndo', () => {
    it('should return true when below limit', () => {
      expect(canUseUndo()).toBe(true);
    });

    it('should return true until limit is reached', () => {
      for (let i = 0; i < DAILY_LIMITS.UNDO; i++) {
        expect(canUseUndo()).toBe(true);
        incrementUndoCount();
      }
    });

    it('should return false when limit is reached', () => {
      for (let i = 0; i < DAILY_LIMITS.UNDO; i++) {
        incrementUndoCount();
      }

      expect(canUseUndo()).toBe(false);
    });

    it('should return false when limit is exceeded', () => {
      for (let i = 0; i < DAILY_LIMITS.UNDO + 5; i++) {
        incrementUndoCount();
      }

      expect(canUseUndo()).toBe(false);
    });
  });

  describe('canUseCheckGrid', () => {
    it('should return true when below limit', () => {
      expect(canUseCheckGrid()).toBe(true);
    });

    it('should return true until limit is reached', () => {
      for (let i = 0; i < DAILY_LIMITS.CHECK_GRID; i++) {
        expect(canUseCheckGrid()).toBe(true);
        incrementCheckGridCount();
      }
    });

    it('should return false when limit is reached', () => {
      for (let i = 0; i < DAILY_LIMITS.CHECK_GRID; i++) {
        incrementCheckGridCount();
      }

      expect(canUseCheckGrid()).toBe(false);
    });

    it('should return false when limit is exceeded', () => {
      for (let i = 0; i < DAILY_LIMITS.CHECK_GRID + 5; i++) {
        incrementCheckGridCount();
      }

      expect(canUseCheckGrid()).toBe(false);
    });
  });

  describe('getRemainingUndos', () => {
    it('should return total limit when at 0', () => {
      expect(getRemainingUndos()).toBe(DAILY_LIMITS.UNDO);
    });

    it('should return remaining after increments', () => {
      incrementUndoCount();
      incrementUndoCount();

      expect(getRemainingUndos()).toBe(DAILY_LIMITS.UNDO - 2);
    });

    it('should return 0 when limit reached', () => {
      for (let i = 0; i < DAILY_LIMITS.UNDO; i++) {
        incrementUndoCount();
      }

      expect(getRemainingUndos()).toBe(0);
    });

    it('should not return negative', () => {
      for (let i = 0; i < DAILY_LIMITS.UNDO + 10; i++) {
        incrementUndoCount();
      }

      expect(getRemainingUndos()).toBe(0);
    });

    it('should track remaining correctly', () => {
      for (let i = 0; i < DAILY_LIMITS.UNDO; i++) {
        incrementUndoCount();
        const remaining = getRemainingUndos();
        expect(remaining).toBe(DAILY_LIMITS.UNDO - (i + 1));
      }
    });
  });

  describe('getRemainingCheckGrids', () => {
    it('should return total limit when at 0', () => {
      expect(getRemainingCheckGrids()).toBe(DAILY_LIMITS.CHECK_GRID);
    });

    it('should return remaining after increments', () => {
      incrementCheckGridCount();

      expect(getRemainingCheckGrids()).toBe(DAILY_LIMITS.CHECK_GRID - 1);
    });

    it('should return 0 when limit reached', () => {
      for (let i = 0; i < DAILY_LIMITS.CHECK_GRID; i++) {
        incrementCheckGridCount();
      }

      expect(getRemainingCheckGrids()).toBe(0);
    });

    it('should not return negative', () => {
      for (let i = 0; i < DAILY_LIMITS.CHECK_GRID + 10; i++) {
        incrementCheckGridCount();
      }

      expect(getRemainingCheckGrids()).toBe(0);
    });

    it('should track remaining correctly', () => {
      for (let i = 0; i < DAILY_LIMITS.CHECK_GRID; i++) {
        incrementCheckGridCount();
        const remaining = getRemainingCheckGrids();
        expect(remaining).toBe(DAILY_LIMITS.CHECK_GRID - (i + 1));
      }
    });
  });

  describe('independent counters', () => {
    it('should track undo and check grid independently', () => {
      incrementUndoCount();
      incrementUndoCount();
      incrementCheckGridCount();

      expect(getUndoCount()).toBe(2);
      expect(getCheckGridCount()).toBe(1);
    });

    it('should allow filling both counters independently', () => {
      // Fill undo counter
      for (let i = 0; i < DAILY_LIMITS.UNDO; i++) {
        incrementUndoCount();
      }

      // Check grid should still be usable
      expect(canUseCheckGrid()).toBe(true);

      // Fill check grid counter
      for (let i = 0; i < DAILY_LIMITS.CHECK_GRID; i++) {
        incrementCheckGridCount();
      }

      // Both should be full now
      expect(canUseUndo()).toBe(false);
      expect(canUseCheckGrid()).toBe(false);
    });
  });

  describe('daily reset behavior', () => {
    it('should reset on new day', () => {
      // Increment both counters
      incrementUndoCount();
      incrementCheckGridCount();

      expect(getUndoCount()).toBe(1);
      expect(getCheckGridCount()).toBe(1);

      // Manually set to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      localStorage.setItem(
        'daily-action-counter',
        JSON.stringify({
          date: yesterdayStr,
          undoCount: 5,
          checkGridCount: 5,
        })
      );

      // Should reset to zero
      expect(getUndoCount()).toBe(0);
      expect(getCheckGridCount()).toBe(0);
    });

    it('should maintain count within same day', () => {
      incrementUndoCount();
      incrementUndoCount();

      const count1 = getUndoCount();
      const count2 = getUndoCount();
      const count3 = getUndoCount();

      expect(count1).toBe(2);
      expect(count2).toBe(2);
      expect(count3).toBe(2);
    });
  });

  describe('integration scenarios', () => {
    it('should simulate daily usage limit scenario', () => {
      // User has used 3 undos and 2 check grids
      for (let i = 0; i < 3; i++) {
        incrementUndoCount();
      }
      for (let i = 0; i < 2; i++) {
        incrementCheckGridCount();
      }

      // Check current state
      expect(getUndoCount()).toBe(3);
      expect(getCheckGridCount()).toBe(2);
      expect(getRemainingUndos()).toBe(DAILY_LIMITS.UNDO - 3);
      expect(getRemainingCheckGrids()).toBe(DAILY_LIMITS.CHECK_GRID - 2);

      // Should still be able to use both
      expect(canUseUndo()).toBe(true);
      expect(canUseCheckGrid()).toBe(true);
    });

    it('should block actions when limits reached', () => {
      // Use all undos
      for (let i = 0; i < DAILY_LIMITS.UNDO; i++) {
        incrementUndoCount();
      }

      // Use all check grids
      for (let i = 0; i < DAILY_LIMITS.CHECK_GRID; i++) {
        incrementCheckGridCount();
      }

      // Both should be blocked
      expect(canUseUndo()).toBe(false);
      expect(canUseCheckGrid()).toBe(false);
      expect(getRemainingUndos()).toBe(0);
      expect(getRemainingCheckGrids()).toBe(0);
    });

    it('should allow partial usage', () => {
      const undoUsage = 2;
      const checkGridUsage = 3;

      for (let i = 0; i < undoUsage; i++) {
        incrementUndoCount();
      }

      for (let i = 0; i < checkGridUsage; i++) {
        incrementCheckGridCount();
      }

      expect(getRemainingUndos()).toBe(DAILY_LIMITS.UNDO - undoUsage);
      expect(getRemainingCheckGrids()).toBe(
        DAILY_LIMITS.CHECK_GRID - checkGridUsage
      );
    });
  });

  describe('limit configuration', () => {
    it('should use UNDO limit from config', () => {
      for (let i = 0; i < DAILY_LIMITS.UNDO; i++) {
        incrementUndoCount();
      }

      expect(canUseUndo()).toBe(false);
    });

    it('should use CHECK_GRID limit from config', () => {
      for (let i = 0; i < DAILY_LIMITS.CHECK_GRID; i++) {
        incrementCheckGridCount();
      }

      expect(canUseCheckGrid()).toBe(false);
    });

    it('should respect configured limits', () => {
      // Limits should be 5 and 5 based on config
      expect(DAILY_LIMITS.UNDO).toBeGreaterThan(0);
      expect(DAILY_LIMITS.CHECK_GRID).toBeGreaterThan(0);

      // Verify they work correctly
      for (let i = 0; i < DAILY_LIMITS.UNDO; i++) {
        expect(canUseUndo()).toBe(true);
        incrementUndoCount();
      }

      expect(canUseUndo()).toBe(false);
    });
  });
});
