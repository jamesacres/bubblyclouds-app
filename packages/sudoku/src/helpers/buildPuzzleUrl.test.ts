import { describe, it, expect } from '@jest/globals';
import { buildPuzzleUrl, buildPuzzleUrlFromState } from './buildPuzzleUrl';
import { GameStateMetadata } from '../types/state';
import { Puzzle } from '../types/puzzle';
import { BaseState } from '@sudoku-web/template/types/state';

describe('buildPuzzleUrl', () => {
  describe('basic functionality', () => {
    it('should generate puzzle URL with initial and final states', () => {
      const url = buildPuzzleUrl(
        '123456789' + '0'.repeat(72),
        '.' + '1'.repeat(80)
      );

      expect(url).toContain('/puzzle?');
      expect(url).toContain('initial=');
      expect(url).toContain('final=');
    });

    it('should start with /puzzle?', () => {
      const url = buildPuzzleUrl('test', 'test');
      expect(url.startsWith('/puzzle?')).toBe(true);
    });

    it('should include initial parameter', () => {
      const initial = '1'.repeat(81);
      const url = buildPuzzleUrl(initial, '2'.repeat(81));

      expect(url).toContain(`initial=${initial}`);
    });

    it('should include final parameter', () => {
      const final = '3'.repeat(81);
      const url = buildPuzzleUrl('1'.repeat(81), final);

      expect(url).toContain(`final=${final}`);
    });
  });

  describe('without metadata', () => {
    it('should not include metadata parameters when undefined', () => {
      const url = buildPuzzleUrl('initial', 'final');

      expect(url).not.toContain('difficulty=');
      expect(url).not.toContain('sudokuId=');
      expect(url).not.toContain('sudokuBookPuzzleId=');
      expect(url).not.toContain('scannedAt=');
    });

    it('should create valid URL without metadata', () => {
      const url = buildPuzzleUrl('a'.repeat(81), 'b'.repeat(81));

      // Should be able to parse as URL
      expect(() => new URL(url, 'http://localhost')).not.toThrow();
    });
  });

  describe('with metadata', () => {
    it('should include single metadata field', () => {
      const metadata: Partial<GameStateMetadata> = {
        difficulty: 'easy',
      };

      const url = buildPuzzleUrl('initial', 'final', metadata);
      expect(url).toContain('difficulty=easy');
    });

    it('should include multiple metadata fields', () => {
      const metadata: Partial<GameStateMetadata> = {
        difficulty: 'hard',
        sudokuId: 'daily_2024_01_01',
      };

      const url = buildPuzzleUrl('initial', 'final', metadata);
      expect(url).toContain('difficulty=hard');
      expect(url).toContain('sudokuId=daily_2024_01_01');
    });

    it('should include all metadata fields', () => {
      const metadata: Partial<GameStateMetadata> = {
        difficulty: 'medium',
        sudokuId: 'puzzle-123',
        sudokuBookPuzzleId: 'book-456',
        scannedAt: '2024-01-01T12:00:00Z',
      };

      const url = buildPuzzleUrl('initial', 'final', metadata);

      expect(url).toContain('difficulty=medium');
      expect(url).toContain('sudokuId=puzzle-123');
      expect(url).toContain('sudokuBookPuzzleId=book-456');
      expect(url).toContain('scannedAt=2024-01-01T12%3A00%3A00Z');
    });

    it('should handle empty metadata object', () => {
      const url = buildPuzzleUrl('initial', 'final', {});

      expect(url).toContain('/puzzle?');
      expect(url).toContain('initial=initial');
      expect(url).toContain('final=final');
    });
  });

  describe('already completed flag', () => {
    it('should add alreadyCompleted=true when true', () => {
      const url = buildPuzzleUrl('initial', 'final', {}, true);

      expect(url).toContain('alreadyCompleted=true');
    });

    it('should add alreadyCompleted=false when false', () => {
      const url = buildPuzzleUrl('initial', 'final', {}, false);

      expect(url).toContain('alreadyCompleted=false');
    });

    it('should not add alreadyCompleted when undefined', () => {
      const url = buildPuzzleUrl('initial', 'final', {}, undefined);

      expect(url).not.toContain('alreadyCompleted');
    });

    it('should work with metadata and alreadyCompleted', () => {
      const metadata: Partial<GameStateMetadata> = {
        difficulty: 'easy',
      };

      const url = buildPuzzleUrl('initial', 'final', metadata, true);

      expect(url).toContain('difficulty=easy');
      expect(url).toContain('alreadyCompleted=true');
    });
  });

  describe('parameter encoding', () => {
    it('should handle special characters in puzzle states', () => {
      const url = buildPuzzleUrl('1.2.3.4.5', '9.8.7.6.5');

      expect(url).toContain('1.2.3.4.5');
      expect(url).toContain('9.8.7.6.5');
    });

    it('should properly encode URL parameters', () => {
      const url = buildPuzzleUrl('test initial', 'test final');

      // URLSearchParams encodes spaces as +
      expect(url).toContain('initial=test+initial');
      expect(url).toContain('final=test+final');
    });

    it('should handle metadata with special characters', () => {
      const metadata: Partial<GameStateMetadata> = {
        sudokuId: 'daily_2024-01-01 puzzle',
      };

      const url = buildPuzzleUrl('initial', 'final', metadata);

      // Should encode the sudokuId properly
      expect(url).toContain('sudokuId=');
    });

    it('should handle ISO datetime in metadata', () => {
      const metadata: Partial<GameStateMetadata> = {
        scannedAt: '2024-01-01T12:00:00Z',
      };

      const url = buildPuzzleUrl('initial', 'final', metadata);

      expect(url).toContain('scannedAt=');
      // The Z should be encoded as %3A for colon
      expect(url.includes('2024-01-01T12%3A00%3A00Z')).toBeTruthy();
    });
  });

  describe('URL structure', () => {
    it('should have correct parameter order', () => {
      const url = buildPuzzleUrl('init', 'final', { difficulty: 'hard' }, true);

      // URL should have ? separating path from params
      const [path, params] = url.split('?');
      expect(path).toBe('/puzzle');
      expect(params).toBeDefined();
    });

    it('should separate parameters with &', () => {
      const metadata: Partial<GameStateMetadata> = {
        difficulty: 'easy',
        sudokuId: 'test',
      };

      const url = buildPuzzleUrl('initial', 'final', metadata);

      // Should have & between parameters
      expect(url).toMatch(/&/);
    });

    it('should be parseable as URL', () => {
      const url = buildPuzzleUrl('1'.repeat(81), '2'.repeat(81), {
        difficulty: 'medium',
      });

      expect(() => {
        new URL(url, 'http://localhost');
      }).not.toThrow();
    });

    it('should be usable with URLSearchParams', () => {
      const url = buildPuzzleUrl(
        'initial',
        'final',
        { difficulty: 'hard' },
        true
      );
      const params = url.split('?')[1];
      const searchParams = new URLSearchParams(params);

      expect(searchParams.get('initial')).toBe('initial');
      expect(searchParams.get('final')).toBe('final');
      expect(searchParams.get('difficulty')).toBe('hard');
      expect(searchParams.get('alreadyCompleted')).toBe('true');
    });
  });

  describe('puzzle text handling', () => {
    it('should handle standard 81-character puzzle string', () => {
      const puzzle =
        '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
      const solved =
        '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

      const url = buildPuzzleUrl(puzzle, solved);

      expect(url).toContain(puzzle);
      expect(url).toContain(solved);
    });

    it('should handle empty dot notation', () => {
      const empty = '.'.repeat(81);
      const solved = '1'.repeat(81);

      const url = buildPuzzleUrl(empty, solved);

      expect(url).toContain('.'.repeat(81));
    });

    it('should handle mixed dot and number notation', () => {
      const mixed =
        '5..7......6..195....9....6..8...6...34..8.3..17...2...6.6....28....419..5....8.79';

      const url = buildPuzzleUrl(mixed, '9'.repeat(81));

      expect(url).toContain(mixed);
    });
  });

  describe('metadata variations', () => {
    it('should handle difficulty levels', () => {
      const difficulties = ['easy', 'medium', 'hard', 'expert'];

      difficulties.forEach((difficulty) => {
        const url = buildPuzzleUrl('initial', 'final', { difficulty });
        expect(url).toContain(`difficulty=${difficulty}`);
      });
    });

    it('should handle puzzle IDs', () => {
      const metadata: Partial<GameStateMetadata> = {
        sudokuId: 'daily_oftheday_2024_01_15',
      };

      const url = buildPuzzleUrl('initial', 'final', metadata);
      expect(url).toContain('sudokuId=daily_oftheday_2024_01_15');
    });

    it('should handle book puzzle IDs', () => {
      const metadata: Partial<GameStateMetadata> = {
        sudokuBookPuzzleId: 'book-hardcover-vol1-puzzle-42',
      };

      const url = buildPuzzleUrl('initial', 'final', metadata);
      expect(url).toContain('sudokuBookPuzzleId=book-hardcover-vol1-puzzle-42');
    });

    it('should handle scanned puzzle dates', () => {
      const metadata: Partial<GameStateMetadata> = {
        scannedAt: '2024-01-15T14:30:45.123Z',
      };

      const url = buildPuzzleUrl('initial', 'final', metadata);
      expect(url).toContain('scannedAt=');
    });
  });

  describe('edge cases', () => {
    it('should handle null metadata gracefully', () => {
      // Function doesn't throw on null, it handles it
      const url = buildPuzzleUrl('a', 'b', null as any);
      expect(url).toContain('/puzzle?');
      expect(url).toContain('initial=a');
      expect(url).toContain('final=b');
    });

    it('should handle very long puzzle strings', () => {
      const longPuzzle = 'a'.repeat(1000);
      const url = buildPuzzleUrl(longPuzzle, longPuzzle);

      expect(url).toContain('initial=');
      expect(url.length).toBeGreaterThan(2000);
    });

    it('should handle empty string puzzles', () => {
      const url = buildPuzzleUrl('', '');

      expect(url).toContain('initial=');
      expect(url).toContain('final=');
    });

    it('should not double-encode already encoded values', () => {
      const metadata: Partial<GameStateMetadata> = {
        difficulty: 'test%20value',
      };

      const url = buildPuzzleUrl('initial', 'final', metadata);

      // Should handle % in values
      expect(url).toContain('difficulty=');
    });
  });

  describe('integration scenarios', () => {
    it('should create shareable puzzle URL', () => {
      const initial =
        '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
      const final =
        '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

      const metadata: Partial<GameStateMetadata> = {
        difficulty: 'medium',
        sudokuId: 'daily_2024_01_15',
      };

      const url = buildPuzzleUrl(initial, final, metadata);

      // Should be valid and complete
      expect(url.startsWith('/puzzle?')).toBe(true);
      expect(url).toContain('initial=');
      expect(url).toContain('final=');
      expect(url).toContain('difficulty=medium');
      expect(url).toContain('sudokuId=daily_2024_01_15');
    });

    it('should create URL for completed puzzle share', () => {
      const puzzle = '1'.repeat(81);
      const solved = '2'.repeat(81);

      const url = buildPuzzleUrl(puzzle, solved, {}, true);

      expect(url).toContain('alreadyCompleted=true');
    });

    it('should create URL for book puzzle', () => {
      const metadata: Partial<GameStateMetadata> = {
        sudokuBookPuzzleId: 'book-123-puzzle-45',
        difficulty: 'hard',
      };

      const url = buildPuzzleUrl('initial', 'final', metadata);

      expect(url).toContain('sudokuBookPuzzleId=');
      expect(url).toContain('difficulty=hard');
    });
  });
});

describe('buildPuzzleUrlFromState', () => {
  const createEmptyPuzzle = (): Puzzle<number> => {
    const emptyRow = { 0: [0, 0, 0], 1: [0, 0, 0], 2: [0, 0, 0] };
    const emptyBox = { 0: emptyRow, 1: emptyRow, 2: emptyRow };
    return { 0: emptyBox, 1: emptyBox, 2: emptyBox };
  };

  it('should build URL from state object', () => {
    const state: BaseState<Puzzle<number>> = {
      initial: createEmptyPuzzle(),
      final: createEmptyPuzzle(),
      answerStack: [],
      metadata: {},
    };

    const url = buildPuzzleUrlFromState(state);

    expect(url).toContain('/puzzle?');
    expect(url).toContain('initial=');
    expect(url).toContain('final=');
  });

  it('should include metadata from state', () => {
    const state: BaseState<Puzzle<number>> = {
      initial: createEmptyPuzzle(),
      final: createEmptyPuzzle(),
      answerStack: [],
      metadata: {
        difficulty: 'hard',
        sudokuId: 'test-123',
      },
    };

    const url = buildPuzzleUrlFromState(state);

    expect(url).toContain('difficulty=hard');
    expect(url).toContain('sudokuId=test-123');
  });

  it('should include isCompleted flag when provided', () => {
    const state: BaseState<Puzzle<number>> = {
      initial: createEmptyPuzzle(),
      final: createEmptyPuzzle(),
      answerStack: [],
      metadata: {},
    };

    const url = buildPuzzleUrlFromState(state, true);

    expect(url).toContain('alreadyCompleted=true');
  });

  it('should not include alreadyCompleted when not provided', () => {
    const state: BaseState<Puzzle<number>> = {
      initial: createEmptyPuzzle(),
      final: createEmptyPuzzle(),
      answerStack: [],
      metadata: {},
    };

    const url = buildPuzzleUrlFromState(state);

    expect(url).not.toContain('alreadyCompleted');
  });
});
