// Compact clock for the stage filmstrip's narrow columns: "0:45", "12:03",
// "1:02:09" — the shared @ui formatSeconds keeps its zero-padded hh:mm:ss for
// the timer and leaderboards.
export const formatSecondsShort = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const paddedSeconds = `${seconds}`.padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${`${minutes}`.padStart(2, '0')}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
};
