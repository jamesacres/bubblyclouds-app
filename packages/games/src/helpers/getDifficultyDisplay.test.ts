import { getI18n } from 'react-i18next';
import { getDifficultyDisplay as getDifficultyDisplayWithT } from './getDifficultyDisplay';

const t = getI18n().getFixedT('en', 'games');

const getDifficultyDisplay = (difficulty: string) =>
  getDifficultyDisplayWithT(difficulty, t);

describe('getDifficultyDisplay', () => {
  describe('Standard Difficulty Levels', () => {
    it('should return correct display for simple difficulty', () => {
      const result = getDifficultyDisplay('simple');
      expect(result).toEqual({
        name: '⚡️ Tricky',
        badgeColor: 'bg-green-500 text-white',
      });
    });

    it('should return correct display for easy difficulty', () => {
      const result = getDifficultyDisplay('easy');
      expect(result).toEqual({
        name: '🔥 Challenging',
        badgeColor: 'bg-yellow-500 text-white',
      });
    });

    it('should return correct display for intermediate difficulty', () => {
      const result = getDifficultyDisplay('intermediate');
      expect(result).toEqual({
        name: '🚀 Hard',
        badgeColor: 'bg-red-500 text-white',
      });
    });

    it('should return correct display for expert difficulty', () => {
      const result = getDifficultyDisplay('expert');
      expect(result).toEqual({
        name: '🔴 Expert',
        badgeColor: 'bg-red-500 text-white',
      });
    });
  });

  describe('Book Puzzle Difficulty Levels', () => {
    it('should return correct display for 1-very-easy difficulty', () => {
      const result = getDifficultyDisplay('1-very-easy');
      expect(result).toEqual({
        name: '🟢 Very Easy',
        badgeColor: 'bg-green-400 text-white',
      });
    });

    it('should return correct display for 2-easy difficulty', () => {
      const result = getDifficultyDisplay('2-easy');
      expect(result).toEqual({
        name: '🟢 Easy',
        badgeColor: 'bg-green-500 text-white',
      });
    });

    it('should return correct display for 3-moderately-easy difficulty', () => {
      const result = getDifficultyDisplay('3-moderately-easy');
      expect(result).toEqual({
        name: '🟡 Moderately Easy',
        badgeColor: 'bg-lime-600 text-white',
      });
    });

    it('should return correct display for 4-moderate difficulty', () => {
      const result = getDifficultyDisplay('4-moderate');
      expect(result).toEqual({
        name: '🟡 Moderate',
        badgeColor: 'bg-yellow-600 text-white',
      });
    });

    it('should return correct display for 5-moderately-hard difficulty', () => {
      const result = getDifficultyDisplay('5-moderately-hard');
      expect(result).toEqual({
        name: '🟠 Moderately Hard',
        badgeColor: 'bg-orange-500 text-white',
      });
    });

    it('should return correct display for 6-hard difficulty', () => {
      const result = getDifficultyDisplay('6-hard');
      expect(result).toEqual({
        name: '🔴 Hard',
        badgeColor: 'bg-red-500 text-white',
      });
    });

    it('should return correct display for 7-vicious difficulty', () => {
      const result = getDifficultyDisplay('7-vicious');
      expect(result).toEqual({
        name: '🔥 Vicious',
        badgeColor: 'bg-red-600 text-white',
      });
    });

    it('should return correct display for 8-fiendish difficulty', () => {
      const result = getDifficultyDisplay('8-fiendish');
      expect(result).toEqual({
        name: '🔥 Fiendish',
        badgeColor: 'bg-red-700 text-white',
      });
    });

    it('should return correct display for 9-devilish difficulty', () => {
      const result = getDifficultyDisplay('9-devilish');
      expect(result).toEqual({
        name: '🔥 Devilish',
        badgeColor: 'bg-red-800 text-white',
      });
    });

    it('should return correct display for 10-hell difficulty', () => {
      const result = getDifficultyDisplay('10-hell');
      expect(result).toEqual({
        name: '🔥🔥 Hell',
        badgeColor: 'bg-red-900 text-white',
      });
    });

    it('should return correct display for 11-beyond-hell difficulty', () => {
      const result = getDifficultyDisplay('11-beyond-hell');
      expect(result).toEqual({
        name: '🔥🔥🔥 Beyond Hell',
        badgeColor: 'bg-black text-white',
      });
    });
  });

  describe('Edge Cases and Unknown Difficulties', () => {
    it('should return default display for unknown difficulty', () => {
      const result = getDifficultyDisplay('unknown-difficulty');
      expect(result).toEqual({
        name: 'unknown-difficulty',
        badgeColor: 'bg-gray-500 text-white',
      });
    });

    it('should return default display for empty string', () => {
      const result = getDifficultyDisplay('');
      expect(result).toEqual({
        name: '',
        badgeColor: 'bg-gray-500 text-white',
      });
    });

    it('should handle case sensitivity', () => {
      const result = getDifficultyDisplay('SIMPLE');
      expect(result).toEqual({
        name: 'SIMPLE',
        badgeColor: 'bg-gray-500 text-white',
      });
    });

    it('should handle numeric difficulty strings', () => {
      const result = getDifficultyDisplay('123');
      expect(result).toEqual({
        name: '123',
        badgeColor: 'bg-gray-500 text-white',
      });
    });

    it('should handle special characters in difficulty', () => {
      const result = getDifficultyDisplay('test@#$');
      expect(result).toEqual({
        name: 'test@#$',
        badgeColor: 'bg-gray-500 text-white',
      });
    });
  });

  describe('Return Value Consistency', () => {
    it('should always return an object with name and badgeColor properties', () => {
      const difficulties = [
        'simple',
        'easy',
        'intermediate',
        'expert',
        '1-very-easy',
        '11-beyond-hell',
        'unknown',
      ];

      difficulties.forEach((difficulty) => {
        const result = getDifficultyDisplay(difficulty);
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('badgeColor');
        expect(typeof result.name).toBe('string');
        expect(typeof result.badgeColor).toBe('string');
      });
    });

    it('should always return badge color with Tailwind classes', () => {
      const difficulties = ['simple', '5-moderately-hard', 'unknown'];

      difficulties.forEach((difficulty) => {
        const result = getDifficultyDisplay(difficulty);
        expect(result.badgeColor).toContain('bg-');
        expect(result.badgeColor).toContain('text-white');
      });
    });
  });
});
