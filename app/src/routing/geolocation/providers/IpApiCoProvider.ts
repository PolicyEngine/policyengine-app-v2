import { GeolocationProvider } from '../types';

/**
 * Geolocation provider that calls our own server-side `/api/geolocate` Vercel
 * Function. The function in turn calls ipapi.co using a server-only API key
 * (`IPAPI_CO_KEY`). This keeps the paid-tier key out of the browser bundle.
 *
 * Free tier: 30,000 requests/month (1,000/day limit). If `IPAPI_CO_KEY` is
 * configured on the server, the paid-tier quota is used instead.
 */
export class IpApiCoProvider implements GeolocationProvider {
  name = 'ipapi.co';
  priority = 1; // Highest priority - use first (free tier)

  private apiUrl: string;

  /**
   * @param apiUrl  Override the server proxy URL (used by tests).
   */
  constructor(apiUrl: string = '/api/geolocate') {
    this.apiUrl = apiUrl;
  }

  async detect(): Promise<string | null> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'GET',
        headers: {
          Accept: 'text/plain',
        },
        signal: AbortSignal.timeout(2000), // Slightly larger than server timeout
      });

      if (!response.ok) {
        return null;
      }

      // /api/geolocate returns plain text like "US", mirroring the upstream
      // ipapi.co country_code endpoint.
      const countryCode = (await response.text()).trim();

      // Validate it's a valid 2-letter country code
      if (!countryCode || countryCode.length !== 2) {
        return null;
      }

      return countryCode;
    } catch {
      return null;
    }
  }
}
