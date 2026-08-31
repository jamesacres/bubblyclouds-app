'use client';
import React, { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: number;
  durationMs?: number;
  startDelayMs?: number;
  prefix?: string;
  suffix?: string;
  format?: (value: number) => string;
  className?: string;
  onDone?: () => void;
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CountUp: React.FC<CountUpProps> = ({
  value,
  durationMs = 900,
  startDelayMs = 0,
  prefix = '',
  suffix = '',
  format,
  className,
  onDone,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let frameId: number | undefined;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const finish = () => {
      if (cancelled) return;
      setDisplayValue(value);
      onDoneRef.current?.();
    };

    if (prefersReducedMotion()) {
      finish();
      return () => {
        cancelled = true;
      };
    }

    const run = () => {
      let startTime: number | undefined;

      const step = (now: number) => {
        if (cancelled) return;
        if (startTime === undefined) {
          startTime = now;
        }
        const elapsed = now - startTime;
        const progress = durationMs > 0 ? Math.min(elapsed / durationMs, 1) : 1;
        setDisplayValue(value * easeOutCubic(progress));

        if (progress < 1) {
          frameId = requestAnimationFrame(step);
        } else {
          finish();
        }
      };

      frameId = requestAnimationFrame(step);
    };

    if (startDelayMs > 0) {
      delayTimer = setTimeout(() => {
        setDisplayValue(0);
        run();
      }, startDelayMs);
    } else {
      run();
    }

    return () => {
      cancelled = true;
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
      }
      if (delayTimer !== undefined) {
        clearTimeout(delayTimer);
      }
    };
  }, [value, durationMs, startDelayMs]);

  const rounded = Math.round(displayValue);
  const formatted = format ? format(rounded) : `${rounded}`;
  const finalFormatted = format ? format(value) : `${value}`;

  return (
    <span className={className}>
      <span aria-hidden="true">
        {prefix}
        {formatted}
        {suffix}
      </span>
      <span className="sr-only" aria-live="polite">
        {prefix}
        {finalFormatted}
        {suffix}
      </span>
    </span>
  );
};

export { CountUp };
export type { CountUpProps };
