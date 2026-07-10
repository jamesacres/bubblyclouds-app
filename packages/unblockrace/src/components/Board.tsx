'use client';

import { useMemo, useRef } from 'react';
import { Move } from '../types/board';
import { parseBoardString } from '../helpers/parseBoardString';
import { pieceRow } from '../helpers/piece';
import { useDrag } from '../hooks/useDrag';
import { isSolved } from '../helpers/isSolved';
import { assignPieceColors } from '../helpers/pieceColors';
import { useThemeColorName } from '../hooks/useThemeColorName';
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
  const themeColor = useThemeColorName();
  const pieceColors = useMemo(
    () => assignPieceColors(board, themeColor),
    [board, themeColor]
  );

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
      className="relative ml-auto mr-auto aspect-square w-full max-w-xl overflow-hidden rounded-2xl border border-stone-200/80 bg-gradient-to-br from-white to-stone-200 lg:mr-0 dark:border-white/10 dark:from-zinc-900 dark:to-zinc-950"
      style={{
        // Theme-colour frame glow instead of a hard border; flares brighter
        // the moment the puzzle is solved
        boxShadow: solved
          ? '0 0 0 1px color-mix(in srgb, var(--theme-primary) 60%, transparent), 0 0 44px -4px color-mix(in srgb, var(--theme-primary) 55%, transparent)'
          : '0 0 0 1px color-mix(in srgb, var(--theme-primary) 28%, transparent), 0 0 36px -12px color-mix(in srgb, var(--theme-primary) 40%, transparent)',
        transition: 'box-shadow 500ms ease-out',
        animation: solved ? 'unblock-solve-pop 450ms ease-out' : undefined,
      }}
    >
      <style>{`
        @keyframes unblock-exit-chevron {
          0% { transform: translateX(-50%); opacity: 0; }
          35% { opacity: 1; }
          100% { transform: translateX(70%); opacity: 0; }
        }
        @keyframes unblock-solve-sweep {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        @keyframes unblock-solve-pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.015); }
          100% { transform: scale(1); }
        }
        @keyframes unblock-exit-burst {
          from { transform: translate(50%, -50%) scale(0.3); opacity: 0.9; }
          to { transform: translate(50%, -50%) scale(2.4); opacity: 0; }
        }
        @keyframes unblock-piece-enter {
          from { transform: scale(0.55); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-testid="unblock-board"],
          [data-testid="unblock-board"] * {
            animation: none !important;
          }
        }
      `}</style>

      {/* Cell sockets: a soft inset per cell instead of full-bleed hairlines,
          so the surface reads as a board with resting places rather than
          graph paper — and still doesn't compete with the piece glow */}
      {Array.from({ length: board.width * board.height }, (_, cell) => (
        <div
          key={`cell-${cell}`}
          aria-hidden="true"
          className="absolute"
          style={{
            left: `${((cell % board.width) / board.width) * 100}%`,
            top: `${(Math.floor(cell / board.width) / board.height) * 100}%`,
            width: `${(1 / board.width) * 100}%`,
            height: `${(1 / board.height) * 100}%`,
          }}
        >
          <div
            className="absolute rounded-[18%] bg-zinc-900/[0.07] dark:bg-white/[0.11]"
            style={{
              inset: '6%',
              boxShadow:
                'inset 0 1px 3px rgba(0,0,0,0.12), inset 0 -1px 1px rgba(255,255,255,0.06)',
            }}
          />
        </div>
      ))}

      {/* Vignette: focuses the eye on the centre of the play surface */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          background:
            'radial-gradient(120% 120% at 50% 42%, transparent 55%, rgba(0,0,0,0.38) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          background:
            'radial-gradient(120% 120% at 50% 42%, rgba(255,255,255,0.55) 25%, transparent 70%)',
        }}
      />

      {/* Exit route: the primary piece's full row rendered as a road lane —
          a faint theme tint with a dashed centre line running to the gate,
          so the way out reads as a road, not a gradient smudge */}
      <div
        aria-hidden="true"
        data-testid="exit-route"
        className={`absolute left-0 right-0 ${solved ? 'duration-500' : ''} transition-opacity`}
        style={{
          top: `${(primaryRow / board.height) * 100}%`,
          height: `${(1 / board.height) * 100}%`,
          background:
            'linear-gradient(to right, color-mix(in srgb, var(--theme-primary) 4%, transparent), color-mix(in srgb, var(--theme-primary) 22%, transparent))',
          opacity: solved ? 1 : 0.9,
        }}
      >
        <div
          className="absolute left-[4%] right-[10%] top-1/2 h-px -translate-y-1/2"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to right, color-mix(in srgb, var(--theme-primary) 55%, transparent) 0 10px, transparent 10px 22px)',
          }}
        />
      </div>

      {/* Exit gate at the primary piece's row: a glowing gantry on the grid
          edge with chevrons marching out through it. Rendered above the
          pieces (z-20 vs the dragged piece's inline z-10 within its own
          stacking order) so an edge-hugging rival can never hide the way
          out — the car passes underneath it like a finish gantry */}
      <div
        aria-hidden="true"
        data-testid="exit-marker"
        className="pointer-events-none absolute right-0 z-20 flex items-center justify-end"
        style={{
          top: `${(primaryRow / board.height) * 100}%`,
          height: `${(1 / board.height) * 100}%`,
        }}
      >
        <div className="relative flex h-full w-full items-center justify-end">
          {/* Dark notch flush to the frame edge, so the gate reads as an
              opening cut into the board wall rather than a decal on it */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '6%',
              bottom: '6%',
              width: 'max(14%, 12px)',
              borderRadius: '6px 0 0 6px',
              background:
                'linear-gradient(to right, transparent, rgba(0,0,0,0.28))',
            }}
          />
          {[0, 1].map((chevron) => (
            <div
              key={chevron}
              className="absolute"
              style={{
                right: `${18 + chevron * 26}%`,
                width: 0,
                height: 0,
                borderTop: '10px solid transparent',
                borderBottom: '10px solid transparent',
                borderLeft: '13px solid var(--theme-primary)',
                filter: 'drop-shadow(0 0 6px var(--theme-primary))',
                opacity: 0,
                animation: `unblock-exit-chevron 1.4s ease-in-out ${chevron * 0.7}s infinite`,
              }}
            />
          ))}
          {/* Checkered finish sliver just inside the gate bar */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 'max(5%, 4px)',
              width: 'max(4.5%, 5px)',
              height: '72%',
              borderRadius: 2,
              opacity: 0.55,
              backgroundColor: 'rgba(255,255,255,0.9)',
              backgroundImage: `
                linear-gradient(45deg, black 25%, transparent 25%),
                linear-gradient(-45deg, black 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, black 75%),
                linear-gradient(-45deg, transparent 75%, black 75%)
              `,
              backgroundSize: '5px 5px',
              backgroundPosition: '0 0, 0 2.5px, 2.5px -2.5px, -2.5px 0px',
            }}
          />
          <div
            style={{
              width: 'max(4%, 3px)',
              height: '84%',
              borderRadius: 2,
              background: 'var(--theme-primary)',
              boxShadow: `0 0 ${solved ? 20 : 12}px 2px color-mix(in srgb, var(--theme-primary) ${solved ? 90 : 70}%, transparent)`,
              transition: 'box-shadow 500ms ease-out',
            }}
          />
        </div>
      </div>

      {/* Walls: static neutral obstacles, not vehicles — no palette colour.
          Hatched and sunken so they read as bolted-down, never draggable */}
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
            className="bg-stone-300 dark:bg-zinc-800"
            style={{
              position: 'absolute',
              inset: '7%',
              borderRadius: '18%',
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(0,0,0,0.1) 0 4px, transparent 4px 9px)',
              border: '1px solid rgba(0,0,0,0.15)',
              boxShadow:
                'inset 0 2px 6px rgba(0,0,0,0.35), inset 0 -1px 2px rgba(255,255,255,0.08)',
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
          color={pieceColors[index]}
          isDragging={draggingPiece === index}
          // The car's exit still plays on a static (outgoing) board so its
          // slide off the right edge continues seamlessly into the next
          // board arriving during a stage transition (SPEC.md §4).
          isExiting={solved && index === 0}
          // Staggered pop-in as a stage arrives; the frozen outgoing board
          // of a transition must not replay it.
          entranceDelayMs={isStatic ? undefined : 60 + index * 40}
          onPointerDown={isStatic ? undefined : onPointerDown}
          onPointerMove={isStatic ? undefined : onPointerMove}
          onPointerUp={isStatic ? undefined : onPointerUp}
          onPointerCancel={isStatic ? undefined : onPointerCancel}
        />
      ))}

      {/* Solve flare: a single theme-colour light sweep across the board as
          the car exits, so every stage win lands, not just the final one */}
      {solved && (
        <div
          aria-hidden="true"
          data-testid="solve-sweep"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, transparent 30%, color-mix(in srgb, var(--theme-primary) 22%, transparent) 50%, transparent 70%)',
              animation: 'unblock-solve-sweep 700ms ease-out forwards',
            }}
          />
          {/* Radial burst out of the exit gate as the car crosses it */}
          <div
            data-testid="solve-burst"
            className="absolute"
            style={{
              right: 0,
              top: `${((primaryRow + 0.5) / board.height) * 100}%`,
              width: '55%',
              aspectRatio: '1',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, color-mix(in srgb, var(--theme-primary) 45%, transparent) 0%, transparent 65%)',
              animation: 'unblock-exit-burst 650ms ease-out forwards',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Board;
