import { calculateCellId } from '../helpers/calculateId';
import SudokuInput from './SudokuInput';
import { PuzzleBox, PuzzleRowOrColumn } from '../types/puzzle';
import { SelectNumber, SetSelectedCell } from '../types/state';
import { memo, PointerEvent } from 'react';

interface Arguments {
  boxId: string;
  selectedCell: string | null;
  setSelectedCell: SetSelectedCell;
  answer: PuzzleBox;
  selectNumber: SelectNumber;
  validation?: PuzzleBox<boolean | undefined>;
  initial: PuzzleBox;
  isZoomMode?: boolean;
  onDragStart?: (e: PointerEvent) => void;
}

const SudokuBox = ({
  boxId,
  selectedCell,
  setSelectedCell,
  answer,
  selectNumber,
  validation,
  initial,
  isZoomMode,
  onDragStart,
}: Arguments) => {
  return (
    <div
      data-box-id={boxId}
      className="border-theme-primary dark:border-theme-primary-light grid aspect-square cursor-pointer grid-cols-3 grid-rows-3 border border-2"
    >
      {Array.from(Array(3)).map((_, y) =>
        Array.from(Array(3)).map((_, x) => {
          const cellId = calculateCellId(boxId, x, y);
          return (
            <SudokuInput
              key={cellId}
              cellId={cellId}
              selectedCell={selectedCell}
              setSelectedCell={setSelectedCell}
              selectNumber={selectNumber}
              value={answer[x as PuzzleRowOrColumn][y as PuzzleRowOrColumn]}
              validation={
                validation &&
                validation[x as PuzzleRowOrColumn][y as PuzzleRowOrColumn]
              }
              isInitial={
                !!initial[x as PuzzleRowOrColumn][y as PuzzleRowOrColumn]
              }
              isZoomMode={isZoomMode}
              onDragStart={onDragStart}
            />
          );
        })
      )}
    </div>
  );
};

// Prevent re-render on timer change
const MemoisedSudokuBox = memo(function MemoisedSudokuBox(args: Arguments) {
  return SudokuBox(args);
});

export default MemoisedSudokuBox;
