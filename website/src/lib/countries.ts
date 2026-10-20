export const VALID_COUNTRIES = ["us", "uk"] as const;

export type CountryId = (typeof VALID_COUNTRIES)[number];
