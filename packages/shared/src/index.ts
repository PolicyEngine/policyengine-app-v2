// Countries
export { countryIds, DEFAULT_COUNTRY } from './countries';
export type { CountryId } from './countries';

// Hooks
export { useCurrentCountry } from './hooks/useCurrentCountry';

// Routing
export { RedirectToCountry } from './routing/RedirectToCountry';
export {
  GeolocationService,
  geolocationService,
  createGeolocationService,
  mapIsoToRoute,
  isSupportedCountry,
  getDefaultCountry,
  BrowserProvider,
  IpApiCoProvider,
} from './routing/geolocation';
export type { GeolocationProvider, IpInfoResponse } from './routing/geolocation';
