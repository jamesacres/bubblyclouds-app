'use client';

import {
  PointerEvent as ReactPointerEvent,
  RefObject,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { splitCellId } from '../helpers/calculateId';

interface UseDragOptions {
  isZoomMode: boolean;
  selectedCell: string | null;
  gridRef: RefObject<HTMLDivElement | null>;
}

export const useDrag = ({
  isZoomMode,
  selectedCell,
  gridRef,
}: UseDragOptions) => {
  // State for drag functionality
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [lastPointer, setLastPointer] = useState({ x: 0, y: 0 });
  const [dragStarted, setDragStarted] = useState(false);

  // Store the zoom origin to prevent jumps during drag
  const [zoomOrigin, setZoomOrigin] = useState('center center');

  // Helper function to calculate zoom transform origin based on selected cell
  const getZoomOrigin = useCallback(
    (cellId: string) => {
      if (cellId && isZoomMode) {
        const { box, cell } = splitCellId(cellId);
        // Calculate the position of the selected cell in the 9x9 grid
        const totalX = box.x * 3 + cell.x;
        const totalY = box.y * 3 + cell.y;
        // Convert to percentage for transform-origin (center of the cell)
        const originX = ((totalX + 0.5) / 9) * 100;
        const originY = ((totalY + 0.5) / 9) * 100;
        return `${originX}% ${originY}%`;
      }
      return 'center center';
    },
    [isZoomMode]
  );

  // Update zoom origin when cell selection changes, but only if not currently dragging
  useEffect(() => {
    if (selectedCell && isZoomMode && !isDragging) {
      // Add a small delay to allow for smooth transition
      const timer = setTimeout(() => {
        setZoomOrigin(getZoomOrigin(selectedCell));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedCell, isZoomMode, isDragging, getZoomOrigin]);

  // Reset drag offset when zoom mode is disabled or cell changes
  useEffect(() => {
    if (!isZoomMode) {
      setDragOffset({ x: 0, y: 0 });
      setZoomOrigin('center center');
    }
  }, [isZoomMode, selectedCell]);

  // Drag handlers
  const handleDragStart = useCallback(
    (e: ReactPointerEvent) => {
      if (isZoomMode && selectedCell) {
        setIsDragging(true);
        setDragStarted(false);
        setLastPointer({ x: e.clientX, y: e.clientY });
      }
    },
    [isZoomMode, selectedCell]
  );

  // Global drag handlers for move and up events
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging && isZoomMode && gridRef.current) {
        const deltaX = e.clientX - lastPointer.x;
        const deltaY = e.clientY - lastPointer.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Only start actual dragging after moving at least 5 pixels
        if (!dragStarted && distance > 5) {
          setDragStarted(true);
        }

        if (dragStarted) {
          setDragOffset((prev) => {
            // Reduce movement speed for more controlled dragging
            const sensitivity = 0.5;
            const newX = prev.x + deltaX * sensitivity;
            const newY = prev.y + deltaY * sensitivity;

            // Calculate boundaries based on actual puzzle dimensions and available viewport
            const gridElement = gridRef.current;
            if (!gridElement) return { x: newX, y: newY };

            const gridRect = gridElement.getBoundingClientRect();

            // Calculate how much we can move in each direction
            const scaledWidth = gridRect.width;
            const scaledHeight = gridRect.height;

            // Simple approach: calculate how much the 1.5x scaled puzzle extends beyond viewport
            // When scaled 1.5x, the puzzle becomes 50% larger
            // So we can translate by 25% of the original size in each direction
            const originalWidth = scaledWidth / 1.5;
            const originalHeight = scaledHeight / 1.5;

            // Maximum translation to show all edges without going beyond puzzle border
            const maxOffsetX = originalWidth * 0.25; // 25% of original size
            const maxOffsetY = originalHeight * 0.25; // 25% of original size

            return {
              x: Math.max(-maxOffsetX, Math.min(maxOffsetX, newX)),
              y: Math.max(-maxOffsetY, Math.min(maxOffsetY, newY)),
            };
          });
          e.preventDefault(); // Only prevent default when actually dragging
        }

        setLastPointer({ x: e.clientX, y: e.clientY });
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (dragStarted) {
        e.preventDefault();
      }
      setIsDragging(false);
      setDragStarted(false);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, isZoomMode, dragStarted, lastPointer, gridRef]);

  return {
    isDragging,
    dragOffset,
    dragStarted,
    zoomOrigin,
    handleDragStart,
  };
};
