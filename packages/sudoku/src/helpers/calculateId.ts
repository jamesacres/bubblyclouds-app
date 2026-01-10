import { PuzzleRowOrColumn } from '../types/puzzle';

const calculateBoxId = (x: number, y: number) => {
  return `box:${x},${y}`;
};

const calculateCellId = (boxId: string, x: number, y: number) => {
  return `${boxId},cell:${x},${y}`;
};

const splitCellId = (
  cellId: string
): {
  box: { x: PuzzleRowOrColumn; y: PuzzleRowOrColumn };
  cell: { x: PuzzleRowOrColumn; y: PuzzleRowOrColumn };
} => {
  const matches = Array.from(
    cellId.matchAll(
      new RegExp('box:([0-3]),([0-3]),cell:([0-3]),([0-3])', 'g')
    ),
    (m) => [
      Number(m[1]) as PuzzleRowOrColumn,
      Number(m[2]) as PuzzleRowOrColumn,
      Number(m[3]) as PuzzleRowOrColumn,
      Number(m[4]) as PuzzleRowOrColumn,
    ]
  )[0];

  if (!matches) {
    console.error(`Invalid cellId format: ${cellId}`);
    // Return default values to prevent crash
    return {
      box: { x: 0, y: 0 },
      cell: { x: 0, y: 0 },
    };
  }

  return {
    box: { x: matches[0], y: matches[1] },
    cell: { x: matches[2], y: matches[3] },
  };
};

const calculateNextCellId = (
  selectedCell: string,
  direction: 'down' | 'up' | 'left' | 'right'
): string => {
  const { box, cell } = splitCellId(selectedCell);
  let nextBox = { ...box };
  let nextCell = { ...cell };

  if (direction === 'down') {
    if (cell.y === 2) {
      if (box.y < 2) {
        nextBox.y = (nextBox.y + 1) as PuzzleRowOrColumn;
        nextCell.y = 0;
      }
    } else {
      nextCell.y = (nextCell.y + 1) as PuzzleRowOrColumn;
    }
  }

  if (direction === 'up') {
    if (cell.y === 0) {
      if (box.y > 0) {
        nextBox.y = (nextBox.y - 1) as PuzzleRowOrColumn;
        nextCell.y = 2;
      }
    } else {
      nextCell.y = (nextCell.y - 1) as PuzzleRowOrColumn;
    }
  }

  if (direction === 'left') {
    if (cell.x === 0) {
      if (box.x > 0) {
        nextBox.x = (nextBox.x - 1) as PuzzleRowOrColumn;
        nextCell.x = 2;
      }
    } else {
      nextCell.x = (nextCell.x - 1) as PuzzleRowOrColumn;
    }
  }

  if (direction === 'right') {
    if (cell.x === 2) {
      if (box.x < 2) {
        nextBox.x = (nextBox.x + 1) as PuzzleRowOrColumn;
        nextCell.x = 0;
      }
    } else {
      nextCell.x = (nextCell.x + 1) as PuzzleRowOrColumn;
    }
  }

  return calculateCellId(
    calculateBoxId(nextBox.x, nextBox.y),
    nextCell.x,
    nextCell.y
  );
};

export { calculateBoxId, calculateCellId, splitCellId, calculateNextCellId };
