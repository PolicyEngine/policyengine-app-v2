import { GeolocationProvider } from '@/routing/geolocation/types';

export const MOCK_US_COUNTRY_CODE = 'US';
export const MOCK_UK_COUNTRY_CODE = 'GB';
export const MOCK_CA_COUNTRY_CODE = 'CA';

export const MOCK_US_ROUTE = 'us';
export const MOCK_UK_ROUTE = 'uk';

export class MockSuccessProvider implements GeolocationProvider {
  name = 'MockSuccess';
  priority = 1;
  countryCode: string;

  constructor(countryCode: string = MOCK_US_COUNTRY_CODE) {
    this.countryCode = countryCode;
  }

  async detect(): Promise<string | null> {
    return this.countryCode;
  }
}

export class MockFailProvider implements GeolocationProvider {
  name = 'MockFail';
  priority = 2;

  async detect(): Promise<string | null> {
    return null;
  }
}

export class MockErrorProvider implements GeolocationProvider {
  name = 'MockError';
  priority = 3;

  async detect(): Promise<string | null> {
    // Simulates a provider that encounters an error but handles it gracefully
    return null;
  }
}
