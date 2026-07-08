// Shapes the real backend will eventually return for Unblock Race
// collections. For v1 these are produced from the mock seed data
// (SPEC.md §8) by helpers/mockData.ts.

export interface UnblockCollectionPuzzle {
  // The starting board string (doubles as the puzzle id, SPEC.md §4)
  initial: string;
  // Goal representation: primary piece at the exit target
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
