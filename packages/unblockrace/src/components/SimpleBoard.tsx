import { BaseState } from '@bubblyclouds-app/template/types/state';
import { parseBoardString } from '../helpers/parseBoardString';
import { pieceCol, pieceRow } from '../helpers/piece';
import { getPieceColor } from '../helpers/pieceColors';

interface SimpleBoardProps {
  initial?: string;
  latest?: string;
  transparent?: boolean;
  compact?: boolean;
  state?: BaseState<string, string>;
}

// Non-interactive small render, mirrors SimpleSudoku (used in MyPuzzlesTab
// rows, FriendsTab, session lists and the lobby).
const SimpleBoard = (props: SimpleBoardProps) => {
  const { transparent, compact } = props;

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
              style={{
                position: 'absolute',
                inset: '8%',
                borderRadius: '22%',
                background: getPieceColor(index),
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default SimpleBoard;
