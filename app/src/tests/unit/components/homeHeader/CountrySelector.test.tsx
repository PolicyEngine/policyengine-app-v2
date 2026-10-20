import { renderWithCountry, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import CountrySelector from '@/components/homeHeader/CountrySelector';
import { FALLBACK_COUNTRIES, useCountries } from '@/hooks/useCountries';
import { MOCK_PATHS } from '@/tests/fixtures/components/homeHeader/CountrySelectorMocks';

vi.mock('@/hooks/useCountries', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useCountries')>()),
  useCountries: vi.fn(),
}));

const mockUseCountries = vi.mocked(useCountries);

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CountrySelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCountries.mockReturnValue({ countries: FALLBACK_COUNTRIES, isFallback: true });
  });

  test('given the Public API lists the countries then the dropdown shows its names', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();
    mockUseCountries.mockReturnValue({
      countries: [
        {
          id: 'us',
          name: 'United States of America',
          householdEnabled: true,
          societyWideEnabled: true,
        },
        { id: 'uk', name: 'United Kingdom', householdEnabled: true, societyWideEnabled: true },
      ],
      isFallback: false,
    });

    // When
    renderWithCountry(<CountrySelector />, 'us');
    await user.click(screen.getByRole('button', { name: /country selector/i }));

    // Then
    expect(screen.getByText('United States of America')).toBeInTheDocument();
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
  });

  test('given the Public API lists only the US then only the US is offered', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();
    mockUseCountries.mockReturnValue({
      countries: [
        { id: 'us', name: 'United States', householdEnabled: true, societyWideEnabled: true },
      ],
      isFallback: false,
    });

    // When
    renderWithCountry(<CountrySelector />, 'us');
    await user.click(screen.getByRole('button', { name: /country selector/i }));

    // Then
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.queryByText('United Kingdom')).not.toBeInTheDocument();
  });

  test('given component renders then displays country selector button', () => {
    // When
    renderWithCountry(<CountrySelector />, 'us');

    // Then
    expect(screen.getByRole('button', { name: /country selector/i })).toBeInTheDocument();
  });

  test('given user clicks selector then shows country dropdown', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();

    // When
    renderWithCountry(<CountrySelector />, 'us');
    await user.click(screen.getByRole('button', { name: /country selector/i }));

    // Then
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
  });

  test('given current country is US then US option is bold', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();

    // When
    renderWithCountry(<CountrySelector />, 'us');
    await user.click(screen.getByRole('button', { name: /country selector/i }));
    const usOption = screen.getByText('United States');

    // Then
    expect(usOption).toHaveStyle({ fontWeight: 700 });
  });

  test('given current country is UK then UK option is bold', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();

    // When
    renderWithCountry(<CountrySelector />, 'uk');
    await user.click(screen.getByRole('button', { name: /country selector/i }));
    const ukOption = screen.getByText('United Kingdom');

    // Then
    expect(ukOption).toHaveStyle({ fontWeight: 700 });
  });

  test('given user selects UK from US then navigates to UK path', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();

    // When
    renderWithCountry(<CountrySelector />, 'us', MOCK_PATHS.US_POLICY);
    await user.click(screen.getByRole('button', { name: /country selector/i }));
    await user.click(screen.getByText('United Kingdom'));

    // Then
    expect(mockNavigate).toHaveBeenCalledWith('/uk/policy/123');
  });

  test('given user selects US from UK then navigates to US path', async () => {
    // Given
    const { userEvent } = await import('@test-utils');
    const user = userEvent.setup();

    // When
    renderWithCountry(<CountrySelector />, 'uk', MOCK_PATHS.UK_POLICY);
    await user.click(screen.getByRole('button', { name: /country selector/i }));
    await user.click(screen.getByText('United States'));

    // Then
    expect(mockNavigate).toHaveBeenCalledWith('/us/policy/456');
  });
});
