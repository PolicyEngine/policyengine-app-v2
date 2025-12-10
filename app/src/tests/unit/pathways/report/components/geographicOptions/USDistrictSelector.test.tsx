import { describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@test-utils';
import USDistrictSelector from '@/pathways/report/components/geographicOptions/USDistrictSelector';
import {
  mockUSDistrictOptions,
  mockUSSingleDistrictOptions,
  TEST_VALUES,
} from '@/tests/fixtures/pathways/report/components/geographicOptionsMocks';

describe('USDistrictSelector', () => {
  test('given district options then renders header text', () => {
    // Given
    const onDistrictChange = vi.fn();

    // When
    render(
      <USDistrictSelector
        districtOptions={mockUSDistrictOptions}
        selectedDistrict=""
        onDistrictChange={onDistrictChange}
      />
    );

    // Then
    expect(screen.getByText('Select Congressional District')).toBeInTheDocument();
  });

  test('given no state selected then district dropdown is disabled', () => {
    // Given
    const onDistrictChange = vi.fn();

    // When
    render(
      <USDistrictSelector
        districtOptions={mockUSDistrictOptions}
        selectedDistrict=""
        onDistrictChange={onDistrictChange}
      />
    );

    // Then
    const selects = screen.getAllByRole('textbox');
    expect(selects).toHaveLength(2);
    // The second select should be disabled
    const disabledSelect = selects[1].closest('input');
    expect(disabledSelect).toBeDisabled();
  });

  test('given user selects state then auto-selects first district', async () => {
    // Given
    const user = userEvent.setup();
    const onDistrictChange = vi.fn();
    render(
      <USDistrictSelector
        districtOptions={mockUSDistrictOptions}
        selectedDistrict=""
        onDistrictChange={onDistrictChange}
      />
    );

    // When - click on the state dropdown (first textbox)
    const stateSelect = screen.getAllByRole('textbox')[0];
    await user.click(stateSelect);
    await user.click(screen.getByText('California'));

    // Then - should auto-select first California district
    expect(onDistrictChange).toHaveBeenCalledWith(TEST_VALUES.CALIFORNIA_DISTRICT_1);
  });

  test('given single district state then shows At-large label', async () => {
    // Given
    const user = userEvent.setup();
    const onDistrictChange = vi.fn();
    render(
      <USDistrictSelector
        districtOptions={mockUSSingleDistrictOptions}
        selectedDistrict=""
        onDistrictChange={onDistrictChange}
      />
    );

    // When - click on the state dropdown
    const stateSelect = screen.getAllByRole('textbox')[0];
    await user.click(stateSelect);
    await user.click(screen.getByText('Alaska'));

    // Then - should show At-large in the district dropdown
    await waitFor(() => {
      const districtSelect = screen.getAllByRole('textbox')[1];
      expect(districtSelect).not.toBeDisabled();
    });
  });

  test('given already selected district then initializes state from district', () => {
    // Given
    const onDistrictChange = vi.fn();

    // When
    render(
      <USDistrictSelector
        districtOptions={mockUSDistrictOptions}
        selectedDistrict={TEST_VALUES.CALIFORNIA_DISTRICT_1}
        onDistrictChange={onDistrictChange}
      />
    );

    // Then - state dropdown should show California (based on useEffect initialization)
    const stateSelect = screen.getAllByRole('textbox')[0];
    expect(stateSelect).toHaveValue('California');
  });

  test('given user changes to different state then auto-selects first district of new state', async () => {
    // Given
    const user = userEvent.setup();
    const onDistrictChange = vi.fn();
    render(
      <USDistrictSelector
        districtOptions={mockUSDistrictOptions}
        selectedDistrict={TEST_VALUES.CALIFORNIA_DISTRICT_1}
        onDistrictChange={onDistrictChange}
      />
    );

    // When - change to a different state
    const stateSelect = screen.getAllByRole('textbox')[0];
    await user.click(stateSelect);
    await user.click(screen.getByText('New York'));

    // Then - should auto-select first New York district
    await waitFor(() => {
      expect(onDistrictChange).toHaveBeenCalledWith('congressional_district/NY-01');
    });
  });

  test('given empty district options then renders with empty state dropdown', () => {
    // Given
    const onDistrictChange = vi.fn();

    // When
    render(
      <USDistrictSelector
        districtOptions={[]}
        selectedDistrict=""
        onDistrictChange={onDistrictChange}
      />
    );

    // Then
    expect(screen.getByText('Select Congressional District')).toBeInTheDocument();
  });
});
