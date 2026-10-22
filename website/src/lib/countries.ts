export const VALID_COUNTRIES = ["us", "uk", "ca", "ng", "il"] as const;

export type CountryId = (typeof VALID_COUNTRIES)[number];

/**
 * Whether the calculator (app.policyengine.org) offers a country. The website
 * serves home pages for more countries than the calculator, so this reads the
 * calculator's own country list rather than `VALID_COUNTRIES`.
 */
export { isCountryId as isCalculatorCountry } from "../../../app/src/libs/countries";
