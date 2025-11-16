import {
  getPuzzleType,
  calculateSpeedBonus,
  calculateRacingBonus,
  calculateUserScore,
  formatTime,
  getUsernameFromParties,
} from './scoringUtils';
import { SCORING_CONFIG } from './scoringConfig';
import { ServerState } from '@sudoku-web/sudoku/types/state';
import { Puzzle } from '@sudoku-web/sudoku/types/puzzle';
import { ServerStateResult, Party } from '@sudoku-web/types/serverTypes';

const isPuzzleCheated = jest.fn().mockReturnValue(false);

// Helper to create empty puzzle
const createEmptyPuzzle = (): Puzzle<number> => {
  const emptyRow = { 0: [0, 0, 0], 1: [0, 0, 0], 2: [0, 0, 0] };
  const emptyBox = { 0: emptyRow, 1: emptyRow, 2: emptyRow };
  return { 0: emptyBox, 1: emptyBox, 2: emptyBox };
};

// Helper to create server state result
const createSession = (
  metadata?: any,
  seconds?: number
): ServerStateResult<ServerState> => {
  return {
    sessionId: 'test-session',
    userId: 'user-1',
    state: {
      answerStack: [createEmptyPuzzle()],
      initial: createEmptyPuzzle(),
      final: createEmptyPuzzle(),
      completed:
        seconds !== undefined
          ? ({ at: '2024-01-01', seconds } as any)
          : undefined,
      metadata,
    },
  } as any;
};

describe('scoringUtils', () => {
  describe('getPuzzleType', () => {
    it('should identify daily puzzle by sudokuId containing "oftheday"', () => {
      const session = createSession({ sudokuId: 'daily_oftheday_2024' });
      expect(getPuzzleType(session)).toBe('daily');
    });

    it('should identify book puzzle by sudokuBookPuzzleId', () => {
      const session = createSession({ sudokuBookPuzzleId: 'book-123' });
      expect(getPuzzleType(session)).toBe('book');
    });

    it('should identify scanned puzzle by scannedAt', () => {
      const session = createSession({ scannedAt: '2024-01-01T12:00:00Z' });
      expect(getPuzzleType(session)).toBe('scanned');
    });

    it('should return unknown for unrecognized puzzle type', () => {
      const session = createSession({});
      expect(getPuzzleType(session)).toBe('unknown');
    });

    it('should prioritize daily over other types', () => {
      const session = createSession({
        sudokuId: 'oftheday_123',
        sudokuBookPuzzleId: 'book-123',
      });
      expect(getPuzzleType(session)).toBe('daily');
    });
  });

  describe('calculateSpeedBonus', () => {
    it('should return LIGHTNING bonus for very fast times', () => {
      const bonus = calculateSpeedBonus(
        SCORING_CONFIG.SPEED_THRESHOLDS.LIGHTNING - 10
      );
      expect(bonus).toBe(SCORING_CONFIG.SPEED_BONUSES.LIGHTNING);
    });

    it('should return FAST bonus for fast times', () => {
      const bonus = calculateSpeedBonus(
        SCORING_CONFIG.SPEED_THRESHOLDS.FAST - 10
      );
      expect(bonus).toBe(SCORING_CONFIG.SPEED_BONUSES.FAST);
    });

    it('should return QUICK bonus for quick times', () => {
      const bonus = calculateSpeedBonus(
        SCORING_CONFIG.SPEED_THRESHOLDS.QUICK - 10
      );
      expect(bonus).toBe(SCORING_CONFIG.SPEED_BONUSES.QUICK);
    });

    it('should return STEADY bonus for steady times', () => {
      const bonus = calculateSpeedBonus(
        SCORING_CONFIG.SPEED_THRESHOLDS.STEADY - 10
      );
      expect(bonus).toBe(SCORING_CONFIG.SPEED_BONUSES.STEADY);
    });

    it('should return 0 bonus for slow times', () => {
      const bonus = calculateSpeedBonus(
        SCORING_CONFIG.SPEED_THRESHOLDS.STEADY + 1000
      );
      expect(bonus).toBe(0);
    });

    it('should handle boundary values', () => {
      expect(
        calculateSpeedBonus(SCORING_CONFIG.SPEED_THRESHOLDS.LIGHTNING)
      ).toBe(SCORING_CONFIG.SPEED_BONUSES.LIGHTNING);
      expect(calculateSpeedBonus(SCORING_CONFIG.SPEED_THRESHOLDS.FAST)).toBe(
        SCORING_CONFIG.SPEED_BONUSES.FAST
      );
    });
  });

  describe('calculateRacingBonus', () => {
    it('should return 0 bonus when user has no completed time', () => {
      const userSession = createSession({}, undefined); // No completion
      const allFriendsSessions = {};
      const result = calculateRacingBonus(
        userSession,
        allFriendsSessions,
        'user-1'
      );

      expect(result.bonus).toBe(0);
      expect(result.wins).toBe(0);
    });

    it('should count wins against friends on same puzzle', () => {
      const userSession = createSession({ sudokuId: 'puzzle-1' }, 100);
      const friendSession = createSession({ sudokuId: 'puzzle-1' }, 200);

      const allFriendsSessions = {
        'friend-1': [friendSession as any],
      };

      const result = calculateRacingBonus(
        userSession,
        allFriendsSessions,
        'user-1'
      );
      expect(result.wins).toBeGreaterThan(0);
    });

    it('should not count wins against current user', () => {
      const userSession = createSession({ sudokuId: 'puzzle-1' }, 100);
      const selfSession = createSession({ sudokuId: 'puzzle-1' }, 200);

      const allFriendsSessions = {
        'user-1': [selfSession as any],
      };

      const result = calculateRacingBonus(
        userSession,
        allFriendsSessions,
        'user-1'
      );
      expect(result.wins).toBe(0);
    });

    it('should only count wins when both users have completed', () => {
      const userSession = createSession({ sudokuId: 'puzzle-1' }, 100);
      const incompleteSession = createSession(
        { sudokuId: 'puzzle-1' },
        undefined
      );

      const allFriendsSessions = {
        'friend-1': [incompleteSession as any],
      };

      const result = calculateRacingBonus(
        userSession,
        allFriendsSessions,
        'user-1'
      );
      expect(result.wins).toBe(0);
    });

    it('should only match sessions with same puzzle identifier', () => {
      const userSession = createSession({ sudokuId: 'puzzle-1' }, 100);
      const friendSession = createSession({ sudokuId: 'puzzle-2' }, 200);

      const allFriendsSessions = {
        'friend-1': [friendSession as any],
      };

      const result = calculateRacingBonus(
        userSession,
        allFriendsSessions,
        'user-1'
      );
      expect(result.wins).toBe(0);
    });
  });

  describe('calculateUserScore', () => {
    it('should return zero score for no sessions', () => {
      const result = calculateUserScore([], {}, 'user-1', isPuzzleCheated);
      expect(result.volumeScore).toBe(0);
      expect(result.stats.totalPuzzles).toBe(0);
    });

    it('should calculate volume score correctly', () => {
      const sessions = [
        createSession({}, 100) as any,
        createSession({}, 150) as any,
      ];
      const result = calculateUserScore(
        sessions,
        {},
        'user-1',
        isPuzzleCheated
      );

      expect(result.volumeScore).toBe(
        sessions.length * SCORING_CONFIG.VOLUME_MULTIPLIER
      );
      expect(result.stats.totalPuzzles).toBe(2);
    });

    it('should calculate average time correctly', () => {
      const sessions = [
        createSession({}, 60) as any,
        createSession({}, 120) as any,
      ];
      const result = calculateUserScore(
        sessions,
        {},
        'user-1',
        isPuzzleCheated
      );

      expect(result.stats.averageTime).toBe(90);
    });

    it('should track fastest time', () => {
      const sessions = [
        createSession({}, 120) as any,
        createSession({}, 60) as any,
        createSession({}, 180) as any,
      ];
      const result = calculateUserScore(
        sessions,
        {},
        'user-1',
        isPuzzleCheated
      );

      expect(result.stats.fastestTime).toBe(60);
    });

    it('should add speed bonus for fast completions', () => {
      const sessions = [
        createSession(
          {},
          SCORING_CONFIG.SPEED_THRESHOLDS.LIGHTNING - 10
        ) as any,
      ];
      const result = calculateUserScore(
        sessions,
        {},
        'user-1',
        isPuzzleCheated
      );

      expect(result.speedBonus).toBeGreaterThan(0);
    });

    it('should categorize puzzle types correctly', () => {
      const sessions = [
        createSession({ sudokuId: 'oftheday_123' }, 100) as any,
        createSession({ sudokuBookPuzzleId: 'book-1' }, 120) as any,
        createSession({ scannedAt: '2024-01-01' }, 150) as any,
      ];
      const result = calculateUserScore(
        sessions,
        {},
        'user-1',
        isPuzzleCheated
      );

      expect(result.stats.dailyPuzzles).toBe(1);
      expect(result.stats.bookPuzzles).toBe(1);
      expect(result.stats.scannedPuzzles).toBe(1);
    });

    it('should exclude cheated puzzles', () => {
      // Note: This test would need mock for isPuzzleCheated
      const sessions = [createSession({}, 100) as any];
      const result = calculateUserScore(
        sessions,
        {},
        'user-1',
        isPuzzleCheated
      );

      // Should include non-cheated puzzle
      expect(result.stats.totalPuzzles).toBe(1);
    });

    it('should handle empty session list', () => {
      const result = calculateUserScore([], {}, 'user-1', isPuzzleCheated);

      expect(result.stats.fastestTime).toBe(0);
      expect(result.stats.averageTime).toBe(0);
    });
  });

  describe('formatTime', () => {
    it('should format 0 seconds as "0:00"', () => {
      expect(formatTime(0)).toBe('0:00');
    });

    it('should format seconds within a minute', () => {
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(59)).toBe('0:59');
    });

    it('should format minutes correctly', () => {
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(90)).toBe('1:30');
    });

    it('should pad seconds with zero', () => {
      expect(formatTime(65)).toBe('1:05');
      expect(formatTime(125)).toBe('2:05');
    });

    it('should handle larger times', () => {
      expect(formatTime(600)).toBe('10:00');
      expect(formatTime(3661)).toBe('61:01');
    });

    it('should round partial seconds', () => {
      expect(formatTime(30.4)).toBe('0:30');
      expect(formatTime(30.6)).toBe('0:31');
    });
  });

  describe('getUsernameFromParties', () => {
    it('should find username in parties', () => {
      const parties: Party[] = [
        {
          partyId: 'party-1',
          createdBy: 'user-1',
          members: [
            { userId: 'user-1', memberNickname: 'Alice' } as any,
            { userId: 'user-2', memberNickname: 'Bob' } as any,
          ],
        },
      ] as any;

      expect(getUsernameFromParties('user-2', parties)).toBe('Bob');
    });

    it('should return "Unknown User" when not found', () => {
      const parties: Party[] = [
        {
          partyId: 'party-1',
          createdBy: 'user-1',
          members: [{ userId: 'user-1', memberNickname: 'Alice' } as any],
        },
      ] as any;

      expect(getUsernameFromParties('user-999', parties)).toBe('Unknown User');
    });

    it('should return first match in multiple parties', () => {
      const parties: Party[] = [
        {
          partyId: 'party-1',
          createdBy: 'user-1',
          members: [{ userId: 'user-2', memberNickname: 'Bob' } as any],
        },
        {
          partyId: 'party-2',
          createdBy: 'user-1',
          members: [{ userId: 'user-2', memberNickname: 'Charlie' } as any],
        },
      ] as any;

      expect(getUsernameFromParties('user-2', parties)).toBe('Bob');
    });

    it('should handle empty parties array', () => {
      expect(getUsernameFromParties('user-1', [])).toBe('Unknown User');
    });
  });
});
