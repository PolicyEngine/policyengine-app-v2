// Countries
export {
  countryIds,
  DEFAULT_COUNTRY,
  countryLabels,
  COUNTRIES,
  WEBSITE_COUNTRIES,
} from './countries';
export type { CountryId, Country } from './countries';

// Hooks
export { useCurrentCountry } from './hooks/useCurrentCountry';

// Routing
export { RedirectToCountry } from './routing/RedirectToCountry';
export { replaceCountryInPath } from './routing/urlUtils';
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
