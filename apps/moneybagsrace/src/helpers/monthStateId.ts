export const currentMonthStateId = (): string => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const isValidMonthStateId = (stateId: string): boolean =>
  /^\d{4}-(0[1-9]|1[0-2])$/.test(stateId);
