import { vi } from 'vitest';
import type { CountryCapability, CountryItemPayload } from '@/api/countries';

export type { CountryItemPayload };

export const UNITED_KINGDOM_PAYLOAD: CountryItemPayload = {
  id: 'uk',
  name: 'United Kingdom',
  household_enabled: true,
  society_wide_enabled: true,
};

export const UNITED_STATES_PAYLOAD: CountryItemPayload = {
  id: 'us',
  name: 'United States',
  household_enabled: true,
  society_wide_enabled: true,
};

/** The UK listed as household-only, to exercise the society-wide hiding. */
export const HOUSEHOLD_ONLY_UNITED_KINGDOM_PAYLOAD: CountryItemPayload = {
  ...UNITED_KINGDOM_PAYLOAD,
  society_wide_enabled: false,
};

/** A country the API lists but the app has no code for, so it must be left out. */
export const COUNTRY_WITHOUT_APP_SUPPORT_PAYLOAD: CountryItemPayload = {
  id: 'be',
  name: 'Belgium',
  household_enabled: true,
  society_wide_enabled: false,
};

/** Names that differ from the app's built-in ones, to show the list came from the API. */
export const RENAMED_UNITED_STATES_PAYLOAD: CountryItemPayload = {
  ...UNITED_STATES_PAYLOAD,
  name: 'United States of America',
};

export const SOCIETY_WIDE_COUNTRIES: CountryCapability[] = [
  { id: 'uk', name: 'United Kingdom', householdEnabled: true, societyWideEnabled: true },
  { id: 'us', name: 'United States', householdEnabled: true, societyWideEnabled: true },
];

export function countriesEnvelope(items: CountryItemPayload[]) {
  return { status: 'ok', message: null, result: { items } };
}

export function mockCountriesResponse(items: CountryItemPayload[]) {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(countriesEnvelope(items)),
  } as unknown as Response;
}

export function mockCountriesBody(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}
