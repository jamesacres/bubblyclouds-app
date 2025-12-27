import { Puzzle, PuzzleRowOrColumn } from '../types/puzzle';
import { splitCellId } from './calculateId';

const emptyValidatation = (): Puzzle<boolean | undefined> => [
  [
    [
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
    ],
    [
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
    ],
    [
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
    ],
  ],
  [
    [
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
    ],
    [
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
    ],
    [
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
    ],
  ],
  [
    [
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
    ],
    [
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
    ],
    [
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
    ],
  ],
];

const checkGrid = (
  initial: Puzzle,
  final: Puzzle,
  answer: Puzzle
): { validation: Puzzle<boolean | undefined>; isComplete: boolean } => {
  let isComplete = true;
  const rowOrColumn: PuzzleRowOrColumn[] = [0, 1, 2];
  const validation = emptyValidatation();
  for (const boxX of rowOrColumn) {
    for (const boxY of rowOrColumn) {
      for (const cellX of rowOrColumn) {
        for (const cellY of rowOrColumn) {
          if (!initial[boxX][boxY][cellX][cellY]) {
            const isValid =
              final[boxX][boxY][cellX][cellY] ===
              answer[boxX][boxY][cellX][cellY];
            validation[boxX][boxY][cellX][cellY] = isValid;
            if (!isValid) {
              isComplete = false;
            }
          }
        }
      }
    }
  }
  return { validation, isComplete };
};

const isInitialCell = (selectedCell: string, initial: Puzzle): boolean => {
  const { box, cell } = splitCellId(selectedCell);
  return !!initial[box.x][box.y][cell.x][cell.y];
};

const checkCell = (
  selectedCell: string,
  initial: Puzzle,
  final: Puzzle,
  answer: Puzzle
): Puzzle<boolean | undefined> => {
  const validation = emptyValidatation();
  const { box, cell } = splitCellId(selectedCell);
  if (!initial[box.x][box.y][cell.x][cell.y]) {
    const isValid =
      final[box.x][box.y][cell.x][cell.y] ===
      answer[box.x][box.y][cell.x][cell.y];
    validation[box.x][box.y][cell.x][cell.y] = isValid;
  }
  return validation;
};

export { checkCell, checkGrid, isInitialCell };
