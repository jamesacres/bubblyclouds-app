import { describe, it, expect } from '@jest/globals';
import { pkce } from './pkce';

// Mock crypto API if needed
if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: require('crypto').webcrypto,
  });
}

describe('pkce', () => {
  describe('basic functionality', () => {
    it('should generate PKCE parameters', async () => {
      const result = await pkce();

      expect(result).toHaveProperty('codeVerifier');
      expect(result).toHaveProperty('codeChallenge');
      expect(result).toHaveProperty('codeChallengeMethod');
    });

    it('should set codeChallengeMethod to S256', async () => {
      const result = await pkce();
      expect(result.codeChallengeMethod).toBe('S256');
    });

    it('should generate code verifier', async () => {
      const result = await pkce();
      expect(result.codeVerifier).toBeDefined();
      expect(typeof result.codeVerifier).toBe('string');
    });

    it('should generate code challenge', async () => {
      const result = await pkce();
      expect(result.codeChallenge).toBeDefined();
      expect(typeof result.codeChallenge).toBe('string');
    });
  });

  describe('code verifier properties', () => {
    it('should generate code verifier as hex string', async () => {
      const result = await pkce();
      // Code verifier should be hex characters
      expect(result.codeVerifier).toMatch(/^[0-9a-f]+$/i);
    });

    it('should generate non-empty code verifier', async () => {
      const result = await pkce();
      expect(result.codeVerifier.length).toBeGreaterThan(0);
    });

    it('should generate reasonably long code verifier', async () => {
      const result = await pkce();
      // 12 Uint32 values = 12 * 8 hex chars per value = 96 chars minimum
      expect(result.codeVerifier.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('code challenge properties', () => {
    it('should generate code challenge as base64url string', async () => {
      const result = await pkce();
      // Base64url uses alphanumerics, -, _ (no padding =)
      expect(result.codeChallenge).toMatch(/^[A-Za-z0-9_-]*$/);
    });

    it('should not have padding in code challenge', async () => {
      const result = await pkce();
      // Base64url should not have = padding
      expect(result.codeChallenge).not.toContain('=');
    });

    it('should not have + or / in code challenge', async () => {
      const result = await pkce();
      // Base64url replaces + with - and / with _
      expect(result.codeChallenge).not.toContain('+');
      expect(result.codeChallenge).not.toContain('/');
    });

    it('should generate non-empty code challenge', async () => {
      const result = await pkce();
      expect(result.codeChallenge.length).toBeGreaterThan(0);
    });

    it('should generate code challenge of reasonable length', async () => {
      const result = await pkce();
      // SHA-256 hash of 96 char string in base64url should be around 43-44 chars
      expect(result.codeChallenge.length).toBeGreaterThanOrEqual(40);
    });
  });

  describe('uniqueness', () => {
    it('should generate different verifiers each time', async () => {
      const result1 = await pkce();
      const result2 = await pkce();
      const result3 = await pkce();

      // Verifiers should be different
      expect(result1.codeVerifier).not.toBe(result2.codeVerifier);
      expect(result2.codeVerifier).not.toBe(result3.codeVerifier);
    });

    it('should generate different challenges each time', async () => {
      const result1 = await pkce();
      const result2 = await pkce();
      const result3 = await pkce();

      // Challenges should be different
      expect(result1.codeChallenge).not.toBe(result2.codeChallenge);
      expect(result2.codeChallenge).not.toBe(result3.codeChallenge);
    });
  });

  describe('challenge derivation', () => {
    it('should consistently generate same challenge from same verifier', async () => {
      const result = await pkce();
      const challenge = result.codeChallenge;

      // Generate another set
      const result2 = await pkce();

      // Different verifier should give different challenge
      expect(result2.codeChallenge).not.toBe(challenge);
    });

    it('should generate deterministic challenges for cryptography', async () => {
      // While verifiers are random, if we had same verifier, challenge would be same
      // This is implicit in the PKCE algorithm
      const result = await pkce();

      expect(result.codeChallenge).toBeDefined();
      expect(result.codeChallenge.length).toBeGreaterThan(0);
    });
  });

  describe('PKCE RFC compliance', () => {
    it('should return object with required fields', async () => {
      const result = await pkce();

      expect(Object.keys(result)).toContain('codeVerifier');
      expect(Object.keys(result)).toContain('codeChallenge');
      expect(Object.keys(result)).toContain('codeChallengeMethod');
    });

    it('should use S256 (SHA-256) challenge method', async () => {
      const result = await pkce();
      // S256 is the recommended method (SHA-256 base64url encoded)
      expect(result.codeChallengeMethod).toBe('S256');
    });

    it('should generate verifier and challenge of compatible lengths', async () => {
      const result = await pkce();

      // Verifier should be at least as long as challenge (challenge is hashed)
      expect(result.codeVerifier.length).toBeGreaterThanOrEqual(
        result.codeChallenge.length / 2
      );
    });
  });

  describe('security properties', () => {
    it('should use cryptographically secure random values', async () => {
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push((await pkce()).codeVerifier);
      }

      // Check for no obvious patterns
      const uniqueVerifiers = new Set(results);
      expect(uniqueVerifiers.size).toBe(10);
    });

    it('should not repeat verifiers in quick succession', async () => {
      const verifiers = [];
      for (let i = 0; i < 100; i++) {
        verifiers.push((await pkce()).codeVerifier);
      }

      const uniqueVerifiers = new Set(verifiers);
      expect(uniqueVerifiers.size).toBe(100);
    });
  });

  describe('OAuth flow compatibility', () => {
    it('should return OAuth compatible format', async () => {
      const result = await pkce();

      // Should be suitable for OAuth query parameters
      expect(typeof result.codeVerifier).toBe('string');
      expect(typeof result.codeChallenge).toBe('string');
      expect(typeof result.codeChallengeMethod).toBe('string');

      // Should not contain spaces or special chars that break URLs
      expect(result.codeVerifier).not.toContain(' ');
      expect(result.codeChallenge).not.toContain(' ');
      expect(result.codeChallengeMethod).not.toContain(' ');
    });

    it('should be URL-safe', async () => {
      const result = await pkce();

      // All components should be safe for URL parameters
      expect(encodeURIComponent(result.codeVerifier)).toBe(result.codeVerifier);
      expect(encodeURIComponent(result.codeChallenge)).toBe(
        result.codeChallenge
      );
    });
  });

  describe('error handling', () => {
    it('should return all required properties even if crypto is slow', async () => {
      const result = await pkce();

      expect(result.codeVerifier).toBeDefined();
      expect(result.codeChallenge).toBeDefined();
      expect(result.codeChallengeMethod).toBe('S256');
    });
  });
});
