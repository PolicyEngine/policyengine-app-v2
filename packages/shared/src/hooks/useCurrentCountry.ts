import { useParams } from 'react-router-dom';
import { countryIds, CountryId } from '../countries';

/**
 * Returns the current country ID from the URL parameter.
 *
 * Architecture:
 * - URL parameter (/:countryId) is the single source of truth
 * - CountryGuard validates the parameter before this hook is called
 * - This hook reads directly from URL via React Router's useParams()
 * - Simple, idiomatic React Router pattern
 *
 * Usage:
 * - Must be used within routes protected by CountryGuard
 * - CountryGuard ensures the country parameter is valid
 * - This hook can safely assume the parameter exists and is valid
 *
 * @returns The country ID from URL parameter
 * @throws {Error} If called outside country routes or if country is invalid
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const country = useCurrentCountry(); // Returns 'us', 'uk', etc.
 *   const { data } = useUserReports(userId, country);
 *   // ...
 * }
 * ```
 */
export function useCurrentCountry(): CountryId {
  const { countryId } = useParams<{ countryId: string }>();

  // CountryGuard ensures this is always valid when inside protected routes
  // This check is for safety and better error messages
  if (!countryId || !countryIds.includes(countryId as CountryId)) {
    throw new Error(
      'useCurrentCountry must be used within country routes (protected by CountryGuard). ' +
        `Got countryId: ${countryId}`
    );
  }

  return countryId as CountryId;
}
