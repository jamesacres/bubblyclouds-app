'use client';

import {
  PointerEvent as ReactPointerEvent,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Board, Move } from '../types/board';
import { pieceMoveRange } from '../helpers/boardMoves';

// How long a released piece takes to settle into its snapped cell (or back
// to where it started). Short enough that rapid consecutive moves never feel
// gated — a new pointerdown cancels an in-flight settle instantly.
const SETTLE_MS = 150;

// Dragging past a piece's legal range gives a little instead of stopping
// dead: the overshoot is scaled down and capped so walls and blockers feel
// like something the piece is pressed against.
const RUBBER_BAND_FACTOR = 0.18;
const RUBBER_BAND_MAX_CELLS = 0.3;

// The dragged piece lifts slightly so it reads as picked up.
const LIFT_SCALE = 'scale(1.035)';

// Board-piece dragging (SPEC.md §9) — not sudoku's zoom/pan drag. One set of
// Pointer Events handlers covers mouse and touch. During the drag the
// transform is written directly to the DOM node (no React re-render per
// pointermove); the move is committed to state on pointerup, rounded to the
// nearest whole cell step and clamped to the piece's legal range, and the
// piece then animates the residual distance into its cell (FLIP-style: the
// commit re-renders the piece at its new cell while a compensating transform
// keeps it visually at the drop point, then transitions to zero).
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
    // Last rubber-banded display offset, for the settle when the pointer is
    // cancelled without coordinates
    lastDisplayPx: number;
    // True while the release animation plays; the drag no longer tracks the
    // pointer but the element's styles are still owned by this hook
    settling: boolean;
    settleTimeout?: number;
  } | null>(null);

  const clearDragStyles = useCallback((element: HTMLElement) => {
    element.style.transform = '';
    element.style.transition = '';
    element.style.willChange = '';
    element.style.zIndex = '';
  }, []);

  const finishSettle = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    if (drag.settleTimeout !== undefined) {
      clearTimeout(drag.settleTimeout);
    }
    clearDragStyles(drag.element);
    dragRef.current = null;
    setDraggingPiece(null);
  }, [clearDragStyles]);

  const axisTransform = useCallback(
    (drag: { horizontal: boolean }, px: number, scale: string): string =>
      drag.horizontal
        ? `translate3d(${px}px, 0, 0) ${scale}`
        : `translate3d(0, ${px}px, 0) ${scale}`,
    []
  );

  // Animate the piece from its current visual offset into its resting spot.
  // The from-transform is applied with transitions off and a reflow forced so
  // the transition interpolates instead of snapping (the classic FLIP trick);
  // left/top may change in the same React commit but only transform animates.
  const startSettle = useCallback(
    (drag: NonNullable<typeof dragRef.current>, residualPx: number) => {
      drag.settling = true;
      const { element } = drag;
      element.style.transition = 'none';
      element.style.transform = axisTransform(drag, residualPx, LIFT_SCALE);
      element.getBoundingClientRect();
      element.style.transition = `transform ${SETTLE_MS}ms cubic-bezier(0.25, 1, 0.4, 1)`;
      element.style.transform = axisTransform(drag, 0, 'scale(1)');
      drag.settleTimeout = window.setTimeout(finishSettle, SETTLE_MS + 40);
    },
    [axisTransform, finishSettle]
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent, pieceIndex: number) => {
      if (disabled || !boardRef.current) {
        return;
      }
      if (dragRef.current) {
        if (!dragRef.current.settling) {
          return;
        }
        // A settle is only a visual flourish — a new grab takes over
        // immediately rather than waiting ~150ms for it to finish
        finishSettle();
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
      element.style.transform = `translate3d(0, 0, 0) ${LIFT_SCALE}`;
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
        lastDisplayPx: 0,
        settling: false,
      };
      setDraggingPiece(pieceIndex);
    },
    [board, boardRef, disabled, finishSettle]
  );

  // The drag delta clamped to the piece's legal range, in pixels.
  const clampedDeltaPx = useCallback((event: ReactPointerEvent): number => {
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

  // What the piece actually shows: the clamped delta plus a rubber-banded
  // fraction of any overshoot, so pushing against a blocker gives instead of
  // stopping dead.
  const displayDeltaPx = useCallback(
    (event: ReactPointerEvent): number => {
      const drag = dragRef.current;
      if (!drag) {
        return 0;
      }
      const delta = drag.horizontal
        ? event.clientX - drag.startX
        : event.clientY - drag.startY;
      const clamped = clampedDeltaPx(event);
      const overshoot = delta - clamped;
      const rubber =
        Math.sign(overshoot) *
        Math.min(
          Math.abs(overshoot) * RUBBER_BAND_FACTOR,
          RUBBER_BAND_MAX_CELLS * drag.cellPx
        );
      return clamped + rubber;
    },
    [clampedDeltaPx]
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.settling || event.pointerId !== drag.pointerId) {
        return;
      }
      const displayPx = displayDeltaPx(event);
      drag.lastDisplayPx = displayPx;
      drag.element.style.transform = axisTransform(drag, displayPx, LIFT_SCALE);
    },
    [axisTransform, displayDeltaPx]
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.settling || event.pointerId !== drag.pointerId) {
        return;
      }
      const steps = Math.min(
        Math.max(Math.round(clampedDeltaPx(event) / drag.cellPx), drag.min),
        drag.max
      );
      const residualPx = displayDeltaPx(event) - steps * drag.cellPx;
      if (steps !== 0) {
        onMove({ piece: drag.pieceIndex, steps });
        // A soft tick on committed moves; ignored where unsupported
        navigator.vibrate?.(10);
      }
      startSettle(drag, residualPx);
    },
    [clampedDeltaPx, displayDeltaPx, onMove, startSettle]
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.settling || event.pointerId !== drag.pointerId) {
        return;
      }
      // Snap back to the original position
      startSettle(drag, drag.lastDisplayPx);
    },
    [startSettle]
  );

  // A settle scheduled just before unmount (e.g. a stage transition right
  // after a move) would otherwise still fire and mutate the detached piece
  // element / call setDraggingPiece on a gone component.
  useEffect(() => {
    return () => {
      const drag = dragRef.current;
      if (drag?.settleTimeout !== undefined) {
        clearTimeout(drag.settleTimeout);
      }
    };
  }, []);

  return {
    draggingPiece,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
}

export { useDrag };
