import { renderWithCountry, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import OrgLogos from '@/components/home/OrgLogos';
import { TEST_COUNTRY_IDS } from '@/tests/fixtures/components/homeHeader/CountrySelectorMocks';

// Mock the organizations module
vi.mock('@/data/organizations', () => ({
  getOrgsForCountry: vi.fn((countryId: string) => {
    if (countryId === 'us') {
      return [
        {
          name: 'US Organization 1',
          logo: '/us-logo1.png',
          link: 'https://us-org1.example.com',
          countries: ['us'],
        },
        {
          name: 'US Organization 2',
          logo: '/us-logo2.png',
          link: 'https://us-org2.example.com',
          countries: ['us'],
        },
      ];
    }
    if (countryId === 'uk') {
      return [
        {
          name: 'UK Organization 1',
          logo: '/uk-logo1.png',
          link: 'https://uk-org1.example.com',
          countries: ['uk'],
        },
        {
          name: 'UK Organization 2',
          logo: '/uk-logo2.png',
          link: 'https://uk-org2.example.com',
          countries: ['uk'],
        },
      ];
    }
    return [];
  }),
}));

describe('OrgLogos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // The carousel renders two copies of each logo for seamless looping,
  // so we use getAllByAltText and check the first instance.

  test('given US country then displays US organizations', () => {
    renderWithCountry(<OrgLogos />, TEST_COUNTRY_IDS.US);
    expect(screen.getAllByAltText('US Organization 1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByAltText('US Organization 2').length).toBeGreaterThanOrEqual(1);
  });

  test('given UK country then displays UK organizations', () => {
    renderWithCountry(<OrgLogos />, TEST_COUNTRY_IDS.UK);
    expect(screen.getAllByAltText('UK Organization 1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByAltText('UK Organization 2').length).toBeGreaterThanOrEqual(1);
  });

  test('given organization logo then links to correct URL', () => {
    renderWithCountry(<OrgLogos />, TEST_COUNTRY_IDS.US);
    const link = screen.getAllByAltText('US Organization 1')[0].closest('a');
    expect(link).toHaveAttribute('href', 'https://us-org1.example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  test('given US country then displays benefit platforms copy', () => {
    renderWithCountry(<OrgLogos />, TEST_COUNTRY_IDS.US);
    expect(screen.getByText(/benefit platforms/)).toBeInTheDocument();
  });

  test('given UK country then displays policy organisations copy', () => {
    renderWithCountry(<OrgLogos />, TEST_COUNTRY_IDS.UK);
    expect(screen.queryByText(/benefit platforms/)).not.toBeInTheDocument();
    expect(screen.getByText('Trusted by researchers and policy organisations')).toBeInTheDocument();
  });
});
