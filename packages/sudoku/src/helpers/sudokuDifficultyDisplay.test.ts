import { sudokuDifficultyDisplay } from './sudokuDifficultyDisplay';

describe('sudokuDifficultyDisplay', () => {
  it('maps a known book difficulty to a label and chip class', () => {
    const display = sudokuDifficultyDisplay('1-very-easy');
    expect(display.label).toBe('🟢 Very Easy');
    expect(display.chipClass).toBe('bg-green-400 text-white');
  });

  it('maps a known daily difficulty to a label and chip class', () => {
    const display = sudokuDifficultyDisplay('expert');
    expect(display.label).toBe('🔴 Expert');
    expect(display.chipClass).toBe('bg-red-500 text-white');
  });

  it('falls back to the raw id for an unknown difficulty', () => {
    const display = sudokuDifficultyDisplay('mystery');
    expect(display.label).toBe('mystery');
    expect(display.chipClass).toBe('bg-gray-500 text-white');
  });
});
