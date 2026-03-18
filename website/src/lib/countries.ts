export const VALID_COUNTRIES = ["us", "uk", "ca", "ng", "il"] as const;

export type CountryId = (typeof VALID_COUNTRIES)[number];
