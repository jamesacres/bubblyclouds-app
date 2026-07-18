import { createRng, sampleIndex } from './rng';

describe('createRng', () => {
  it('produces an identical sequence for the same seed', () => {
    const a = createRng(12345);
    const b = createRng(12345);
    const sequenceA = Array.from({ length: 100 }, () => a());
    const sequenceB = Array.from({ length: 100 }, () => b());
    expect(sequenceA).toEqual(sequenceB);
  });

  it('produces different sequences for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    const sequenceA = Array.from({ length: 20 }, () => a());
    const sequenceB = Array.from({ length: 20 }, () => b());
    expect(sequenceA).not.toEqual(sequenceB);
  });

  it('returns values in [0, 1)', () => {
    const rng = createRng(987654321);
    for (let i = 0; i < 10000; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('is roughly uniform across buckets', () => {
    const rng = createRng(42);
    const buckets = new Array<number>(10).fill(0);
    const draws = 100000;
    for (let i = 0; i < draws; i += 1) {
      buckets[Math.floor(rng() * 10)] += 1;
    }
    const expected = draws / 10;
    for (const count of buckets) {
      expect(count).toBeGreaterThan(expected * 0.9);
      expect(count).toBeLessThan(expected * 1.1);
    }
  });
});

describe('sampleIndex', () => {
  it('stays within bounds over many draws', () => {
    const rng = createRng(7);
    const length = 124;
    for (let i = 0; i < 10000; i += 1) {
      const index = sampleIndex(rng, length);
      expect(Number.isInteger(index)).toBe(true);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(length);
    }
  });

  it('reaches both the first and last index', () => {
    const rng = createRng(11);
    const seen = new Set<number>();
    for (let i = 0; i < 10000; i += 1) {
      seen.add(sampleIndex(rng, 5));
    }
    expect(seen.has(0)).toBe(true);
    expect(seen.has(4)).toBe(true);
    expect(seen.size).toBe(5);
  });

  it('throws for non-positive length', () => {
    const rng = createRng(3);
    expect(() => sampleIndex(rng, 0)).toThrow(
      'sampleIndex requires a positive length'
    );
  });
});
