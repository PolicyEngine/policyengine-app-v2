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

let mockUseSelector: any;

vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => selector(mockRootState),
}));

vi.mock('@/hooks/useIngredientReset', () => ({
  useIngredientReset: () => mockUseIngredientReset,
}));

vi.mock('@/reducers/flowReducer', () => ({
  clearFlow: vi.fn(() => ({ type: 'flow/clearFlow' })),
  returnFromFlow: vi.fn(() => ({ type: 'flow/returnFromFlow' })),
}));

// Import mocked modules for assertions
import { clearFlow, returnFromFlow } from '@/reducers/flowReducer';

let mockRootState: ReturnType<typeof createMockRootState>;

describe('useCancelFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: standalone flow (no subflow), position 0, country 'us'
    mockRootState = createMockRootState(0, TEST_POSITIONS.FIRST, TEST_COUNTRIES.US);
  });

  describe('given policy cancellation', () => {
    test('given standalone flow then clears policy at position and navigates to policies page', () => {
      // Given
      mockRootState = createMockRootState(0, TEST_POSITIONS.FIRST, TEST_COUNTRIES.US);
      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.POLICY));

      // When
      result.current.handleCancel();

      // Then
      expect(mockUseIngredientReset.resetIngredientAtPosition).toHaveBeenCalledWith(
        TEST_INGREDIENT_TYPES.POLICY,
        TEST_POSITIONS.FIRST
      );
      expect(clearFlow).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        EXPECTED_NAVIGATION_PATHS.POLICIES(TEST_COUNTRIES.US)
      );
      expect(returnFromFlow).not.toHaveBeenCalled();
    });

    test('given subflow then clears policy at position and returns to parent flow', () => {
      // Given
      mockRootState = createMockRootState(1, TEST_POSITIONS.FIRST, TEST_COUNTRIES.US);
      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.POLICY));

      // When
      result.current.handleCancel();

      // Then
      expect(mockUseIngredientReset.resetIngredientAtPosition).toHaveBeenCalledWith(
        TEST_INGREDIENT_TYPES.POLICY,
        TEST_POSITIONS.FIRST
      );
      expect(returnFromFlow).toHaveBeenCalled();
      expect(clearFlow).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('given position 1 then clears policy at position 1', () => {
      // Given - Update state before rendering hook
      const stateAtPositionOne = createMockRootState(0, TEST_POSITIONS.SECOND, TEST_COUNTRIES.US);
      mockRootState = stateAtPositionOne;

      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.POLICY));

      // When
      result.current.handleCancel();

      // Then
      expect(mockUseIngredientReset.resetIngredientAtPosition).toHaveBeenCalledWith(
        TEST_INGREDIENT_TYPES.POLICY,
        TEST_POSITIONS.SECOND
      );
    });
  });

  describe('given population cancellation', () => {
    test('given standalone flow then clears population at position and navigates to populations page', () => {
      // Given
      mockRootState = createMockRootState(0, TEST_POSITIONS.FIRST, TEST_COUNTRIES.US);
      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.POPULATION));

      // When
      result.current.handleCancel();

      // Then
      expect(mockUseIngredientReset.resetIngredientAtPosition).toHaveBeenCalledWith(
        TEST_INGREDIENT_TYPES.POPULATION,
        TEST_POSITIONS.FIRST
      );
      expect(clearFlow).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        EXPECTED_NAVIGATION_PATHS.POPULATIONS(TEST_COUNTRIES.US)
      );
    });

    test('given subflow then clears population at position and returns to parent flow', () => {
      // Given
      mockRootState = createMockRootState(2, TEST_POSITIONS.FIRST, TEST_COUNTRIES.US);
      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.POPULATION));

      // When
      result.current.handleCancel();

      // Then
      expect(mockUseIngredientReset.resetIngredientAtPosition).toHaveBeenCalledWith(
        TEST_INGREDIENT_TYPES.POPULATION,
        TEST_POSITIONS.FIRST
      );
      expect(returnFromFlow).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('given simulation cancellation', () => {
    test('given standalone flow then clears simulation at position with cascading and navigates', () => {
      // Given
      mockRootState = createMockRootState(0, TEST_POSITIONS.FIRST, TEST_COUNTRIES.US);
      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.SIMULATION));

      // When
      result.current.handleCancel();

      // Then
      expect(mockUseIngredientReset.resetIngredientAtPosition).toHaveBeenCalledWith(
        TEST_INGREDIENT_TYPES.SIMULATION,
        TEST_POSITIONS.FIRST
      );
      expect(clearFlow).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        EXPECTED_NAVIGATION_PATHS.SIMULATIONS(TEST_COUNTRIES.US)
      );
    });

    test('given subflow then clears simulation at position with cascading and returns', () => {
      // Given - Update state before rendering hook
      const stateInSubflowAtPositionOne = createMockRootState(
        1,
        TEST_POSITIONS.SECOND,
        TEST_COUNTRIES.US
      );
      mockRootState = stateInSubflowAtPositionOne;

      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.SIMULATION));

      // When
      result.current.handleCancel();

      // Then
      expect(mockUseIngredientReset.resetIngredientAtPosition).toHaveBeenCalledWith(
        TEST_INGREDIENT_TYPES.SIMULATION,
        TEST_POSITIONS.SECOND
      );
      expect(returnFromFlow).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('given report cancellation', () => {
    test('given standalone flow then clears all reports and navigates to reports page', () => {
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

    test('given subflow then clears all reports and returns to parent flow', () => {
      // Given
      mockRootState = createMockRootState(1, TEST_POSITIONS.FIRST, TEST_COUNTRIES.US);
      const { result } = renderHook(() => useCancelFlow(TEST_INGREDIENT_TYPES.REPORT));

      // When
      result.current.handleCancel();

      // Then
      expect(mockUseIngredientReset.resetIngredient).toHaveBeenCalledWith(
        TEST_INGREDIENT_TYPES.REPORT
      );
      expect(returnFromFlow).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('given different country IDs', () => {
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
});
