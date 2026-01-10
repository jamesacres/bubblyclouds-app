/**
 * Enum for subscription modal contexts
 * Used to provide specific messaging based on which premium feature was blocked
 */
export enum SubscriptionContext {
  UNDO = 'undo',
  CHECK_GRID = 'checkGrid',
  REVEAL = 'reveal',
  THEME_COLOR = 'themeColor',
  DAILY_PUZZLE_LIMIT = 'dailyPuzzleLimit',
  REMOVE_MEMBER = 'removeMember',
  MULTIPLE_PARTIES = 'multipleParties',
  PARTY_MAX_SIZE = 'maxSize',
}
