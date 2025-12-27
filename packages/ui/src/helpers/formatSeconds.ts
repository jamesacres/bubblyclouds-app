const padNumber = (number: number) => `${number}`.padStart(2, '0');
const formatSeconds = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
};

export { formatSeconds };
