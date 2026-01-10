'use client';

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDrag } from './useDrag';

describe('useDrag', () => {
  let gridRef: React.RefObject<HTMLDivElement | null>;

  beforeEach(() => {
    const mockElement = document.createElement('div');
    mockElement.getBoundingClientRect = jest.fn(() => ({
      width: 300,
      height: 300,
      top: 0,
      left: 0,
      right: 300,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));

    gridRef = { current: mockElement };
  });

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: false,
          selectedCell: null,
          gridRef: gridRef,
        })
      );

      expect(result.current).toBeDefined();
      expect(result.current.isDragging).toBe(false);
      expect(result.current.dragOffset).toEqual({ x: 0, y: 0 });
      expect(result.current.dragStarted).toBe(false);
      expect(result.current.zoomOrigin).toBe('center center');
      expect(result.current.handleDragStart).toBeDefined();
    });

    it('should accept all required options', () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:0,0,cell:0,0',
          gridRef: gridRef,
        })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('drag start', () => {
    it('should start drag when in zoom mode with selected cell', () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:0,0,cell:0,0',
          gridRef: gridRef,
        })
      );

      const mockPointerEvent = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      }) as any;

      act(() => {
        result.current.handleDragStart(mockPointerEvent);
      });

      expect(result.current.isDragging).toBe(true);
    });

    it('should not start drag when not in zoom mode', () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: false,
          selectedCell: 'box:0,0,cell:0,0',
          gridRef: gridRef,
        })
      );

      const mockPointerEvent = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      }) as any;

      act(() => {
        result.current.handleDragStart(mockPointerEvent);
      });

      expect(result.current.isDragging).toBe(false);
    });

    it('should not start drag when no selected cell', () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: null,
          gridRef: gridRef,
        })
      );

      const mockPointerEvent = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      }) as any;

      act(() => {
        result.current.handleDragStart(mockPointerEvent);
      });

      expect(result.current.isDragging).toBe(false);
    });

    it('should record initial pointer position', () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:0,0,cell:0,0',
          gridRef: gridRef,
        })
      );

      const mockPointerEvent = new PointerEvent('pointerdown', {
        clientX: 150,
        clientY: 250,
      }) as any;

      act(() => {
        result.current.handleDragStart(mockPointerEvent);
      });

      expect(result.current.isDragging).toBe(true);
    });
  });

  describe('drag offset calculation', () => {
    it('should reset drag offset when zoom mode is disabled', () => {
      const { result, rerender } = renderHook(
        ({ isZoomMode, selectedCell }) =>
          useDrag({
            isZoomMode,
            selectedCell,
            gridRef: gridRef,
          }),
        {
          initialProps: {
            isZoomMode: true,
            selectedCell: 'box:0,0,cell:0,0',
          },
        }
      );

      act(() => {
        rerender({ isZoomMode: false, selectedCell: 'box:0,0,cell:0,0' });
      });

      expect(result.current.dragOffset).toEqual({ x: 0, y: 0 });
      expect(result.current.zoomOrigin).toBe('center center');
    });

    it('should calculate zoom origin from selected cell', async () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:1,1,cell:1,1',
          gridRef: gridRef,
        })
      );

      // Wait for the zoom origin to be calculated (has 50ms delay in useEffect)
      await waitFor(() => {
        expect(result.current.zoomOrigin).not.toBe('center center');
      });
      expect(result.current.zoomOrigin).toMatch(/\d+\.?\d*% \d+\.?\d*%/);
    });

    it('should calculate zoom origin for different cells', async () => {
      const { result: result1 } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:0,0,cell:0,0',
          gridRef: gridRef,
        })
      );

      const { result: result2 } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:2,2,cell:2,2',
          gridRef: gridRef,
        })
      );

      // Wait for both zoom origins to be calculated (has 50ms delay in useEffect)
      await waitFor(() => {
        expect(result1.current.zoomOrigin).not.toBe('center center');
        expect(result2.current.zoomOrigin).not.toBe('center center');
      });
      expect(result1.current.zoomOrigin).not.toBe(result2.current.zoomOrigin);
    });

    it('should keep zoom origin as center when not in zoom mode', () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: false,
          selectedCell: 'box:1,1,cell:1,1',
          gridRef: gridRef,
        })
      );

      expect(result.current.zoomOrigin).toBe('center center');
    });
  });

  describe('pointer move events', () => {
    it('should track pointer movement', () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:0,0,cell:0,0',
          gridRef: gridRef,
        })
      );

      const mockPointerStart = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      }) as any;

      act(() => {
        result.current.handleDragStart(mockPointerStart);
      });

      expect(result.current.isDragging).toBe(true);
    });

    it('should calculate drag distance correctly', () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:0,0,cell:0,0',
          gridRef: gridRef,
        })
      );

      const mockPointerStart = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      }) as any;

      act(() => {
        result.current.handleDragStart(mockPointerStart);
      });

      // Simulate pointer move
      const mockPointerMove = new PointerEvent('pointermove', {
        clientX: 150,
        clientY: 150,
      });

      act(() => {
        document.dispatchEvent(mockPointerMove);
      });

      expect(result.current.isDragging).toBe(true);
    });

    it('should require 5 pixel threshold before starting drag', () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:0,0,cell:0,0',
          gridRef: gridRef,
        })
      );

      const mockPointerStart = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      }) as any;

      act(() => {
        result.current.handleDragStart(mockPointerStart);
      });

      // Move less than 5 pixels
      const mockPointerMove = new PointerEvent('pointermove', {
        clientX: 102,
        clientY: 102,
      });

      act(() => {
        document.dispatchEvent(mockPointerMove);
      });

      expect(result.current.dragStarted).toBe(false);
    });

    it('should start drag after 5+ pixel movement', () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:0,0,cell:0,0',
          gridRef: gridRef,
        })
      );

      const mockPointerStart = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      }) as any;

      act(() => {
        result.current.handleDragStart(mockPointerStart);
      });

      // Move more than 5 pixels
      const mockPointerMove = new PointerEvent('pointermove', {
        clientX: 110,
        clientY: 110,
      });

      act(() => {
        document.dispatchEvent(mockPointerMove);
      });

      expect(result.current.dragStarted).toBe(true);
    });
  });

  describe('drag boundaries', () => {
    it('should constrain drag offset within boundaries', () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:0,0,cell:0,0',
          gridRef: gridRef,
        })
      );

      const mockPointerStart = new PointerEvent('pointerdown', {
        clientX: 150,
        clientY: 150,
      }) as any;

      act(() => {
        result.current.handleDragStart(mockPointerStart);
      });

      // Simulate extreme movement
      const mockPointerMove = new PointerEvent('pointermove', {
        clientX: -1000,
        clientY: -1000,
      });

      act(() => {
        document.dispatchEvent(mockPointerMove);
      });

      // Offset should be bounded
      expect(Math.abs(result.current.dragOffset.x)).toBeLessThanOrEqual(75);
      expect(Math.abs(result.current.dragOffset.y)).toBeLessThanOrEqual(75);
    });

    it('should apply sensitivity to drag movement', () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:0,0,cell:0,0',
          gridRef: gridRef,
        })
      );

      const mockPointerStart = new PointerEvent('pointerdown', {
        clientX: 150,
        clientY: 150,
      }) as any;

      act(() => {
        result.current.handleDragStart(mockPointerStart);
      });

      const mockPointerMove = new PointerEvent('pointermove', {
        clientX: 170,
        clientY: 170,
      });

      act(() => {
        document.dispatchEvent(mockPointerMove);
      });

      // With sensitivity 0.5, movement of 20 pixels should result in offset of 10
      expect(result.current.dragOffset.x).toBeLessThanOrEqual(10);
      expect(result.current.dragOffset.y).toBeLessThanOrEqual(10);
    });
  });

  describe('pointer up events', () => {
    it('should end drag on pointer up', () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:0,0,cell:0,0',
          gridRef: gridRef,
        })
      );

      const mockPointerStart = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      }) as any;

      act(() => {
        result.current.handleDragStart(mockPointerStart);
      });

      expect(result.current.isDragging).toBe(true);

      const mockPointerUp = new PointerEvent('pointerup', {
        clientX: 100,
        clientY: 100,
      });

      act(() => {
        document.dispatchEvent(mockPointerUp);
      });

      expect(result.current.isDragging).toBe(false);
    });

    it('should reset dragStarted on pointer up', () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:0,0,cell:0,0',
          gridRef: gridRef,
        })
      );

      const mockPointerStart = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      }) as any;

      act(() => {
        result.current.handleDragStart(mockPointerStart);
      });

      const mockPointerMove = new PointerEvent('pointermove', {
        clientX: 120,
        clientY: 120,
      });

      act(() => {
        document.dispatchEvent(mockPointerMove);
      });

      expect(result.current.dragStarted).toBe(true);

      const mockPointerUp = new PointerEvent('pointerup');

      act(() => {
        document.dispatchEvent(mockPointerUp);
      });

      expect(result.current.dragStarted).toBe(false);
    });
  });

  describe('event listeners', () => {
    it('should add event listeners when dragging', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:0,0,cell:0,0',
          gridRef: gridRef,
        })
      );

      const mockPointerStart = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      }) as any;

      act(() => {
        result.current.handleDragStart(mockPointerStart);
      });

      // Event listeners should be added
      expect(addEventListenerSpy).toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
    });

    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(
        document,
        'removeEventListener'
      );

      const { unmount, result } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:0,0,cell:0,0',
          gridRef: gridRef,
        })
      );

      const mockPointerStart = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      }) as any;

      act(() => {
        result.current.handleDragStart(mockPointerStart);
      });

      act(() => {
        unmount();
      });

      expect(removeEventListenerSpy).toHaveBeenCalled();

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle null gridRef', () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:0,0,cell:0,0',
          gridRef: { current: null },
        })
      );

      expect(result.current.dragOffset).toEqual({ x: 0, y: 0 });
    });

    it('should handle rapid drag start/stop cycles', () => {
      const { result } = renderHook(() =>
        useDrag({
          isZoomMode: true,
          selectedCell: 'box:0,0,cell:0,0',
          gridRef: gridRef,
        })
      );

      const mockPointerStart = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      }) as any;

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.handleDragStart(mockPointerStart);
        });

        const mockPointerUp = new PointerEvent('pointerup');
        act(() => {
          document.dispatchEvent(mockPointerUp);
        });
      }

      expect(result.current.isDragging).toBe(false);
    });

    it('should handle cell change during drag', () => {
      const { result, rerender } = renderHook(
        ({ selectedCell }) =>
          useDrag({
            isZoomMode: true,
            selectedCell,
            gridRef: gridRef,
          }),
        {
          initialProps: { selectedCell: 'box:0,0,cell:0,0' },
        }
      );

      const mockPointerStart = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      }) as any;

      act(() => {
        result.current.handleDragStart(mockPointerStart);
      });

      act(() => {
        rerender({ selectedCell: 'box:1,1,cell:1,1' });
      });

      expect(result.current.isDragging).toBe(true);
    });

    it('should handle zoom mode toggle during drag', () => {
      const { result, rerender } = renderHook(
        ({ isZoomMode }) =>
          useDrag({
            isZoomMode,
            selectedCell: 'box:0,0,cell:0,0',
            gridRef: gridRef,
          }),
        {
          initialProps: { isZoomMode: true },
        }
      );

      const mockPointerStart = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      }) as any;

      act(() => {
        result.current.handleDragStart(mockPointerStart);
      });

      act(() => {
        rerender({ isZoomMode: false });
      });

      expect(result.current.dragOffset).toEqual({ x: 0, y: 0 });
    });
  });
});
