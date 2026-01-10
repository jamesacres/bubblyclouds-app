import { getTechniquesDisplay } from './getTechniquesDisplay';

describe('getTechniquesDisplay', () => {
  describe('Input Validation', () => {
    it('should return empty array for undefined input', () => {
      const result = getTechniquesDisplay(undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty object', () => {
      const result = getTechniquesDisplay({});
      expect(result).toEqual([]);
    });

    it('should handle null techniques object', () => {
      const result = getTechniquesDisplay(null as any);
      expect(result).toEqual([]);
    });
  });

  describe('Basic Techniques', () => {
    it('should display basic category techniques', () => {
      const techniques = {
        basic: {
          lastDigit: 3,
          nakedSingle: 5,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        name: 'Last Digit',
        count: 3,
        color: 'bg-green-500 text-white',
        category: 'basic',
        categoryOrder: 5,
      });
      expect(result).toContainEqual({
        name: 'Naked Single',
        count: 5,
        color: 'bg-green-500 text-white',
        category: 'basic',
        categoryOrder: 5,
      });
    });

    it('should display hiddenSingleBox with correct name', () => {
      const techniques = {
        basic: {
          hiddenSingleBox: 2,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result[0]).toMatchObject({
        name: 'Hidden Single (Box)',
        count: 2,
      });
    });

    it('should display hiddenSingleLine with correct name', () => {
      const techniques = {
        basic: {
          hiddenSingleLine: 4,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result[0]).toMatchObject({
        name: 'Hidden Single (Line)',
        count: 4,
      });
    });
  });

  describe('Simple Techniques', () => {
    it('should display simple category techniques', () => {
      const techniques = {
        simple: {
          nakedPair: 2,
          hiddenPair: 3,
          lockedCandidate: 1,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toHaveLength(3);
      expect(result.every((t) => t.color === 'bg-blue-500 text-white')).toBe(
        true
      );
      expect(result.every((t) => t.categoryOrder === 4)).toBe(true);
    });

    it('should handle nakedTriple and nakedQuadruple', () => {
      const techniques = {
        simple: {
          nakedTriple: 1,
          nakedQuadruple: 2,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toContainEqual({
        name: 'Naked Triple',
        count: 1,
        color: 'bg-blue-500 text-white',
        category: 'simple',
        categoryOrder: 4,
      });
      expect(result).toContainEqual({
        name: 'Naked Quadruple',
        count: 2,
        color: 'bg-blue-500 text-white',
        category: 'simple',
        categoryOrder: 4,
      });
    });
  });

  describe('Advanced Techniques', () => {
    it('should display advanced category techniques', () => {
      const techniques = {
        advanced: {
          xWing: 2,
          yWing: 1,
          swordfish: 3,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toHaveLength(3);
      expect(result.every((t) => t.color === 'bg-yellow-500 text-white')).toBe(
        true
      );
      expect(result.every((t) => t.categoryOrder === 3)).toBe(true);
    });

    it('should handle uniqueRectangle variations', () => {
      const techniques = {
        advanced: {
          uniqueRectangleType1: 1,
          uniqueRectangleType2: 2,
          uniqueRectangleType3: 3,
          uniqueRectangleType4: 1,
          uniqueRectangleType5: 1,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toContainEqual(
        expect.objectContaining({
          name: 'Unique Rectangle Type 1',
          count: 1,
        })
      );
      expect(result).toContainEqual(
        expect.objectContaining({
          name: 'Unique Rectangle Type 5',
          count: 1,
        })
      );
    });

    it('should handle complex wing techniques', () => {
      const techniques = {
        advanced: {
          xYZWing: 2,
          wWing: 1,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toContainEqual(
        expect.objectContaining({
          name: 'XYZ-Wing',
          count: 2,
        })
      );
      expect(result).toContainEqual(
        expect.objectContaining({
          name: 'W-Wing',
          count: 1,
        })
      );
    });
  });

  describe('Hard Techniques', () => {
    it('should display hard category techniques', () => {
      const techniques = {
        hard: {
          jellyfish: 1,
          xChain: 2,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toHaveLength(2);
      expect(result.every((t) => t.color === 'bg-red-500 text-white')).toBe(
        true
      );
      expect(result.every((t) => t.categoryOrder === 2)).toBe(true);
    });

    it('should handle Y-Wing variations', () => {
      const techniques = {
        hard: {
          yWing5: 1,
          yWing6: 2,
          yWing7: 1,
          yWing8: 3,
          yWing9: 1,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toHaveLength(5);
      expect(result).toContainEqual(
        expect.objectContaining({
          name: '5-Y-Wing',
          count: 1,
        })
      );
      expect(result).toContainEqual(
        expect.objectContaining({
          name: '9-Y-Wing',
          count: 1,
        })
      );
    });

    it('should handle BUG technique', () => {
      const techniques = {
        hard: {
          bugBinaryUniversalGrave: 1,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result[0]).toMatchObject({
        name: 'BUG (Binary Universal Grave)',
        count: 1,
      });
    });
  });

  describe('Brutal Techniques', () => {
    it('should display brutal category techniques', () => {
      const techniques = {
        brutal: {
          medusa3D: 1,
          xyChain: 2,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toHaveLength(2);
      expect(result.every((t) => t.color === 'bg-red-600 text-white')).toBe(
        true
      );
      expect(result.every((t) => t.categoryOrder === 1)).toBe(true);
    });

    it('should handle AIC techniques', () => {
      const techniques = {
        brutal: {
          alternatingInferenceChainAIC: 1,
          groupedAlternatingInferenceChainAIC: 2,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toContainEqual(
        expect.objectContaining({
          name: 'Alternating Inference Chain (AIC)',
          count: 1,
        })
      );
      expect(result).toContainEqual(
        expect.objectContaining({
          name: 'Grouped Alternating Inference Chain (AIC)',
          count: 2,
        })
      );
    });
  });

  describe('Beyond Brutal Techniques', () => {
    it('should display beyond brutal category techniques', () => {
      const techniques = {
        beyondBrutal: {
          nishioForcingChain: 1,
          nishioForcingNet: 2,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toHaveLength(2);
      expect(result.every((t) => t.color === 'bg-black text-white')).toBe(true);
      expect(result.every((t) => t.categoryOrder === 0)).toBe(true);
    });

    it('should handle Nishio techniques', () => {
      const techniques = {
        beyondBrutal: {
          nishioForcingChain: 1,
          nishioForcingNet: 1,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toContainEqual(
        expect.objectContaining({
          name: 'Nishio Forcing Chain',
          count: 1,
        })
      );
      expect(result).toContainEqual(
        expect.objectContaining({
          name: 'Nishio Forcing Net',
          count: 1,
        })
      );
    });
  });

  describe('Sorting Behavior', () => {
    it('should sort by category order first', () => {
      const techniques = {
        basic: { nakedSingle: 10 },
        beyondBrutal: { nishioForcingChain: 1 },
        simple: { nakedPair: 5 },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result[0].category).toBe('beyondBrutal');
      expect(result[1].category).toBe('simple');
      expect(result[2].category).toBe('basic');
    });

    it('should sort by count within same category', () => {
      const techniques = {
        basic: {
          nakedSingle: 5,
          lastDigit: 10,
          hiddenSingleBox: 3,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result[0].count).toBe(10);
      expect(result[1].count).toBe(5);
      expect(result[2].count).toBe(3);
    });

    it('should maintain category order across mixed difficulties', () => {
      const techniques = {
        basic: { nakedSingle: 1 },
        simple: { nakedPair: 1 },
        advanced: { xWing: 1 },
        hard: { jellyfish: 1 },
        brutal: { xyChain: 1 },
        beyondBrutal: { nishioForcingChain: 1 },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result.map((t) => t.category)).toEqual([
        'beyondBrutal',
        'brutal',
        'hard',
        'advanced',
        'simple',
        'basic',
      ]);
    });
  });

  describe('Count Filtering', () => {
    it('should exclude techniques with zero count', () => {
      const techniques = {
        basic: {
          nakedSingle: 5,
          lastDigit: 0,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Naked Single');
    });

    it('should exclude techniques with negative count', () => {
      const techniques = {
        basic: {
          nakedSingle: 5,
          lastDigit: -1,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Naked Single');
    });

    it('should include techniques with count of 1', () => {
      const techniques = {
        basic: {
          nakedSingle: 1,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(1);
    });
  });

  describe('Unknown Techniques', () => {
    it('should handle unknown technique names', () => {
      const techniques = {
        basic: {
          unknownTechnique: 5,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result[0]).toMatchObject({
        name: 'unknownTechnique',
        count: 5,
      });
    });

    it('should handle unknown categories with default color', () => {
      const techniques = {
        unknownCategory: {
          someTechnique: 3,
        },
      };

      const result = getTechniquesDisplay(techniques as any);

      expect(result[0]).toMatchObject({
        name: 'someTechnique',
        count: 3,
        color: 'bg-gray-500 text-white',
        categoryOrder: 999,
      });
    });
  });

  describe('Multiple Categories', () => {
    it('should combine techniques from multiple categories', () => {
      const techniques = {
        basic: { nakedSingle: 5 },
        simple: { nakedPair: 3 },
        advanced: { xWing: 2 },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toHaveLength(3);
      expect(result.map((t) => t.category)).toContain('basic');
      expect(result.map((t) => t.category)).toContain('simple');
      expect(result.map((t) => t.category)).toContain('advanced');
    });

    it('should handle all categories at once', () => {
      const techniques = {
        basic: { nakedSingle: 1 },
        simple: { nakedPair: 1 },
        advanced: { xWing: 1 },
        hard: { jellyfish: 1 },
        brutal: { xyChain: 1 },
        beyondBrutal: { nishioForcingChain: 1 },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toHaveLength(6);
    });
  });

  describe('Return Value Structure', () => {
    it('should return array with correct structure', () => {
      const techniques = {
        basic: { nakedSingle: 5 },
      };

      const result = getTechniquesDisplay(techniques);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('count');
      expect(result[0]).toHaveProperty('color');
      expect(result[0]).toHaveProperty('category');
      expect(result[0]).toHaveProperty('categoryOrder');
    });

    it('should have correct types for all properties', () => {
      const techniques = {
        basic: { nakedSingle: 5 },
      };

      const result = getTechniquesDisplay(techniques);

      expect(typeof result[0].name).toBe('string');
      expect(typeof result[0].count).toBe('number');
      expect(typeof result[0].color).toBe('string');
      expect(typeof result[0].category).toBe('string');
      expect(typeof result[0].categoryOrder).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle partial technique objects', () => {
      const techniques = {
        basic: {},
      };

      const result = getTechniquesDisplay(techniques);

      expect(result).toEqual([]);
    });

    it('should handle non-object category values', () => {
      const techniques = {
        basic: null,
      };

      const result = getTechniquesDisplay(techniques as any);

      expect(result).toEqual([]);
    });

    it('should handle very large counts', () => {
      const techniques = {
        basic: {
          nakedSingle: 99999,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result[0].count).toBe(99999);
    });

    it('should handle decimal counts by treating them as numbers', () => {
      const techniques = {
        basic: {
          nakedSingle: 5.5,
        },
      };

      const result = getTechniquesDisplay(techniques);

      expect(result[0].count).toBe(5.5);
    });
  });
});
