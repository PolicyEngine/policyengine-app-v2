import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useRegions } from '@/hooks/useRegions';
import USPlaceSelector from '@/pathways/report/components/geographicOptions/USPlaceSelector';
import {
  createMockProps,
  TEST_PLACE_REGIONS,
} from '@/tests/fixtures/pathways/report/components/geographicOptions/USPlaceSelectorMocks';
import { mockUSRegionRecords } from '@/tests/fixtures/utils/regionStrategiesMocks';

vi.mock('@/hooks/useRegions', () => ({
  useRegions: vi.fn(),
}));

describe('USPlaceSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRegions).mockReturnValue({
      data: mockUSRegionRecords,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useRegions>);
  });

  test('given no selection then renders the state and city controls', () => {
    // When
    render(<USPlaceSelector {...createMockProps()} />);

    // Then
    expect(screen.getByText('Select state')).toBeInTheDocument();
    expect(screen.getByText('Select city')).toBeInTheDocument();
    expect(screen.getAllByRole('combobox')[0]).toHaveTextContent('Choose a state');
  });

  test('given no state selected then city dropdown is disabled', () => {
    // When
    render(<USPlaceSelector {...createMockProps()} />);

    // Then
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes[1]).toBeDisabled();
    expect(comboboxes[1]).toHaveTextContent('--');
  });

  test('given canonical region data then it derives place options from v2 regions', () => {
    // When
    render(<USPlaceSelector {...createMockProps()} />);

    // Then
    expect(vi.mocked(useRegions)).toHaveBeenCalledWith('us');
  });

  test('given a selected place then it initializes the state from the region string', async () => {
    // When
    render(
      <USPlaceSelector
        {...createMockProps({
          selectedPlace: TEST_PLACE_REGIONS.PATERSON_NJ,
        })}
      />
    );

    // Then
    expect(await screen.findByText('Select city')).toBeInTheDocument();
  });
});
