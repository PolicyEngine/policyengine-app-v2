import { GeolocationProvider } from '../types';

/**
 * Geolocation provider using ipapi.co API
 * Free tier: 30,000 requests/month (1,000/day limit)
 * No API key required for free tier
 */
export class IpApiCoProvider implements GeolocationProvider {
  name = 'ipapi.co';
  priority = 1; // Highest priority - use first (free tier)

  // Use country_code endpoint - returns just "US" instead of full JSON
  private apiUrl = 'https://ipapi.co/country_code/';
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    // API key is optional - free tier works without it
    // Apps can pass VITE_IPAPI_CO_KEY from their environment
    this.apiKey = apiKey;
  }

  async detect(): Promise<string | null> {
    try {
      // Add API key to URL if available (for paid tier)
      const url = this.apiKey ? `${this.apiUrl}?key=${this.apiKey}` : this.apiUrl;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/plain',
        },
        signal: AbortSignal.timeout(1000), // 1 second timeout
      });

      if (!response.ok) {
        return null;
      }

      // country_code endpoint returns plain text like "US" not JSON
      const countryCode = (await response.text()).trim();

      // Validate it's a valid 2-letter country code
      if (!countryCode || countryCode.length !== 2) {
        return null;
      }

      return countryCode;
    } catch (error) {
      return null;
    }
  }
}

/**
 * ipapi.co API Endpoints:
 *
 * Full data: https://ipapi.co/json/
 * Country only: https://ipapi.co/country_code/ (returns plain text: "US")
 * Country name: https://ipapi.co/country_name/ (returns: "United States")
 * City: https://ipapi.co/city/ (returns: "Mountain View")
 *
 * Benefits of using country_code endpoint:
 * - Smaller response (just "US" vs full JSON object)
 * - Faster parsing (text vs JSON)
 * - Less bandwidth usage
 * - Same rate limits apply
 *
 * Rate limits (free tier):
 * - 30,000 requests/month
 * - 1,000 requests/day
 */
