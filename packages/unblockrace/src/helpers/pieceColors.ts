import { ThemeColor } from '@bubblyclouds-app/ui/providers/ThemeColorProvider';
import { Board } from '../types/board';
import { pieceCells } from './piece';

// Neon-friendly hues spaced around the color wheel (SPEC.md §9). Every hue is
// a saturated mid-tone chosen to stay legible and glow convincingly on both
// the light and dark board backgrounds. Each entry lists the theme colours it
// would be mistaken for, so the hero piece's hue is never shared by a rival —
// with a blue theme no other piece may also be blue. `family` groups entries
// that read as the same colour at a glance (violet vs magenta), so the
// adjacency-aware assignment can keep look-alikes off neighbouring pieces.
type HueFamily = 'purple' | 'blue' | 'green' | 'warm' | 'red';

const PIECE_PALETTE: {
  color: string;
  family: HueFamily;
  clashes: ThemeColor[];
}[] = [
  {
    color: '#d946ef',
    family: 'purple',
    clashes: ['fuchsia', 'pink', 'purple'],
  }, // magenta
  { color: '#06b6d4', family: 'blue', clashes: ['cyan', 'sky'] }, // cyan
  { color: '#f59e0b', family: 'warm', clashes: ['amber', 'yellow', 'orange'] }, // amber
  { color: '#84cc16', family: 'green', clashes: ['lime', 'green'] }, // lime
  {
    color: '#8b5cf6',
    family: 'purple',
    clashes: ['violet', 'purple', 'indigo'],
  }, // violet
  { color: '#f43f5e', family: 'red', clashes: ['rose', 'red', 'pink'] }, // rose
  { color: '#14b8a6', family: 'green', clashes: ['teal', 'emerald'] }, // teal
  { color: '#3b82f6', family: 'blue', clashes: ['blue', 'indigo', 'sky'] }, // blue
  { color: '#f97316', family: 'warm', clashes: ['orange', 'amber', 'red'] }, // orange
  { color: '#10b981', family: 'green', clashes: ['emerald', 'green', 'teal'] }, // emerald
];

// The primary piece is the app's theme colour, not red, to stay visually
// distinct from ThinkFun's physical board (SPEC.md §1).
export const PRIMARY_PIECE_COLOR = 'var(--theme-primary)';

export const getPieceColor = (
  pieceIndex: number,
  themeColor?: ThemeColor
): string => {
  if (pieceIndex === 0) {
    return PRIMARY_PIECE_COLOR;
  }
  const palette = themeColor
    ? PIECE_PALETTE.filter((entry) => !entry.clashes.includes(themeColor))
    : PIECE_PALETTE;
  return palette[(pieceIndex - 1) % palette.length].color;
};

// Piece indexes whose cells touch orthogonally — the pairs that would be
// confusable if they wore look-alike hues.
const buildAdjacency = (board: Board): Set<number>[] => {
  const cellOwner = new Array<number>(board.width * board.height).fill(-1);
  board.pieces.forEach((piece, index) => {
    for (const cell of pieceCells(piece, board.width)) {
      cellOwner[cell] = index;
    }
  });
  const adjacency = board.pieces.map(() => new Set<number>());
  board.pieces.forEach((piece, index) => {
    for (const cell of pieceCells(piece, board.width)) {
      const row = Math.floor(cell / board.width);
      const col = cell % board.width;
      const neighbours = [
        row > 0 ? cell - board.width : -1,
        row < board.height - 1 ? cell + board.width : -1,
        col > 0 ? cell - 1 : -1,
        col < board.width - 1 ? cell + 1 : -1,
      ];
      for (const neighbour of neighbours) {
        if (neighbour < 0) {
          continue;
        }
        const owner = cellOwner[neighbour];
        if (owner !== -1 && owner !== index) {
          adjacency[index].add(owner);
        }
      }
    }
  });
  return adjacency;
};

// One colour per piece for a whole board: the hero keeps the theme colour and
// every rival gets a palette hue chosen so no two touching pieces share a hue
// family — three purple-ish blocks can no longer end up side by side.
// Deterministic for a given board and theme: pieces are coloured in index
// order, each starting from its default cycled entry and advancing to the
// first entry whose family no already-coloured neighbour uses.
export const assignPieceColors = (
  board: Board,
  themeColor?: ThemeColor
): string[] => {
  const palette = themeColor
    ? PIECE_PALETTE.filter((entry) => !entry.clashes.includes(themeColor))
    : PIECE_PALETTE;
  const adjacency = buildAdjacency(board);
  const families = new Array<HueFamily | undefined>(board.pieces.length);
  return board.pieces.map((_, index) => {
    if (index === 0) {
      return PRIMARY_PIECE_COLOR;
    }
    const neighbourFamilies = new Set<HueFamily>();
    for (const neighbour of adjacency[index]) {
      const family = families[neighbour];
      if (family) {
        neighbourFamilies.add(family);
      }
    }
    const start = (index - 1) % palette.length;
    let chosen = palette[start];
    for (let offset = 0; offset < palette.length; offset += 1) {
      const candidate = palette[(start + offset) % palette.length];
      if (!neighbourFamilies.has(candidate.family)) {
        chosen = candidate;
        break;
      }
    }
    families[index] = chosen.family;
    return chosen.color;
  });
};
