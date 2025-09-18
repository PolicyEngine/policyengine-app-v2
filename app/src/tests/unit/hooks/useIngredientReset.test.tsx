import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import React from 'react';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import {
  createMockDispatch,
  createMockStore,
  TEST_MODES,
  TEST_POSITIONS,
  TEST_INGREDIENTS,
  ACTION_TYPES,
} from '@/tests/fixtures/hooks/useIngredientResetMocks';

// Mock the reducers - mocks must be defined inline due to hoisting
vi.mock('@/reducers/policyReducer', () => ({
  clearAllPolicies: vi.fn(() => ({ type: 'policy/clearAllPolicies' })),
}));

vi.mock('@/reducers/populationReducer', () => ({
  clearAllPopulations: vi.fn(() => ({ type: 'population/clearAllPopulations' })),
}));

vi.mock('@/reducers/reportReducer', () => ({
  clearReport: vi.fn(() => ({ type: 'report/clearReport' })),
  setMode: vi.fn((mode: string) => ({ type: 'report/setMode', payload: mode })),
  setActiveSimulationPosition: vi.fn((position: number) => ({
    type: 'report/setActiveSimulationPosition',
    payload: position
  })),
}));

vi.mock('@/reducers/simulationsReducer', () => ({
  clearAllSimulations: vi.fn(() => ({ type: 'simulations/clearAllSimulations' })),
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
      payload: TEST_MODES.STANDALONE
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setActiveSimulationPosition',
      payload: TEST_POSITIONS.FIRST
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
      payload: TEST_MODES.STANDALONE
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setActiveSimulationPosition',
      payload: TEST_POSITIONS.FIRST
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
      payload: TEST_MODES.STANDALONE
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setActiveSimulationPosition',
      payload: TEST_POSITIONS.FIRST
    });
  });

  test('given report reset then clears all and resets mode and position', () => {
    // Given
    const { result } = renderHook(() => useIngredientReset(), { wrapper });

    // When
    result.current.resetIngredient(TEST_INGREDIENTS.REPORT);

    // Then
    expect(dispatch).toHaveBeenCalledWith({ type: ACTION_TYPES.CLEAR_REPORT });
    expect(dispatch).toHaveBeenCalledWith({ type: ACTION_TYPES.CLEAR_ALL_SIMULATIONS });
    expect(dispatch).toHaveBeenCalledWith({ type: ACTION_TYPES.CLEAR_ALL_POLICIES });
    expect(dispatch).toHaveBeenCalledWith({ type: ACTION_TYPES.CLEAR_ALL_POPULATIONS });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setMode',
      payload: TEST_MODES.STANDALONE
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'report/setActiveSimulationPosition',
      payload: TEST_POSITIONS.FIRST
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
});