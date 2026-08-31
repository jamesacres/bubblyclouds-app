import { ThemeColor } from '@bubblyclouds-app/ui/providers/ThemeColorProvider';

// Opponent kart hues, same spacing rationale as the board's piece palette
// (pieceColors.ts): saturated Tailwind mid-tones that stay legible in both
// themes. Each entry lists the theme colours it would be mistaken for, so an
// opponent never wears the same hue as the current player's themed kart.
const OPPONENT_PALETTE: { className: string; clashes: ThemeColor[] }[] = [
  { className: 'bg-fuchsia-500', clashes: ['fuchsia', 'pink', 'purple'] },
  { className: 'bg-cyan-500', clashes: ['cyan', 'sky', 'blue'] },
  { className: 'bg-amber-500', clashes: ['amber', 'yellow', 'orange'] },
  { className: 'bg-lime-500', clashes: ['lime', 'green'] },
  { className: 'bg-violet-500', clashes: ['violet', 'purple', 'indigo'] },
  { className: 'bg-rose-500', clashes: ['rose', 'red', 'pink'] },
  { className: 'bg-teal-500', clashes: ['teal', 'emerald'] },
  { className: 'bg-emerald-500', clashes: ['emerald', 'green', 'teal'] },
];

// The current player always races in the app's theme colour rather than a
// fixed hue, so their kart matches the rest of the themed UI.
export const CURRENT_PLAYER_CAR_COLOR = 'bg-theme-primary';

/**
 * Get the kart colour class for a race participant. The current player
 * always gets the theme colour; opponents cycle through a palette filtered
 * to exclude any hue that would be confused with the active theme colour.
 */
export const getRaceCarColor = (
  userId: string,
  allUserIds: string[],
  isCurrentUser: boolean,
  themeColor?: ThemeColor
): string => {
  if (isCurrentUser) {
    return CURRENT_PLAYER_CAR_COLOR;
  }

  const palette = themeColor
    ? OPPONENT_PALETTE.filter((entry) => !entry.clashes.includes(themeColor))
    : OPPONENT_PALETTE;

  const userIndex = allUserIds.indexOf(userId);
  if (userIndex === -1) {
    return palette[0].className;
  }

  return palette[userIndex % palette.length].className;
};
