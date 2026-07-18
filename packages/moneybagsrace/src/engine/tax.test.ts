import { TaxBand } from '../types/assumptions';
import {
  DEFAULT_TAX_BANDS,
  grossPensionForNet,
  netFromGrossPension,
  taxDueForIncome,
} from './tax';

const STATE_PENSION_PENCE = 1_197_300; // £11,973

describe('DEFAULT_TAX_BANDS', () => {
  it('encodes the UK personal allowance, basic and higher rates', () => {
    expect(DEFAULT_TAX_BANDS).toEqual([
      { thresholdPence: 0, ratePct: 0 },
      { thresholdPence: 1_257_000, ratePct: 20 },
      { thresholdPence: 5_027_000, ratePct: 40 },
    ]);
  });
});

describe('taxDueForIncome', () => {
  it('charges nothing at or below the personal allowance', () => {
    expect(taxDueForIncome(0, DEFAULT_TAX_BANDS)).toBe(0);
    expect(taxDueForIncome(1_257_000, DEFAULT_TAX_BANDS)).toBe(0);
  });

  it('charges the basic rate marginally above the allowance', () => {
    expect(taxDueForIncome(1_257_100, DEFAULT_TAX_BANDS)).toBe(20);
    expect(taxDueForIncome(2_257_000, DEFAULT_TAX_BANDS)).toBe(200_000);
  });

  it('charges the higher rate above the basic-rate limit', () => {
    expect(taxDueForIncome(5_027_000, DEFAULT_TAX_BANDS)).toBe(754_000);
    expect(taxDueForIncome(6_027_000, DEFAULT_TAX_BANDS)).toBe(1_154_000);
  });

  it('treats income below the first threshold of unnormalized bands as untaxed', () => {
    const bands: TaxBand[] = [{ thresholdPence: 1_000_000, ratePct: 20 }];
    expect(taxDueForIncome(500_000, bands)).toBe(0);
    expect(taxDueForIncome(1_500_000, bands)).toBe(100_000);
  });
});

describe('netFromGrossPension', () => {
  it('returns the full gross when the taxable 75% stays within the allowance', () => {
    expect(netFromGrossPension(1_000_000, 0, DEFAULT_TAX_BANDS)).toBe(
      1_000_000
    );
  });

  it('taxes the 75% taxable part through the bands', () => {
    // £100,000 gross: £75,000 taxable → £7,540 basic + £9,892 higher tax
    expect(netFromGrossPension(10_000_000, 0, DEFAULT_TAX_BANDS)).toBe(
      8_256_800
    );
  });

  it('stacks the taxable part on top of other taxable income', () => {
    expect(
      netFromGrossPension(1_000_000, STATE_PENSION_PENCE, DEFAULT_TAX_BANDS)
    ).toBe(861_940);
  });

  it('returns zero for a zero withdrawal', () => {
    expect(netFromGrossPension(0, 0, DEFAULT_TAX_BANDS)).toBe(0);
    expect(netFromGrossPension(0, STATE_PENSION_PENCE, DEFAULT_TAX_BANDS)).toBe(
      0
    );
  });
});

describe('grossPensionForNet', () => {
  it('returns zero for a zero or negative net target', () => {
    expect(grossPensionForNet(0, 0, DEFAULT_TAX_BANDS)).toBe(0);
    expect(grossPensionForNet(-100, 0, DEFAULT_TAX_BANDS)).toBe(0);
  });

  it('needs no gross-up while the taxable part stays within the allowance', () => {
    expect(grossPensionForNet(1_000_000, 0, DEFAULT_TAX_BANDS)).toBe(1_000_000);
  });

  it('inverts netFromGrossPension exactly across all bands', () => {
    expect(grossPensionForNet(8_256_800, 0, DEFAULT_TAX_BANDS)).toBe(
      10_000_000
    );
    expect(
      grossPensionForNet(861_940, STATE_PENSION_PENCE, DEFAULT_TAX_BANDS)
    ).toBe(1_000_000);
  });

  it.each([0, STATE_PENSION_PENCE])(
    'round-trips net targets across all bands with other income %i',
    (otherPence) => {
      const netTargets = [
        1, 10_000, 500_000, 1_257_000, 1_676_000, 2_000_000, 5_000_000,
        8_256_800, 12_000_000, 20_000_000,
      ];
      for (const netPence of netTargets) {
        const grossPence = grossPensionForNet(
          netPence,
          otherPence,
          DEFAULT_TAX_BANDS
        );
        expect(grossPence).toBeGreaterThanOrEqual(netPence);
        const roundTripPence = netFromGrossPension(
          grossPence,
          otherPence,
          DEFAULT_TAX_BANDS
        );
        expect(roundTripPence).toBeGreaterThanOrEqual(netPence);
        expect(roundTripPence).toBeLessThanOrEqual(netPence + 1);
      }
    }
  );
});
