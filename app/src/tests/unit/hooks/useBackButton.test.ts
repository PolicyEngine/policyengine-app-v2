import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useBackButton } from '@/hooks/useBackButton';
// Import mocked module for assertions
import { navigateToPreviousFrame, returnFromFlow } from '@/reducers/flowReducer';
import {
  createMockDispatch,
  createMockRootState,
  MOCK_STATE_IN_SUBFLOW,
  MOCK_STATE_WITH_MULTIPLE_HISTORY,
  MOCK_STATE_WITH_NO_HISTORY,
  MOCK_STATE_WITH_SINGLE_HISTORY,
  TEST_FRAME_NAMES,
} from '@/tests/fixtures/hooks/useBackButtonMocks';

// Mock dependencies
const mockDispatch = createMockDispatch();

vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => selector(mockRootState),
}));

vi.mock('@/reducers/flowReducer', () => ({
  navigateToPreviousFrame: vi.fn(() => ({ type: 'flow/navigateToPreviousFrame' })),
  returnFromFlow: vi.fn(() => ({ type: 'flow/returnFromFlow' })),
}));

let mockRootState: ReturnType<typeof createMockRootState>;

describe('useBackButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no frame history
    mockRootState = MOCK_STATE_WITH_NO_HISTORY;
  });

  describe('canGoBack', () => {
    test('given empty frame history and no parent flow then canGoBack is false', () => {
      // Given
      mockRootState = createMockRootState([], []);
      const { result } = renderHook(() => useBackButton());

      // Then
      expect(result.current.canGoBack).toBe(false);
    });

    test('given single item in frame history then canGoBack is true', () => {
      // Given
      mockRootState = MOCK_STATE_WITH_SINGLE_HISTORY;
      const { result } = renderHook(() => useBackButton());

      // Then
      expect(result.current.canGoBack).toBe(true);
    });

    test('given multiple items in frame history then canGoBack is true', () => {
      // Given
      mockRootState = MOCK_STATE_WITH_MULTIPLE_HISTORY;
      const { result } = renderHook(() => useBackButton());

      // Then
      expect(result.current.canGoBack).toBe(true);
    });

    test('given empty frame history but in subflow then canGoBack is true', () => {
      // Given - first frame of subflow, no frame history but has parent flow
      mockRootState = MOCK_STATE_IN_SUBFLOW;
      const { result } = renderHook(() => useBackButton());

      // Then
      expect(result.current.canGoBack).toBe(true);
    });
  });

  describe('handleBack', () => {
    test('given canGoBack is true then dispatches navigateToPreviousFrame', () => {
      // Given
      mockRootState = createMockRootState([TEST_FRAME_NAMES.FRAME_A]);
      const { result } = renderHook(() => useBackButton());

      // When
      result.current.handleBack();

      // Then
      expect(navigateToPreviousFrame).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'flow/navigateToPreviousFrame' });
    });

    test('given canGoBack is false then does not dispatch', () => {
      // Given
      mockRootState = createMockRootState([], []);
      const { result } = renderHook(() => useBackButton());

      // When
      result.current.handleBack();

      // Then
      expect(navigateToPreviousFrame).not.toHaveBeenCalled();
      expect(returnFromFlow).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    test('given multiple frames in history then dispatches navigateToPreviousFrame', () => {
      // Given
      mockRootState = createMockRootState([TEST_FRAME_NAMES.FRAME_A, TEST_FRAME_NAMES.FRAME_B]);
      const { result } = renderHook(() => useBackButton());

      // When
      result.current.handleBack();

      // Then
      expect(navigateToPreviousFrame).toHaveBeenCalled();
      expect(returnFromFlow).not.toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'flow/navigateToPreviousFrame' });
    });

    test('given first frame of subflow then dispatches returnFromFlow', () => {
      // Given - empty frame history but has parent flow in stack
      mockRootState = MOCK_STATE_IN_SUBFLOW;
      const { result } = renderHook(() => useBackButton());

      // When
      result.current.handleBack();

      // Then
      expect(navigateToPreviousFrame).not.toHaveBeenCalled();
      expect(returnFromFlow).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'flow/returnFromFlow' });
    });
  });

  describe('return value', () => {
    test('given hook called then returns handleBack and canGoBack', () => {
      // Given
      mockRootState = createMockRootState([]);
      const { result } = renderHook(() => useBackButton());

      // Then
      expect(result.current).toHaveProperty('handleBack');
      expect(result.current).toHaveProperty('canGoBack');
      expect(typeof result.current.handleBack).toBe('function');
      expect(typeof result.current.canGoBack).toBe('boolean');
    });
  });
});
