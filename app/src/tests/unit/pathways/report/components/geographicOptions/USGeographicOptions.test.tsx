import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import USGeographicOptions from '@/pathways/report/components/geographicOptions/USGeographicOptions';
import {
  mockUSDistrictOptions,
  mockUSStateOptions,
} from '@/tests/fixtures/pathways/report/components/geographicOptionsMocks';
import { US_REGION_TYPES } from '@/utils/regionStrategies';

// Mock the regionStrategies place functions to avoid the object-as-React-child bug
// (getPlaceStateNames returns {value, label}[] but USPlaceSelector maps them as string children)
vi.mock('@/utils/regionStrategies', async () => {
  const actual = await vi.importActual<typeof import('@/utils/regionStrategies')>(
    '@/utils/regionStrategies'
  );
  return {
    ...actual,
    getPlaceStateNames: () => ['California', 'Nevada', 'New Jersey', 'New York'],
    filterPlacesByState: () => [],
  };
});

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
    expect(screen.getByLabelText('All households in a city')).toBeInTheDocument();
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

  // Place (city) tests
  describe('place (city) option', () => {
    test('given component then renders city option with correct label', () => {
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
      expect(screen.getByLabelText('All households in a city')).toBeInTheDocument();
    });

    test('given place scope then place radio is checked', () => {
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
      expect(screen.getByLabelText('All households in a city')).toBeChecked();
    });

    test('given place scope then shows place selector', () => {
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
      expect(screen.getByText('Select city')).toBeInTheDocument();
    });

    test('given national scope then does not show place selector', () => {
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
      expect(screen.queryByText('Select city')).not.toBeInTheDocument();
    });

    test('given user clicks place option then calls onScopeChange with place', async () => {
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
      await user.click(screen.getByLabelText('All households in a city'));

      // Then
      expect(onRegionChange).toHaveBeenCalledWith('');
      expect(onScopeChange).toHaveBeenCalledWith(US_REGION_TYPES.PLACE);
    });

    test('given user switches from state to place then clears selected region', async () => {
      // Given
      const user = userEvent.setup();
      const onScopeChange = vi.fn();
      const onRegionChange = vi.fn();
      render(
        <USGeographicOptions
          scope={US_REGION_TYPES.STATE}
          selectedRegion="state/ca"
          stateOptions={mockUSStateOptions}
          districtOptions={mockUSDistrictOptions}
          onScopeChange={onScopeChange}
          onRegionChange={onRegionChange}
        />
      );

      // When
      await user.click(screen.getByLabelText('All households in a city'));

      // Then
      expect(onRegionChange).toHaveBeenCalledWith('');
      expect(onScopeChange).toHaveBeenCalledWith(US_REGION_TYPES.PLACE);
    });
  });
});
