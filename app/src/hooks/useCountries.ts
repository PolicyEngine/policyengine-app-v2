import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCountries } from '@/api/countries';
import { countryIds, type CountryId } from '@/libs/countries';
import { countryKeys } from '@/libs/queryKeys';

/** A country the app has code for, as the Public API lists it. */
export interface SupportedCountry {
  id: CountryId;
  name: string;
  householdEnabled: boolean;
  societyWideEnabled: boolean;
}

/**
 * The list used while `/v2/countries` loads, when it fails, or when it lists
 * none of the app's countries: the US and the UK with every calculation, so
 * an unreachable endpoint never hides what those countries offer.
 */
export const FALLBACK_COUNTRIES: readonly SupportedCountry[] = [
  { id: 'us', name: 'United States', householdEnabled: true, societyWideEnabled: true },
  { id: 'uk', name: 'United Kingdom', householdEnabled: true, societyWideEnabled: true },
];

/** Countries change rarely; one request per hour at most. */
const COUNTRIES_STALE_TIME_MS = 60 * 60 * 1000;

function isSupportedCountryId(countryId: string): countryId is CountryId {
  return (countryIds as readonly string[]).includes(countryId);
}

/**
 * The countries to offer: those the Public API lists that the app also has
 * code for, in the app's order (`countryIds`). `isFallback` is true when the
 * built-in list is used instead.
 */
export function useCountries(): { countries: readonly SupportedCountry[]; isFallback: boolean } {
  const { data } = useQuery({
    queryKey: countryKeys.all,
    queryFn: () => fetchCountries(),
    staleTime: COUNTRIES_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });

  return useMemo(() => {
    const listed = (data ?? []).filter((country) => isSupportedCountryId(country.id));
    if (listed.length === 0) {
      return { countries: FALLBACK_COUNTRIES, isFallback: true };
    }
    const countries = countryIds.flatMap((countryId) => {
      const country = listed.find((candidate) => candidate.id === countryId);
      return country ? [{ ...country, id: countryId }] : [];
    });
    return { countries, isFallback: false };
  }, [data]);
}

/**
 * One country's capability. A country missing from the Public API's list
 * keeps its built-in capability.
 */
export function useCountryCapability(countryId: CountryId): SupportedCountry {
  const { countries } = useCountries();
  return (
    countries.find((country) => country.id === countryId) ??
    FALLBACK_COUNTRIES.find((country) => country.id === countryId) ?? {
      id: countryId,
      name: countryId.toUpperCase(),
      householdEnabled: true,
      societyWideEnabled: true,
    }
  );
}
