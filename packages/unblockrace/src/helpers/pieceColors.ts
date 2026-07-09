import { ThemeColor } from '@bubblyclouds-app/ui/providers/ThemeColorProvider';

// Neon-friendly hues spaced around the color wheel (SPEC.md §9): each
// non-primary piece gets its own palette entry by piece index, cycling if
// there are more pieces than entries. Assignment is deterministic for a given
// theme (piece B is always the first non-clashing entry). Every hue is a
// saturated mid-tone chosen to stay legible and glow convincingly on both the
// light and dark board backgrounds. Each entry lists the theme colours it
// would be mistaken for, so the hero piece's hue is never shared by a rival —
// with a blue theme no other piece may also be blue.
const PIECE_PALETTE: { color: string; clashes: ThemeColor[] }[] = [
  { color: '#d946ef', clashes: ['fuchsia', 'pink', 'purple'] }, // magenta
  { color: '#06b6d4', clashes: ['cyan', 'sky'] }, // cyan
  { color: '#f59e0b', clashes: ['amber', 'yellow', 'orange'] }, // amber
  { color: '#84cc16', clashes: ['lime', 'green'] }, // lime
  { color: '#8b5cf6', clashes: ['violet', 'purple', 'indigo'] }, // violet
  { color: '#f43f5e', clashes: ['rose', 'red', 'pink'] }, // rose
  { color: '#14b8a6', clashes: ['teal', 'emerald'] }, // teal
  { color: '#3b82f6', clashes: ['blue', 'indigo', 'sky'] }, // blue
  { color: '#f97316', clashes: ['orange', 'amber', 'red'] }, // orange
  { color: '#10b981', clashes: ['emerald', 'green', 'teal'] }, // emerald
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
