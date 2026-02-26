import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import UKGeographicOptions from '@/pathways/report/components/geographicOptions/UKGeographicOptions';
import {
  mockUKConstituencyOptions,
  mockUKCountryOptions,
  mockUKLocalAuthorityOptions,
  TEST_VALUES,
} from '@/tests/fixtures/pathways/report/components/geographicOptionsMocks';
import { UK_REGION_TYPES } from '@/utils/regionStrategies';

describe('UKGeographicOptions', () => {
  test('given component then renders all scope options', () => {
    // Given
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();

    // When
    render(
      <UKGeographicOptions
        scope={UK_REGION_TYPES.NATIONAL}
        selectedRegion=""
        countryOptions={mockUKCountryOptions}
        constituencyOptions={mockUKConstituencyOptions}
        localAuthorityOptions={mockUKLocalAuthorityOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // Then
    expect(screen.getByLabelText('All households UK-wide')).toBeInTheDocument();
    expect(screen.getByLabelText('All households in a country')).toBeInTheDocument();
    expect(screen.getByLabelText('All households in a constituency')).toBeInTheDocument();
    expect(screen.getByLabelText('All households in a local authority')).toBeInTheDocument();
    expect(screen.getByLabelText('Custom household')).toBeInTheDocument();
  });

  test('given national scope then national radio is checked', () => {
    // Given
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();

    // When
    render(
      <UKGeographicOptions
        scope={UK_REGION_TYPES.NATIONAL}
        selectedRegion=""
        countryOptions={mockUKCountryOptions}
        constituencyOptions={mockUKConstituencyOptions}
        localAuthorityOptions={mockUKLocalAuthorityOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // Then
    expect(screen.getByLabelText('All households UK-wide')).toBeChecked();
    expect(screen.getByLabelText('All households in a country')).not.toBeChecked();
  });

  test('given country scope then shows country selector', () => {
    // Given
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();

    // When
    render(
      <UKGeographicOptions
        scope={UK_REGION_TYPES.COUNTRY}
        selectedRegion=""
        countryOptions={mockUKCountryOptions}
        constituencyOptions={mockUKConstituencyOptions}
        localAuthorityOptions={mockUKLocalAuthorityOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // Then
    expect(screen.getByText('Select Country')).toBeInTheDocument();
  });

  test('given national scope then does not show country selector', () => {
    // Given
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();

    // When
    render(
      <UKGeographicOptions
        scope={UK_REGION_TYPES.NATIONAL}
        selectedRegion=""
        countryOptions={mockUKCountryOptions}
        constituencyOptions={mockUKConstituencyOptions}
        localAuthorityOptions={mockUKLocalAuthorityOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // Then
    expect(screen.queryByText('Select Country')).not.toBeInTheDocument();
  });

  test('given constituency scope then shows constituency selector', () => {
    // Given
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();

    // When
    render(
      <UKGeographicOptions
        scope={UK_REGION_TYPES.CONSTITUENCY}
        selectedRegion=""
        countryOptions={mockUKCountryOptions}
        constituencyOptions={mockUKConstituencyOptions}
        localAuthorityOptions={mockUKLocalAuthorityOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // Then
    expect(screen.getByText('Select Parliamentary Constituency')).toBeInTheDocument();
  });

  test('given user clicks country option then calls onScopeChange', async () => {
    // Given
    const user = userEvent.setup();
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();
    render(
      <UKGeographicOptions
        scope={UK_REGION_TYPES.NATIONAL}
        selectedRegion=""
        countryOptions={mockUKCountryOptions}
        constituencyOptions={mockUKConstituencyOptions}
        localAuthorityOptions={mockUKLocalAuthorityOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // When
    await user.click(screen.getByLabelText('All households in a country'));

    // Then
    expect(onScopeChange).toHaveBeenCalledWith(UK_REGION_TYPES.COUNTRY);
  });

  test('given user clicks constituency option then calls onScopeChange', async () => {
    // Given
    const user = userEvent.setup();
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();
    render(
      <UKGeographicOptions
        scope={UK_REGION_TYPES.NATIONAL}
        selectedRegion=""
        countryOptions={mockUKCountryOptions}
        constituencyOptions={mockUKConstituencyOptions}
        localAuthorityOptions={mockUKLocalAuthorityOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // When
    await user.click(screen.getByLabelText('All households in a constituency'));

    // Then
    expect(onScopeChange).toHaveBeenCalledWith(UK_REGION_TYPES.CONSTITUENCY);
  });

  test('given user clicks household option then calls onScopeChange with household', async () => {
    // Given
    const user = userEvent.setup();
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();
    render(
      <UKGeographicOptions
        scope={UK_REGION_TYPES.NATIONAL}
        selectedRegion=""
        countryOptions={mockUKCountryOptions}
        constituencyOptions={mockUKConstituencyOptions}
        localAuthorityOptions={mockUKLocalAuthorityOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // When
    await user.click(screen.getByLabelText('Custom household'));

    // Then
    expect(onScopeChange).toHaveBeenCalledWith('household');
  });

  test('given country scope with selected country then displays country value', () => {
    // Given
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();

    // When
    render(
      <UKGeographicOptions
        scope={UK_REGION_TYPES.COUNTRY}
        selectedRegion={TEST_VALUES.ENGLAND_COUNTRY}
        countryOptions={mockUKCountryOptions}
        constituencyOptions={mockUKConstituencyOptions}
        localAuthorityOptions={mockUKLocalAuthorityOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // Then
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('England');
  });

  test('given user selects country from dropdown then calls onRegionChange', async () => {
    // Given
    const user = userEvent.setup();
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();
    render(
      <UKGeographicOptions
        scope={UK_REGION_TYPES.COUNTRY}
        selectedRegion=""
        countryOptions={mockUKCountryOptions}
        constituencyOptions={mockUKConstituencyOptions}
        localAuthorityOptions={mockUKLocalAuthorityOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // When
    await user.click(screen.getByRole('textbox'));
    await user.click(screen.getByText('England'));

    // Then
    expect(onRegionChange).toHaveBeenCalledWith(TEST_VALUES.ENGLAND_COUNTRY);
  });

  test('given empty country options then does not show country selector even when country scope', () => {
    // Given
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();

    // When
    render(
      <UKGeographicOptions
        scope={UK_REGION_TYPES.COUNTRY}
        selectedRegion=""
        countryOptions={[]}
        constituencyOptions={mockUKConstituencyOptions}
        localAuthorityOptions={mockUKLocalAuthorityOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // Then
    expect(screen.queryByText('Select Country')).not.toBeInTheDocument();
  });
});
