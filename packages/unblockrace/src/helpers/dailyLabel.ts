// Calendar-date label for the daily run's end-game summary card, e.g.
// "Daily · Aug 8". A real date needs no arbitrary launch-date baseline and
// reads the same for every player who raced that day.
export const getDailyLabel = (date: Date = new Date()): string =>
  `Daily · ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })}`;
