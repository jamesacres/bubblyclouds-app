import { InvestmentWrapper } from '../types/accounts';
import {
  NMPA_TABLE,
  STATE_PENSION_AGE_TABLE,
  ageAtDate,
  getNmpaAge,
  getStatePensionAge,
  isLockedWrapper,
  partitionWealth,
} from './accessRules';

describe('NMPA_TABLE', () => {
  it('starts at 55 and rises to 57 from 2028-04-06', () => {
    expect(NMPA_TABLE).toEqual([
      { fromIsoDate: '1900-01-01', age: 55 },
      { fromIsoDate: '2028-04-06', age: 57 },
    ]);
  });
});

describe('getNmpaAge', () => {
  it('returns 55 for a member reaching 55 before 2028-04-06', () => {
    expect(getNmpaAge('1973-04-05')).toBe(55);
    expect(getNmpaAge('1960-01-01')).toBe(55);
  });

  it('returns 57 for a member reaching 55 on or after 2028-04-06', () => {
    expect(getNmpaAge('1973-04-06')).toBe(57);
    expect(getNmpaAge('1990-06-15')).toBe(57);
  });

  it('prefers the override when provided', () => {
    expect(getNmpaAge('1990-06-15', 55)).toBe(55);
    expect(getNmpaAge('1960-01-01', 58)).toBe(58);
  });
});

describe('STATE_PENSION_AGE_TABLE', () => {
  it('covers the 66/67/68 cohorts', () => {
    expect(STATE_PENSION_AGE_TABLE).toEqual([
      { fromDateOfBirth: '1900-01-01', age: 66 },
      { fromDateOfBirth: '1960-04-06', age: 67 },
      { fromDateOfBirth: '1977-04-06', age: 68 },
    ]);
  });
});

describe('getStatePensionAge', () => {
  it('returns 66 for those born before 1960-04-06', () => {
    expect(getStatePensionAge('1958-12-31')).toBe(66);
    expect(getStatePensionAge('1960-04-05')).toBe(66);
  });

  it('returns 67 for those born from 1960-04-06 to 1977-04-05', () => {
    expect(getStatePensionAge('1960-04-06')).toBe(67);
    expect(getStatePensionAge('1977-04-05')).toBe(67);
  });

  it('returns 68 for those born on or after 1977-04-06', () => {
    expect(getStatePensionAge('1977-04-06')).toBe(68);
    expect(getStatePensionAge('1995-01-01')).toBe(68);
  });

  it('prefers the override when provided', () => {
    expect(getStatePensionAge('1995-01-01', 66)).toBe(66);
    expect(getStatePensionAge('1958-12-31', 70)).toBe(70);
  });
});

describe('isLockedWrapper', () => {
  it('locks pensions until NMPA', () => {
    expect(isLockedWrapper(InvestmentWrapper.SIPP)).toBe(true);
    expect(isLockedWrapper(InvestmentWrapper.COMPANY_PENSION)).toBe(true);
  });

  it('treats non-pension wrappers as accessible bridge wealth', () => {
    expect(isLockedWrapper(InvestmentWrapper.ISA)).toBe(false);
    expect(isLockedWrapper(InvestmentWrapper.GIA)).toBe(false);
    expect(isLockedWrapper(InvestmentWrapper.CRYPTO)).toBe(false);
    expect(isLockedWrapper(InvestmentWrapper.OTHER)).toBe(false);
  });
});

describe('partitionWealth', () => {
  it('splits balances into accessible and locked totals', () => {
    expect(
      partitionWealth({
        [InvestmentWrapper.SIPP]: 10_000_00,
        [InvestmentWrapper.COMPANY_PENSION]: 5_000_00,
        [InvestmentWrapper.ISA]: 3_000_00,
        [InvestmentWrapper.GIA]: 2_000_00,
        [InvestmentWrapper.CRYPTO]: 1_000_00,
        [InvestmentWrapper.OTHER]: 500_00,
      })
    ).toEqual({ accessiblePence: 6_500_00, lockedPence: 15_000_00 });
  });

  it('treats missing wrappers as zero', () => {
    expect(partitionWealth({})).toEqual({
      accessiblePence: 0,
      lockedPence: 0,
    });
    expect(partitionWealth({ [InvestmentWrapper.ISA]: 42 })).toEqual({
      accessiblePence: 42,
      lockedPence: 0,
    });
  });
});

describe('ageAtDate', () => {
  it('counts whole years only after the birthday has passed', () => {
    expect(ageAtDate('1990-06-15', '2025-06-14')).toBe(34);
    expect(ageAtDate('1990-06-15', '2025-06-15')).toBe(35);
    expect(ageAtDate('1990-06-15', '2025-06-16')).toBe(35);
  });

  it('handles year boundaries', () => {
    expect(ageAtDate('1990-12-31', '2025-01-01')).toBe(34);
    expect(ageAtDate('1990-01-01', '2025-12-31')).toBe(35);
  });
});
