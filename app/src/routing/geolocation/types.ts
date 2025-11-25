/**
 * Types for geolocation detection services
 */

export interface GeolocationProvider {
  name: string;
  priority: number;
  detect: () => Promise<string | null>; // Returns ISO country code (e.g., 'US', 'GB')
}

export interface IpInfoResponse {
  ip: string;
  city?: string;
  region?: string;
  country: string; // ISO 3166-1 alpha-2 code
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
}
