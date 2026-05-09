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
  MessageCircle,
  Minus,
  RefreshCw,
  Square,
  Unlock,
} from 'lucide-react';
import { Technique, HintResult } from 'human-sudoku-solver';
import { UserAvatar } from '@bubblyclouds-app/auth/components/UserAvatar';
import { UserProfile } from '@bubblyclouds-app/types/userProfile';
import { NumberPad } from '@bubblyclouds-app/games/components/NumberPad';
import { Toggle as NotesToggle } from '@bubblyclouds-app/ui/components/NotesToggle';
import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import { HintBox } from '@bubblyclouds-app/games/components/HintBox';
import {
  canUseUndo,
  canUseCheckGrid,
} from '@bubblyclouds-app/template/utils/dailyActionCounter';

const TECHNIQUE_NAMES: Record<Technique, string> = {
  nakedSingle: 'Naked Single',
  hiddenSingleBox: 'Hidden Single (Box)',
  hiddenSingleRow: 'Hidden Single (Row)',
  hiddenSingleCol: 'Hidden Single (Column)',
  nakedPair: 'Naked Pair',
  nakedTriple: 'Naked Triple',
  nakedQuad: 'Naked Quad',
  hiddenPair: 'Hidden Pair',
  hiddenTriple: 'Hidden Triple',
  hiddenQuad: 'Hidden Quad',
  lockedCandidatePointing: 'Locked Candidates (Pointing)',
  lockedCandidateClaiming: 'Locked Candidates (Claiming)',
  xWing: 'X-Wing',
  swordfish: 'Swordfish',
  jellyfish: 'Jellyfish',
  skyscraper: 'Skyscraper',
  twoStringKite: 'Two-String Kite',
  finnedXWing: 'Finned X-Wing',
  finnedSwordfish: 'Finned Swordfish',
  finnedJellyfish: 'Finned Jellyfish',
  emptyRectangle: 'Empty Rectangle',
  wWing: 'W-Wing',
  yWing: 'Y-Wing',
  xyzWing: 'XYZ-Wing',
  uniqueRectangleType1: 'Unique Rectangle (Type 1)',
  uniqueRectangleType2: 'Unique Rectangle (Type 2)',
  uniqueRectangleType3: 'Unique Rectangle (Type 3)',
  uniqueRectangleType4: 'Unique Rectangle (Type 4)',
  uniqueRectangleType5: 'Unique Rectangle (Type 5)',
  bug: 'BUG',
  xyChain: 'XY-Chain',
  aic: 'AIC',
  aicRing: 'AIC Ring',
  groupedAIC: 'Grouped AIC',
  alsXZ: 'ALS-XZ',
  sueDeCoq: 'Sue de Coq',
  deathBlossom: 'Death Blossom',
  nishio: 'Nishio',
  nishioNet: 'Nishio Net',
  cellRegionForcingChain: 'Cell/Region Forcing Chain',
  cellRegionForcingNet: 'Cell/Region Forcing Net',
  forcingChain: 'Forcing Chain',
};

interface Arguments {
  selectedCell: string | null;
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
  getHint: () => HintResult | null | 'invalid';
  user?: UserProfile;
  onShowWhere: (_hint: HintResult) => void;
  onRevealEliminations: (_hint: HintResult) => void;
  onHideHint: () => void;
  onClearSelection: () => void;
}

const SudokuControls = ({
  selectedCell,
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
  getHint,
  user,
  onShowWhere,
  onRevealEliminations,
  onHideHint,
  onClearSelection,
}: Arguments) => {
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hint, setHint] = useState<HintResult | null | 'invalid' | undefined>(
    undefined
  );
  const [showWhere, setShowWhere] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [owlTyping, setOwlTyping] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const dragStartY = useRef(0);
  const dragRef = useRef<HTMLDivElement>(null);
  const openingHintRef = useRef(false);

  const hasShownRainbowNudgeRef = useRef<boolean>(false);
  const [showRainbowNudge, setShowRainbowNudge] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!hasShownRainbowNudgeRef.current) {
      timeoutRef.current = setTimeout(() => {
        hasShownRainbowNudgeRef.current = true;
        setShowRainbowNudge(true);
        setTimeout(() => {
          setShowRainbowNudge(false);
        }, 2000);
      }, 30000);
    }
  }, []);

  useEffect(() => {
    resetInactivityTimer();

    const handleInteraction = () => {
      resetInactivityTimer();
    };

    window.addEventListener('sudoku-interaction', handleInteraction);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener('sudoku-interaction', handleInteraction);
    };
  }, [resetInactivityTimer]);

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

  const handleHint = useCallback(() => {
    openingHintRef.current = true;
    onClearSelection();
    const result = getHint();
    setHint(result);
    setShowWhere(false);
    setOwlTyping(true);
    setUserTyping(false);
    setTimeout(() => {
      setOwlTyping(false);
      if (result !== 'invalid') {
        setUserTyping(true);
        setTimeout(() => setUserTyping(false), 600);
      }
    }, 800);
  }, [getHint, onClearSelection]);

  const handleCloseHint = useCallback(() => {
    setHint(undefined);
    setShowWhere(false);
    setShowExplanation(false);
    setOwlTyping(false);
    setUserTyping(false);
    onHideHint();
  }, [onHideHint]);

  const handleShowWhere = useCallback(() => {
    if (hint && hint !== 'invalid') {
      onClearSelection();
      onShowWhere(hint);
      setOwlTyping(true);
      setTimeout(() => {
        setShowWhere(true);
        setOwlTyping(false);
        setUserTyping(true);
        setTimeout(() => setUserTyping(false), 600);
      }, 800);
    }
  }, [hint, onShowWhere, onClearSelection]);

  const handleTellMeMore = useCallback(() => {
    setUserTyping(true);
    setTimeout(() => {
      setUserTyping(false);
      setOwlTyping(true);
      setTimeout(() => {
        setShowExplanation(true);
        if (hint && hint !== 'invalid') {
          onRevealEliminations(hint);
        }
        setOwlTyping(false);
        setUserTyping(true);
        setTimeout(() => setUserTyping(false), 600);
      }, 800);
    }, 600);
  }, [hint, onRevealEliminations]);

  useEffect(() => {
    setTimeout(() => setShowAdvanced(false), 1000);
  }, []);

  useEffect(() => {
    if (openingHintRef.current) {
      openingHintRef.current = false;
      return;
    }
    if (hint !== undefined) {
      handleCloseHint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when selectedCell changes
  }, [selectedCell]);

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
    <div className="mb-0 mt-0 overflow-visible px-2 pt-2 lg:mb-16 xl:max-w-lg">
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
        <div className={`lg:hidden ${hint !== undefined ? 'invisible' : ''}`}>
          <div className="duration-60 flex w-full cursor-grab select-none items-center justify-center gap-1.5 rounded-lg px-2 py-0 text-xs font-medium text-gray-600 transition-all dark:text-gray-400">
            <p className="grow-0 cursor-pointer" onClick={handleAdvancedToggle}>
              {showAdvanced ? (
                <ChevronDown size={15} />
              ) : (
                <ChevronUp size={15} />
              )}
            </p>
            <div
              ref={dragRef}
              className={`duration-60 flex max-h-[35px] w-full cursor-grab select-none items-center justify-center gap-1.5 rounded-lg px-2 py-0 text-xs font-medium text-gray-600 transition-all dark:text-gray-400 ${
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
        {hint !== undefined ? (
          <div className="flex flex-col gap-3 py-1">
            {/* Owl speech bubble */}
            <div className="flex items-start gap-3">
              <span className="text-3xl leading-none">🦉</span>
              <div className="relative whitespace-pre-line rounded-2xl rounded-tl-sm bg-amber-100 p-3 text-sm font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
                <div className="absolute -left-2 top-3 h-0 w-0 border-b-8 border-r-8 border-t-8 border-b-transparent border-r-amber-100 border-t-transparent dark:border-r-amber-900/30" />
                {owlTyping ? (
                  <span className="inline-flex translate-y-0.5 items-end gap-1 leading-none">
                    <span className="animate-bounce text-sm [animation-delay:0ms] [animation-duration:300ms]">
                      •
                    </span>
                    <span className="animate-bounce text-sm [animation-delay:100ms] [animation-duration:300ms]">
                      •
                    </span>
                    <span className="animate-bounce text-sm [animation-delay:200ms] [animation-duration:300ms]">
                      •
                    </span>
                  </span>
                ) : hint === 'invalid' ? (
                  'Looks like you have made a mistake. I recommend checking the grid.'
                ) : (showExplanation || showWhere) && hint ? (
                  <div className="flex flex-col gap-2">
                    <span>
                      {showExplanation
                        ? `${hint.explanation ?? 'Sorry, I am not sure.'}${hint.eureka ? ` \n\nEureka notation ${hint.eureka}` : ''}`
                        : "I've highlighted the relevant cells for you"}
                    </span>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      {hint.technique === 'deathBlossom' ? (
                        <>
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-3 w-3 rounded-sm bg-yellow-400/70" />
                            Stem
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-3 w-3 rounded-sm bg-blue-400/60" />
                            Petal A
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-3 w-3 rounded-sm bg-green-400/60" />
                            Petal B
                          </span>
                        </>
                      ) : hint.technique === 'alsXZ' ||
                        hint.technique === 'sueDeCoq' ? (
                        <>
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-3 w-3 rounded-sm bg-blue-400/60" />
                            ALS 1
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-3 w-3 rounded-sm bg-green-400/60" />
                            ALS 2
                          </span>
                        </>
                      ) : hint.chainPath && hint.chainPath.length > 0 ? (
                        <>
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-3 w-3 rounded-sm bg-blue-400/60" />
                            On (true)
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-3 w-3 rounded-sm bg-green-400/60" />
                            Off (false)
                          </span>
                        </>
                      ) : null}
                      {showExplanation && hint.eliminations.length > 0 && (
                        <span className="flex items-center gap-1">
                          {[
                            ...new Set(hint.eliminations.map((e) => e.digit)),
                          ].map((d) => (
                            <span
                              key={d}
                              className="inline-block rounded bg-red-600 px-1 text-xs font-bold text-white line-through"
                            >
                              {d}
                            </span>
                          ))}
                          Elimination
                        </span>
                      )}
                    </div>
                  </div>
                ) : hint ? (
                  `I've found a ${TECHNIQUE_NAMES[hint.technique]}`
                ) : (
                  'No hint available'
                )}
              </div>
            </div>
            {/* User response bubble */}
            {!owlTyping && (
              <div className="flex items-start justify-end gap-3">
                <div className="relative rounded-2xl rounded-tr-sm bg-gray-100 p-3 dark:bg-zinc-800">
                  <div className="absolute -right-2 top-3 h-0 w-0 border-b-8 border-l-8 border-t-8 border-b-transparent border-l-gray-100 border-t-transparent dark:border-l-zinc-800" />
                  {userTyping ? (
                    <span className="inline-flex translate-y-0.5 items-end gap-1 leading-none">
                      <span className="animate-bounce text-sm text-gray-900 [animation-delay:0ms] [animation-duration:300ms] dark:text-white">
                        •
                      </span>
                      <span className="animate-bounce text-sm text-gray-900 [animation-delay:100ms] [animation-duration:300ms] dark:text-white">
                        •
                      </span>
                      <span className="animate-bounce text-sm text-gray-900 [animation-delay:200ms] [animation-duration:300ms] dark:text-white">
                        •
                      </span>
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Thanks,
                        </span>
                      }
                      {hint !== 'invalid' &&
                        !showExplanation &&
                        (showWhere ? (
                          <button
                            onClick={handleTellMeMore}
                            className="bg-theme-primary hover:bg-theme-primary-dark active:bg-theme-primary-darker dark:bg-theme-primary-light dark:hover:bg-theme-primary dark:active:bg-theme-primary-dark cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-white transition-all duration-150"
                          >
                            🤔 Tell me more
                          </button>
                        ) : (
                          hint && (
                            <button
                              onClick={handleShowWhere}
                              className="bg-theme-primary hover:bg-theme-primary-dark active:bg-theme-primary-darker dark:bg-theme-primary-light dark:hover:bg-theme-primary dark:active:bg-theme-primary-dark cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-white transition-all duration-150"
                            >
                              👀 Show me where
                            </button>
                          )
                        ))}
                      <button
                        onClick={handleCloseHint}
                        className="bg-theme-primary hover:bg-theme-primary-dark active:bg-theme-primary-darker dark:bg-theme-primary-light dark:hover:bg-theme-primary dark:active:bg-theme-primary-dark cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-white transition-all duration-150"
                      >
                        Hide Hint
                      </button>
                    </div>
                  )}
                </div>
                {user ? (
                  <UserAvatar
                    user={user}
                    size={36}
                    enableAvatarPicture={false}
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-600">
                    <span className="text-lg">👤</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-0 flex items-center justify-between border-b border-gray-200 pb-3 lg:mb-3 dark:border-gray-600">
            <div className="flex-1">
              <button
                onClick={handleHint}
                className={`${showRainbowNudge ? 'rainbow-border-wrap' : ''} flex cursor-pointer items-center gap-1 rounded-md bg-gray-100 px-1.5 py-1 text-xs font-medium text-gray-700 transition-all duration-150 hover:bg-gray-200 active:bg-gray-300 dark:bg-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-600 dark:active:bg-zinc-500`}
              >
                <MessageCircle size={10} />
                Ask for help
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                {isNotesMode ? <Edit size={14} /> : <Edit2 size={14} />}
                Notes
              </div>
              <NotesToggle
                isEnabled={isNotesMode}
                setEnabled={setIsNotesMode}
              />
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
        )}

        {/* Main controls layout */}
        {hint === undefined && (
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
                  {!isSubscribed && !canUseUndo() && (
                    <span className="absolute -right-1 -top-1 z-10 inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-1 py-0.5 text-xs font-semibold text-white shadow-lg">
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
                      <span className="absolute -right-1 -top-1 z-10 inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-1 py-0.5 text-xs font-semibold text-white shadow-lg">
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
                      <span className="absolute -right-1 -top-1 z-10 inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-1 py-0.5 text-xs font-semibold text-white shadow-lg">
                        ✨
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
