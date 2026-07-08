'use client';

import {
  PointerEvent as ReactPointerEvent,
  RefObject,
  useCallback,
  useRef,
  useState,
} from 'react';
import { Board, Move } from '../types/board';
import { pieceMoveRange } from '../helpers/boardMoves';

// Board-piece dragging (SPEC.md §9) — not sudoku's zoom/pan drag. One set of
// Pointer Events handlers covers mouse and touch. During the drag the
// transform is written directly to the DOM node (no React re-render per
// pointermove); the move is only committed to state on pointerup, rounded to
// the nearest whole cell step and clamped to the piece's legal range.
function useDrag({
  boardRef,
  board,
  onMove,
  disabled,
}: {
  boardRef: RefObject<HTMLDivElement | null>;
  board: Board;
  onMove: (move: Move) => void;
  disabled?: boolean;
}) {
  const [draggingPiece, setDraggingPiece] = useState<number | null>(null);

  const dragRef = useRef<{
    pieceIndex: number;
    pointerId: number;
    startX: number;
    startY: number;
    min: number;
    max: number;
    horizontal: boolean;
    cellPx: number;
    element: HTMLElement;
  } | null>(null);

  const clearDragStyles = useCallback((element: HTMLElement) => {
    element.style.transform = '';
    element.style.willChange = '';
    element.style.zIndex = '';
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent, pieceIndex: number) => {
      if (disabled || dragRef.current || !boardRef.current) {
        return;
      }
      const piece = board.pieces[pieceIndex];
      if (!piece) {
        return;
      }
      const element = event.currentTarget as HTMLElement;
      const { min, max } = pieceMoveRange(board, pieceIndex);
      const cellPx = boardRef.current.offsetWidth / board.width;
      if (!cellPx) {
        return;
      }
      // Keep tracking even if the pointer leaves the piece element
      element.setPointerCapture(event.pointerId);
      element.style.willChange = 'transform';
      element.style.zIndex = '10';
      dragRef.current = {
        pieceIndex,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        min,
        max,
        horizontal: piece.orientation === 'horizontal',
        cellPx,
        element,
      };
      setDraggingPiece(pieceIndex);
    },
    [board, boardRef, disabled]
  );

  const dragDeltaPx = useCallback((event: ReactPointerEvent): number => {
    const drag = dragRef.current;
    if (!drag) {
      return 0;
    }
    // Constrain movement to the piece's single axis and clamp to the
    // legal range in pixels
    const delta = drag.horizontal
      ? event.clientX - drag.startX
      : event.clientY - drag.startY;
    return Math.min(
      Math.max(delta, drag.min * drag.cellPx),
      drag.max * drag.cellPx
    );
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      const delta = dragDeltaPx(event);
      drag.element.style.transform = drag.horizontal
        ? `translate3d(${delta}px, 0, 0)`
        : `translate3d(0, ${delta}px, 0)`;
    },
    [dragDeltaPx]
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      const steps = Math.min(
        Math.max(Math.round(dragDeltaPx(event) / drag.cellPx), drag.min),
        drag.max
      );
      clearDragStyles(drag.element);
      dragRef.current = null;
      setDraggingPiece(null);
      if (steps !== 0) {
        onMove({ piece: drag.pieceIndex, steps });
      }
    },
    [clearDragStyles, dragDeltaPx, onMove]
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      // Snap back to the original position
      clearDragStyles(drag.element);
      dragRef.current = null;
      setDraggingPiece(null);
    },
    [clearDragStyles]
  );

  return {
    draggingPiece,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
}

export { useDrag };
