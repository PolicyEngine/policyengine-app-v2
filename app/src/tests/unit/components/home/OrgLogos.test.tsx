import { renderWithCountry, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import OrgLogos from '@/components/home/OrgLogos';
import { TEST_COUNTRY_IDS } from '@/tests/fixtures/components/home-header/CountrySelectorMocks';

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
        {
          name: 'US Organization 3',
          logo: '/us-logo3.png',
          link: 'https://us-org3.example.com',
          countries: ['us'],
        },
        {
          name: 'US Organization 4',
          logo: '/us-logo4.png',
          link: 'https://us-org4.example.com',
          countries: ['us'],
        },
        {
          name: 'US Organization 5',
          logo: '/us-logo5.png',
          link: 'https://us-org5.example.com',
          countries: ['us'],
        },
        {
          name: 'US Organization 6',
          logo: '/us-logo6.png',
          link: 'https://us-org6.example.com',
          countries: ['us'],
        },
        {
          name: 'US Organization 7',
          logo: '/us-logo7.png',
          link: 'https://us-org7.example.com',
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
        {
          name: 'UK Organization 3',
          logo: '/uk-logo3.png',
          link: 'https://uk-org3.example.com',
          countries: ['uk'],
        },
        {
          name: 'UK Organization 4',
          logo: '/uk-logo4.png',
          link: 'https://uk-org4.example.com',
          countries: ['uk'],
        },
        {
          name: 'UK Organization 5',
          logo: '/uk-logo5.png',
          link: 'https://uk-org5.example.com',
          countries: ['uk'],
        },
        {
          name: 'UK Organization 6',
          logo: '/uk-logo6.png',
          link: 'https://uk-org6.example.com',
          countries: ['uk'],
        },
        {
          name: 'UK Organization 7',
          logo: '/uk-logo7.png',
          link: 'https://uk-org7.example.com',
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

  test('given US country then displays US organizations', () => {
    // When
    renderWithCountry(<OrgLogos />, TEST_COUNTRY_IDS.US);

    // Then
    expect(screen.getByAltText('US Organization 1')).toBeInTheDocument();
    expect(screen.getByAltText('US Organization 2')).toBeInTheDocument();
  });

  test('given UK country then displays UK organizations', () => {
    // When
    renderWithCountry(<OrgLogos />, TEST_COUNTRY_IDS.UK);

    // Then
    expect(screen.getByAltText('UK Organization 1')).toBeInTheDocument();
    expect(screen.getByAltText('UK Organization 2')).toBeInTheDocument();
  });

  test('given organization logo then opens link on click', async () => {
    // Given
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();

    // When
    renderWithCountry(<OrgLogos />, TEST_COUNTRY_IDS.US);
    await user.click(screen.getByAltText('US Organization 1'));

    // Then
    expect(windowOpenSpy).toHaveBeenCalledWith('https://us-org1.example.com', '_blank');
  });

  test('given US country then displays benefit platforms copy', () => {
    // When
    renderWithCountry(<OrgLogos />, TEST_COUNTRY_IDS.US);

    // Then
    expect(screen.getByText(/benefit platforms/)).toBeInTheDocument();
  });

  test('given UK country then displays simpler copy without benefit platforms', () => {
    // When
    renderWithCountry(<OrgLogos />, TEST_COUNTRY_IDS.UK);

    // Then
    expect(screen.queryByText(/benefit platforms/)).not.toBeInTheDocument();
    expect(screen.getByText('Trusted by researchers and policy organizations')).toBeInTheDocument();
  });
});
