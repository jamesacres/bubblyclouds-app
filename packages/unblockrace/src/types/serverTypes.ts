// Wire shapes for the Unblock Race API (/unblockRace/ofTheDay,
// /unblockRace/collectionOfTheMonth). App-facing shapes below reshape the
// API's board/moves fields into what the rest of the app expects (see
// helpers/mapPuzzleDto.ts); the difficulty vocabulary itself
// (beginner/challenging/hard/expert) is used as-is, unchanged.

// API difficulty vocabulary (UnblockRacePuzzleDto.difficulty).
export type ApiPuzzleDifficulty =
  | 'beginner'
  | 'challenging'
  | 'hard'
  | 'expert';

export interface UnblockRacePuzzleDto {
  // 36 characters describing a 6x6 grid, row major: 'o' empty, 'x' wall,
  // 'A' the escaping car, other letters are vehicles.
  board: string;
  // Minimum number of moves required to solve.
  moves: number;
  difficulty: ApiPuzzleDifficulty;
}

export interface UnblockRaceOfTheDayResponse {
  unblockRaceId: string;
  puzzles: UnblockRacePuzzleDto[];
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnblockRaceOfTheDay extends Omit<
  UnblockRaceOfTheDayResponse,
  'createdAt' | 'updatedAt'
> {
  createdAt: Date;
  updatedAt: Date;
}

export interface UnblockRaceCollectionOfTheMonthResponse {
  unblockRaceCollectionId: string;
  puzzles: UnblockRacePuzzleDto[];
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnblockRaceCollectionOfTheMonth extends Omit<
  UnblockRaceCollectionOfTheMonthResponse,
  'createdAt' | 'updatedAt'
> {
  createdAt: Date;
  updatedAt: Date;
}

// App-facing puzzle shape: the starting board string (doubles as the puzzle
// id), a goal representation, and the API's difficulty id (see
// helpers/difficultyDisplay.ts).
export interface UnblockCollectionPuzzle {
  initial: string;
  final: string;
  movesRequired: number;
  difficulty: string;
}

export interface UnblockCollectionOfTheMonth {
  unblockCollectionId: string;
  puzzles: UnblockCollectionPuzzle[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UnblockRaceOfTheDayRun {
  runId: string;
  puzzles: UnblockCollectionPuzzle[];
  createdAt: Date;
  updatedAt: Date;
}
