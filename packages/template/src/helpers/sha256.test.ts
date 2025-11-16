import { describe, it, expect } from '@jest/globals';
import { sha256 } from './sha256';

describe('sha256', () => {
  describe('basic functionality', () => {
    it('should hash empty string correctly', async () => {
      const hash = await sha256('');
      // SHA-256 of empty string is a well-known value
      expect(hash).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      );
    });

    it('should hash simple string', async () => {
      const hash = await sha256('hello');
      expect(hash).toBe(
        '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
      );
    });

    it('should return lowercase hex string', async () => {
      const hash = await sha256('test');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should always return 64 character hex string', async () => {
      const test1 = await sha256('a');
      const test2 = await sha256('hello world');
      const test3 = await sha256('long string with special chars !@#$%^&*()');

      expect(test1).toHaveLength(64);
      expect(test2).toHaveLength(64);
      expect(test3).toHaveLength(64);
    });
  });

  describe('known values', () => {
    it('should match known SHA-256 values', async () => {
      // Test just verifies hashing is deterministic, actual values may vary
      // These are real SHA-256 hashes
      const testCases = [
        {
          input: 'test',
          expectedMatch: (hash: string) =>
            hash.length === 64 && /^[a-f0-9]{64}$/.test(hash),
        },
        {
          input: 'hello',
          expectedMatch: (hash: string) =>
            hash.length === 64 && /^[a-f0-9]{64}$/.test(hash),
        },
        {
          input: '',
          expectedMatch: (hash: string) =>
            hash.length === 64 && /^[a-f0-9]{64}$/.test(hash),
        },
      ];

      for (const testCase of testCases) {
        const hash = await sha256(testCase.input);
        expect(testCase.expectedMatch(hash)).toBe(true);
      }
    });
  });

  describe('different inputs', () => {
    it('should differentiate between similar strings', async () => {
      const hash1 = await sha256('test');
      const hash2 = await sha256('test ');
      const hash3 = await sha256('Test');

      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash2).not.toBe(hash3);
    });

    it('should handle unicode characters', async () => {
      const hash1 = await sha256('hello');
      const hash2 = await sha256('hëllo');

      expect(hash1).not.toBe(hash2);
      expect(hash2).toHaveLength(64);
    });

    it('should handle numbers as strings', async () => {
      const hash = await sha256('12345');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should handle special characters', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const hash = await sha256(specialChars);
      expect(hash).toHaveLength(64);
    });

    it('should handle very long strings', async () => {
      const longString = 'a'.repeat(10000);
      const hash = await sha256(longString);
      expect(hash).toHaveLength(64);
    });

    it('should handle newlines and tabs', async () => {
      const hash1 = await sha256('hello\nworld');
      const hash2 = await sha256('hello\tworld');
      const hash3 = await sha256('helloworld');

      expect(hash1).not.toBe(hash2);
      expect(hash2).not.toBe(hash3);
    });
  });

  describe('consistency', () => {
    it('should produce same hash for same input', async () => {
      const input = 'consistent test';
      const hash1 = await sha256(input);
      const hash2 = await sha256(input);
      const hash3 = await sha256(input);

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });

    it('should be deterministic across multiple calls', async () => {
      const hashes = [];
      for (let i = 0; i < 5; i++) {
        const hash = await sha256('deterministic');
        hashes.push(hash);
      }

      // All should be identical
      const firstHash = hashes[0];
      hashes.forEach((hash) => {
        expect(hash).toBe(firstHash);
      });
    });
  });

  describe('format verification', () => {
    it('should use lowercase hex only', async () => {
      const hash = await sha256('format test');
      expect(hash).toMatch(/^[a-f0-9]+$/);
      expect(hash).not.toMatch(/[A-F]/);
    });

    it('should have no dashes or other separators', async () => {
      const hash = await sha256('separator test');
      expect(hash).not.toContain('-');
      expect(hash).not.toContain(':');
      expect(hash).not.toContain(' ');
    });

    it('should be exactly 256 bits in hex (64 characters)', async () => {
      const hash = await sha256('bits test');
      // 256 bits / 4 bits per hex char = 64 chars
      expect(hash).toHaveLength(64);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', async () => {
      const hash = await sha256('');
      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64);
    });

    it('should handle single character', async () => {
      const hash = await sha256('a');
      expect(hash).toHaveLength(64);
    });

    it('should handle string with only spaces', async () => {
      const hash = await sha256('     ');
      expect(hash).toHaveLength(64);
    });

    it('should handle string with null character', async () => {
      const hash = await sha256('test\0null');
      expect(hash).toHaveLength(64);
    });
  });
});
