'use client';

import { PointerEvent as ReactPointerEvent, useEffect, useState } from 'react';
import { Piece as PieceType } from '../types/board';
import { pieceCol, pieceRow } from '../helpers/piece';
import { getPieceColor } from '../helpers/pieceColors';

// How long the primary piece takes to slide off the grid edge on a win.
// Exported so the stage-transition orchestrator (UnblockRace) can chain the
// slide-to-next-puzzle immediately after, from one shared value instead of a
// magic number that can drift out of sync.
export const EXIT_ANIMATION_MS = 550;

interface PieceProps {
  piece: PieceType;
  index: number;
  width: number;
  height: number;
  // Resolved fill colour (theme-aware, from Board). Falls back to the
  // theme-agnostic palette when rendered standalone.
  color?: string;
  isDragging?: boolean;
  // Win animation: the primary piece continues its slide fully off the
  // right edge of the grid (SPEC.md §9)
  isExiting?: boolean;
  // Staggered pop-in when a stage arrives; undefined skips the entrance
  // (static transition boards, reduced-motion handled by Board's media rule).
  entranceDelayMs?: number;
  onPointerDown?: (event: ReactPointerEvent, pieceIndex: number) => void;
  onPointerMove?: (event: ReactPointerEvent) => void;
  onPointerUp?: (event: ReactPointerEvent) => void;
  onPointerCancel?: (event: ReactPointerEvent) => void;
}

// Wheel offsets along the vehicle's long axis: two axles for a car, three
// for the size-3 rigs, so every rival reads as traffic at a glance.
const wheelPositions = (size: number): string[] =>
  size >= 3 ? ['7%', '43%', '79%'] : ['12%', '70%'];

const Piece = ({
  piece,
  index,
  width,
  height,
  color,
  isDragging,
  isExiting,
  entranceDelayMs,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: PieceProps) => {
  const row = pieceRow(piece, width);
  const col = pieceCol(piece, width);
  const horizontal = piece.orientation === 'horizontal';
  const spanX = horizontal ? piece.size : 1;
  const spanY = horizontal ? 1 : piece.size;
  const fill = color ?? getPieceColor(index);
  const isPrimary = index === 0;

  // The primary piece commits to its resting (solved) cell in the same
  // render that isExiting flips true — the drag handler clears the mid-drag
  // transform at the same moment. A CSS transition needs a painted "from"
  // frame to interpolate against; without one the piece snaps straight to
  // the exit. Defer the exit transform one frame so the resting cell paints
  // first, then the slide animates from there.
  const [exitStarted, setExitStarted] = useState(false);
  useEffect(() => {
    if (!isExiting) {
      return;
    }
    const frame = requestAnimationFrame(() => setExitStarted(true));
    return () => cancelAnimationFrame(frame);
  }, [isExiting]);

  // Slide the primary piece the remaining cells plus its own length so it
  // fully clears the grid edge; transform % is relative to the piece width.
  const exitTransform =
    isExiting && exitStarted
      ? `translate3d(${((width - col) / spanX) * 100}%, 0, 0)`
      : undefined;

  return (
    <div
      data-testid={`piece-${String.fromCharCode(65 + index)}`}
      className={`absolute select-none ${onPointerDown ? 'cursor-grab active:cursor-grabbing' : ''} ${
        isExiting ? 'transition-transform ease-in' : ''
      }`}
      style={{
        left: `${(col / width) * 100}%`,
        top: `${(row / height) * 100}%`,
        width: `${(spanX / width) * 100}%`,
        height: `${(spanY / height) * 100}%`,
        // Mobile browsers must not scroll/zoom the page in response to a
        // piece drag; set statically so the very first drag tracks too
        touchAction: onPointerDown ? 'none' : undefined,
        transform: exitTransform,
        transitionDuration: isExiting ? `${EXIT_ANIMATION_MS}ms` : undefined,
      }}
      onPointerDown={
        onPointerDown ? (event) => onPointerDown(event, index) : undefined
      }
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div
        style={{
          position: 'absolute',
          inset: '6%',
          borderRadius: isPrimary ? '30% / 42%' : '26% / 34%',
          // A lit-from-above gradient instead of a flat fill so pieces read
          // as physical, glowing blocks; color-mix works for the primary's
          // var(--theme-primary) too. Rivals mix towards a neutral grey at
          // the shadow end so the hero's clean saturated hue owns the board.
          background: isPrimary
            ? `linear-gradient(150deg, color-mix(in srgb, ${fill} 76%, white) 0%, ${fill} 45%, color-mix(in srgb, ${fill} 80%, black) 100%)`
            : `linear-gradient(150deg, color-mix(in srgb, ${fill} 88%, white) 0%, color-mix(in srgb, ${fill} 92%, #52525b) 45%, color-mix(in srgb, ${fill} 70%, #27272a) 100%)`,
          // Grab feedback is a physical lift — brighter, slightly scaled and
          // casting a drop shadow — so the piece feels picked up, not tinted
          filter: isDragging
            ? 'brightness(1.12) drop-shadow(0 6px 10px rgba(0,0,0,0.35))'
            : undefined,
          transform: isDragging ? 'scale(1.04)' : undefined,
          transition: 'transform 150ms ease-out, filter 150ms ease-out',
          // Soft outer glow in the piece's own hue plus a brighter inner
          // highlight edge — the neon treatment (SPEC.md §9). The hero
          // piece glows noticeably harder than the pack; rivals stay muted
          // so the eye lands on the car first.
          boxShadow: `0 0 ${isPrimary ? 26 : 7}px ${isPrimary ? 4 : 1}px color-mix(in srgb, ${fill} ${isDragging ? 75 : isPrimary ? 70 : 20}%, transparent), inset 0 2px 3px rgba(255,255,255,${isPrimary ? 0.4 : 0.28}), inset 0 -2px 4px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.12)`,
          animation:
            entranceDelayMs !== undefined
              ? `unblock-piece-enter 340ms cubic-bezier(0.34, 1.4, 0.5, 1) ${entranceDelayMs}ms both`
              : undefined,
        }}
      >
        {/* Glass highlight across the top edge */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '42%',
            borderRadius: '22% 22% 40% 40%',
            background: `linear-gradient(to bottom, rgba(255,255,255,${isPrimary ? 0.3 : 0.2}), transparent)`,
          }}
        />
        {/* Wheels on the flanks for every vehicle — the board is traffic,
            not dominoes. Rivals' wheels sit fainter than the hero's so the
            pack stays background players. */}
        {wheelPositions(piece.size).flatMap((along) =>
          (['top', 'bottom'] as const).map((edge) => (
            <div
              key={`${along}-${edge}`}
              aria-hidden="true"
              style={{
                position: 'absolute',
                ...(horizontal
                  ? {
                      left: along,
                      [edge]: '-3%',
                      width: `${36 / piece.size}%`,
                      height: '10%',
                    }
                  : {
                      top: along,
                      [edge === 'top' ? 'left' : 'right']: '-3%',
                      height: `${36 / piece.size}%`,
                      width: '10%',
                    }),
                borderRadius: 999,
                background: isPrimary ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.4)',
                // A faint light rim so the tires still read against the dark
                // board sockets — without it the "traffic" read is lost in
                // dark mode
                boxShadow: `0 0 0 1px rgba(255,255,255,${isPrimary ? 0.16 : 0.12})`,
              }}
            />
          ))
        )}
        {isPrimary ? (
          // Top-down car anatomy so the hero reads as "the car" at a
          // glance: a full-length racing stripe, a glass cabin over it,
          // headlights on the leading edge and taillights on the rear —
          // all pointing the car at the exit
          <>
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                ...(horizontal
                  ? { left: '4%', right: '4%', top: '42%', height: '16%' }
                  : { top: '4%', bottom: '4%', left: '42%', width: '16%' }),
                borderRadius: 999,
                background: 'rgba(255,255,255,0.35)',
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                ...(horizontal
                  ? { left: '34%', width: '30%', top: '16%', bottom: '16%' }
                  : { top: '34%', height: '30%', left: '16%', right: '16%' }),
                borderRadius: '26%',
                background:
                  'linear-gradient(150deg, rgba(15,23,42,0.55), rgba(15,23,42,0.35))',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.35)',
              }}
            />
            {[26, 74].map((across) => (
              <div
                key={`headlight-${across}`}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  ...(horizontal
                    ? { right: '4%', top: `${across}%` }
                    : { bottom: '4%', left: `${across}%` }),
                  transform: horizontal
                    ? 'translateY(-50%)'
                    : 'translateX(-50%)',
                  width: horizontal ? `${10 / piece.size}%` : '10%',
                  aspectRatio: '1',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  boxShadow:
                    '0 0 10px 3px rgba(255,255,255,0.85), 0 0 22px 6px rgba(255,255,240,0.35)',
                }}
              />
            ))}
            {[30, 70].map((across) => (
              <div
                key={`taillight-${across}`}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  ...(horizontal
                    ? { left: '4.5%', top: `${across}%` }
                    : { top: '4.5%', left: `${across}%` }),
                  transform: horizontal
                    ? 'translateY(-50%)'
                    : 'translateX(-50%)',
                  width: horizontal ? `${7 / piece.size}%` : '7%',
                  aspectRatio: '1',
                  borderRadius: '50%',
                  background: '#f87171',
                  boxShadow: '0 0 6px 1px rgba(248,113,113,0.8)',
                }}
              />
            ))}
          </>
        ) : (
          // Rival glass: a car gets a front and a rear windshield band so
          // its top reads as a car roof at a glance (one centred canopy
          // used to read as a hole punched in the piece); the size-3 rigs
          // keep a row of bus windows. Quieter than the hero's chrome —
          // no lights, dimmer glass — so rivals read as parked traffic.
          <>
            {(piece.size >= 3 ? ['12%', '42%', '72%'] : ['16%', '66%']).map(
              (along) => (
                <div
                  key={`cabin-${along}`}
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    ...(horizontal
                      ? {
                          left: along,
                          width: piece.size >= 3 ? '16%' : '18%',
                          top: '20%',
                          bottom: '20%',
                        }
                      : {
                          top: along,
                          height: piece.size >= 3 ? '16%' : '18%',
                          left: '20%',
                          right: '20%',
                        }),
                    borderRadius: '30%',
                    background:
                      'linear-gradient(150deg, rgba(15,23,42,0.42), rgba(15,23,42,0.24))',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)',
                  }}
                />
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Piece;
