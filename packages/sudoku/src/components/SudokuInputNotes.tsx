import { Notes } from '../types/notes';
import { SelectNumber } from '../types/state';
import { memo } from 'react';

interface Arguments {
  notes: Notes;
  selectNumber: SelectNumber;
  eliminatedDigits?: number[];
  visibleDigits?: number[];
}

const SudokuInputNotes = ({
  notes,
  eliminatedDigits,
  visibleDigits,
}: Arguments) => {
  return (
    <div className={`grid h-full w-full grid-cols-3 grid-rows-3`}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => {
        const isChecked = notes[value];
        const isEliminated = eliminatedDigits?.includes(value);
        const isHintVisible = !isChecked && visibleDigits?.includes(value);
        const show = isChecked || isEliminated || isHintVisible;

        if (!show) {
          return <div key={value}></div>;
        }

        if (isEliminated) {
          return (
            <div
              className="flex aspect-square h-full w-full items-center justify-center"
              key={value}
            >
              <span className="flex items-center justify-center rounded bg-red-600 px-0.5 text-xs font-bold leading-none text-white line-through md:text-sm">
                {value}
              </span>
            </div>
          );
        }

        if (isHintVisible) {
          return (
            <div
              className="flex aspect-square h-full w-full items-center justify-center text-xs italic text-black/70 md:text-sm dark:text-white/80"
              key={value}
            >
              {value}
            </div>
          );
        }

        return (
          <div
            className="flex aspect-square h-full w-full items-center justify-center text-xs font-bold text-black md:text-sm dark:text-white"
            key={value}
          >
            {value}
          </div>
        );
      })}
    </div>
  );
};

// Prevent re-render on timer change
const MemoisedSudokuInputNotes = memo(function MemoisedSudokuInputNotes(
  args: Arguments
) {
  return SudokuInputNotes(args);
});

export default MemoisedSudokuInputNotes;
