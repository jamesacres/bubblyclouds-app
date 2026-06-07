import { describe, it, expect } from '@jest/globals';
import { fmtClock, fmtElapsed, avatarGradient } from './playerAvatar';

describe('fmtClock', () => {
  it('formats zero seconds', () => {
    expect(fmtClock(0)).toBe('0:00');
  });

  it('formats seconds under a minute', () => {
    expect(fmtClock(9)).toBe('0:09');
    expect(fmtClock(59)).toBe('0:59');
  });

  it('formats exactly one minute', () => {
    expect(fmtClock(60)).toBe('1:00');
  });

  it('formats minutes and seconds', () => {
    expect(fmtClock(75)).toBe('1:15');
    expect(fmtClock(3661)).toBe('61:01');
  });

  it('pads seconds with leading zero', () => {
    expect(fmtClock(61)).toBe('1:01');
    expect(fmtClock(600)).toBe('10:00');
  });
});

describe('fmtElapsed', () => {
  it('formats elapsed time under an hour in minutes', () => {
    expect(fmtElapsed(60000)).toBe('1m ago');
    expect(fmtElapsed(30 * 60000)).toBe('30m ago');
    expect(fmtElapsed(59 * 60000)).toBe('59m ago');
  });

  it('formats elapsed time under 48 hours in hours', () => {
    expect(fmtElapsed(60 * 60000)).toBe('1h ago');
    expect(fmtElapsed(24 * 3600000)).toBe('24h ago');
    expect(fmtElapsed(47 * 3600000)).toBe('47h ago');
  });

  it('formats elapsed time 48 hours or more in days', () => {
    expect(fmtElapsed(48 * 3600000)).toBe('2d ago');
    expect(fmtElapsed(7 * 24 * 3600000)).toBe('7d ago');
  });
});

describe('avatarGradient', () => {
  it('returns a gradient string', () => {
    const result = avatarGradient('Alice');
    expect(result).toMatch(/^linear-gradient/);
  });

  it('is deterministic for the same input', () => {
    expect(avatarGradient('Bob')).toBe(avatarGradient('Bob'));
  });

  it('returns different gradients for different names', () => {
    const gradients = new Set([
      avatarGradient('Alice'),
      avatarGradient('Bob'),
      avatarGradient('Charlie'),
      avatarGradient('Diana'),
      avatarGradient('Eve'),
    ]);
    expect(gradients.size).toBeGreaterThan(1);
  });

  it('handles empty string without throwing', () => {
    expect(() => avatarGradient('')).not.toThrow();
  });
});
