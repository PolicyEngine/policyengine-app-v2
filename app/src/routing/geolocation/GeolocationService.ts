import { getDefaultCountry, mapIsoToRoute } from './countryMapper';
import { BrowserProvider } from './providers/BrowserProvider';
import { IpApiCoProvider } from './providers/IpApiCoProvider';
import { GeolocationProvider } from './types';

/**
 * Coordinates geolocation providers to detect user's country.
 * Tries providers in priority order and maps ISO codes to PolicyEngine routes.
 */
export class GeolocationService {
  private providers: GeolocationProvider[] = [];

  constructor() {
    // Initialize providers in priority order
    this.providers = [
      new IpApiCoProvider(), // Primary IP-based provider (30k free/month)
      new BrowserProvider(), // Fallback using browser language
    ];

    // Sort by priority (lower number = higher priority)
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Detects user's country using available providers in priority order
   * @returns PolicyEngine route code (e.g., 'us', 'uk')
   */
  async detectCountry(): Promise<string> {
    // Try each provider in priority order
    for (const provider of this.providers) {
      const isoCode = await provider.detect();

      if (isoCode) {
        const routeCode = mapIsoToRoute(isoCode);
        if (routeCode) {
          return routeCode;
        }
      }
    }

    // If all providers fail or return unsupported countries, use default
    return getDefaultCountry();
  }
}

// Export singleton instance
export const geolocationService = new GeolocationService();
