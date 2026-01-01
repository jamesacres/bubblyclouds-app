import { calculateBoxId, calculateCellId } from '../helpers/calculateId';
import { Puzzle, PuzzleRowOrColumn } from '../types/puzzle';
import { BaseState } from '@bubblyclouds-app/template/types/state';

interface SimpleSudokuProps {
  initial?: Puzzle<number>;
  final?: Puzzle<number>;
  latest?: Puzzle | undefined;
  transparent?: boolean;
  state?: BaseState<Puzzle<number>, Puzzle>;
}

const SimpleSudoku = (props: SimpleSudokuProps) => {
  const { transparent } = props;

  let initial: Puzzle<number> | undefined;
  let final: Puzzle<number> | undefined;
  let latest: Puzzle | undefined;

  if (props.state) {
    initial = props.state.initial;
    final = props.state.final;
    latest =
      props.state.answerStack.length > 0
        ? props.state.answerStack[props.state.answerStack.length - 1]
        : undefined;
  } else {
    initial = props.initial;
    final = props.final;
    latest = props.latest;
  }

  if (!initial || !final) {
    return null;
  }
  const background = transparent ? '' : 'bg-zinc-50 dark:bg-zinc-900';
  return (
    <div
      className={`mr-auto ml-auto grid max-w-xl grid-cols-3 grid-rows-3 border border-1 border-zinc-900 text-black lg:mr-0 dark:border-zinc-50 dark:text-white ${background}`}
    >
      {Array.from(Array(3)).map((_, y) =>
        Array.from(Array(3)).map((_, x) => {
          const boxId = calculateBoxId(x, y);
          return (
            <div
              key={boxId}
              className="grid aspect-square grid-cols-3 grid-rows-3 border border-zinc-900 dark:border-zinc-50"
            >
              {Array.from(Array(3)).map((_, celly) =>
                Array.from(Array(3)).map((_, cellx) => {
                  const cellId = calculateCellId(boxId, cellx, celly);
                  const initialValue =
                    initial[x as PuzzleRowOrColumn][y as PuzzleRowOrColumn][
                      cellx as PuzzleRowOrColumn
                    ][celly as PuzzleRowOrColumn];
                  const finalValue =
                    final[x as PuzzleRowOrColumn][y as PuzzleRowOrColumn][
                      cellx as PuzzleRowOrColumn
                    ][celly as PuzzleRowOrColumn];
                  const latestValue =
                    latest?.[x as PuzzleRowOrColumn][y as PuzzleRowOrColumn][
                      cellx as PuzzleRowOrColumn
                    ][celly as PuzzleRowOrColumn];
                  const hasCorrectGuess =
                    !initialValue && latestValue && latestValue === finalValue;
                  const hasIncorrectGuess =
                    !initialValue &&
                    latestValue &&
                    typeof latestValue === 'number' &&
                    latestValue !== finalValue;
                  const correctBackground = hasCorrectGuess
                    ? 'bg-green-500'
                    : '';
                  const incorrectBackground = hasIncorrectGuess
                    ? 'bg-red-500'
                    : '';
                  return (
                    <div
                      key={cellId}
                      className={`flex aspect-square size-fit h-full w-full items-center justify-center border border-zinc-300 dark:border-zinc-400 ${correctBackground} ${incorrectBackground}`}
                    >
                      {initialValue || ''}
                    </div>
                  );
                })
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default SimpleSudoku;
