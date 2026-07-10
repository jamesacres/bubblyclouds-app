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
          borderRadius: isPrimary ? '30% / 42%' : '22%',
          // A lit-from-above gradient instead of a flat fill so pieces read
          // as physical, glowing blocks; color-mix works for the primary's
          // var(--theme-primary) too. Rivals mix towards a neutral grey at
          // the shadow end so the hero's clean saturated hue owns the board.
          background: isPrimary
            ? `linear-gradient(150deg, color-mix(in srgb, ${fill} 76%, white) 0%, ${fill} 45%, color-mix(in srgb, ${fill} 80%, black) 100%)`
            : `linear-gradient(150deg, color-mix(in srgb, ${fill} 88%, white) 0%, color-mix(in srgb, ${fill} 92%, #52525b) 45%, color-mix(in srgb, ${fill} 70%, #27272a) 100%)`,
          filter: isDragging ? 'brightness(1.12)' : undefined,
          // Soft outer glow in the piece's own hue plus a brighter inner
          // highlight edge — the neon treatment (SPEC.md §9). The hero
          // piece glows noticeably harder than the pack; rivals stay muted
          // so the eye lands on the car first.
          boxShadow: `0 0 ${isPrimary ? 26 : 7}px ${isPrimary ? 4 : 1}px color-mix(in srgb, ${fill} ${isDragging ? 75 : isPrimary ? 70 : 20}%, transparent), inset 0 2px 3px rgba(255,255,255,${isPrimary ? 0.4 : 0.28}), inset 0 -2px 4px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.12)`,
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
        {isPrimary ? (
          // Top-down car anatomy so the hero reads as "the car" at a
          // glance: wheels on the flanks, a full-length racing stripe, a
          // glass cabin over it, headlights on the leading edge and
          // taillights on the rear — all pointing the car at the exit
          <>
            {[
              { along: '12%', edge: 'top' as const },
              { along: '12%', edge: 'bottom' as const },
              { along: '70%', edge: 'top' as const },
              { along: '70%', edge: 'bottom' as const },
            ].map((wheel, i) => (
              <div
                key={i}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  ...(horizontal
                    ? {
                        left: wheel.along,
                        [wheel.edge]: '-3%',
                        width: '18%',
                        height: '10%',
                      }
                    : {
                        top: wheel.along,
                        [wheel.edge === 'top' ? 'left' : 'right']: '-3%',
                        height: '18%',
                        width: '10%',
                      }),
                  borderRadius: 999,
                  background: 'rgba(0,0,0,0.45)',
                }}
              />
            ))}
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
