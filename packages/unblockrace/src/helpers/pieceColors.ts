// Neon-friendly hues spaced around the color wheel (SPEC.md §9): each
// non-primary piece gets its own palette entry by piece index, cycling if
// there are more pieces than entries. Assignment is deterministic (piece B
// is always palette color 0 for a given board). Every hue is a saturated
// mid-tone chosen to stay legible and glow convincingly on both the light
// and dark board backgrounds.
const PIECE_PALETTE = [
  '#d946ef', // magenta
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#84cc16', // lime
  '#8b5cf6', // violet
  '#f43f5e', // rose
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#f97316', // orange
  '#10b981', // emerald
];

// The primary piece is the app's theme colour, not red, to stay visually
// distinct from ThinkFun's physical board (SPEC.md §1).
export const PRIMARY_PIECE_COLOR = 'var(--theme-primary)';

export const getPieceColor = (pieceIndex: number): string =>
  pieceIndex === 0
    ? PRIMARY_PIECE_COLOR
    : PIECE_PALETTE[(pieceIndex - 1) % PIECE_PALETTE.length];
