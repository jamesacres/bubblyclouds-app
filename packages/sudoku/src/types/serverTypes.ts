import {
  Difficulty,
  BookPuzzleDifficulty,
} from '@bubblyclouds-app/games/types/difficulty';

export interface SudokuOfTheDayResponse {
  sudokuId: string;
  difficulty: Difficulty;
  initial: string;
  final: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SudokuOfTheDay extends Omit<
  SudokuOfTheDayResponse,
  'createdAt' | 'updatedAt'
> {
  createdAt: Date;
  updatedAt: Date;
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

export interface SudokuBookOfTheMonth extends Omit<
  SudokuBookOfTheMonthResponse,
  'createdAt' | 'updatedAt'
> {
  createdAt: Date;
  updatedAt: Date;
}
