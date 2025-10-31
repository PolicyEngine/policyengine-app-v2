import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderWithCountry, screen } from '@test-utils';
import OrgLogos from '@/components/home/OrgLogos';
import { MOCK_ORG_DATA } from '@/tests/fixtures/data/organizationsMocks';
import { TEST_COUNTRY_IDS } from '@/tests/fixtures/components/home-header/CountrySelectorMocks';

describe('OrgLogos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given US country then displays US organizations', () => {
    // When
    renderWithCountry(<OrgLogos logos={MOCK_ORG_DATA} />, TEST_COUNTRY_IDS.US);

    // Then
    expect(screen.getByAltText('US Organization 1')).toBeInTheDocument();
    expect(screen.getByAltText('US Organization 2')).toBeInTheDocument();
  });

  test('given UK country then displays UK organizations', () => {
    // When
    renderWithCountry(<OrgLogos logos={MOCK_ORG_DATA} />, TEST_COUNTRY_IDS.UK);

    // Then
    expect(screen.getByAltText('UK Organization 1')).toBeInTheDocument();
    expect(screen.getByAltText('UK Organization 2')).toBeInTheDocument();
  });

  test('given empty country data then renders no organizations', () => {
    // Given
    const emptyOrgData = {
      us: {},
      uk: {},
    };

    // When
    renderWithCountry(<OrgLogos logos={emptyOrgData} />, TEST_COUNTRY_IDS.US);

    // Then
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('given organization logo then opens link on click', async () => {
    // Given
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();

    // When
    renderWithCountry(<OrgLogos logos={MOCK_ORG_DATA} />, TEST_COUNTRY_IDS.US);
    await user.click(screen.getByAltText('US Organization 1'));

    // Then
    expect(windowOpenSpy).toHaveBeenCalledWith('https://us-org1.example.com', '_blank');
  });

  test('given more than 7 organizations then limits to 7', () => {
    // Given
    const manyOrgs = {
      us: {
        org1: { name: 'Org 1', logo: '/logo1.png', link: 'https://org1.com' },
        org2: { name: 'Org 2', logo: '/logo2.png', link: 'https://org2.com' },
        org3: { name: 'Org 3', logo: '/logo3.png', link: 'https://org3.com' },
        org4: { name: 'Org 4', logo: '/logo4.png', link: 'https://org4.com' },
        org5: { name: 'Org 5', logo: '/logo5.png', link: 'https://org5.com' },
        org6: { name: 'Org 6', logo: '/logo6.png', link: 'https://org6.com' },
        org7: { name: 'Org 7', logo: '/logo7.png', link: 'https://org7.com' },
        org8: { name: 'Org 8', logo: '/logo8.png', link: 'https://org8.com' },
      },
      uk: {},
    };

    // When
    renderWithCountry(<OrgLogos logos={manyOrgs} />, TEST_COUNTRY_IDS.US);

    // Then
    expect(screen.getByAltText('Org 7')).toBeInTheDocument();
    expect(screen.queryByAltText('Org 8')).not.toBeInTheDocument();
  });
});
