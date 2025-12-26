export interface SessionResponse<T> {
  sessionId: string;
  state: T;
  updatedAt: string;
}

export interface Session<T> {
  sessionId: string;
  state: T;
  updatedAt: Date;
}

export interface SessionParty<T> {
  memberSessions: {
    [userId: string]: T | undefined;
  };
}

export interface Parties<T> {
  [partyId: string]: SessionParty<T> | undefined;
}

export interface StateResponse<T> extends SessionResponse<T> {
  parties: Parties<SessionResponse<T>>;
}

export interface ServerStateResult<T> extends Session<T> {
  parties?: Parties<Session<T>>;
}

export enum EntitlementDuration {
  LIFETIME = 'lifetime',
  ONE_MONTH = 'one_month',
  ONE_YEAR = 'one_year',
}

export interface PartyResponse {
  partyId: string;
  appId: string;
  partyName: string;
  createdBy: string;
  maxSize?: number;
  entitlementDuration?: EntitlementDuration;
  createdAt: string;
  updatedAt: string;
}

export interface MemberResponse {
  userId: string;
  resourceId: string;
  memberNickname: string;
  createdAt: string;
  updatedAt: string;
}

export interface Member
  extends Omit<MemberResponse, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
  isOwner: boolean;
  isUser: boolean;
}

export interface Party extends Omit<PartyResponse, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
  isOwner: boolean;
  members: Member[];
}

export interface InviteResponse {
  inviteId: string;
  resourceId: string;
  description?: string;
  sessionId?: string;
  redirectUri?: string;
  createdBy: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invite
  extends Omit<InviteResponse, 'createdAt' | 'updatedAt' | 'expiresAt'> {
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicInvite
  extends Pick<
    Invite,
    'description' | 'resourceId' | 'sessionId' | 'redirectUri'
  > {
  entitlementDuration?: EntitlementDuration;
}

// ===== Sudoku-specific types =====

export enum Difficulty {
  SIMPLE = 'simple',
  EASY = 'easy',
  INTERMEDIATE = 'intermediate',
  EXPERT = 'expert',
}

export interface SudokuOfTheDayResponse {
  sudokuId: string;
  difficulty: Difficulty;
  initial: string;
  final: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SudokuOfTheDay
  extends Omit<SudokuOfTheDayResponse, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
}

export enum BookPuzzleDifficulty {
  VERY_EASY = '1-very-easy',
  EASY = '2-easy',
  MODERATELY_EASY = '3-moderately-easy',
  MODERATE = '4-moderate',
  MODERATELY_HARD = '5-moderately-hard',
  HARD = '6-hard',
  VICIOUS = '7-vicious',
  FIENDISH = '8-fiendish',
  DEVILISH = '9-devilish',
  HELL = '10-hell',
  BEYOND_HELL = '11-beyond-hell',
}

export interface SudokuBookPuzzle {
  initial: string;
  final: string;
  difficulty: {
    coach: BookPuzzleDifficulty; // https://sudoku.coach
    sudokuExplainer: number; // https://github.com/SudokuMonster/SukakuExplainer
    hoDoKu: number; // https://hodoku.sourceforge.net
    tediousPercent: number; // TediousnessPercentage
    count: {
      givens: number;
      basic: number;
      simple: number;
      advanced: number;
      moreAdvanced: number;
      hard: number;
      brutal: number;
    };
  };
  techniques: Partial<{
    basic: Partial<{
      lastDigit: number;
      hiddenSingleBox: number;
      hiddenSingleLine: number;
      hiddenSingleVariantRegion: number;
      nakedSingle: number;
    }>;
    simple: Partial<{
      hiddenPair: number;
      lockedCandidate: number;
      hiddenTriple: number;
      hiddenQuadruple: number;
      nakedPair: number;
      nakedTriple: number;
      nakedQuadruple: number;
    }>;
    advanced: Partial<{
      xWing: number;
      swordfish: number;
      skyscraper: number;
      twoStringKite: number;
      crane: number;
      simpleColoring: number;
      yWing: number;
      xYZWing: number;
      wWing: number;
      finnedSashimiXWing: number;
      emptyRectangle: number;
      uniqueRectangleType1: number;
      uniqueRectangleType2: number;
      uniqueRectangleType3: number;
      uniqueRectangleType4: number;
      uniqueRectangleType5: number;
    }>;
    hard: Partial<{
      finnedSashimiSwordfish: number;
      jellyfish: number;
      bugBinaryUniversalGrave: number;
      xChain: number;
      groupedXChain: number;
      YWing4WXYZWing: number;
      yWing5: number;
      yWing6: number;
      yWing7: number;
      yWing8: number;
      yWing9: number;
      finnedSashimiJellyfish: number;
    }>;
    brutal: Partial<{
      medusa3D: number;
      xyChain: number;
      alternatingInferenceChainAIC: number;
      groupedAlternatingInferenceChainAIC: number;
    }>;
    beyondBrutal: Partial<{
      nishioForcingChain: number;
      nishioForcingNet: number;
    }>;
  }>;
}

export interface SudokuBookOfTheMonthResponse {
  sudokuBookId: string;
  puzzles: SudokuBookPuzzle[];
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SudokuBookOfTheMonth
  extends Omit<SudokuBookOfTheMonthResponse, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
}
