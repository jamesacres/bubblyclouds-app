'use client';

import { CSSProperties, ReactNode } from 'react';

// How long a finish celebration owns the screen. Exported so each caller's
// showAnimation window always matches the overlay's own fade-out instead of
// drifting apart as two magic numbers.
export const CELEBRATION_MS = 5500;

// The celebratory default palette when a caller doesn't theme the confetti to
// its own art. Bright, party-poppers hues spread around the wheel so the rain
// reads as a generic "you did it" burst.
const DEFAULT_CONFETTI_COLORS = [
  '#f43f5e',
  '#f59e0b',
  '#facc15',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

interface RaceCelebrationOverlayProps {
  isVisible: boolean;
  // The big banner headline that slams in ("Finish!", "Complete!", …).
  title: string;
  // An optional pill under the title (a trophy badge, a "Solved!" check, …).
  badge?: ReactNode;
  // Optional content rendered under the badge (stars, totals, points) so each
  // game can compose its own middle column without the overlay knowing about
  // race- or sudoku-specific payoffs.
  belowBadge?: ReactNode;
  // Optional extra layer rendered inside the overlay (e.g. the race's victory
  // lap car) after the banner column.
  children?: ReactNode;
  // Confetti coloring. Callers can theme the rain to their own art; when
  // omitted a neutral celebratory palette is used. `checkered` turns every
  // third piece into a checkered-flag square for the race finish look.
  confettiColors?: string[];
  checkered?: boolean;
}

interface ConfettiGeometry {
  left: number;
  delayMs: number;
  durationMs: number;
  size: number;
  driftPx: number;
  spinDeg: number;
  colorIndex: number;
  isCheckered: boolean;
}

const CONFETTI_COUNT = 32;

// The fall keyframes read each piece's drift and spin from CSS custom
// properties, which CSSProperties doesn't know about by name.
type ConfettiStyle = CSSProperties & { '--drift': string; '--spin': string };

// Scattered once at module load, not per render — render must stay pure
// (react-hooks/purity), and one shared scatter per page load is
// indistinguishable to the player. Colors are applied at render from the
// caller's prop, so only the geometry (position, timing, spin) is frozen here.
const CONFETTI_GEOMETRY: ConfettiGeometry[] = Array.from(
  { length: CONFETTI_COUNT },
  (_, i) => ({
    left: (i * 100) / CONFETTI_COUNT + Math.random() * (100 / CONFETTI_COUNT),
    delayMs: Math.random() * 1600,
    durationMs: 2600 + Math.random() * 1400,
    size: 7 + Math.random() * 7,
    driftPx: Math.random() * 90 - 45,
    spinDeg: Math.random() * 900 - 450,
    colorIndex: i,
    isCheckered: i % 3 === 0,
  })
);

const confettiStyle = (
  piece: ConfettiGeometry,
  colors: string[],
  checkered: boolean
): ConfettiStyle => {
  const wearsCheckered = checkered && piece.isCheckered;
  const color = colors[piece.colorIndex % colors.length];
  return {
    left: `${piece.left}%`,
    width: piece.size,
    height: piece.size,
    borderRadius: wearsCheckered ? 1 : 2,
    '--drift': `${piece.driftPx}px`,
    '--spin': `${piece.spinDeg}deg`,
    animation: `celebration-confetti-fall ${piece.durationMs}ms linear ${piece.delayMs}ms forwards`,
    opacity: 0,
    ...(wearsCheckered
      ? {
          backgroundColor: 'rgba(255,255,255,0.95)',
          backgroundImage: `
            linear-gradient(45deg, black 25%, transparent 25%),
            linear-gradient(-45deg, black 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, black 75%),
            linear-gradient(-45deg, transparent 75%, black 75%)
          `,
          backgroundSize: '4px 4px',
          backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px',
        }
      : {
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }),
  };
};

// The generic finish-celebration overlay: a theme-colour flash, confetti rain,
// and a banner that slams the headline in before rising its extras. It is
// presentation-only (no rating prompt, no capacitor) and aria-hidden /
// pointer-events-none so it never affects a11y or interaction. Each game
// composes its own middle column (stars, totals, points) through the slots and
// layers game-specific flourishes (e.g. a victory-lap car) via children.
const RaceCelebrationOverlay = ({
  isVisible,
  title,
  badge,
  belowBadge,
  children,
  confettiColors,
  checkered = false,
}: RaceCelebrationOverlayProps) => {
  if (!isVisible) {
    return null;
  }

  const colors =
    confettiColors && confettiColors.length > 0
      ? confettiColors
      : DEFAULT_CONFETTI_COLORS;

  return (
    <div
      data-testid="race-celebration-overlay"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[110] overflow-hidden"
      style={{
        animation: `celebration-fade 500ms ease-in ${CELEBRATION_MS - 500}ms forwards`,
      }}
    >
      <style>{`
        @keyframes celebration-fade {
          to { opacity: 0; }
        }
        @keyframes celebration-flash {
          from { opacity: 0.45; }
          to { opacity: 0; }
        }
        @keyframes celebration-confetti-fall {
          0% { transform: translate3d(0, -12vh, 0) rotate(0deg); opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translate3d(var(--drift), 108vh, 0) rotate(var(--spin)); opacity: 0; }
        }
        @keyframes celebration-banner-slam {
          0% { transform: scale(2.3); opacity: 0; }
          55% { transform: scale(0.94); opacity: 1; }
          75% { transform: scale(1.03); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes celebration-banner-rise {
          from { transform: translateY(14px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-testid="race-celebration-overlay"] .celebration-motion {
            display: none !important;
          }
          [data-testid="race-celebration-overlay"] * {
            animation-duration: 0.01ms !important;
            animation-delay: 0ms !important;
          }
        }
      `}</style>

      {/* One quick theme-colour flash as the game completes */}
      <div
        className="celebration-motion absolute inset-0"
        style={{
          background: 'color-mix(in srgb, var(--theme-primary) 55%, white)',
          animation: 'celebration-flash 550ms ease-out forwards',
        }}
      />

      {/* Confetti rain */}
      {CONFETTI_GEOMETRY.map((piece, i) => (
        <div
          key={i}
          className="celebration-motion absolute top-0"
          style={confettiStyle(piece, colors, checkered)}
        />
      ))}

      {/* Victory banner: the headline slams, then the extras rise */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div
          className="flex items-center gap-2 text-6xl font-black uppercase italic tracking-tight text-white"
          style={{
            textShadow:
              '0 3px 16px rgba(0,0,0,0.6), 0 0 44px color-mix(in srgb, var(--theme-primary) 85%, transparent)',
            animation:
              'celebration-banner-slam 550ms cubic-bezier(0.2, 1.4, 0.4, 1) both',
          }}
        >
          {title}
        </div>
        {badge !== undefined && (
          <div
            style={{
              animation: 'celebration-banner-rise 400ms ease-out 350ms both',
            }}
          >
            {badge}
          </div>
        )}
        {belowBadge}
      </div>

      {children}
    </div>
  );
};

export default RaceCelebrationOverlay;
