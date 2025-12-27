import { Notes } from '../types/notes';
import { SelectNumber } from '../types/state';
import { memo } from 'react';

interface Arguments {
  notes: Notes;
  selectNumber: SelectNumber;
}

const SudokuInputNotes = ({ notes }: Arguments) => {
  return (
    <div className={`grid h-full w-full grid-cols-3 grid-rows-3`}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => {
        const isChecked = notes[value];
        const colorClass = isChecked
          ? 'dark:text-white text-black'
          : 'text-slate-400';
        const boldClass = isChecked ? 'font-bold' : undefined;
        return isChecked ? (
          <div
            className={`flex aspect-square h-full w-full items-center justify-center text-xs md:text-sm ${colorClass} ${boldClass}`}
            key={crypto.randomUUID()}
          >
            {value}
          </div>
        ) : (
          <div key={crypto.randomUUID()}></div>
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
