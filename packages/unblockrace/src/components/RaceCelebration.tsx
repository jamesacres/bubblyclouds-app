'use client';

import { CSSProperties, useEffect } from 'react';
import { InAppReview } from '@capacitor-community/in-app-review';
import { Trophy } from 'lucide-react';
import { formatSecondsShort } from '../helpers/formatSecondsShort';
import { getPieceColor } from '../helpers/pieceColors';

// How long the finish celebration owns the screen. Exported so the parent's
// showAnimation window always matches the overlay's own fade-out instead of
// drifting apart as two magic numbers.
export const RACE_CELEBRATION_MS = 5500;

interface RaceCelebrationProps {
  isVisible: boolean;
  // Whole-run totals for the banner (sum of every stage, not just the last).
  totalSeconds: number;
  totalMoves: number;
  completedGamesCount?: number;
  isCapacitor?: () => boolean;
}

interface ConfettiPiece {
  left: number;
  delayMs: number;
  durationMs: number;
  size: number;
  driftPx: number;
  spinDeg: number;
  // Every third piece is a checkered-flag square; the rest wear the board's
  // own piece palette so the confetti reads as this game bursting, not a
  // generic party.
  checkered: boolean;
  color: string;
}

const CONFETTI_COUNT = 32;

// The fall keyframes read each piece's drift and spin from CSS custom
// properties, which CSSProperties doesn't know about by name.
type ConfettiStyle = CSSProperties & { '--drift': string; '--spin': string };

// Scattered once at module load, not per render — render must stay pure
// (react-hooks/purity), and one shared scatter per page load is
// indistinguishable to the player.
const CONFETTI_PIECES: ConfettiPiece[] = Array.from(
  { length: CONFETTI_COUNT },
  (_, i) => ({
    left: (i * 100) / CONFETTI_COUNT + Math.random() * (100 / CONFETTI_COUNT),
    delayMs: Math.random() * 1600,
    durationMs: 2600 + Math.random() * 1400,
    size: 7 + Math.random() * 7,
    driftPx: Math.random() * 90 - 45,
    spinDeg: Math.random() * 900 - 450,
    checkered: i % 3 === 0,
    color: getPieceColor(1 + (i % 10)),
  })
);

const confettiStyle = (piece: ConfettiPiece): ConfettiStyle => ({
  left: `${piece.left}%`,
  width: piece.size,
  height: piece.size,
  borderRadius: piece.checkered ? 1 : 2,
  '--drift': `${piece.driftPx}px`,
  '--spin': `${piece.spinDeg}deg`,
  animation: `unblock-confetti-fall ${piece.durationMs}ms linear ${piece.delayMs}ms forwards`,
  opacity: 0,
  ...(piece.checkered
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
        background: piece.color,
        boxShadow: `0 0 8px ${piece.color}`,
      }),
});

// Unblock Race's own finish celebration — the shared @ui CelebrationAnimation
// keeps its exploding-numbers styling for sudoku (this board has no text
// cells for it to explode, and it blanks the grid while it runs). This one is
// a race podium moment: checkered/palette confetti rain, a FINISH! banner
// slam carrying the run totals, and the hero car taking a victory lap across
// the screen. The board stays visible and glowing underneath throughout.
const RaceCelebration = ({
  isVisible,
  totalSeconds,
  totalMoves,
  completedGamesCount = 0,
  isCapacitor,
}: RaceCelebrationProps) => {
  // The same rating-prompt milestones the shared celebration used, kept so
  // swapping the visuals doesn't drop the review ask.
  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const timer = setTimeout(() => {
      try {
        if (
          isCapacitor?.() &&
          [2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].includes(
            completedGamesCount
          )
        ) {
          InAppReview.requestReview().catch((e) => {
            console.error(e);
          });
        }
      } catch (e) {
        console.error('Error requesting app review:', e);
      }
    }, RACE_CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [isVisible, completedGamesCount, isCapacitor]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      data-testid="race-celebration"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[110] overflow-hidden"
      style={{
        animation: `unblock-celebrate-fade 500ms ease-in ${RACE_CELEBRATION_MS - 500}ms forwards`,
      }}
    >
      <style>{`
        @keyframes unblock-celebrate-fade {
          to { opacity: 0; }
        }
        @keyframes unblock-celebrate-flash {
          from { opacity: 0.45; }
          to { opacity: 0; }
        }
        @keyframes unblock-confetti-fall {
          0% { transform: translate3d(0, -12vh, 0) rotate(0deg); opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translate3d(var(--drift), 108vh, 0) rotate(var(--spin)); opacity: 0; }
        }
        @keyframes unblock-banner-slam {
          0% { transform: scale(2.3); opacity: 0; }
          55% { transform: scale(0.94); opacity: 1; }
          75% { transform: scale(1.03); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes unblock-banner-rise {
          from { transform: translateY(14px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes unblock-victory-lap {
          from { left: -12%; }
          to { left: 112%; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-testid="race-celebration"] .unblock-celebrate-motion {
            display: none !important;
          }
          [data-testid="race-celebration"] * {
            animation-duration: 0.01ms !important;
            animation-delay: 0ms !important;
          }
        }
      `}</style>

      {/* One quick theme-colour flash as the run completes, mirroring the
          GO! burst so the race's start and finish bookend each other */}
      <div
        className="unblock-celebrate-motion absolute inset-0"
        style={{
          background: 'color-mix(in srgb, var(--theme-primary) 55%, white)',
          animation: 'unblock-celebrate-flash 550ms ease-out forwards',
        }}
      />

      {/* Confetti rain: checkered-flag squares and piece-palette chips */}
      {CONFETTI_PIECES.map((piece, i) => (
        <div
          key={i}
          className="unblock-celebrate-motion absolute top-0"
          style={confettiStyle(piece)}
        />
      ))}

      {/* Victory banner: FINISH! slam plus the run totals */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div
          className="flex items-center gap-2 text-6xl font-black uppercase italic tracking-tight text-white"
          style={{
            textShadow:
              '0 3px 16px rgba(0,0,0,0.6), 0 0 44px color-mix(in srgb, var(--theme-primary) 85%, transparent)',
            animation:
              'unblock-banner-slam 550ms cubic-bezier(0.2, 1.4, 0.4, 1) both',
          }}
        >
          Finish!
        </div>
        <div
          className="flex items-center gap-2 rounded-full bg-zinc-900/85 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-lg ring-1 ring-white/15"
          style={{ animation: 'unblock-banner-rise 400ms ease-out 350ms both' }}
        >
          <Trophy className="h-4 w-4 text-amber-400" aria-hidden="true" />
          Run complete
        </div>
        <div
          data-testid="race-celebration-totals"
          className="font-mono text-2xl font-bold tabular-nums text-white"
          style={{
            textShadow: '0 2px 10px rgba(0,0,0,0.6)',
            animation: 'unblock-banner-rise 400ms ease-out 500ms both',
          }}
        >
          {formatSecondsShort(totalSeconds)}
          <span className="text-base font-semibold text-white/75">
            {' '}
            · {totalMoves} moves
          </span>
        </div>
      </div>

      {/* Victory lap: the hero car streaks across below the banner with a
          light trail, the same anatomy as its board self at pill scale */}
      <div
        className="unblock-celebrate-motion absolute"
        style={{
          top: '68%',
          left: '-12%',
          animation: `unblock-victory-lap 1500ms cubic-bezier(0.5, 0, 0.7, 1) 700ms both`,
        }}
      >
        <div className="relative h-6 w-12">
          {/* Trail */}
          <div
            className="absolute right-full top-1/2 h-1.5 w-28 -translate-y-1/2 rounded-full opacity-70"
            style={{
              background:
                'linear-gradient(to left, var(--theme-primary), transparent)',
              filter: 'blur(1px)',
            }}
          />
          <div
            className="relative h-full w-full rounded-md"
            style={{
              background:
                'linear-gradient(150deg, color-mix(in srgb, var(--theme-primary) 76%, white) 0%, var(--theme-primary) 45%, color-mix(in srgb, var(--theme-primary) 80%, black) 100%)',
              boxShadow:
                '0 0 18px 3px color-mix(in srgb, var(--theme-primary) 70%, transparent)',
            }}
          >
            {/* Racing stripe, cabin and headlight matching the board hero */}
            <div className="absolute inset-x-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/35" />
            <div className="absolute bottom-1 left-1/3 top-1 w-1/3 rounded-sm bg-slate-900/45" />
            <div className="absolute -right-px top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_3px_rgba(255,255,255,0.8)]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceCelebration;
