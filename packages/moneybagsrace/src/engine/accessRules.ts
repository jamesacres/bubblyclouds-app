import { InvestmentWrapper } from '../types/accounts';

export interface NmpaTableEntry {
  fromIsoDate: string; // rule applies to members reaching the previous age on/after this date
  age: number;
}

export interface StatePensionAgeTableEntry {
  fromDateOfBirth: string; // applies to members born on/after this date
  age: number;
}

export const NMPA_TABLE: NmpaTableEntry[] = [
  { fromIsoDate: '1900-01-01', age: 55 },
  { fromIsoDate: '2028-04-06', age: 57 },
];

export const STATE_PENSION_AGE_TABLE: StatePensionAgeTableEntry[] = [
  { fromDateOfBirth: '1900-01-01', age: 66 },
  { fromDateOfBirth: '1960-04-06', age: 67 },
  { fromDateOfBirth: '1977-04-06', age: 68 },
];

interface IsoDateParts {
  year: number;
  month: string;
  day: string;
}

const parseIsoDate = (isoDate: string): IsoDateParts => {
  const [year, month, day] = isoDate.split('-');
  return { year: Number(year), month, day };
};

const dateAtAge = (dateOfBirth: string, age: number): string => {
  const { year, month, day } = parseIsoDate(dateOfBirth);
  return `${String(year + age).padStart(4, '0')}-${month}-${day}`;
};

export const getNmpaAge = (dateOfBirth: string, override?: number): number => {
  if (override !== undefined) {
    return override;
  }
  for (let i = 0; i < NMPA_TABLE.length; i += 1) {
    const entry = NMPA_TABLE[i];
    const next = NMPA_TABLE[i + 1];
    if (!next || dateAtAge(dateOfBirth, entry.age) < next.fromIsoDate) {
      return entry.age;
    }
  }
  return NMPA_TABLE[NMPA_TABLE.length - 1].age;
};

export const getStatePensionAge = (
  dateOfBirth: string,
  override?: number
): number => {
  if (override !== undefined) {
    return override;
  }
  let age = STATE_PENSION_AGE_TABLE[0].age;
  for (const entry of STATE_PENSION_AGE_TABLE) {
    if (dateOfBirth >= entry.fromDateOfBirth) {
      age = entry.age;
    }
  }
  return age;
};

export const isLockedWrapper = (wrapper: InvestmentWrapper): boolean =>
  wrapper === InvestmentWrapper.SIPP ||
  wrapper === InvestmentWrapper.COMPANY_PENSION;

export const partitionWealth = (
  balancesPencePerWrapper: Partial<Record<InvestmentWrapper, number>>
): { accessiblePence: number; lockedPence: number } => {
  let accessiblePence = 0;
  let lockedPence = 0;
  for (const wrapper of Object.values(InvestmentWrapper)) {
    const balancePence = balancesPencePerWrapper[wrapper] ?? 0;
    if (isLockedWrapper(wrapper)) {
      lockedPence += balancePence;
    } else {
      accessiblePence += balancePence;
    }
  }
  return { accessiblePence, lockedPence };
};

export const ageAtDate = (dateOfBirth: string, isoDate: string): number => {
  const dob = parseIsoDate(dateOfBirth);
  const at = parseIsoDate(isoDate);
  const hadBirthday = `${at.month}-${at.day}` >= `${dob.month}-${dob.day}`;
  return at.year - dob.year - (hadBirthday ? 0 : 1);
};
