import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import UKGeographicScopeForm from '@/frames/population/components/UKGeographicScopeForm';

describe('UKGeographicScopeForm', () => {
  const user = userEvent.setup();

  const mockRegionOptions = [
    { name: 'uk', label: 'United Kingdom' },
    { name: 'country/england', label: 'England' },
    { name: 'country/scotland', label: 'Scotland' },
    { name: 'constituency/london', label: 'London' },
    { name: 'constituency/manchester', label: 'Manchester' },
  ];

  const defaultProps = {
    scope: 'uk-wide' as const,
    selectedRegion: '',
    regionOptions: mockRegionOptions,
    onScopeChange: vi.fn(),
    onRegionChange: vi.fn(),
  };

  const renderComponent = (props: typeof defaultProps | any = defaultProps) => {
    return render(
      <MantineProvider>
        <UKGeographicScopeForm {...props} />
      </MantineProvider>
    );
  };

  test('given component renders then shows all UK scope options', () => {
    // When
    renderComponent();

    // Then
    expect(screen.getByLabelText('UK-wide')).toBeInTheDocument();
    expect(screen.getByLabelText('Country')).toBeInTheDocument();
    expect(screen.getByLabelText('Parliamentary constituency')).toBeInTheDocument();
    expect(screen.getByLabelText('Household')).toBeInTheDocument();
  });

  test('given uk-wide scope selected then uk-wide radio is checked', () => {
    // When
    renderComponent({ ...defaultProps, scope: 'uk-wide' });

    // Then
    const ukWideRadio = screen.getByLabelText('UK-wide') as HTMLInputElement;
    expect(ukWideRadio.checked).toBe(true);
  });

  test('given country scope selected then shows country dropdown', () => {
    // When
    const props = { ...defaultProps, scope: 'country' as 'country' };
    renderComponent(props);

    // Then
    expect(screen.getByPlaceholderText('Pick a country')).toBeInTheDocument();
  });

  test('given constituency scope selected then shows constituency dropdown', () => {
    // When
    const props = { ...defaultProps, scope: 'constituency' as 'constituency' };
    renderComponent(props);

    // Then
    expect(screen.getByPlaceholderText('Search for a constituency')).toBeInTheDocument();
  });

  test('given uk-wide scope selected then dropdowns are hidden', () => {
    // When
    renderComponent({ ...defaultProps, scope: 'uk-wide' });

    // Then
    expect(screen.queryByPlaceholderText('Pick a country')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search for a constituency')).not.toBeInTheDocument();
  });

  test('given user clicks country radio then calls onScopeChange', async () => {
    // Given
    const onScopeChange = vi.fn();
    renderComponent({ ...defaultProps, onScopeChange });

    // When
    const countryRadio = screen.getByLabelText('Country');
    await user.click(countryRadio);

    // Then
    expect(onScopeChange).toHaveBeenCalledWith('country');
  });

  test('given user clicks constituency radio then calls onScopeChange', async () => {
    // Given
    const onScopeChange = vi.fn();
    renderComponent({ ...defaultProps, onScopeChange });

    // When
    const constituencyRadio = screen.getByLabelText('Parliamentary constituency');
    await user.click(constituencyRadio);

    // Then
    expect(onScopeChange).toHaveBeenCalledWith('constituency');
  });

  test('given user clicks uk-wide radio then calls onScopeChange', async () => {
    // Given
    const onScopeChange = vi.fn();
    const props = { ...defaultProps, scope: 'country' as 'country', onScopeChange };
    renderComponent(props);

    // When
    const ukWideRadio = screen.getByLabelText('UK-wide');
    await user.click(ukWideRadio);

    // Then
    expect(onScopeChange).toHaveBeenCalledWith('uk-wide');
  });

  test('given user clicks household radio then calls onScopeChange', async () => {
    // Given
    const onScopeChange = vi.fn();
    renderComponent({ ...defaultProps, onScopeChange });

    // When
    const householdRadio = screen.getByLabelText('Household');
    await user.click(householdRadio);

    // Then
    expect(onScopeChange).toHaveBeenCalledWith('household');
  });

  test('given user selects country then calls onRegionChange', async () => {
    // Given
    const onRegionChange = vi.fn();
    const props = { ...defaultProps, scope: 'country' as 'country', onRegionChange };
    renderComponent(props);

    // When
    const dropdown = screen.getByPlaceholderText('Pick a country');
    await user.click(dropdown);

    const scotland = await screen.findByText('Scotland');
    await user.click(scotland);

    // Then
    expect(onRegionChange).toHaveBeenCalledWith('country/scotland');
  });
});
