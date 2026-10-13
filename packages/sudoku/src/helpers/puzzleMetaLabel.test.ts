import { describe, it, expect } from '@jest/globals';
import { getI18n } from 'react-i18next';
import { derivePuzzleMetaLabel } from './puzzleMetaLabel';

const t = getI18n().getFixedT('en', 'sudoku');
const label = (metadata: Parameters<typeof derivePuzzleMetaLabel>[0]) =>
  derivePuzzleMetaLabel(metadata, t, 'en');

describe('derivePuzzleMetaLabel', () => {
  describe('daily puzzles', () => {
    it('formats a daily puzzle with st suffix', () => {
      expect(label({ sudokuId: 'oftheday-20240101' })).toBe('Daily Jan 1st');
    });

    it('formats a daily puzzle with nd suffix', () => {
      expect(label({ sudokuId: 'oftheday-20240102' })).toBe('Daily Jan 2nd');
    });

    it('formats a daily puzzle with rd suffix', () => {
      expect(label({ sudokuId: 'oftheday-20240103' })).toBe('Daily Jan 3rd');
    });

    it('formats a daily puzzle with th suffix for 4th', () => {
      expect(label({ sudokuId: 'oftheday-20240104' })).toBe('Daily Jan 4th');
    });

    it('formats teen dates with th suffix (11th)', () => {
      expect(label({ sudokuId: 'oftheday-20240111' })).toBe('Daily Jan 11th');
    });

    it('formats teen dates with th suffix (12th)', () => {
      expect(label({ sudokuId: 'oftheday-20240112' })).toBe('Daily Jan 12th');
    });

    it('formats teen dates with th suffix (13th)', () => {
      expect(label({ sudokuId: 'oftheday-20240113' })).toBe('Daily Jan 13th');
    });

    it('formats 21st with st suffix', () => {
      expect(label({ sudokuId: 'oftheday-20240121' })).toBe('Daily Jan 21st');
    });

    it('formats month correctly for December', () => {
      expect(label({ sudokuId: 'oftheday-20241215' })).toBe('Daily Dec 15th');
    });

    it('uses UTC date to avoid timezone issues', () => {
      // 20240101 parses as UTC midnight, so UTC date is always 1st
      expect(label({ sudokuId: 'oftheday-20240101' })).toBe('Daily Jan 1st');
    });
  });

  describe('monthly book puzzles', () => {
    it('formats a book puzzle', () => {
      expect(
        label({
          sudokuBookPuzzleId: 'ofthemonth-202401-puzzle-0',
        })
      ).toBe('Book Jan #1');
    });

    it('formats a later book puzzle number', () => {
      expect(
        label({
          sudokuBookPuzzleId: 'ofthemonth-202412-puzzle-4',
        })
      ).toBe('Book Dec #5');
    });
  });

  describe('scanned puzzles', () => {
    it('returns Scanned Puzzle for a scanned puzzle', () => {
      expect(label({ scannedAt: '2024-01-01T00:00:00.000Z' })).toBe(
        'Scanned Puzzle'
      );
    });

    it('ignores the string "undefined" as scannedAt', () => {
      expect(label({ scannedAt: 'undefined' })).toBe('');
    });
  });

  describe('unknown puzzles', () => {
    it('returns empty string for unknown puzzle type', () => {
      expect(label({})).toBe('');
    });

    it('returns empty string for unrecognised sudokuId format', () => {
      expect(label({ sudokuId: 'custom-puzzle-123' })).toBe('');
    });
  });
});
