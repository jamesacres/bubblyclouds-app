import React from 'react';
import { render, act } from '@testing-library/react';
import { CountUp } from './CountUp';

type FrameCallback = (time: number) => void;

describe('CountUp', () => {
  let frameCallbacks: Map<number, FrameCallback>;
  let nextFrameId: number;
  let now: number;

  const flushFrame = (advanceMs: number) => {
    now += advanceMs;
    const callbacks = Array.from(frameCallbacks.entries());
    frameCallbacks = new Map();
    act(() => {
      callbacks.forEach(([, cb]) => cb(now));
    });
  };

  const setReducedMotion = (reduce: boolean) => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: reduce,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  };

  beforeEach(() => {
    jest.useFakeTimers();
    frameCallbacks = new Map();
    nextFrameId = 1;
    now = 0;

    window.requestAnimationFrame = jest.fn((cb: FrameCallback) => {
      const id = nextFrameId++;
      frameCallbacks.set(id, cb);
      return id;
    });
    window.cancelAnimationFrame = jest.fn((id: number) => {
      frameCallbacks.delete(id);
    });

    setReducedMotion(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders 0 before any frame runs', () => {
    const { container } = render(<CountUp value={100} />);
    const visible = container.querySelector('[aria-hidden="true"]');
    expect(visible?.textContent).toBe('0');
  });

  it('animates towards the final value with ease-out over frames', () => {
    const { container } = render(<CountUp value={100} durationMs={900} />);
    const visible = container.querySelector('[aria-hidden="true"]');

    flushFrame(0);
    flushFrame(450);
    const mid = Number(visible?.textContent);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(100);

    flushFrame(450);
    expect(visible?.textContent).toBe('100');
  });

  it('fires onDone when the animation completes', () => {
    const onDone = jest.fn();
    render(<CountUp value={50} durationMs={900} onDone={onDone} />);

    flushFrame(0);
    flushFrame(900);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('applies prefix and suffix', () => {
    const { container } = render(
      <CountUp value={20} prefix="+" suffix=" pts" />
    );
    flushFrame(0);
    flushFrame(1000);
    const visible = container.querySelector('[aria-hidden="true"]');
    expect(visible?.textContent).toBe('+20 pts');
  });

  it('uses a custom format function', () => {
    const { container } = render(
      <CountUp value={1000} format={(v) => v.toLocaleString('en-US')} />
    );
    flushFrame(0);
    flushFrame(1000);
    const visible = container.querySelector('[aria-hidden="true"]');
    expect(visible?.textContent).toBe('1,000');
  });

  it('exposes the final value in an aria-live polite span', () => {
    const { container } = render(<CountUp value={42} prefix="+" />);
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toHaveClass('sr-only');
    expect(live?.textContent).toBe('+42');
  });

  it('waits for startDelayMs before starting', () => {
    const { container } = render(
      <CountUp value={100} startDelayMs={500} durationMs={900} />
    );
    const visible = container.querySelector('[aria-hidden="true"]');

    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    expect(visible?.textContent).toBe('0');

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(window.requestAnimationFrame).toHaveBeenCalled();

    flushFrame(0);
    flushFrame(900);
    expect(visible?.textContent).toBe('100');
  });

  it('jumps to the final value and fires onDone when reduced motion is preferred', () => {
    setReducedMotion(true);
    const onDone = jest.fn();
    const { container } = render(<CountUp value={77} onDone={onDone} />);

    const visible = container.querySelector('[aria-hidden="true"]');
    expect(visible?.textContent).toBe('77');
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('cancels the animation frame on unmount', () => {
    const { unmount } = render(<CountUp value={100} />);
    flushFrame(0);
    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('cancels and restarts when the value changes', () => {
    const onDone = jest.fn();
    const { rerender, container } = render(
      <CountUp value={100} durationMs={900} onDone={onDone} />
    );
    flushFrame(0);
    flushFrame(450);

    rerender(<CountUp value={200} durationMs={900} onDone={onDone} />);
    expect(window.cancelAnimationFrame).toHaveBeenCalled();

    flushFrame(0);
    flushFrame(900);
    const visible = container.querySelector('[aria-hidden="true"]');
    expect(visible?.textContent).toBe('200');
  });
});
