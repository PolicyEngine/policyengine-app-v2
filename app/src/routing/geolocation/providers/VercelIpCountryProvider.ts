import { GeolocationProvider } from '../types';

/**
 * Geolocation provider that calls the calculator's own `/api/geolocate`
 * route. The route returns, as plain text such as "US", the country that
 * Vercel's `x-vercel-ip-country` request header gives for the visitor's IP
 * address. When the header is missing, the route responds 204 with an empty
 * body, and this provider returns null so the next provider is tried.
 */
export class VercelIpCountryProvider implements GeolocationProvider {
  name = 'Vercel IP country';
  priority = 1; // Highest priority: the country of the visitor's IP address

  private apiUrl: string;

  /**
   * @param apiUrl  Override the route URL (used by tests).
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
        signal: AbortSignal.timeout(2000),
      });

      if (!response.ok) {
        return null;
      }

      const countryCode = (await response.text()).trim();

      // Validate it's a valid 2-letter country code; a 204 has an empty body
      if (!countryCode || countryCode.length !== 2) {
        return null;
      }

      return countryCode;
    } catch {
      return null;
    }
  }
}
