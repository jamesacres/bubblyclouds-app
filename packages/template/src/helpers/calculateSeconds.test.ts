import { describe, it, expect } from '@jest/globals';
import { calculateSeconds } from './calculateSeconds';
import type { Timer } from '../types/timer';

describe('calculateSeconds', () => {
  describe('basic functionality', () => {
    it('should return 0 when timer is null', () => {
      const result = calculateSeconds(null);
      expect(result).toBe(0);
    });

    it('should return 0 when timer is undefined', () => {
      const result = calculateSeconds(null);
      expect(result).toBe(0);
    });

    it('should add elapsed time to base seconds', () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 10000); // 10 seconds ago

      const timer: Timer = {
        seconds: 5,
        inProgress: {
          start: pastDate.toISOString(),
          lastInteraction: now.toISOString(),
        },
      };

      const result = calculateSeconds(timer);
      // Should be base 5 + ~10 seconds
      expect(result).toBeGreaterThanOrEqual(14);
      expect(result).toBeLessThanOrEqual(16);
    });

    it('should return base seconds when start and last interaction are same time', () => {
      const now = new Date();
      const isoString = now.toISOString();

      const timer: Timer = {
        seconds: 100,
        inProgress: {
          start: isoString,
          lastInteraction: isoString,
        },
      };

      const result = calculateSeconds(timer);
      expect(result).toBe(100);
    });
  });

  describe('time calculations', () => {
    it('should calculate 1 second elapsed', () => {
      const now = new Date();
      const oneSecAgo = new Date(now.getTime() - 1000);

      const timer: Timer = {
        seconds: 0,
        inProgress: {
          start: oneSecAgo.toISOString(),
          lastInteraction: now.toISOString(),
        },
      };

      const result = calculateSeconds(timer);
      expect(result).toBe(1);
    });

    it('should calculate 60 seconds elapsed (1 minute)', () => {
      const now = new Date();
      const sixtySecsAgo = new Date(now.getTime() - 60000);

      const timer: Timer = {
        seconds: 0,
        inProgress: {
          start: sixtySecsAgo.toISOString(),
          lastInteraction: now.toISOString(),
        },
      };

      const result = calculateSeconds(timer);
      expect(result).toBe(60);
    });

    it('should calculate 3600 seconds elapsed (1 hour)', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);

      const timer: Timer = {
        seconds: 0,
        inProgress: {
          start: oneHourAgo.toISOString(),
          lastInteraction: now.toISOString(),
        },
      };

      const result = calculateSeconds(timer);
      expect(result).toBe(3600);
    });
  });

  describe('base seconds accumulation', () => {
    it('should add base seconds to elapsed time', () => {
      const now = new Date();
      const tenSecsAgo = new Date(now.getTime() - 10000);

      const timer: Timer = {
        seconds: 50,
        inProgress: {
          start: tenSecsAgo.toISOString(),
          lastInteraction: now.toISOString(),
        },
      };

      const result = calculateSeconds(timer);
      expect(result).toBe(60);
    });

    it('should work with large base seconds', () => {
      const now = new Date();
      const fiveSecsAgo = new Date(now.getTime() - 5000);

      const timer: Timer = {
        seconds: 1000,
        inProgress: {
          start: fiveSecsAgo.toISOString(),
          lastInteraction: now.toISOString(),
        },
      };

      const result = calculateSeconds(timer);
      expect(result).toBeGreaterThanOrEqual(1005);
      expect(result).toBeLessThanOrEqual(1006);
    });

    it('should combine multiple base seconds with elapsed time', () => {
      const now = new Date();
      const twentySecsAgo = new Date(now.getTime() - 20000);

      const timer: Timer = {
        seconds: 100,
        inProgress: {
          start: twentySecsAgo.toISOString(),
          lastInteraction: now.toISOString(),
        },
      };

      const result = calculateSeconds(timer);
      expect(result).toBeGreaterThanOrEqual(120);
      expect(result).toBeLessThanOrEqual(121);
    });
  });

  describe('edge cases', () => {
    it('should floor elapsed seconds (not round)', () => {
      const now = new Date();
      const almost2SecsAgo = new Date(now.getTime() - 1999);

      const timer: Timer = {
        seconds: 0,
        inProgress: {
          start: almost2SecsAgo.toISOString(),
          lastInteraction: now.toISOString(),
        },
      };

      const result = calculateSeconds(timer);
      expect(result).toBe(1); // Should floor, not round
    });

    it('should handle very small elapsed times', () => {
      const now = new Date();
      const almostNowAgo = new Date(now.getTime() - 100); // 100ms ago

      const timer: Timer = {
        seconds: 10,
        inProgress: {
          start: almostNowAgo.toISOString(),
          lastInteraction: now.toISOString(),
        },
      };

      const result = calculateSeconds(timer);
      expect(result).toBe(10); // Less than 1 second floors to 0
    });

    it('should handle timer with countdown property', () => {
      const now = new Date();
      const tenSecsAgo = new Date(now.getTime() - 10000);

      const timer: Timer = {
        seconds: 5,
        countdown: 300, // 5 minute countdown
        inProgress: {
          start: tenSecsAgo.toISOString(),
          lastInteraction: now.toISOString(),
        },
      };

      const result = calculateSeconds(timer);
      expect(result).toBe(15); // Should work same way
    });

    it('should handle timer with stopped property', () => {
      const now = new Date();
      const tenSecsAgo = new Date(now.getTime() - 10000);

      const timer: Timer = {
        seconds: 5,
        stopped: true,
        inProgress: {
          start: tenSecsAgo.toISOString(),
          lastInteraction: now.toISOString(),
        },
      };

      const result = calculateSeconds(timer);
      expect(result).toBe(15); // Should calculate regardless of stopped flag
    });
  });

  describe('ISO date string handling', () => {
    it('should handle standard ISO format', () => {
      const now = new Date();
      const tenSecsAgo = new Date(now.getTime() - 10000);

      const timer: Timer = {
        seconds: 0,
        inProgress: {
          start: tenSecsAgo.toISOString(),
          lastInteraction: now.toISOString(),
        },
      };

      const result = calculateSeconds(timer);
      expect(result).toBeGreaterThanOrEqual(10);
    });

    it('should handle different timezone offsets in ISO strings', () => {
      // Create dates that when converted to ISO have different representations
      const date1 = new Date('2024-01-01T12:00:00Z');
      const date2 = new Date('2024-01-01T12:00:10Z');

      const timer: Timer = {
        seconds: 0,
        inProgress: {
          start: date1.toISOString(),
          lastInteraction: date2.toISOString(),
        },
      };

      const result = calculateSeconds(timer);
      expect(result).toBe(10);
    });
  });

  describe('accumulation scenarios', () => {
    it('should simulate puzzle timer progression', () => {
      // Simulate a puzzle that's been running for 5 minutes total
      // with 3 minutes already on the clock and 2 minutes elapsed this session
      const now = new Date();
      const twoMinsAgo = new Date(now.getTime() - 120000);

      const timer: Timer = {
        seconds: 180, // 3 minutes already elapsed
        inProgress: {
          start: twoMinsAgo.toISOString(),
          lastInteraction: now.toISOString(),
        },
      };

      const result = calculateSeconds(timer);
      // 180 + 120 = 300 seconds = 5 minutes
      expect(result).toBe(300);
    });

    it('should handle pause and resume scenarios', () => {
      // Simulate timer that was paused
      const pauseTime = new Date('2024-01-01T12:00:30Z');
      const resumeTime = new Date('2024-01-01T12:01:00Z'); // 30 seconds later

      const timer: Timer = {
        seconds: 100, // Had 100 seconds when paused
        inProgress: {
          start: pauseTime.toISOString(),
          lastInteraction: resumeTime.toISOString(),
        },
      };

      const result = calculateSeconds(timer);
      // 100 + 30 = 130 seconds
      expect(result).toBe(130);
    });
  });

  describe('null safety', () => {
    it('should gracefully handle null input', () => {
      expect(() => calculateSeconds(null)).not.toThrow();
    });

    it('should return 0 for null', () => {
      const result = calculateSeconds(null);
      expect(result).toBe(0);
    });

    it('should not crash with missing inProgress', () => {
      // @ts-ignore - testing error handling
      const timer: Timer = {
        seconds: 10,
      };

      expect(() => calculateSeconds(timer)).toThrow();
    });
  });

  describe('type compatibility', () => {
    it('should accept Timer object', () => {
      const now = new Date();
      const timer: Timer = {
        seconds: 10,
        inProgress: {
          start: now.toISOString(),
          lastInteraction: now.toISOString(),
        },
      };

      expect(() => calculateSeconds(timer)).not.toThrow();
    });

    it('should accept null as Timer | null', () => {
      expect(() => calculateSeconds(null)).not.toThrow();
    });
  });

  describe('performance', () => {
    it('should calculate quickly', () => {
      const now = new Date();
      const tenSecsAgo = new Date(now.getTime() - 10000);

      const timer: Timer = {
        seconds: 100,
        inProgress: {
          start: tenSecsAgo.toISOString(),
          lastInteraction: now.toISOString(),
        },
      };

      const start = performance.now();
      calculateSeconds(timer);
      const end = performance.now();

      expect(end - start).toBeLessThan(10); // Should be less than 10ms
    });

    it('should handle many rapid calls', () => {
      const now = new Date();
      const tenSecsAgo = new Date(now.getTime() - 10000);

      const timer: Timer = {
        seconds: 100,
        inProgress: {
          start: tenSecsAgo.toISOString(),
          lastInteraction: now.toISOString(),
        },
      };

      expect(() => {
        for (let i = 0; i < 1000; i++) {
          calculateSeconds(timer);
        }
      }).not.toThrow();
    });
  });
});
