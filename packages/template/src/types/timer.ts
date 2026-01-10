'use client';

export interface Timer {
  seconds: number;
  inProgress: {
    start: string;
    lastInteraction: string;
  };
  countdown?: number;
  stopped?: boolean;
}
