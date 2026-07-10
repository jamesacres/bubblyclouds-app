'use client';

import { BaseState } from '@bubblyclouds-app/template/types/state';
import { parseBoardString } from '../helpers/parseBoardString';
import { pieceCol, pieceRow } from '../helpers/piece';
import { assignPieceColors } from '../helpers/pieceColors';
import { useThemeColorName } from '../hooks/useThemeColorName';

interface SimpleBoardProps {
  initial?: string;
  latest?: string;
  transparent?: boolean;
  compact?: boolean;
  // Rivals render as neutral silhouettes so only the hero car carries
  // colour — at thumbnail size the full palette is just noise (the stage
  // filmstrip uses this; lobby previews keep the colours).
  muteRivals?: boolean;
  state?: BaseState<string, string>;
}

// Non-interactive small render, mirrors SimpleSudoku (used in MyPuzzlesTab
// rows, FriendsTab, session lists and the lobby).
const SimpleBoard = (props: SimpleBoardProps) => {
  const { transparent, compact, muteRivals } = props;
  const themeColor = useThemeColorName();

  let initial: string | undefined;
  let latest: string | undefined;

  if (props.state) {
    initial = props.state.initial;
    latest =
      props.state.answerStack.length > 0
        ? props.state.answerStack[props.state.answerStack.length - 1]
        : undefined;
  } else {
    initial = props.initial;
    latest = props.latest;
  }

  const boardString = latest || initial;
  if (!boardString) {
    return null;
  }

  let board;
  try {
    board = parseBoardString(boardString);
  } catch {
    return null;
  }

  // Colours are pinned to the starting layout: the assignment is
  // adjacency-aware, so deriving it from the live positions would recolour
  // pieces move by move as a session progresses.
  let colorBoard = board;
  if (initial && boardString !== initial) {
    try {
      colorBoard = parseBoardString(initial);
    } catch {
      // keep the live board's colours if the initial string is unusable
    }
  }

  const pieceColors = assignPieceColors(colorBoard, themeColor);

  const background = transparent ? '' : 'bg-zinc-50 dark:bg-zinc-900';
  return (
    <div
      className={`relative aspect-square overflow-hidden rounded-lg border border-zinc-900/20 dark:border-zinc-50/20 ${background} ${
        compact ? 'h-full w-full' : 'ml-auto mr-auto max-w-xl lg:mr-0'
      }`}
    >
      {board.walls.map((wall) => (
        <div
          key={`wall-${wall}`}
          className="absolute bg-stone-300 dark:bg-zinc-700"
          style={{
            left: `${((wall % board.width) / board.width) * 100}%`,
            top: `${(Math.floor(wall / board.width) / board.height) * 100}%`,
            width: `${(1 / board.width) * 100}%`,
            height: `${(1 / board.height) * 100}%`,
          }}
        />
      ))}
      {board.pieces.map((piece, index) => {
        const horizontal = piece.orientation === 'horizontal';
        const spanX = horizontal ? piece.size : 1;
        const spanY = horizontal ? 1 : piece.size;
        const isPrimary = index === 0;
        return (
          <div
            key={String.fromCharCode(65 + index)}
            className="absolute"
            style={{
              left: `${(pieceCol(piece, board.width) / board.width) * 100}%`,
              top: `${(pieceRow(piece, board.width) / board.height) * 100}%`,
              width: `${(spanX / board.width) * 100}%`,
              height: `${(spanY / board.height) * 100}%`,
            }}
          >
            <div
              className={
                muteRivals && !isPrimary
                  ? 'bg-stone-300/90 dark:bg-zinc-600/80'
                  : undefined
              }
              style={{
                position: 'absolute',
                inset: '8%',
                borderRadius: '22%',
                background:
                  muteRivals && !isPrimary ? undefined : pieceColors[index],
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default SimpleBoard;
