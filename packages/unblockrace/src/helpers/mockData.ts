import puzzles from '../mockData/puzzles.json';
import {
  UnblockCollectionOfTheMonth,
  UnblockCollectionPuzzle,
} from '../types/serverTypes';
import { solvedBoardString } from './boardToString';
import { difficultyForMoves } from './difficulty';

// Mock puzzle-content source (SPEC.md §8): deterministic picks from the
// static seed fixture until a real backend exists. Sessions, parties,
// invites, auth and RevenueCat are all real — only which boards exist and
// what the daily/collection picks are is mocked.

export interface SeedPuzzle {
  boardString: string;
  movesRequired: number;
  clusterSize: number;
}

export const SEED_PUZZLES: SeedPuzzle[] = puzzles;

export const RUN_STAGE_COUNT = 5;

const daysSinceEpoch = (date: Date): number =>
  Math.floor(date.getTime() / 86400000);

const utcDateKey = (date: Date): string =>
  date.toISOString().split('T')[0].replaceAll('-', '');

// Split the fixture (already sorted ascending by move count) into equal
// difficulty bands, one per run stage, so a run races from easy to hard.
const stageBands = (): SeedPuzzle[][] => {
  const bandSize = Math.floor(SEED_PUZZLES.length / RUN_STAGE_COUNT);
  return Array.from({ length: RUN_STAGE_COUNT }, (_, band) =>
    SEED_PUZZLES.slice(
      band * bandSize,
      band === RUN_STAGE_COUNT - 1 ? SEED_PUZZLES.length : (band + 1) * bandSize
    )
  );
};

// The daily run of 5 (SPEC.md §8 "mock run of 5"): deterministic pick per
// UTC date, one puzzle from each ascending difficulty band.
export const getDailyRun = (
  date: Date = new Date()
): { runId: string; puzzles: SeedPuzzle[] } => {
  const seed = daysSinceEpoch(date);
  return {
    runId: `oftheday-${utcDateKey(date)}`,
    puzzles: stageBands().map(
      (band, stage) => band[(seed * 31 + stage * 7) % band.length]
    ),
  };
};

// Deterministic pick of one collection's worth of puzzles keyed by
// year+month, sized to the calendar month like sudoku's book of the month.
export const getCollectionOfTheMonth = (
  date: Date = new Date()
): UnblockCollectionOfTheMonth => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const seed = year * 12 + month;

  const step = Math.floor(SEED_PUZZLES.length / daysInMonth);
  const collectionPuzzles: UnblockCollectionPuzzle[] = Array.from(
    { length: daysInMonth },
    (_, i) => {
      const offset = (seed * 17) % Math.max(1, step);
      const seedPuzzle =
        SEED_PUZZLES[Math.min(i * step + offset, SEED_PUZZLES.length - 1)];
      return {
        initial: seedPuzzle.boardString,
        final: solvedBoardString(seedPuzzle.boardString),
        movesRequired: seedPuzzle.movesRequired,
        difficulty: difficultyForMoves(seedPuzzle.movesRequired),
      };
    }
  );

  const monthKey = `${year}${String(month + 1).padStart(2, '0')}`;
  return {
    unblockCollectionId: `ofthemonth-${monthKey}`,
    puzzles: collectionPuzzles,
    createdAt: new Date(Date.UTC(year, month, 1)),
    updatedAt: new Date(Date.UTC(year, month, 1)),
  };
};

// Daily challenge number for the end-game summary card (SPEC.md §7),
// counting days since launch the same way sudoku's daily counter counts
// days.
const LAUNCH_DATE = Date.UTC(2026, 6, 1);

export const getDailyNumber = (date: Date = new Date()): number =>
  daysSinceEpoch(date) - Math.floor(LAUNCH_DATE / 86400000) + 1;
