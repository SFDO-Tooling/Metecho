export const pluralize = (count: number, str: string) =>
  count === 1 ? str : `${str}s`;
