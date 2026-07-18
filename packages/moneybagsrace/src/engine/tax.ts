import { TaxBand } from '../types/assumptions';

// Bands are ascending thresholds; ratePct applies marginally to income above
// thresholdPence up to the next band's threshold.
export const DEFAULT_TAX_BANDS: TaxBand[] = [
  { thresholdPence: 0, ratePct: 0 }, // personal allowance £12,570
  { thresholdPence: 1_257_000, ratePct: 20 }, // basic rate to £50,270
  { thresholdPence: 5_027_000, ratePct: 40 }, // higher rate
];

export const TAXABLE_PENSION_FRACTION = 0.75; // 25% of pension withdrawals is tax-free
const CEIL_EPSILON_PENCE = 1e-6;

const normalizeBands = (bands: TaxBand[]): TaxBand[] =>
  bands.length > 0 && bands[0].thresholdPence === 0
    ? bands
    : [{ thresholdPence: 0, ratePct: 0 }, ...bands];

const taxDueExact = (grossIncomePence: number, bands: TaxBand[]): number => {
  let taxPence = 0;
  for (let i = 0; i < bands.length; i += 1) {
    const band = bands[i];
    if (grossIncomePence <= band.thresholdPence) {
      break;
    }
    const upperPence = bands[i + 1]?.thresholdPence ?? Number.POSITIVE_INFINITY;
    const taxablePence =
      Math.min(grossIncomePence, upperPence) - band.thresholdPence;
    taxPence += (taxablePence * band.ratePct) / 100;
  }
  return taxPence;
};

export const taxDueForIncome = (
  grossIncomePence: number,
  bands: TaxBand[]
): number => Math.round(taxDueExact(grossIncomePence, bands));

export const netFromGrossPension = (
  grossPensionPence: number,
  otherTaxableIncomePence: number,
  bands: TaxBand[]
): number => {
  const taxablePensionPence = grossPensionPence * TAXABLE_PENSION_FRACTION;
  const marginalTaxPence =
    taxDueExact(otherTaxableIncomePence + taxablePensionPence, bands) -
    taxDueExact(otherTaxableIncomePence, bands);
  return Math.round(grossPensionPence - marginalTaxPence);
};

// Exact piecewise inversion: walk each band segment above otherTaxableIncome,
// converting net capacity to gross at that segment's marginal rate. Rounded up
// so the delivered net is never below the target.
export const grossPensionForNet = (
  netNeededPence: number,
  otherTaxableIncomePence: number,
  bands: TaxBand[]
): number => {
  if (netNeededPence <= 0) {
    return 0;
  }
  const normalized = normalizeBands(bands);
  let remainingNetPence = netNeededPence;
  let grossPence = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    const band = normalized[i];
    const upperPence =
      normalized[i + 1]?.thresholdPence ?? Number.POSITIVE_INFINITY;
    if (upperPence <= otherTaxableIncomePence) {
      continue;
    }
    const lowerPence = Math.max(band.thresholdPence, otherTaxableIncomePence);
    const netPerGross = 1 - (TAXABLE_PENSION_FRACTION * band.ratePct) / 100;
    const grossCapacityPence =
      (upperPence - lowerPence) / TAXABLE_PENSION_FRACTION;
    const netCapacityPence = grossCapacityPence * netPerGross;
    if (remainingNetPence <= netCapacityPence) {
      grossPence += remainingNetPence / netPerGross;
      remainingNetPence = 0;
      break;
    }
    grossPence += grossCapacityPence;
    remainingNetPence -= netCapacityPence;
  }
  return Math.ceil(grossPence - CEIL_EPSILON_PENCE);
};
