'use client';

import { PointerEvent as ReactPointerEvent } from 'react';
import { Piece as PieceType } from '../types/board';
import { pieceCol, pieceRow } from '../helpers/piece';
import { getPieceColor } from '../helpers/pieceColors';

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

  // Slide the primary piece the remaining cells plus its own length so it
  // fully clears the grid edge; transform % is relative to the piece width
  const exitTransform = isExiting
    ? `translate3d(${((width - col) / spanX) * 100}%, 0, 0)`
    : undefined;

  return (
    <div
      data-testid={`piece-${String.fromCharCode(65 + index)}`}
      className={`absolute select-none ${onPointerDown ? 'cursor-grab active:cursor-grabbing' : ''} ${
        isExiting ? 'transition-transform duration-500 ease-in' : ''
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
