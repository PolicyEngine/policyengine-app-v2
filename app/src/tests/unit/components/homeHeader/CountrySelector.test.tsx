import { renderWithCountry, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import CountrySelector from '@/components/homeHeader/CountrySelector';
import { MOCK_PATHS } from '@/tests/fixtures/components/homeHeader/CountrySelectorMocks';

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
