import { GLOBAL_EQUITY_ANNUAL_RETURNS } from './globalEquityReturns';

const realValues = GLOBAL_EQUITY_ANNUAL_RETURNS.map((r) => r.realPct);
const nominalValues = GLOBAL_EQUITY_ANNUAL_RETURNS.map((r) => r.nominalPct);

const mean = (values: number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const stdev = (values: number[]): number => {
  const m = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - m) ** 2)));
};

describe('GLOBAL_EQUITY_ANNUAL_RETURNS', () => {
  it('covers at least 120 years', () => {
    expect(GLOBAL_EQUITY_ANNUAL_RETURNS.length).toBeGreaterThanOrEqual(120);
  });

  it('has strictly ascending, unique years', () => {
    const years = GLOBAL_EQUITY_ANNUAL_RETURNS.map((r) => r.year);
    for (let i = 1; i < years.length; i += 1) {
      expect(years[i]).toBeGreaterThan(years[i - 1]);
    }
    expect(new Set(years).size).toBe(years.length);
  });

  it('has an arithmetic mean real return between 3.5% and 6.5%', () => {
    const m = mean(realValues);
    expect(m).toBeGreaterThanOrEqual(3.5);
    expect(m).toBeLessThanOrEqual(6.5);
  });

  it('has a real return standard deviation between 15% and 22%', () => {
    const sd = stdev(realValues);
    expect(sd).toBeGreaterThanOrEqual(15);
    expect(sd).toBeLessThanOrEqual(22);
  });

  it.each([1931, 1974, 2008])(
    'records %i as negative and among the worst years',
    (year) => {
      const entry = GLOBAL_EQUITY_ANNUAL_RETURNS.find((r) => r.year === year);
      expect(entry).toBeDefined();
      if (!entry) {
        return;
      }
      expect(entry.realPct).toBeLessThan(0);
      const sorted = [...realValues].sort((a, b) => a - b);
      const rank = sorted.indexOf(entry.realPct);
      expect(rank).toBeLessThan(10);
    }
  );

  it('has nominal returns above real returns on average (inflation gap)', () => {
    const gap = mean(nominalValues) - mean(realValues);
    expect(gap).toBeGreaterThanOrEqual(2.5);
    expect(gap).toBeLessThanOrEqual(6);
  });

  it('has nominal above real in most years (deflation years excepted)', () => {
    const aboveCount = GLOBAL_EQUITY_ANNUAL_RETURNS.filter(
      (r) => r.nominalPct > r.realPct
    ).length;
    expect(aboveCount / GLOBAL_EQUITY_ANNUAL_RETURNS.length).toBeGreaterThan(
      0.7
    );
  });

  it('rounds all values to one decimal place', () => {
    for (const entry of GLOBAL_EQUITY_ANNUAL_RETURNS) {
      expect(Math.round(entry.realPct * 10) / 10).toBeCloseTo(
        entry.realPct,
        10
      );
      expect(Math.round(entry.nominalPct * 10) / 10).toBeCloseTo(
        entry.nominalPct,
        10
      );
    }
  });
});
