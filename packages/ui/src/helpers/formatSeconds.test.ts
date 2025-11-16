import { formatSeconds } from '../helpers/formatSeconds';

describe('formatSeconds', () => {
  describe('basic functionality', () => {
    it('should format 0 seconds correctly', () => {
      expect(formatSeconds(0)).toBe('00:00:00');
    });

    it('should format seconds only', () => {
      expect(formatSeconds(1)).toBe('00:00:01');
      expect(formatSeconds(30)).toBe('00:00:30');
      expect(formatSeconds(59)).toBe('00:00:59');
    });

    it('should format minutes', () => {
      expect(formatSeconds(60)).toBe('00:01:00');
      expect(formatSeconds(90)).toBe('00:01:30');
      expect(formatSeconds(600)).toBe('00:10:00');
    });

    it('should format hours', () => {
      expect(formatSeconds(3600)).toBe('01:00:00');
      expect(formatSeconds(3660)).toBe('01:01:00');
      expect(formatSeconds(3661)).toBe('01:01:01');
    });
  });

  describe('padding', () => {
    it('should pad single digit seconds', () => {
      expect(formatSeconds(5)).toBe('00:00:05');
      expect(formatSeconds(9)).toBe('00:00:09');
    });

    it('should pad single digit minutes', () => {
      expect(formatSeconds(65)).toBe('00:01:05');
      expect(formatSeconds(595)).toBe('00:09:55');
    });

    it('should pad single digit hours', () => {
      expect(formatSeconds(3605)).toBe('01:00:05');
      expect(formatSeconds(3665)).toBe('01:01:05');
    });

    it('should maintain padding for all digits', () => {
      expect(formatSeconds(1)).toBe('00:00:01');
      expect(formatSeconds(601)).toBe('00:10:01');
      expect(formatSeconds(3661)).toBe('01:01:01');
    });
  });

  describe('complex times', () => {
    it('should format typical game times', () => {
      expect(formatSeconds(180)).toBe('00:03:00'); // 3 minutes
      expect(formatSeconds(300)).toBe('00:05:00'); // 5 minutes
      expect(formatSeconds(600)).toBe('00:10:00'); // 10 minutes
    });

    it('should format times over 1 hour', () => {
      expect(formatSeconds(3600 + 300 + 45)).toBe('01:05:45');
      expect(formatSeconds(7200 + 600)).toBe('02:10:00');
    });

    it('should handle large times', () => {
      expect(formatSeconds(9 * 3600 + 59 * 60 + 59)).toBe('09:59:59');
      expect(formatSeconds(10 * 3600)).toBe('10:00:00');
    });

    it('should handle times over 24 hours', () => {
      expect(formatSeconds(24 * 3600)).toBe('24:00:00');
      expect(formatSeconds(25 * 3600 + 30 * 60 + 30)).toBe('25:30:30');
    });
  });

  describe('edge cases', () => {
    it('should handle decimal numbers by flooring', () => {
      expect(formatSeconds(1.9)).toBe('00:00:01');
      expect(formatSeconds(59.5)).toBe('00:00:59');
      expect(formatSeconds(60.1)).toBe('00:01:00');
    });

    it('should handle very small decimal seconds', () => {
      expect(formatSeconds(0.5)).toBe('00:00:00');
      expect(formatSeconds(0.1)).toBe('00:00:00');
    });

    it('should format 59 seconds correctly', () => {
      expect(formatSeconds(59)).toBe('00:00:59');
      expect(formatSeconds(119)).toBe('00:01:59');
      expect(formatSeconds(3659)).toBe('01:00:59');
    });
  });

  describe('mathematical correctness', () => {
    it('should convert seconds correctly', () => {
      const seconds = 125; // 2 minutes 5 seconds
      const expected = '00:02:05';
      expect(formatSeconds(seconds)).toBe(expected);
    });

    it('should convert mixed units', () => {
      // 1 hour, 30 minutes, 45 seconds
      const seconds = 1 * 3600 + 30 * 60 + 45;
      expect(formatSeconds(seconds)).toBe('01:30:45');
    });

    it('should handle remainder calculations', () => {
      expect(formatSeconds(3745)).toBe('01:02:25'); // 1h 2m 25s
      expect(formatSeconds(7325)).toBe('02:02:05'); // 2h 2m 5s
    });
  });

  describe('real-world scenarios', () => {
    it('should format quick puzzles', () => {
      expect(formatSeconds(120)).toBe('00:02:00'); // 2 min
      expect(formatSeconds(300)).toBe('00:05:00'); // 5 min
    });

    it('should format medium puzzles', () => {
      expect(formatSeconds(600)).toBe('00:10:00'); // 10 min
      expect(formatSeconds(1200)).toBe('00:20:00'); // 20 min
    });

    it('should format slow puzzles', () => {
      expect(formatSeconds(1800)).toBe('00:30:00'); // 30 min
      expect(formatSeconds(3600)).toBe('01:00:00'); // 1 hour
    });
  });
});
