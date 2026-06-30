import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useRegions } from '@/hooks/useRegions';
import USGeographicOptions from '@/pathways/report/components/geographicOptions/USGeographicOptions';
import {
  mockUSDistrictOptions,
  mockUSStateOptions,
} from '@/tests/fixtures/pathways/report/components/geographicOptionsMocks';
import { mockUSRegionRecords } from '@/tests/fixtures/utils/regionStrategiesMocks';
import { US_REGION_TYPES } from '@/utils/regionStrategies';

vi.mock('@/hooks/useRegions', () => ({
  useRegions: vi.fn(),
}));

describe('USGeographicOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRegions).mockReturnValue({
      data: mockUSRegionRecords,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useRegions>);
  });

  test('given component then renders available scope options', () => {
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
    expect(screen.queryByLabelText('All households in a city')).not.toBeInTheDocument();
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

    // Then - text is now sentence case
    expect(screen.getByText('Select state')).toBeInTheDocument();
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

    // Then - text is now sentence case
    expect(screen.queryByText('Select state')).not.toBeInTheDocument();
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

    // Then - text is now sentence case
    expect(screen.getByText('Select congressional district')).toBeInTheDocument();
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

    // Then - text is now sentence case
    expect(screen.queryByText('Select state')).not.toBeInTheDocument();
  });

  describe('temporarily hidden place (city) option', () => {
    test('given component then does not render city option', () => {
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
      expect(screen.queryByLabelText('All households in a city')).not.toBeInTheDocument();
    });

    test('given stale place scope then does not show place selector', () => {
      // Given
      const onScopeChange = vi.fn();
      const onRegionChange = vi.fn();

      // When
      render(
        <USGeographicOptions
          scope={US_REGION_TYPES.PLACE}
          selectedRegion=""
          stateOptions={mockUSStateOptions}
          districtOptions={mockUSDistrictOptions}
          onScopeChange={onScopeChange}
          onRegionChange={onRegionChange}
        />
      );

      // Then
      expect(screen.queryByLabelText('All households in a city')).not.toBeInTheDocument();
      expect(screen.queryByText('Select city')).not.toBeInTheDocument();
    });
  });
});
