import {
  getCollectionOfTheMonth,
  getDailyRun,
  getDailyNumber,
  RUN_STAGE_COUNT,
  SEED_PUZZLES,
} from './mockData';
import { parseBoardString } from './parseBoardString';

describe('SEED_PUZZLES', () => {
  it('is sorted ascending by move count', () => {
    for (let i = 1; i < SEED_PUZZLES.length; i++) {
      expect(SEED_PUZZLES[i].movesRequired).toBeGreaterThanOrEqual(
        SEED_PUZZLES[i - 1].movesRequired
      );
    }
  });
});

describe('getDailyRun', () => {
  const date = new Date('2026-07-08T10:00:00Z');

  it('is deterministic for a given date', () => {
    expect(getDailyRun(date)).toEqual(getDailyRun(date));
  });

  it('differs between days', () => {
    const nextDay = new Date('2026-07-09T10:00:00Z');
    expect(getDailyRun(date).puzzles).not.toEqual(getDailyRun(nextDay).puzzles);
  });

  it('mints a date-keyed runId', () => {
    expect(getDailyRun(date).runId).toBe('oftheday-20260708');
  });

  it('returns a run of ascending difficulty', () => {
    const { puzzles } = getDailyRun(date);
    expect(puzzles).toHaveLength(RUN_STAGE_COUNT);
    for (let i = 1; i < puzzles.length; i++) {
      expect(puzzles[i].movesRequired).toBeGreaterThanOrEqual(
        puzzles[i - 1].movesRequired
      );
    }
  });

  it('returns valid boards', () => {
    for (const puzzle of getDailyRun(date).puzzles) {
      expect(() => parseBoardString(puzzle.boardString)).not.toThrow();
    }
  });
});

describe('getCollectionOfTheMonth', () => {
  const date = new Date('2026-07-08T10:00:00Z');

  it('is deterministic for a given month', () => {
    expect(getCollectionOfTheMonth(date)).toEqual(
      getCollectionOfTheMonth(new Date('2026-07-20T00:00:00Z'))
    );
  });

  it('is keyed by year and month', () => {
    expect(getCollectionOfTheMonth(date).unblockCollectionId).toBe(
      'ofthemonth-202607'
    );
  });

  it('sizes the collection to the calendar month', () => {
    expect(getCollectionOfTheMonth(date).puzzles).toHaveLength(31);
  });

  it('orders puzzles by ascending difficulty', () => {
    const { puzzles } = getCollectionOfTheMonth(date);
    for (let i = 1; i < puzzles.length; i++) {
      expect(puzzles[i].movesRequired).toBeGreaterThanOrEqual(
        puzzles[i - 1].movesRequired
      );
    }
  });
});

describe('getDailyNumber', () => {
  it('counts days since launch', () => {
    expect(getDailyNumber(new Date('2026-07-01T12:00:00Z'))).toBe(1);
    expect(getDailyNumber(new Date('2026-07-08T12:00:00Z'))).toBe(8);
  });
});
