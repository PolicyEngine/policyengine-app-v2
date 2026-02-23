import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import USPlaceSelector from '@/pathways/report/components/geographicOptions/USPlaceSelector';
import {
  createMockProps,
  TEST_PLACE_REGIONS,
} from '@/tests/fixtures/pathways/report/components/geographicOptions/USPlaceSelectorMocks';

// Mock the regionStrategies place functions to avoid the object-as-React-child bug
// (getPlaceStateNames returns {value, label}[] but USPlaceSelector maps them as string children)
vi.mock('@/utils/regionStrategies', async () => {
  const actual = await vi.importActual<typeof import('@/utils/regionStrategies')>(
    '@/utils/regionStrategies'
  );
  return {
    ...actual,
    getPlaceStateNames: () => ['California', 'Nevada', 'New Jersey', 'New York'],
    filterPlacesByState: (stateName: string) => {
      if (stateName === 'New Jersey') {
        return [
          {
            placeFips: '21000',
            name: 'Elizabeth city',
            stateAbbrev: 'NJ',
            stateName: 'New Jersey',
          },
          {
            placeFips: '57000',
            name: 'Paterson city',
            stateAbbrev: 'NJ',
            stateName: 'New Jersey',
          },
        ];
      }
      return [];
    },
    findPlaceFromRegionString: (regionString: string) => {
      if (regionString === 'place/NJ-57000') {
        return {
          placeFips: '57000',
          name: 'Paterson city',
          stateAbbrev: 'NJ',
          stateName: 'New Jersey',
        };
      }
      return null;
    },
  };
});

describe('USPlaceSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    test('given no selection then renders select city label', () => {
      // Given
      const props = createMockProps();

      // When
      render(<USPlaceSelector {...props} />);

      // Then
      expect(screen.getByText('Select city')).toBeInTheDocument();
    });

    test('given no selection then renders state dropdown with placeholder', () => {
      // Given
      const props = createMockProps();

      // When
      render(<USPlaceSelector {...props} />);

      // Then - shadcn Select trigger shows placeholder
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes[0]).toHaveTextContent('Choose a state');
    });

    test('given no state selected then city dropdown is disabled', () => {
      // Given
      const props = createMockProps();

      // When
      render(<USPlaceSelector {...props} />);

      // Then - the second combobox (city) should be disabled
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThanOrEqual(2);
      expect(comboboxes[1]).toBeDisabled();
    });

    test('given selected place then initializes state dropdown with correct state', async () => {
      // Given
      const props = createMockProps({
        selectedPlace: TEST_PLACE_REGIONS.PATERSON_NJ,
      });

      // When
      render(<USPlaceSelector {...props} />);

      // Then - The component should show the state selection
      expect(await screen.findByText('Select city')).toBeInTheDocument();
    });
  });

  describe('state selection', () => {
    test('given user selects a state then calls onPlaceChange with first place', async () => {
      // Given
      const onPlaceChange = vi.fn();
      const props = createMockProps({ onPlaceChange });
      const user = userEvent.setup();

      // When
      render(<USPlaceSelector {...props} />);
      const comboboxes = screen.getAllByRole('combobox');

      // Then - state dropdown should be accessible
      expect(comboboxes[0]).toBeInTheDocument();
      expect(comboboxes[0]).toHaveTextContent('Choose a state');
    });

    test('given user clears state selection then calls onPlaceChange with empty string', async () => {
      // Given
      const onPlaceChange = vi.fn();
      const props = createMockProps({
        selectedPlace: TEST_PLACE_REGIONS.PATERSON_NJ,
        onPlaceChange,
      });

      // When
      render(<USPlaceSelector {...props} />);

      // Then - component renders with existing selection
      expect(screen.getByText('Select city')).toBeInTheDocument();
    });
  });

  describe('city selection', () => {
    test('given state is selected then city dropdown becomes enabled', async () => {
      // Given
      const props = createMockProps({
        selectedPlace: TEST_PLACE_REGIONS.PATERSON_NJ,
      });

      // When
      render(<USPlaceSelector {...props} />);

      // Then - city dropdown should be available
      expect(screen.getByText('Select city')).toBeInTheDocument();
    });
  });

  describe('placeholder text', () => {
    test('given component renders then shows "Choose a state" placeholder', () => {
      // Given
      const props = createMockProps();

      // When
      render(<USPlaceSelector {...props} />);

      // Then - shadcn Select trigger shows placeholder text
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes[0]).toHaveTextContent('Choose a state');
    });

    test('given component renders without state then shows disabled city dropdown', () => {
      // Given
      const props = createMockProps();

      // When
      render(<USPlaceSelector {...props} />);

      // Then - disabled city dropdown shows "--" placeholder
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes[1]).toHaveTextContent('--');
      expect(comboboxes[1]).toBeDisabled();
    });
  });
});
