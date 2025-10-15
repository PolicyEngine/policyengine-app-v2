import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import {
  ACTION_TYPES,
  createMockDispatch,
  createMockStore,
  TEST_COUNTRY_ID,
  TEST_INGREDIENTS,
  TEST_MODES,
  TEST_POSITIONS,
} from '@/tests/fixtures/hooks/useIngredientResetMocks';

// Mock useCurrentCountry hook
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

// Mock the reducers - mocks must be defined inline due to hoisting
vi.mock('@/reducers/policyReducer', () => ({
  clearAllPolicies: vi.fn(() => ({ type: 'policy/clearAllPolicies' })),
  clearPolicyAtPosition: vi.fn((position: number) => ({
    type: 'policy/clearPolicyAtPosition',
    payload: position,
  })),
}));

vi.mock('@/reducers/populationReducer', () => ({
  clearAllPopulations: vi.fn(() => ({ type: 'population/clearAllPopulations' })),
  clearPopulationAtPosition: vi.fn((position: number) => ({
    type: 'population/clearPopulationAtPosition',
    payload: position,
  })),
}));

vi.mock('@/reducers/reportReducer', () => ({
  clearReport: vi.fn((countryId: string) => ({ type: 'report/clearReport', payload: countryId })),
  setMode: vi.fn((mode: string) => ({ type: 'report/setMode', payload: mode })),
  setActiveSimulationPosition: vi.fn((position: number) => ({
    type: 'report/setActiveSimulationPosition',
    payload: position,
  })),
}));

vi.mock('@/reducers/simulationsReducer', () => ({
  clearAllSimulations: vi.fn(() => ({ type: 'simulations/clearAllSimulations' })),
  clearSimulationAtPosition: vi.fn((position: number) => ({
    type: 'simulations/clearSimulationAtPosition',
    payload: position,
  })),
}));

describe('useIngredientReset', () => {
  let store: ReturnType<typeof createMockStore>;
  let dispatch: ReturnType<typeof createMockDispatch>;

  beforeEach(() => {
    vi.clearAllMocks();
    dispatch = createMockDispatch();
    store = createMockStore(dispatch);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  test('given policy reset then clears policies and resets mode and position', () => {
    // Given
    const { result } = renderHook(() => useIngredientReset(), { wrapper });

    // When
    result.current.resetIngredient(TEST_INGREDIENTS.POLICY);

    // Then
    expect(dispatch).toHaveBeenCalledWith({ type: ACTION_TYPES.CLEAR_ALL_POLICIES });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setMode',
      payload: TEST_MODES.STANDALONE,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setActiveSimulationPosition',
      payload: TEST_POSITIONS.FIRST,
    });
  });

  test('given population reset then clears populations and resets mode and position', () => {
    // Given
    const { result } = renderHook(() => useIngredientReset(), { wrapper });

    // When
    result.current.resetIngredient(TEST_INGREDIENTS.POPULATION);

    // Then
    expect(dispatch).toHaveBeenCalledWith({ type: ACTION_TYPES.CLEAR_ALL_POPULATIONS });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setMode',
      payload: TEST_MODES.STANDALONE,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setActiveSimulationPosition',
      payload: TEST_POSITIONS.FIRST,
    });
  });

  test('given simulation reset then clears all and resets mode and position', () => {
    // Given
    const { result } = renderHook(() => useIngredientReset(), { wrapper });

    // When
    result.current.resetIngredient(TEST_INGREDIENTS.SIMULATION);

    // Then
    expect(dispatch).toHaveBeenCalledWith({ type: ACTION_TYPES.CLEAR_ALL_SIMULATIONS });
    expect(dispatch).toHaveBeenCalledWith({ type: ACTION_TYPES.CLEAR_ALL_POLICIES });
    expect(dispatch).toHaveBeenCalledWith({ type: ACTION_TYPES.CLEAR_ALL_POPULATIONS });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setMode',
      payload: TEST_MODES.STANDALONE,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setActiveSimulationPosition',
      payload: TEST_POSITIONS.FIRST,
    });
  });

  test('given report reset then clears all and resets mode and position', () => {
    // Given
    const { result } = renderHook(() => useIngredientReset(), { wrapper });

    // When
    result.current.resetIngredient(TEST_INGREDIENTS.REPORT);

    // Then
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPES.CLEAR_REPORT,
      payload: TEST_COUNTRY_ID,
    });
    expect(dispatch).toHaveBeenCalledWith({ type: ACTION_TYPES.CLEAR_ALL_SIMULATIONS });
    expect(dispatch).toHaveBeenCalledWith({ type: ACTION_TYPES.CLEAR_ALL_POLICIES });
    expect(dispatch).toHaveBeenCalledWith({ type: ACTION_TYPES.CLEAR_ALL_POPULATIONS });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setMode',
      payload: TEST_MODES.STANDALONE,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setActiveSimulationPosition',
      payload: TEST_POSITIONS.FIRST,
    });
  });

  test('given multiple ingredients reset then processes in dependency order', () => {
    // Given
    const { result } = renderHook(() => useIngredientReset(), { wrapper });
    const ingredientsToReset = [TEST_INGREDIENTS.POLICY, TEST_INGREDIENTS.POPULATION];

    // When
    result.current.resetIngredients(ingredientsToReset);

    // Then - should process in dependency order and reset mode/position
    expect(dispatch).toHaveBeenCalled();

    // Both should trigger mode and position reset
    const modeCalls = dispatch.mock.calls.filter(
      (call: any) => call[0].type === ACTION_TYPES.SET_MODE
    );
    const positionCalls = dispatch.mock.calls.filter(
      (call: any) => call[0].type === ACTION_TYPES.SET_ACTIVE_SIMULATION_POSITION
    );

    expect(modeCalls.length).toBeGreaterThan(0);
    expect(positionCalls.length).toBeGreaterThan(0);
  });

  test('given policy reset at position 0 then clears policy at position 0 and resets mode', () => {
    // Given
    const { result } = renderHook(() => useIngredientReset(), { wrapper });

    // When
    result.current.resetIngredientAtPosition(TEST_INGREDIENTS.POLICY, TEST_POSITIONS.FIRST);

    // Then
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPES.CLEAR_POLICY_AT_POSITION,
      payload: TEST_POSITIONS.FIRST,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setMode',
      payload: TEST_MODES.STANDALONE,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setActiveSimulationPosition',
      payload: TEST_POSITIONS.FIRST,
    });
  });

  test('given policy reset at position 1 then clears policy at position 1 and resets mode', () => {
    // Given
    const { result } = renderHook(() => useIngredientReset(), { wrapper });

    // When
    result.current.resetIngredientAtPosition(TEST_INGREDIENTS.POLICY, TEST_POSITIONS.SECOND);

    // Then
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPES.CLEAR_POLICY_AT_POSITION,
      payload: TEST_POSITIONS.SECOND,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setMode',
      payload: TEST_MODES.STANDALONE,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setActiveSimulationPosition',
      payload: TEST_POSITIONS.FIRST,
    });
  });

  test('given population reset at position 0 then clears population at position 0 and resets mode', () => {
    // Given
    const { result } = renderHook(() => useIngredientReset(), { wrapper });

    // When
    result.current.resetIngredientAtPosition(TEST_INGREDIENTS.POPULATION, TEST_POSITIONS.FIRST);

    // Then
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPES.CLEAR_POPULATION_AT_POSITION,
      payload: TEST_POSITIONS.FIRST,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setMode',
      payload: TEST_MODES.STANDALONE,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setActiveSimulationPosition',
      payload: TEST_POSITIONS.FIRST,
    });
  });

  test('given population reset at position 1 then clears population at position 1 and resets mode', () => {
    // Given
    const { result } = renderHook(() => useIngredientReset(), { wrapper });

    // When
    result.current.resetIngredientAtPosition(TEST_INGREDIENTS.POPULATION, TEST_POSITIONS.SECOND);

    // Then
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPES.CLEAR_POPULATION_AT_POSITION,
      payload: TEST_POSITIONS.SECOND,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setMode',
      payload: TEST_MODES.STANDALONE,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setActiveSimulationPosition',
      payload: TEST_POSITIONS.FIRST,
    });
  });

  test('given simulation reset at position 0 then clears simulation, policy, and population at position 0', () => {
    // Given
    const { result } = renderHook(() => useIngredientReset(), { wrapper });

    // When
    result.current.resetIngredientAtPosition(TEST_INGREDIENTS.SIMULATION, TEST_POSITIONS.FIRST);

    // Then
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPES.CLEAR_SIMULATION_AT_POSITION,
      payload: TEST_POSITIONS.FIRST,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPES.CLEAR_POLICY_AT_POSITION,
      payload: TEST_POSITIONS.FIRST,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPES.CLEAR_POPULATION_AT_POSITION,
      payload: TEST_POSITIONS.FIRST,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setMode',
      payload: TEST_MODES.STANDALONE,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setActiveSimulationPosition',
      payload: TEST_POSITIONS.FIRST,
    });
  });

  test('given simulation reset at position 1 then clears simulation, policy, and population at position 1', () => {
    // Given
    const { result } = renderHook(() => useIngredientReset(), { wrapper });

    // When
    result.current.resetIngredientAtPosition(TEST_INGREDIENTS.SIMULATION, TEST_POSITIONS.SECOND);

    // Then
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPES.CLEAR_SIMULATION_AT_POSITION,
      payload: TEST_POSITIONS.SECOND,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPES.CLEAR_POLICY_AT_POSITION,
      payload: TEST_POSITIONS.SECOND,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPES.CLEAR_POPULATION_AT_POSITION,
      payload: TEST_POSITIONS.SECOND,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setMode',
      payload: TEST_MODES.STANDALONE,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setActiveSimulationPosition',
      payload: TEST_POSITIONS.FIRST,
    });
  });

  // Tests for clearIngredientAtPosition (no mode/position reset)
  test('given policy clear at position 0 then clears policy without mode/position reset', () => {
    // Given
    const { result } = renderHook(() => useIngredientReset(), { wrapper });

    // When
    result.current.clearIngredientAtPosition(TEST_INGREDIENTS.POLICY, TEST_POSITIONS.FIRST);

    // Then
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPES.CLEAR_POLICY_AT_POSITION,
      payload: TEST_POSITIONS.FIRST,
    });
    // Should NOT reset mode or position
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'report/setMode' })
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'report/setActiveSimulationPosition' })
    );
  });

  test('given population clear at position 1 then clears population without mode/position reset', () => {
    // Given
    const { result } = renderHook(() => useIngredientReset(), { wrapper });

    // When
    result.current.clearIngredientAtPosition(TEST_INGREDIENTS.POPULATION, TEST_POSITIONS.SECOND);

    // Then
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPES.CLEAR_POPULATION_AT_POSITION,
      payload: TEST_POSITIONS.SECOND,
    });
    // Should NOT reset mode or position
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'report/setMode' })
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'report/setActiveSimulationPosition' })
    );
  });

  test('given simulation clear at position 0 then cascades without mode/position reset', () => {
    // Given
    const { result } = renderHook(() => useIngredientReset(), { wrapper });

    // When
    result.current.clearIngredientAtPosition(TEST_INGREDIENTS.SIMULATION, TEST_POSITIONS.FIRST);

    // Then - Should clear simulation, policy, and population at position
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPES.CLEAR_SIMULATION_AT_POSITION,
      payload: TEST_POSITIONS.FIRST,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPES.CLEAR_POLICY_AT_POSITION,
      payload: TEST_POSITIONS.FIRST,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTION_TYPES.CLEAR_POPULATION_AT_POSITION,
      payload: TEST_POSITIONS.FIRST,
    });
    // Should NOT reset mode or position
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'report/setMode' })
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'report/setActiveSimulationPosition' })
    );
  });
});
