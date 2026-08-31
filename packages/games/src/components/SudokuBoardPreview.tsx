const sudokuCell = (value: number) => `${(value / 9) * 100}%`;

const sudokuCellStyle = (col: number, row: number) => ({
  left: sudokuCell(col),
  top: sudokuCell(row),
  width: sudokuCell(1),
  height: sudokuCell(1),
});

// A valid solved 9x9 sudoku (3x3 boxes, digits 1-9): every row, column, and
// box contains each digit exactly once. The clues below are a subset of this
// solution; row 4 is left blank so the race animation can fill in its real
// solution values.
const SUDOKU_GIVEN_NUMBERS = [
  { col: 0, row: 0, value: 5 },
  { col: 3, row: 1, value: 1 },
  { col: 8, row: 1, value: 8 },
  { col: 1, row: 2, value: 9 },
  { col: 0, row: 3, value: 8 },
  { col: 4, row: 3, value: 6 },
  { col: 8, row: 3, value: 3 },
  { col: 0, row: 5, value: 7 },
  { col: 4, row: 5, value: 2 },
  { col: 8, row: 5, value: 6 },
  { col: 7, row: 6, value: 8 },
  { col: 0, row: 7, value: 2 },
  { col: 5, row: 7, value: 9 },
  { col: 8, row: 8, value: 9 },
];

const SUDOKU_RACE_ROW = [
  { col: 0, row: 4, value: 4 },
  { col: 1, row: 4, value: 2 },
  { col: 2, row: 4, value: 6 },
  { col: 3, row: 4, value: 8 },
  { col: 4, row: 4, value: 5 },
  { col: 5, row: 4, value: 3 },
  { col: 6, row: 4, value: 7 },
  { col: 7, row: 4, value: 9 },
  { col: 8, row: 4, value: 1 },
];

// Looping preview of the Sudoku Race game itself: given numbers sit fixed
// while the highlighted row races to fill in one cell at a time, then
// glows complete and resets (keyframes defined per-app in globals.css,
// choreographed on a shared 9s clock to match UnblockRaceBoardPreview's timing).
export const SudokuBoardPreview = () => (
  <div
    aria-hidden="true"
    className="relative aspect-square w-full overflow-hidden rounded-2xl"
    style={{
      background: 'rgba(8,2,20,0.85)',
      border: '1px solid rgba(167,139,250,0.16)',
      backgroundImage:
        'linear-gradient(rgba(167,139,250,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.09) 1px, transparent 1px), linear-gradient(rgba(167,139,250,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.28) 1px, transparent 1px)',
      backgroundSize:
        'calc(100% / 9) calc(100% / 9), calc(100% / 9) calc(100% / 9), calc(100% / 3) calc(100% / 3), calc(100% / 3) calc(100% / 3)',
    }}
  >
    {SUDOKU_GIVEN_NUMBERS.map(({ col, row, value }) => (
      <div
        key={`given-${col}-${row}`}
        className="absolute flex items-center justify-center font-black text-white/30"
        style={{
          ...sudokuCellStyle(col, row),
          fontSize: 'clamp(6px, 1.4vw, 12px)',
        }}
      >
        {value}
      </div>
    ))}
    <div
      className="sudoku-race-row absolute rounded-md"
      style={{
        left: 0,
        top: sudokuCell(4),
        width: '100%',
        height: sudokuCell(1),
        background: 'rgba(167,139,250,0.12)',
      }}
    />
    {SUDOKU_RACE_ROW.map(({ col, row, value }, index) => (
      <div
        key={`race-${col}-${row}`}
        className="sudoku-race-cell absolute flex items-center justify-center font-black"
        style={{
          ...sudokuCellStyle(col, row),
          fontSize: 'clamp(6px, 1.4vw, 12px)',
          color: 'var(--theme-primary-light)',
          textShadow: '0 0 8px var(--theme-primary)',
          animationDelay: `-${(SUDOKU_RACE_ROW.length - 1 - index) * 0.05}s`,
        }}
      >
        {value}
      </div>
    ))}
  </div>
);

export default SudokuBoardPreview;
