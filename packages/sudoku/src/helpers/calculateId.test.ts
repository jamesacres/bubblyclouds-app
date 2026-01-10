import { describe, it, expect } from '@jest/globals';
import {
  calculateBoxId,
  calculateCellId,
  splitCellId,
  calculateNextCellId,
} from './calculateId';

describe('calculateId helpers', () => {
  describe('calculateBoxId', () => {
    it('should generate correct box ID with valid coordinates', () => {
      expect(calculateBoxId(0, 0)).toBe('box:0,0');
      expect(calculateBoxId(1, 1)).toBe('box:1,1');
      expect(calculateBoxId(2, 2)).toBe('box:2,2');
    });

    it('should handle all valid box coordinates', () => {
      for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
          expect(calculateBoxId(x, y)).toBe(`box:${x},${y}`);
        }
      }
    });
  });

  describe('calculateCellId', () => {
    it('should generate correct cell ID with valid coordinates', () => {
      const boxId = 'box:0,0';
      expect(calculateCellId(boxId, 0, 0)).toBe('box:0,0,cell:0,0');
      expect(calculateCellId(boxId, 1, 2)).toBe('box:0,0,cell:1,2');
    });

    it('should append cell coordinates to box ID', () => {
      const boxId = 'box:1,2';
      expect(calculateCellId(boxId, 0, 1)).toBe('box:1,2,cell:0,1');
    });

    it('should handle all valid cell coordinates within a box', () => {
      const boxId = 'box:0,0';
      for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
          expect(calculateCellId(boxId, x, y)).toBe(`box:0,0,cell:${x},${y}`);
        }
      }
    });
  });

  describe('splitCellId', () => {
    it('should correctly parse valid cell ID', () => {
      const result = splitCellId('box:0,0,cell:0,0');
      expect(result.box.x).toBe(0);
      expect(result.box.y).toBe(0);
      expect(result.cell.x).toBe(0);
      expect(result.cell.y).toBe(0);
    });

    it('should handle all valid cell coordinates', () => {
      for (let bx = 0; bx < 3; bx++) {
        for (let by = 0; by < 3; by++) {
          for (let cx = 0; cx < 3; cx++) {
            for (let cy = 0; cy < 3; cy++) {
              const cellId = `box:${bx},${by},cell:${cx},${cy}`;
              const result = splitCellId(cellId);
              expect(result.box.x).toBe(bx);
              expect(result.box.y).toBe(by);
              expect(result.cell.x).toBe(cx);
              expect(result.cell.y).toBe(cy);
            }
          }
        }
      }
    });

    it('should handle invalid cell ID format gracefully', () => {
      const result = splitCellId('invalid-format');
      expect(result.box.x).toBe(0);
      expect(result.box.y).toBe(0);
      expect(result.cell.x).toBe(0);
      expect(result.cell.y).toBe(0);
    });

    it('should handle empty string gracefully', () => {
      const result = splitCellId('');
      expect(result.box.x).toBe(0);
      expect(result.box.y).toBe(0);
      expect(result.cell.x).toBe(0);
      expect(result.cell.y).toBe(0);
    });

    it('should handle malformed coordinates', () => {
      const result = splitCellId('box:5,5,cell:5,5');
      // Should gracefully return default values
      expect(result.box.x).toBe(0);
      expect(result.box.y).toBe(0);
    });
  });

  describe('calculateNextCellId', () => {
    describe('moving down', () => {
      it('should move down within same box', () => {
        const result = calculateNextCellId('box:0,0,cell:0,0', 'down');
        expect(result).toBe('box:0,0,cell:0,1');
      });

      it('should move to next box when at bottom of current box', () => {
        const result = calculateNextCellId('box:0,0,cell:0,2', 'down');
        expect(result).toBe('box:0,1,cell:0,0');
      });

      it('should not move beyond bottom-right box', () => {
        const result = calculateNextCellId('box:0,2,cell:0,2', 'down');
        expect(result).toBe('box:0,2,cell:0,2');
      });

      it('should handle all valid down movements', () => {
        for (let bx = 0; bx < 3; bx++) {
          for (let by = 0; by < 2; by++) {
            for (let cx = 0; cx < 3; cx++) {
              for (let cy = 0; cy < 3; cy++) {
                const cellId = `box:${bx},${by},cell:${cx},${cy}`;
                const result = calculateNextCellId(cellId, 'down');
                expect(result).toMatch(/box:[0-2],[0-2],cell:[0-2],[0-2]/);
              }
            }
          }
        }
      });
    });

    describe('moving up', () => {
      it('should move up within same box', () => {
        const result = calculateNextCellId('box:0,0,cell:0,1', 'up');
        expect(result).toBe('box:0,0,cell:0,0');
      });

      it('should move to previous box when at top of current box', () => {
        const result = calculateNextCellId('box:0,1,cell:0,0', 'up');
        expect(result).toBe('box:0,0,cell:0,2');
      });

      it('should not move beyond top-left box', () => {
        const result = calculateNextCellId('box:0,0,cell:0,0', 'up');
        expect(result).toBe('box:0,0,cell:0,0');
      });
    });

    describe('moving left', () => {
      it('should move left within same box', () => {
        const result = calculateNextCellId('box:0,0,cell:1,0', 'left');
        expect(result).toBe('box:0,0,cell:0,0');
      });

      it('should move to previous box when at left edge of current box', () => {
        const result = calculateNextCellId('box:1,0,cell:0,0', 'left');
        expect(result).toBe('box:0,0,cell:2,0');
      });

      it('should not move beyond left edge', () => {
        const result = calculateNextCellId('box:0,0,cell:0,0', 'left');
        expect(result).toBe('box:0,0,cell:0,0');
      });
    });

    describe('moving right', () => {
      it('should move right within same box', () => {
        const result = calculateNextCellId('box:0,0,cell:0,0', 'right');
        expect(result).toBe('box:0,0,cell:1,0');
      });

      it('should move to next box when at right edge of current box', () => {
        const result = calculateNextCellId('box:0,0,cell:2,0', 'right');
        expect(result).toBe('box:1,0,cell:0,0');
      });

      it('should not move beyond right edge', () => {
        const result = calculateNextCellId('box:2,0,cell:2,0', 'right');
        expect(result).toBe('box:2,0,cell:2,0');
      });
    });

    it('should handle corners correctly', () => {
      // Top-left corner
      expect(calculateNextCellId('box:0,0,cell:0,0', 'up')).toBe(
        'box:0,0,cell:0,0'
      );
      expect(calculateNextCellId('box:0,0,cell:0,0', 'left')).toBe(
        'box:0,0,cell:0,0'
      );

      // Bottom-right corner
      expect(calculateNextCellId('box:2,2,cell:2,2', 'down')).toBe(
        'box:2,2,cell:2,2'
      );
      expect(calculateNextCellId('box:2,2,cell:2,2', 'right')).toBe(
        'box:2,2,cell:2,2'
      );
    });
  });
});
