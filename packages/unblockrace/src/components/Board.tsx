'use client';

import { useMemo, useRef } from 'react';
import { Move } from '../types/board';
import { parseBoardString } from '../helpers/parseBoardString';
import { pieceRow } from '../helpers/piece';
import { useDrag } from '../hooks/useDrag';
import { isSolved } from '../helpers/isSolved';
import Piece from './Piece';

interface BoardProps {
  boardString: string;
  onMove: (move: Move) => void;
  isDisabled?: boolean;
  // Frozen render used as the outgoing board during a stage transition: no
  // drag, and the primary piece stays at rest in its solved cell (the win
  // exit slide is not replayed — the carousel carries it across instead).
  isStatic?: boolean;
}

// Plain HTML/CSS board (SPEC.md §9): absolutely-positioned divs inside a
// square aspect-ratio-locked container. Static layout is %-based; the
// actively-dragged piece moves via translate3d written directly to the DOM
// node by useDrag.
const Board = ({ boardString, onMove, isDisabled, isStatic }: BoardProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const board = useMemo(() => parseBoardString(boardString), [boardString]);
  const solved = isSolved(board);

  const {
    draggingPiece,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useDrag({
    boardRef,
    board,
    onMove,
    disabled: isStatic || isDisabled || solved,
  });

  const primaryRow = pieceRow(board.pieces[0], board.width);

  return (
    <div
      ref={boardRef}
      data-testid="unblock-board"
      className="border-theme-primary dark:border-theme-primary-light relative ml-auto mr-auto aspect-square w-full max-w-xl overflow-hidden rounded-2xl border-2 bg-stone-100 lg:mr-0 dark:bg-zinc-900"
    >
      {/* Grid lines: low-opacity per theme so they don't compete with the
          piece glow */}
      {Array.from({ length: board.width - 1 }, (_, i) => (
        <div
          key={`v-${i}`}
          aria-hidden="true"
          className="absolute bottom-0 top-0 w-px bg-zinc-900/10 dark:bg-white/10"
          style={{ left: `${((i + 1) / board.width) * 100}%` }}
        />
      ))}
      {Array.from({ length: board.height - 1 }, (_, i) => (
        <div
          key={`h-${i}`}
          aria-hidden="true"
          className="absolute left-0 right-0 h-px bg-zinc-900/10 dark:bg-white/10"
          style={{ top: `${((i + 1) / board.height) * 100}%` }}
        />
      ))}

      {/* Exit route: the primary piece's row, highlighted so the path out
          reads as more than a static arrow — pulses while unsolved, flares
          brighter as the piece slides through it on exit */}
      <div
        aria-hidden="true"
        data-testid="exit-route"
        className={`absolute right-0 ${solved ? 'duration-500' : 'animate-pulse'} transition-opacity`}
        style={{
          top: `${(primaryRow / board.height) * 100}%`,
          height: `${(1 / board.height) * 100}%`,
          width: `${(1 / board.width) * 100}%`,
          background:
            'linear-gradient(to right, transparent, color-mix(in srgb, var(--theme-primary) 35%, transparent))',
          opacity: solved ? 1 : 0.7,
        }}
      />

      {/* Exit chevron on the grid edge at the primary piece's row, glowing
          in the theme colour so it reads as where the glow leads out */}
      <div
        aria-hidden="true"
        data-testid="exit-marker"
        className="absolute right-0 flex items-center justify-end"
        style={{
          top: `${(primaryRow / board.height) * 100}%`,
          height: `${(1 / board.height) * 100}%`,
        }}
      >
        <div
          className={solved ? 'animate-pulse' : ''}
          style={{
            width: 0,
            height: 0,
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            borderLeft: '12px solid var(--theme-primary)',
            filter: `drop-shadow(0 0 ${solved ? 12 : 6}px var(--theme-primary))`,
          }}
        />
      </div>

      {/* Walls: static neutral obstacles, not vehicles — no palette colour */}
      {board.walls.map((wall) => (
        <div
          key={`wall-${wall}`}
          data-testid={`wall-${wall}`}
          className="absolute"
          style={{
            left: `${((wall % board.width) / board.width) * 100}%`,
            top: `${(Math.floor(wall / board.width) / board.height) * 100}%`,
            width: `${(1 / board.width) * 100}%`,
            height: `${(1 / board.height) * 100}%`,
          }}
        >
          <div
            className="bg-stone-300 dark:bg-zinc-700"
            style={{
              position: 'absolute',
              inset: '8%',
              borderRadius: '18%',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.25)',
            }}
          />
        </div>
      ))}

      {board.pieces.map((piece, index) => (
        <Piece
          key={String.fromCharCode(65 + index)}
          piece={piece}
          index={index}
          width={board.width}
          height={board.height}
          isDragging={draggingPiece === index}
          // The car's exit still plays on a static (outgoing) board so its
          // slide off the right edge continues seamlessly into the next
          // board arriving during a stage transition (SPEC.md §4).
          isExiting={solved && index === 0}
          onPointerDown={isStatic ? undefined : onPointerDown}
          onPointerMove={isStatic ? undefined : onPointerMove}
          onPointerUp={isStatic ? undefined : onPointerUp}
          onPointerCancel={isStatic ? undefined : onPointerCancel}
        />
      ))}
    </div>
  );
};

export default Board;
