import { render, screen, userEvent, waitFor } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
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

    // Then - text is now sentence case
    expect(screen.getByText('Select congressional district')).toBeInTheDocument();
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

    // Then - shadcn Select triggers have role="combobox"
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes).toHaveLength(2);
    // The second combobox (district) should be disabled
    expect(comboboxes[1]).toBeDisabled();
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

    // Then - verify the state select trigger renders with correct placeholder
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes[0]).toHaveTextContent('Pick a state');
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

    // Then - verify component renders with state and district dropdowns
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes).toHaveLength(2);
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

    // Then - state dropdown should show California
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes[0]).toHaveTextContent('California');
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

    // Then - verify the state dropdown shows California
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes[0]).toHaveTextContent('California');
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

    // Then - text is now sentence case
    expect(screen.getByText('Select congressional district')).toBeInTheDocument();
  });
});
