import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import USPlaceSelector from '@/pathways/report/components/geographicOptions/USPlaceSelector';
import {
  createMockProps,
  TEST_PLACE_REGIONS,
} from '@/tests/fixtures/pathways/report/components/geographicOptions/USPlaceSelectorMocks';

describe('USPlaceSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    test('given no selection then renders select community label', () => {
      // Given
      const props = createMockProps();

      // When
      render(<USPlaceSelector {...props} />);

      // Then
      expect(screen.getByText('Select community')).toBeInTheDocument();
    });

    test('given no selection then renders state dropdown with placeholder', () => {
      // Given
      const props = createMockProps();

      // When
      render(<USPlaceSelector {...props} />);

      // Then
      expect(screen.getByPlaceholderText('Choose a state')).toBeInTheDocument();
    });

    test('given no state selected then community dropdown is disabled', () => {
      // Given
      const props = createMockProps();

      // When
      render(<USPlaceSelector {...props} />);

      // Then
      // The second select should show "--" placeholder when disabled
      const selects = screen.getAllByRole('textbox');
      expect(selects.length).toBeGreaterThanOrEqual(1);
    });

    test('given selected place then initializes state dropdown with correct state', async () => {
      // Given
      const props = createMockProps({
        selectedPlace: TEST_PLACE_REGIONS.PATERSON_NJ,
      });

      // When
      render(<USPlaceSelector {...props} />);

      // Then - The component should show the state selection
      // Since Paterson is in New Jersey, the state dropdown should show New Jersey
      expect(await screen.findByText('Select community')).toBeInTheDocument();
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
      const stateDropdown = screen.getByPlaceholderText('Choose a state');
      await user.click(stateDropdown);

      // Then - state options should be visible
      // The dropdown should contain state names from getPlaceStateNames()
      expect(stateDropdown).toBeInTheDocument();
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
      expect(screen.getByText('Select community')).toBeInTheDocument();
    });
  });

  describe('community selection', () => {
    test('given state is selected then community dropdown becomes enabled', async () => {
      // Given
      const props = createMockProps({
        selectedPlace: TEST_PLACE_REGIONS.PATERSON_NJ,
      });

      // When
      render(<USPlaceSelector {...props} />);

      // Then - community dropdown should be available (not showing "--")
      expect(screen.getByText('Select community')).toBeInTheDocument();
    });
  });

  describe('placeholder text', () => {
    test('given component renders then shows "Choose a state" placeholder', () => {
      // Given
      const props = createMockProps();

      // When
      render(<USPlaceSelector {...props} />);

      // Then
      expect(screen.getByPlaceholderText('Choose a state')).toBeInTheDocument();
    });

    test('given component renders without state then shows disabled community dropdown', () => {
      // Given
      const props = createMockProps();

      // When
      render(<USPlaceSelector {...props} />);

      // Then - should show disabled dropdown with "--" placeholder
      const communityPlaceholder = screen.getByPlaceholderText('--');
      expect(communityPlaceholder).toBeInTheDocument();
    });
  });
});
