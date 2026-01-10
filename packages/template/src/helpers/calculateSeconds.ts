import type { Timer } from '../types/timer';

const calculateSeconds = (timer: Timer | null) => {
  let nextSeconds = 0;
  if (timer) {
    nextSeconds =
      timer.seconds +
      Math.floor(
        (new Date(timer.inProgress.lastInteraction).getTime() -
          new Date(timer.inProgress.start).getTime()) /
          1000
      );
  }
  return nextSeconds;
};

export { calculateSeconds };
