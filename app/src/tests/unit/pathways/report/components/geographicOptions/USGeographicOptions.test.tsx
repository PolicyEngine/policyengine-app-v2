import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import USGeographicOptions from '@/pathways/report/components/geographicOptions/USGeographicOptions';
import {
  mockUSDistrictOptions,
  mockUSStateOptions,
} from '@/tests/fixtures/pathways/report/components/geographicOptionsMocks';
import { US_REGION_TYPES } from '@/utils/regionStrategies';

describe('USGeographicOptions', () => {
  test('given component then renders all scope options', () => {
    // Given
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();

    // When
    render(
      <USGeographicOptions
        scope={US_REGION_TYPES.NATIONAL}
        selectedRegion=""
        stateOptions={mockUSStateOptions}
        districtOptions={mockUSDistrictOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // Then
    expect(screen.getByLabelText('All households nationally')).toBeInTheDocument();
    expect(
      screen.getByLabelText('All households in a state or federal district')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('All households in a congressional district')).toBeInTheDocument();
    expect(screen.getByLabelText('Custom household')).toBeInTheDocument();
  });

  test('given national scope then national radio is checked', () => {
    // Given
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();

    // When
    render(
      <USGeographicOptions
        scope={US_REGION_TYPES.NATIONAL}
        selectedRegion=""
        stateOptions={mockUSStateOptions}
        districtOptions={mockUSDistrictOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // Then
    expect(screen.getByLabelText('All households nationally')).toBeChecked();
    expect(
      screen.getByLabelText('All households in a state or federal district')
    ).not.toBeChecked();
  });

  test('given state scope then shows state selector', () => {
    // Given
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();

    // When
    render(
      <USGeographicOptions
        scope={US_REGION_TYPES.STATE}
        selectedRegion=""
        stateOptions={mockUSStateOptions}
        districtOptions={mockUSDistrictOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // Then
    expect(screen.getByText('Select State')).toBeInTheDocument();
  });

  test('given national scope then does not show state selector', () => {
    // Given
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();

    // When
    render(
      <USGeographicOptions
        scope={US_REGION_TYPES.NATIONAL}
        selectedRegion=""
        stateOptions={mockUSStateOptions}
        districtOptions={mockUSDistrictOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // Then
    expect(screen.queryByText('Select State')).not.toBeInTheDocument();
  });

  test('given congressional_district scope then shows district selector', () => {
    // Given
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();

    // When
    render(
      <USGeographicOptions
        scope={US_REGION_TYPES.CONGRESSIONAL_DISTRICT}
        selectedRegion=""
        stateOptions={mockUSStateOptions}
        districtOptions={mockUSDistrictOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // Then
    expect(screen.getByText('Select Congressional District')).toBeInTheDocument();
  });

  test('given user clicks state option then calls onScopeChange and clears region', async () => {
    // Given
    const user = userEvent.setup();
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();
    render(
      <USGeographicOptions
        scope={US_REGION_TYPES.NATIONAL}
        selectedRegion=""
        stateOptions={mockUSStateOptions}
        districtOptions={mockUSDistrictOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // When
    await user.click(screen.getByLabelText('All households in a state or federal district'));

    // Then
    expect(onRegionChange).toHaveBeenCalledWith('');
    expect(onScopeChange).toHaveBeenCalledWith(US_REGION_TYPES.STATE);
  });

  test('given user clicks congressional district option then calls onScopeChange and clears region', async () => {
    // Given
    const user = userEvent.setup();
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();
    render(
      <USGeographicOptions
        scope={US_REGION_TYPES.NATIONAL}
        selectedRegion=""
        stateOptions={mockUSStateOptions}
        districtOptions={mockUSDistrictOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // When
    await user.click(screen.getByLabelText('All households in a congressional district'));

    // Then
    expect(onRegionChange).toHaveBeenCalledWith('');
    expect(onScopeChange).toHaveBeenCalledWith(US_REGION_TYPES.CONGRESSIONAL_DISTRICT);
  });

  test('given user clicks household option then calls onScopeChange with household', async () => {
    // Given
    const user = userEvent.setup();
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();
    render(
      <USGeographicOptions
        scope={US_REGION_TYPES.NATIONAL}
        selectedRegion=""
        stateOptions={mockUSStateOptions}
        districtOptions={mockUSDistrictOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // When
    await user.click(screen.getByLabelText('Custom household'));

    // Then
    expect(onScopeChange).toHaveBeenCalledWith('household');
  });

  test('given empty state options then does not show state selector even when state scope', () => {
    // Given
    const onScopeChange = vi.fn();
    const onRegionChange = vi.fn();

    // When
    render(
      <USGeographicOptions
        scope={US_REGION_TYPES.STATE}
        selectedRegion=""
        stateOptions={[]}
        districtOptions={mockUSDistrictOptions}
        onScopeChange={onScopeChange}
        onRegionChange={onRegionChange}
      />
    );

    // Then
    expect(screen.queryByText('Select State')).not.toBeInTheDocument();
  });
});
