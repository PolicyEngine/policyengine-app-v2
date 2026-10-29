/**
 * Types for geolocation detection services
 */

export interface GeolocationProvider {
  name: string;
  priority: number;
  detect: () => Promise<string | null>; // Returns ISO country code (e.g., 'US', 'GB')
}
