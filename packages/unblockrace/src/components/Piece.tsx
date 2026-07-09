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
  onPointerDown?: (event: ReactPointerEvent, pieceIndex: number) => void;
  onPointerMove?: (event: ReactPointerEvent) => void;
  onPointerUp?: (event: ReactPointerEvent) => void;
  onPointerCancel?: (event: ReactPointerEvent) => void;
}

const Piece = ({
  piece,
  index,
  width,
  height,
  color,
  isDragging,
  isExiting,
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
          borderRadius: '22%',
          // A lit-from-above gradient instead of a flat fill so pieces read
          // as physical, glowing blocks; color-mix works for the primary's
          // var(--theme-primary) too
          background: `linear-gradient(150deg, color-mix(in srgb, ${fill} ${isPrimary ? 76 : 84}%, white) 0%, ${fill} 45%, color-mix(in srgb, ${fill} ${isPrimary ? 80 : 74}%, black) 100%)`,
          filter: isDragging ? 'brightness(1.12)' : undefined,
          // Soft outer glow in the piece's own hue plus a brighter inner
          // highlight edge — the neon treatment (SPEC.md §9). The hero
          // piece glows noticeably harder than the pack; rivals stay muted
          // so the eye lands on the car first.
          boxShadow: `0 0 ${isPrimary ? 26 : 9}px ${isPrimary ? 4 : 1}px color-mix(in srgb, ${fill} ${isDragging ? 75 : isPrimary ? 70 : 28}%, transparent), inset 0 2px 3px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.12)`,
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
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)',
          }}
        />
        {isPrimary ? (
          // Headlights on the leading edge plus a double racing stripe down
          // the length: the hero piece points at the exit and reads as "the
          // car" even next to same-hue rivals
          <>
            {[38, 54].map((stripeTop) => (
              <div
                key={stripeTop}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '8%',
                  right: '20%',
                  top: `${stripeTop}%`,
                  height: '8%',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: '6%',
                top: '24%',
                width: '9%',
                aspectRatio: '1',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 0 8px 2px rgba(255,255,255,0.8)',
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: '6%',
                bottom: '24%',
                width: '9%',
                aspectRatio: '1',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 0 8px 2px rgba(255,255,255,0.8)',
              }}
            />
          </>
        ) : (
          // Grip dots along the movement axis, so a piece's drag direction
          // is readable before it is touched — quieter than the hero's
          // stripes so rivals stay background players
          <>
            {[36, 64].map((position) => (
              <div
                key={position}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: horizontal ? `${position}%` : '50%',
                  top: horizontal ? '50%' : `${position}%`,
                  transform: 'translate(-50%, -50%)',
                  width: horizontal ? `${16 / piece.size}%` : '16%',
                  aspectRatio: '1',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.24)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default Piece;
