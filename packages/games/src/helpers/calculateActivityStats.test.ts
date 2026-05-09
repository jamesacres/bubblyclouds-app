import { calculateActivityStats } from './calculateActivityStats';
import { BaseServerState } from '@bubblyclouds-app/template/types/state';
import { ServerStateResult } from '@bubblyclouds-app/types/serverTypes';

const makeSession = (daysAgo: number): ServerStateResult<BaseServerState> => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    updatedAt: date,
    sessionId: `session-${daysAgo}-${Math.random()}`,
    state: {} as BaseServerState,
  };
};

describe('calculateActivityStats', () => {
  describe('empty/missing sessions', () => {
    it('returns zeros for undefined', () => {
      const result = calculateActivityStats(undefined);
      expect(result.daysPlayedInThirtyDays).toBe(0);
      expect(result.puzzlesPlayedInThirtyDays).toBe(0);
      expect(result.currentStreak).toBe(0);
    });

    it('returns zeros for empty array', () => {
      const result = calculateActivityStats([]);
      expect(result.daysPlayedInThirtyDays).toBe(0);
      expect(result.puzzlesPlayedInThirtyDays).toBe(0);
      expect(result.currentStreak).toBe(0);
    });

    it('returns 7 days in lastSevenDays even with no sessions', () => {
      const { lastSevenDays } = calculateActivityStats(undefined);
      expect(lastSevenDays).toHaveLength(7);
      expect(lastSevenDays.every((d) => d.puzzleCount === 0)).toBe(true);
    });
  });

  describe('daysPlayedInThirtyDays', () => {
    it('counts unique days within 30 days', () => {
      const sessions = [
        makeSession(0),
        makeSession(1),
        makeSession(5),
        makeSession(31),
      ];
      const { daysPlayedInThirtyDays } = calculateActivityStats(sessions);
      expect(daysPlayedInThirtyDays).toBe(3);
    });

    it('does not count sessions beyond 30 days', () => {
      const sessions = [makeSession(0), makeSession(31)];
      const { daysPlayedInThirtyDays } = calculateActivityStats(sessions);
      expect(daysPlayedInThirtyDays).toBe(1);
    });

    it('deduplicates multiple sessions on the same day', () => {
      const sessions = [makeSession(0), makeSession(0), makeSession(0)];
      const { daysPlayedInThirtyDays } = calculateActivityStats(sessions);
      expect(daysPlayedInThirtyDays).toBe(1);
    });
  });

  describe('puzzlesPlayedInThirtyDays', () => {
    it('counts each session individually, not unique days', () => {
      const sessions = [makeSession(0), makeSession(0), makeSession(1)];
      const { puzzlesPlayedInThirtyDays } = calculateActivityStats(sessions);
      expect(puzzlesPlayedInThirtyDays).toBe(3);
    });

    it('does not count sessions beyond 30 days', () => {
      const sessions = [makeSession(0), makeSession(31)];
      const { puzzlesPlayedInThirtyDays } = calculateActivityStats(sessions);
      expect(puzzlesPlayedInThirtyDays).toBe(1);
    });
  });

  describe('currentStreak', () => {
    it('returns 1 for today only', () => {
      const { currentStreak } = calculateActivityStats([makeSession(0)]);
      expect(currentStreak).toBe(1);
    });

    it('returns streak including today', () => {
      const sessions = [makeSession(0), makeSession(1), makeSession(2)];
      const { currentStreak } = calculateActivityStats(sessions);
      expect(currentStreak).toBe(3);
    });

    it('continues streak from yesterday when today has no session', () => {
      const sessions = [makeSession(1), makeSession(2), makeSession(3)];
      const { currentStreak } = calculateActivityStats(sessions);
      expect(currentStreak).toBe(3);
    });

    it('breaks streak at a gap', () => {
      const sessions = [makeSession(0), makeSession(1), makeSession(3)];
      const { currentStreak } = calculateActivityStats(sessions);
      expect(currentStreak).toBe(2);
    });

    it('returns 0 when only old sessions exist', () => {
      const sessions = [makeSession(5), makeSession(6)];
      const { currentStreak } = calculateActivityStats(sessions);
      expect(currentStreak).toBe(0);
    });

    it('caps streak at 30 days', () => {
      const sessions = Array.from({ length: 35 }, (_, i) => makeSession(i));
      const { currentStreak } = calculateActivityStats(sessions);
      expect(currentStreak).toBe(30);
    });
  });

  describe('lastSevenDays', () => {
    it('returns exactly 7 entries', () => {
      const { lastSevenDays } = calculateActivityStats([makeSession(0)]);
      expect(lastSevenDays).toHaveLength(7);
    });

    it('counts puzzles for today', () => {
      const { lastSevenDays } = calculateActivityStats([
        makeSession(0),
        makeSession(0),
      ]);
      const today = lastSevenDays[6];
      expect(today.isToday).toBe(true);
      expect(today.puzzleCount).toBe(2);
    });

    it('has zero puzzle count today when no session today', () => {
      const { lastSevenDays } = calculateActivityStats([makeSession(1)]);
      const today = lastSevenDays[6];
      expect(today.isToday).toBe(true);
      expect(today.puzzleCount).toBe(0);
    });

    it('counts puzzles for yesterday', () => {
      const { lastSevenDays } = calculateActivityStats([makeSession(1)]);
      const yesterday = lastSevenDays[5];
      expect(yesterday.puzzleCount).toBe(1);
    });

    it('has correct day labels in order', () => {
      const { lastSevenDays } = calculateActivityStats([]);
      const validLabels = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
      lastSevenDays.forEach((day) => {
        expect(validLabels).toContain(day.label);
      });
    });
  });
});
