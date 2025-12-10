import { describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';
import USStateSelector from '@/pathways/report/components/geographicOptions/USStateSelector';
import {
  mockUSStateOptions,
  TEST_VALUES,
} from '@/tests/fixtures/pathways/report/components/geographicOptionsMocks';

describe('USStateSelector', () => {
  test('given state options then renders select with label', () => {
    // Given
    const onStateChange = vi.fn();

    // When
    render(
      <USStateSelector
        stateOptions={mockUSStateOptions}
        selectedState=""
        onStateChange={onStateChange}
      />
    );

    // Then
    expect(screen.getByText('Select State')).toBeInTheDocument();
  });

  test('given state options then displays placeholder when no state selected', () => {
    // Given
    const onStateChange = vi.fn();

    // When
    render(
      <USStateSelector
        stateOptions={mockUSStateOptions}
        selectedState=""
        onStateChange={onStateChange}
      />
    );

    // Then
    expect(screen.getByPlaceholderText('Pick a state')).toBeInTheDocument();
  });

  test('given selected state then displays state label', () => {
    // Given
    const onStateChange = vi.fn();

    // When
    render(
      <USStateSelector
        stateOptions={mockUSStateOptions}
        selectedState={TEST_VALUES.CALIFORNIA_STATE}
        onStateChange={onStateChange}
      />
    );

    // Then
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('California');
  });

  test('given user selects state then calls onStateChange with value', async () => {
    // Given
    const user = userEvent.setup();
    const onStateChange = vi.fn();
    render(
      <USStateSelector
        stateOptions={mockUSStateOptions}
        selectedState=""
        onStateChange={onStateChange}
      />
    );

    // When
    await user.click(screen.getByRole('textbox'));
    await user.click(screen.getByText('California'));

    // Then
    expect(onStateChange).toHaveBeenCalledWith(TEST_VALUES.CALIFORNIA_STATE);
  });

  test('given empty state options then renders empty select', () => {
    // Given
    const onStateChange = vi.fn();

    // When
    render(
      <USStateSelector
        stateOptions={[]}
        selectedState=""
        onStateChange={onStateChange}
      />
    );

    // Then
    expect(screen.getByText('Select State')).toBeInTheDocument();
  });
});
