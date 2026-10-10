import { getI18n } from 'react-i18next';
import { sudokuDifficultyDisplay } from './sudokuDifficultyDisplay';

const t = getI18n().getFixedT('en', 'games');

describe('sudokuDifficultyDisplay', () => {
  it('maps a known book difficulty to a label and chip class', () => {
    const display = sudokuDifficultyDisplay('1-very-easy', t);
    expect(display.label).toBe('🟢 Very Easy');
    expect(display.chipClass).toBe('bg-green-400 text-white');
  });

  it('maps a known daily difficulty to a label and chip class', () => {
    const display = sudokuDifficultyDisplay('expert', t);
    expect(display.label).toBe('🔴 Expert');
    expect(display.chipClass).toBe('bg-red-500 text-white');
  });

  it('falls back to the raw id for an unknown difficulty', () => {
    const display = sudokuDifficultyDisplay('mystery', t);
    expect(display.label).toBe('mystery');
    expect(display.chipClass).toBe('bg-gray-500 text-white');
  });
});
