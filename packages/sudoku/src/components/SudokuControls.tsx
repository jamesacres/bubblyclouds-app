import {
  ChevronDown,
  ChevronUp,
  Copy,
  CornerUpLeft,
  CornerUpRight,
  Delete,
  Edit,
  Edit2,
  Eye,
  Grid,
  Minus,
  RefreshCw,
  Square,
  Unlock,
} from 'react-feather';
import { NumberPad } from '@bubblyclouds-app/games/components/NumberPad';
import { Toggle as NotesToggle } from '@bubblyclouds-app/ui/components/NotesToggle';
import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import { HintBox } from '@bubblyclouds-app/games/components/HintBox';
import {
  canUseUndo,
  canUseCheckGrid,
} from '@bubblyclouds-app/template/utils/dailyActionCounter';

interface Arguments {
  isInputDisabled: boolean;
  isValidateCellDisabled: boolean;
  isDeleteDisabled: boolean;
  validateGrid: () => void;
  validateCell: () => void;
  isUndoDisabled: boolean;
  isRedoDisabled: boolean;
  undo: () => void;
  redo: () => void;

  selectNumber: (number: number) => void;
  isNotesMode: boolean;
  setIsNotesMode: (_value: boolean) => void;
  isZoomMode: boolean;
  setIsZoomMode: (_value: boolean) => void;
  reset: () => void;
  reveal: () => void;
  copyGrid: () => void;
  onAdvancedToggle?: (_expanded: boolean) => void;
  isSubscribed?: boolean;
}

const SudokuControls = ({
  isInputDisabled,
  isValidateCellDisabled,
  isDeleteDisabled,
  validateGrid,
  validateCell,
  isUndoDisabled,
  isRedoDisabled,
  undo,
  redo,
  selectNumber,
  isNotesMode,
  setIsNotesMode,
  isZoomMode,
  setIsZoomMode,
  reset,
  reveal,
  copyGrid,
  onAdvancedToggle,
  isSubscribed,
}: Arguments) => {
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const dragStartY = useRef(0);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleAdvancedToggle = () => {
    if (!isDragging) {
      const newState = !showAdvanced;
      setShowAdvanced(newState);
      onAdvancedToggle?.(newState);
    }
  };

  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    dragStartY.current = clientY;
  }, []);

  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!isDragging) return;

      const deltaY = dragStartY.current - clientY;
      // If dragged up by at least 20px, show advanced controls
      if (deltaY > 20 && !showAdvanced) {
        setShowAdvanced(true);
        setIsDragging(false); // Stop dragging when toggled
      }
      // If dragged down by at least 20px, hide advanced controls
      else if (deltaY < -20 && showAdvanced) {
        setShowAdvanced(false);
        setIsDragging(false); // Stop dragging when toggled
      }
    },
    [isDragging, showAdvanced]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleCopyGrid = useCallback(() => {
    copyGrid();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [copyGrid]);

  useEffect(() => {
    setTimeout(() => setShowAdvanced(false), 1000);
  }, []);

  // Global mouse and touch handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleDragMove(touch.clientY);
    };

    const handleGlobalEnd = () => {
      handleDragEnd();
    };

    // Add global listeners
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalEnd);
    document.addEventListener('touchmove', handleGlobalTouchMove, {
      passive: false,
    });
    document.addEventListener('touchend', handleGlobalEnd);

    return () => {
      // Cleanup
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Local start events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientY);
    },
    [handleDragStart]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleDragStart(touch.clientY);
    },
    [handleDragStart]
  );

  return (
    <div className="mt-0 mb-0 overflow-visible px-2 pt-2 lg:mb-16 xl:max-w-lg">
      <div className="hidden lg:block">
        <HintBox>
          Keyboard: arrow keys, undo, redo.
          <br />
          Hold shift or press n to toggle notes mode.
          <br />
          Press c to validate cell, g to validate grid.
        </HintBox>
      </div>

      {/* iOS-style control panel */}
      <div className="pb-safe mt-0 touch-none overflow-visible rounded-t-xl bg-white/60 p-3 pt-0 shadow-lg backdrop-blur-md lg:pt-3 dark:bg-zinc-900/60">
        {/* Advanced controls drag handle */}
        <div className="lg:hidden">
          <div className="flex w-full cursor-grab items-center justify-center gap-1.5 rounded-lg px-2 py-0 text-xs font-medium text-gray-600 transition-all duration-60 select-none dark:text-gray-400">
            <p className="grow-0 cursor-pointer" onClick={handleAdvancedToggle}>
              {showAdvanced ? (
                <ChevronDown size={15} />
              ) : (
                <ChevronUp size={15} />
              )}
            </p>
            <div
              ref={dragRef}
              className={`flex max-h-[35px] w-full cursor-grab items-center justify-center gap-1.5 rounded-lg px-2 py-0 text-xs font-medium text-gray-600 transition-all duration-60 select-none dark:text-gray-400 ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              <Minus size={50} className="grow-3" />
            </div>
            <p className="grow-0 cursor-pointer" onClick={handleAdvancedToggle}>
              {showAdvanced ? (
                <ChevronDown size={15} />
              ) : (
                <ChevronUp size={15} />
              )}
            </p>
          </div>
        </div>

        {/* Toggle controls section */}
        <div className="mb-0 flex items-center justify-between border-b border-gray-200 pb-3 lg:mb-3 dark:border-gray-600">
          <div className="flex-1"></div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              {isNotesMode ? <Edit size={14} /> : <Edit2 size={14} />}
              Notes
            </div>
            <NotesToggle isEnabled={isNotesMode} setEnabled={setIsNotesMode} />
          </div>
          <div className="flex flex-1 justify-end">
            <button
              onClick={handleCopyGrid}
              className="flex cursor-pointer items-center gap-1 rounded-md bg-gray-100 px-1.5 py-1 text-xs font-medium text-gray-700 transition-all duration-150 hover:bg-gray-200 active:bg-gray-300 dark:bg-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-600 dark:active:bg-zinc-500"
            >
              <Copy size={10} />
              {isCopied ? 'Copied!' : 'Export'}
            </button>
          </div>
        </div>

        {/* Main controls layout */}
        <div className="flex flex-col items-center gap-2 overflow-visible lg:flex-row">
          {/* Number pad */}
          <div className="order-1 flex-shrink-0 lg:order-1">
            <NumberPad
              selectNumber={selectNumber}
              isInputDisabled={isInputDisabled}
            />
          </div>

          {/* Action buttons - compact layout for mobile */}
          <div className="order-2 w-full flex-1 overflow-visible lg:order-2 lg:w-auto">
            <div className="grid grid-cols-3 gap-2 overflow-visible">
              {/* Row 1: Delete, Undo, and Redo */}
              <button
                disabled={isDeleteDisabled}
                onClick={() => selectNumber(0)}
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-2 py-2.5 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-200 active:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 dark:bg-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-600 dark:active:bg-zinc-500 dark:disabled:bg-zinc-800"
              >
                <Delete size={15} />
                Delete
              </button>
              <button
                disabled={isUndoDisabled}
                onClick={() => undo()}
                className="relative flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-2 py-2.5 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-200 active:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 dark:bg-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-600 dark:active:bg-zinc-500 dark:disabled:bg-zinc-800"
              >
                <CornerUpLeft size={15} />
                Undo
                {!isSubscribed && !isUndoDisabled && !canUseUndo() && (
                  <span className="absolute -top-1 -right-1 z-10 inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-1 py-0.5 text-xs font-semibold text-white shadow-lg">
                    ✨
                  </span>
                )}
              </button>
              <button
                disabled={isRedoDisabled}
                onClick={() => redo()}
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-2 py-2.5 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-200 active:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 dark:bg-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-600 dark:active:bg-zinc-500 dark:disabled:bg-zinc-800"
              >
                Redo
                <CornerUpRight size={15} />
              </button>
            </div>

            {/* Collapsible advanced controls */}
            <div
              className={`mt-2 overflow-visible transition-all duration-300 ease-in-out lg:block ${
                showAdvanced
                  ? 'max-h-96 opacity-100'
                  : 'max-h-0 opacity-0 lg:max-h-96 lg:opacity-100'
              }`}
            >
              <div className="mb-2 grid grid-cols-3 gap-2 overflow-visible">
                {/* Check Cell, Check Grid, Zoom Mode */}
                <button
                  disabled={isValidateCellDisabled}
                  onClick={() => validateCell()}
                  className="relative flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-2 py-2.5 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-200 active:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 dark:bg-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-600 dark:active:bg-zinc-500 dark:disabled:bg-zinc-800"
                >
                  <Square size={15} />
                  Cell
                </button>
                <button
                  onClick={() => validateGrid()}
                  className="relative flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-2 py-2.5 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-200 active:bg-gray-300 dark:bg-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-600 dark:active:bg-zinc-500"
                >
                  <Grid size={15} />
                  Grid
                  {!isSubscribed && !canUseCheckGrid() && (
                    <span className="absolute -top-1 -right-1 z-10 inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-1 py-0.5 text-xs font-semibold text-white shadow-lg">
                      ✨
                    </span>
                  )}
                </button>
                <button
                  disabled={!isZoomMode && isInputDisabled}
                  onClick={() => setIsZoomMode(!isZoomMode)}
                  className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-zinc-800 ${
                    isZoomMode
                      ? 'bg-theme-primary hover:bg-theme-primary-dark active:bg-theme-primary-darker dark:bg-theme-primary-light dark:hover:bg-theme-primary dark:active:bg-theme-primary-dark text-white dark:text-gray-900'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 dark:bg-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-600 dark:active:bg-zinc-500'
                  }`}
                >
                  <Eye size={15} />
                  Zoom
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 overflow-visible">
                <button
                  onClick={() => {
                    window.confirm(
                      'Are you sure you wish to reset the whole grid?'
                    ) && reset();
                  }}
                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-2 py-2.5 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-200 active:bg-gray-300 dark:bg-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-600 dark:active:bg-zinc-500"
                >
                  <RefreshCw size={15} />
                  Reset
                </button>
                <button
                  onClick={() => {
                    window.confirm(
                      'Are you sure you wish to reveal the whole grid?'
                    ) && reveal();
                  }}
                  className="relative flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-2 py-2.5 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-200 active:bg-gray-300 dark:bg-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-600 dark:active:bg-zinc-500"
                >
                  <Unlock size={15} />
                  Reveal
                  {!isSubscribed && (
                    <span className="absolute -top-1 -right-1 z-10 inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-1 py-0.5 text-xs font-semibold text-white shadow-lg">
                      ✨
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Prevent re-render on timer change
const MemoisedSudokuControls = memo(function MemoisedSudokuControls(
  args: Arguments
) {
  return SudokuControls(args);
});

export default MemoisedSudokuControls;
