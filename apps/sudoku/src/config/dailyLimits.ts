/**
 * Configuration for daily limits in the freemium model
 * These limits apply to non-subscribed users and reset daily at midnight
 */
export const DAILY_LIMITS = {
  /** Number of free undo actions per day */
  UNDO: 5,

  /** Number of free grid check actions per day */
  CHECK_GRID: 5,

  /** Number of free puzzles per day */
  PUZZLE: 1,
};
