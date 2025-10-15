import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import USGeographicScopeForm from '@/frames/population/components/USGeographicScopeForm';

describe('USGeographicScopeForm', () => {
  const user = userEvent.setup();

  const mockRegionOptions = [
    { name: 'us', label: 'United States' },
    { name: 'state/ca', label: 'California' },
    { name: 'state/ny', label: 'New York' },
  ];

  const defaultProps = {
    scope: 'national' as const,
    selectedState: '',
    regionOptions: mockRegionOptions,
    onScopeChange: vi.fn(),
    onStateChange: vi.fn(),
  };

  const renderComponent = (props: typeof defaultProps | any = defaultProps) => {
    return render(
      <MantineProvider>
        <USGeographicScopeForm {...props} />
      </MantineProvider>
    );
  };

  test('given component renders then shows all US scope options', () => {
    // When
    renderComponent();

    // Then
    expect(screen.getByLabelText('National')).toBeInTheDocument();
    expect(screen.getByLabelText('State')).toBeInTheDocument();
    expect(screen.getByLabelText('Household')).toBeInTheDocument();
  });

  test('given national scope selected then national radio is checked', () => {
    // When
    renderComponent({ ...defaultProps, scope: 'national' });

    // Then
    const nationalRadio = screen.getByLabelText('National') as HTMLInputElement;
    expect(nationalRadio.checked).toBe(true);
  });

  test('given state scope selected then shows state dropdown', () => {
    // When
    const props = { ...defaultProps, scope: 'state' as 'state' };
    renderComponent(props);

    // Then
    expect(screen.getByPlaceholderText('Pick a state')).toBeInTheDocument();
  });

  test('given national scope selected then state dropdown is hidden', () => {
    // When
    renderComponent({ ...defaultProps, scope: 'national' });

    // Then
    expect(screen.queryByPlaceholderText('Pick a state')).not.toBeInTheDocument();
  });

  test('given user clicks state radio then calls onScopeChange', async () => {
    // Given
    const onScopeChange = vi.fn();
    renderComponent({ ...defaultProps, onScopeChange });

    // When
    const stateRadio = screen.getByLabelText('State');
    await user.click(stateRadio);

    // Then
    expect(onScopeChange).toHaveBeenCalledWith('state');
  });

  test('given user clicks national radio then calls onScopeChange', async () => {
    // Given
    const onScopeChange = vi.fn();
    const props = { ...defaultProps, scope: 'state' as 'state', onScopeChange };
    renderComponent(props);

    // When
    const nationalRadio = screen.getByLabelText('National');
    await user.click(nationalRadio);

    // Then
    expect(onScopeChange).toHaveBeenCalledWith('national');
  });

  test('given user clicks household radio then calls onScopeChange', async () => {
    // Given
    const onScopeChange = vi.fn();
    renderComponent({ ...defaultProps, onScopeChange });

    // When
    const householdRadio = screen.getByLabelText('Household');
    await user.click(householdRadio);

    // Then
    expect(onScopeChange).toHaveBeenCalledWith('household');
  });

  test('given user selects state then calls onStateChange', async () => {
    // Given
    const onStateChange = vi.fn();
    const props = { ...defaultProps, scope: 'state' as 'state', onStateChange };
    renderComponent(props);

    // When
    const dropdown = screen.getByPlaceholderText('Pick a state');
    await user.click(dropdown);

    const california = await screen.findByText('California');
    await user.click(california);

    // Then
    expect(onStateChange).toHaveBeenCalledWith('state/ca');
  });
});
