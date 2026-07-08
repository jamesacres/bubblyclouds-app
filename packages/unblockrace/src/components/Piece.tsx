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
  const color = getPieceColor(index);
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
          background: color,
          filter: isDragging ? 'brightness(1.1)' : undefined,
          // Soft outer glow in the piece's own hue plus a brighter inner
          // highlight edge — the neon treatment (SPEC.md §9)
          boxShadow: `0 0 ${isPrimary ? 18 : 12}px 2px color-mix(in srgb, ${color} ${isDragging ? 70 : 50}%, transparent), inset 0 2px 3px rgba(255,255,255,0.35), inset 0 -2px 3px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.1)`,
        }}
      />
    </div>
  );
};

export default Piece;
