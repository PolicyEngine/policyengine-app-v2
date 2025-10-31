import { renderWithCountry, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import HeaderLogo from '@/components/home-header/HeaderLogo';
import { TEST_COUNTRY_IDS } from '@/tests/fixtures/components/home-header/CountrySelectorMocks';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('HeaderLogo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given component renders then displays PolicyEngine logo', () => {
    // When
    renderWithCountry(<HeaderLogo />, TEST_COUNTRY_IDS.US);

    // Then
    expect(screen.getByAltText('PolicyEngine')).toBeInTheDocument();
  });

  test('given logo has correct height then height is 24px', () => {
    // When
    renderWithCountry(<HeaderLogo />, TEST_COUNTRY_IDS.US);
    const logo = screen.getByAltText('PolicyEngine');

    // Then
    expect(logo).toHaveStyle({ height: '24px' });
  });

  test('given user clicks logo from US then navigates to US home', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();

    // When
    renderWithCountry(<HeaderLogo />, TEST_COUNTRY_IDS.US);
    await user.click(screen.getByAltText('PolicyEngine'));

    // Then
    expect(mockNavigate).toHaveBeenCalledWith('/us');
  });

  test('given user clicks logo from UK then navigates to UK home', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();

    // When
    renderWithCountry(<HeaderLogo />, TEST_COUNTRY_IDS.UK);
    await user.click(screen.getByAltText('PolicyEngine'));

    // Then
    expect(mockNavigate).toHaveBeenCalledWith('/uk');
  });
});
