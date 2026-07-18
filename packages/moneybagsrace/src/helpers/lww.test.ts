import { HouseholdAssumptions } from '../types/assumptions';
import { ProfileData } from '../types/profile';
import { MonthlySnapshotData, SharedAssetsEntry } from '../types/snapshot';
import {
  isMonthComplete,
  resolveSharedAssets,
  resolveSharedAssumptions,
} from './lww';

const sharedEntry = (
  updatedAt: string,
  houseValuePence = 30_000_000
): SharedAssetsEntry => ({
  houseValuePence,
  mortgageBalancePence: 10_000_000,
  updatedAt,
});

const snapshot = (
  overrides: Partial<MonthlySnapshotData> = {}
): MonthlySnapshotData => ({
  schemaVersion: 1,
  month: '2026-07',
  accounts: [],
  complete: true,
  ...overrides,
});

const assumptions: HouseholdAssumptions = {
  inflationRatePct: 2.5,
  returnScenarios: { lowerRealPct: 2, centralRealPct: 5, upperRealPct: 7 },
  taxBands: [],
  statePensionAnnualPence: 1_190_260,
  targetSuccessRatePct: 90,
};

const profile = (overrides: Partial<ProfileData> = {}): ProfileData => ({
  schemaVersion: 1,
  accounts: [],
  contributions: { monthlyPencePerWrapper: {}, stepChanges: [] },
  overrides: {},
  ...overrides,
});

describe('resolveSharedAssets', () => {
  it('returns undefined when no snapshot has a shared entry', () => {
    expect(resolveSharedAssets([])).toBeUndefined();
    expect(resolveSharedAssets([undefined, snapshot()])).toBeUndefined();
  });

  it('returns the only shared entry', () => {
    const entry = sharedEntry('2026-07-01T10:00:00.000Z');
    expect(resolveSharedAssets([snapshot({ shared: entry }), snapshot()])).toBe(
      entry
    );
  });

  it('returns the newest entry across members', () => {
    const older = sharedEntry('2026-07-01T10:00:00.000Z', 29_000_000);
    const newer = sharedEntry('2026-07-02T09:00:00.000Z', 31_000_000);
    expect(
      resolveSharedAssets([
        snapshot({ shared: older }),
        undefined,
        snapshot({ shared: newer }),
      ])
    ).toBe(newer);
    expect(
      resolveSharedAssets([
        snapshot({ shared: newer }),
        snapshot({ shared: older }),
      ])
    ).toBe(newer);
  });
});

describe('resolveSharedAssumptions', () => {
  it('returns undefined when no profile has shared assumptions', () => {
    expect(resolveSharedAssumptions([])).toBeUndefined();
    expect(resolveSharedAssumptions([undefined, profile()])).toBeUndefined();
  });

  it('returns the newest shared assumptions across members', () => {
    const older = { updatedAt: '2026-06-01T00:00:00.000Z', assumptions };
    const newer = {
      updatedAt: '2026-06-15T00:00:00.000Z',
      assumptions: { ...assumptions, inflationRatePct: 3 },
    };
    expect(
      resolveSharedAssumptions([
        profile({ sharedAssumptions: older }),
        profile({ sharedAssumptions: newer }),
      ])
    ).toBe(newer);
  });
});

describe('isMonthComplete', () => {
  const shared = sharedEntry('2026-07-01T10:00:00.000Z');

  it('is false when there are no members', () => {
    expect(isMonthComplete([], {})).toBe(false);
  });

  it('is true when every member snapshot is complete and shared exists', () => {
    expect(
      isMonthComplete(['a', 'b'], {
        a: snapshot({ shared }),
        b: snapshot(),
      })
    ).toBe(true);
  });

  it('is false when a member snapshot is missing', () => {
    expect(isMonthComplete(['a', 'b'], { a: snapshot({ shared }) })).toBe(
      false
    );
  });

  it('is false when a member snapshot is not complete', () => {
    expect(
      isMonthComplete(['a', 'b'], {
        a: snapshot({ shared }),
        b: snapshot({ complete: false }),
      })
    ).toBe(false);
  });

  it('is false when no effective shared entry exists', () => {
    expect(isMonthComplete(['a', 'b'], { a: snapshot(), b: snapshot() })).toBe(
      false
    );
  });

  it('ignores snapshots of users outside the member list', () => {
    expect(
      isMonthComplete(['a'], {
        a: snapshot(),
        b: snapshot({ shared }),
      })
    ).toBe(false);
  });
});
