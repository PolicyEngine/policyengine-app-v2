import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useCancelFlow } from '@/hooks/useCancelFlow';
import {
  createMockDispatch,
  createMockNavigate,
  createMockRootState,
  createMockUseIngredientReset,
  EXPECTED_NAVIGATION_PATHS,
  TEST_COUNTRIES,
  TEST_INGREDIENT_TYPES,
  TEST_POSITIONS,
} from '@/tests/fixtures/hooks/useCancelFlowMocks';

// Mock dependencies
const mockNavigate = createMockNavigate();
const mockDispatch = createMockDispatch();
const mockUseIngredientReset = createMockUseIngredientReset();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => selector(mockRootState),
}));

vi.mock('@/hooks/useIngredientReset', () => ({
  useIngredientReset: () => mockUseIngredientReset,
}));

vi.mock('@/reducers/flowReducer', () => ({
  clearFlow: vi.fn(() => ({ type: 'flow/clearFlow' })),
}));

// Import mocked modules for assertions
import { clearFlow } from '@/reducers/flowReducer';

let mockRootState: ReturnType<typeof createMockRootState>;

describe('useCancelFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: standalone flow (no subflow), position 0, country 'us'
    mockRootState = createMockRootState(0, TEST_POSITIONS.FIRST, TEST_COUNTRIES.US);
  });

  describe('Nuclear option behavior', () => {
    test('given policy cancellation then clears all policies, exits all flows, and navigates', () => {
      // Given - Can be in any context (standalone or subflow, any position)
      mockRootState = createMockRootState(0, TEST_POSITIONS.FIRST, TEST_COUNTRIES.US);
      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.POLICY));

      // When
      result.current.handleCancel();

      // Then - Always clears ALL, exits ALL flows, and navigates
      expect(mockUseIngredientReset.resetIngredient).toHaveBeenCalledWith(
        TEST_INGREDIENT_TYPES.POLICY
      );
      expect(clearFlow).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        EXPECTED_NAVIGATION_PATHS.POLICIES(TEST_COUNTRIES.US)
      );
    });

    test('given population cancellation then clears all populations, exits all flows, and navigates', () => {
      // Given
      mockRootState = createMockRootState(0, TEST_POSITIONS.FIRST, TEST_COUNTRIES.US);
      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.POPULATION));

      // When
      result.current.handleCancel();

      // Then
      expect(mockUseIngredientReset.resetIngredient).toHaveBeenCalledWith(
        TEST_INGREDIENT_TYPES.POPULATION
      );
      expect(clearFlow).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        EXPECTED_NAVIGATION_PATHS.POPULATIONS(TEST_COUNTRIES.US)
      );
    });

    test('given simulation cancellation then clears all simulations, exits all flows, and navigates', () => {
      // Given
      mockRootState = createMockRootState(0, TEST_POSITIONS.FIRST, TEST_COUNTRIES.US);
      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.SIMULATION));

      // When
      result.current.handleCancel();

      // Then
      expect(mockUseIngredientReset.resetIngredient).toHaveBeenCalledWith(
        TEST_INGREDIENT_TYPES.SIMULATION
      );
      expect(clearFlow).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        EXPECTED_NAVIGATION_PATHS.SIMULATIONS(TEST_COUNTRIES.US)
      );
    });

    test('given report cancellation then clears all reports, exits all flows, and navigates', () => {
      // Given
      mockRootState = createMockRootState(0, TEST_POSITIONS.FIRST, TEST_COUNTRIES.US);
      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.REPORT));

      // When
      result.current.handleCancel();

      // Then
      expect(mockUseIngredientReset.resetIngredient).toHaveBeenCalledWith(
        TEST_INGREDIENT_TYPES.REPORT
      );
      expect(clearFlow).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        EXPECTED_NAVIGATION_PATHS.REPORTS(TEST_COUNTRIES.US)
      );
    });
  });

  describe('Context independence', () => {
    test('given standalone flow then behavior is same as subflow', () => {
      // Given - Standalone flow (flowStack length = 0)
      mockRootState = createMockRootState(0, TEST_POSITIONS.FIRST, TEST_COUNTRIES.US);
      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.POLICY));

      // When
      result.current.handleCancel();

      // Then - Nuclear option behavior
      expect(mockUseIngredientReset.resetIngredient).toHaveBeenCalledWith(
        TEST_INGREDIENT_TYPES.POLICY
      );
      expect(clearFlow).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        EXPECTED_NAVIGATION_PATHS.POLICIES(TEST_COUNTRIES.US)
      );
    });

    test('given subflow then behavior is same as standalone', () => {
      // Given - Subflow (flowStack length = 1)
      mockRootState = createMockRootState(1, TEST_POSITIONS.FIRST, TEST_COUNTRIES.US);
      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.POLICY));

      // When
      result.current.handleCancel();

      // Then - Same nuclear option behavior
      expect(mockUseIngredientReset.resetIngredient).toHaveBeenCalledWith(
        TEST_INGREDIENT_TYPES.POLICY
      );
      expect(clearFlow).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        EXPECTED_NAVIGATION_PATHS.POLICIES(TEST_COUNTRIES.US)
      );
    });

    test('given deep subflow then still exits all flows', () => {
      // Given - Deep subflow (flowStack length = 3)
      mockRootState = createMockRootState(3, TEST_POSITIONS.SECOND, TEST_COUNTRIES.UK);
      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.SIMULATION));

      // When
      result.current.handleCancel();

      // Then - Clears ALL flows, not just one level
      expect(mockUseIngredientReset.resetIngredient).toHaveBeenCalledWith(
        TEST_INGREDIENT_TYPES.SIMULATION
      );
      expect(clearFlow).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        EXPECTED_NAVIGATION_PATHS.SIMULATIONS(TEST_COUNTRIES.UK)
      );
    });

    test('given position 1 then still resets all (position-independent)', () => {
      // Given - At position 1
      mockRootState = createMockRootState(0, TEST_POSITIONS.SECOND, TEST_COUNTRIES.US);
      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.POPULATION));

      // When
      result.current.handleCancel();

      // Then - Clears ALL, regardless of position
      expect(mockUseIngredientReset.resetIngredient).toHaveBeenCalledWith(
        TEST_INGREDIENT_TYPES.POPULATION
      );
      expect(clearFlow).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        EXPECTED_NAVIGATION_PATHS.POPULATIONS(TEST_COUNTRIES.US)
      );
    });
  });

  describe('Country-specific navigation', () => {
    test('given UK country then navigates to UK policies page', () => {
      // Given
      mockRootState = createMockRootState(0, TEST_POSITIONS.FIRST, TEST_COUNTRIES.UK);
      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.POLICY));

      // When
      result.current.handleCancel();

      // Then
      expect(mockNavigate).toHaveBeenCalledWith(
        EXPECTED_NAVIGATION_PATHS.POLICIES(TEST_COUNTRIES.UK)
      );
    });

    test('given no country ID then defaults to US', () => {
      // Given
      mockRootState = createMockRootState(0, TEST_POSITIONS.FIRST, '');
      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.POPULATION));

      // When
      result.current.handleCancel();

      // Then
      expect(mockNavigate).toHaveBeenCalledWith(
        EXPECTED_NAVIGATION_PATHS.POPULATIONS(TEST_COUNTRIES.US)
      );
    });
  });

  describe('Return value', () => {
    test('given hook called then returns handleCancel function', () => {
      // Given
      mockRootState = createMockRootState(0, TEST_POSITIONS.FIRST, TEST_COUNTRIES.US);
      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.POLICY));

      // Then
      expect(result.current).toHaveProperty('handleCancel');
      expect(typeof result.current.handleCancel).toBe('function');
    });
  });
});
