import { BASE_URL } from '@/constants';

/** One country the Public API lists, and the calculations it supports. */
export interface CountryCapability {
  /** The country ID other routes take, e.g. 'us'. */
  id: string;
  name: string;
  /** Household calculations and saved households are available. */
  householdEnabled: boolean;
  /** Society-wide reports are available; implies `householdEnabled`. */
  societyWideEnabled: boolean;
}

/** One `GET /v2/countries` item in the Public API's snake_case shape. */
export interface CountryItemPayload {
  id: string;
  name: string;
  household_enabled: boolean;
  society_wide_enabled: boolean;
}

function isCountryItemPayload(value: unknown): value is CountryItemPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.household_enabled === 'boolean' &&
    typeof item.society_wide_enabled === 'boolean'
  );
}

/**
 * Fetch every country the Public API lists (`GET /v2/countries`, no
 * credential), including any the app has no code for; callers keep the ones
 * the app supports. Rejects on an error status or an unexpected body.
 */
export async function fetchCountries(
  fetchImplementation: typeof fetch = fetch
): Promise<CountryCapability[]> {
  const response = await fetchImplementation(`${BASE_URL}/v2/countries`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch countries: HTTP ${response.status}`);
  }

  const body: unknown = await response.json();
  const items = (body as { result?: { items?: unknown } } | null)?.result?.items;
  if (!Array.isArray(items) || !items.every(isCountryItemPayload)) {
    throw new Error('Unexpected countries response');
  }
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    householdEnabled: item.household_enabled,
    societyWideEnabled: item.society_wide_enabled,
  }));
}
