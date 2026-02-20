import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createHousehold } from '@/api/household';
// Now import the actual implementations
import { useCreateHousehold } from '@/hooks/useCreateHousehold';
import { useCreateHouseholdAssociation } from '@/hooks/useUserHousehold';
// Import fixtures first
import {
  CONSOLE_MESSAGES,
  createMockQueryClient,
  ERROR_MESSAGES,
  mockCreateHousehold,
  mockCreateHouseholdAssociationMutateAsync,
  mockCreateHouseholdResponse,
  mockHouseholdCreationPayload,
  setupMockConsole,
  TEST_IDS,
  TEST_LABELS,
} from '@/tests/fixtures/hooks/hooksMocks';

// Mock the modules before importing them
vi.mock('@/api/household', () => ({
  createHousehold: vi.fn(),
}));

vi.mock('@/constants', () => ({
  MOCK_USER_ID: 'test-user-123',
  CURRENT_YEAR: '2025',
}));

vi.mock('@/libs/queryKeys', () => ({
  householdKeys: {
    all: ['households'],
    byId: (id: string) => ['households', 'byId', id],
  },
}));

vi.mock('@/hooks/useUserHousehold', () => ({
  useCreateHouseholdAssociation: vi.fn(),
}));

describe('useCreateHousehold', () => {
  let queryClient: QueryClient;
  let consoleMocks: ReturnType<typeof setupMockConsole>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createMockQueryClient();
    consoleMocks = setupMockConsole();

    // Set up the mocked functions
    (createHousehold as any).mockImplementation(mockCreateHousehold);
    (useCreateHouseholdAssociation as any).mockReturnValue({
      mutateAsync: mockCreateHouseholdAssociationMutateAsync,
    });

    // Set default mock implementations
    mockCreateHousehold.mockResolvedValue(mockCreateHouseholdResponse);
    mockCreateHouseholdAssociationMutateAsync.mockResolvedValue({
      userId: TEST_IDS.USER_ID,
      householdId: TEST_IDS.HOUSEHOLD_ID,
      label: TEST_LABELS.HOUSEHOLD,
    });
  });

  afterEach(() => {
    consoleMocks.restore();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('successful household creation', () => {
    test('given valid payload when createHousehold called then creates household and association', async () => {
      // Given
      const { result } = renderHook(() => useCreateHousehold(TEST_LABELS.HOUSEHOLD), { wrapper });

      // When
      const promise = result.current.createHousehold(mockHouseholdCreationPayload);

      // Wait for completion
      const response = await promise;

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      // Verify API calls (check only first argument, as React Query may pass additional context)
      expect(mockCreateHousehold).toHaveBeenCalled();
      expect(mockCreateHousehold.mock.calls[0][0]).toEqual(mockHouseholdCreationPayload);
      expect(mockCreateHouseholdAssociationMutateAsync).toHaveBeenCalledWith({
        userId: TEST_IDS.USER_ID,
        householdId: TEST_IDS.HOUSEHOLD_ID,
        countryId: mockHouseholdCreationPayload.country_id,
        label: TEST_LABELS.HOUSEHOLD,
      });

      // Verify response
      expect(response).toEqual(mockCreateHouseholdResponse);

      // Query invalidation is handled by the association hook, not this hook
      expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });

    test('given no label when createHousehold called then passes undefined label to association', async () => {
      // Given
      const { result } = renderHook(() => useCreateHousehold(), { wrapper });

      // When
      await result.current.createHousehold(mockHouseholdCreationPayload);

      // Then
      expect(mockCreateHouseholdAssociationMutateAsync).toHaveBeenCalledWith({
        userId: TEST_IDS.USER_ID,
        householdId: TEST_IDS.HOUSEHOLD_ID,
        countryId: mockHouseholdCreationPayload.country_id,
        label: undefined,
      });
    });

    test('given custom label when createHousehold called then uses provided label', async () => {
      // Given
      const customLabel = 'Custom Household Label';
      const { result } = renderHook(() => useCreateHousehold(customLabel), { wrapper });

      // When
      await result.current.createHousehold(mockHouseholdCreationPayload);

      // Then
      expect(mockCreateHouseholdAssociationMutateAsync).toHaveBeenCalledWith({
        userId: TEST_IDS.USER_ID,
        householdId: TEST_IDS.HOUSEHOLD_ID,
        countryId: mockHouseholdCreationPayload.country_id,
        label: customLabel,
      });
    });
  });

  describe('error handling', () => {
    test('given household creation fails when createHousehold called then propagates error', async () => {
      // Given
      const error = new Error(ERROR_MESSAGES.CREATE_FAILED);
      mockCreateHousehold.mockRejectedValue(error);
      const { result } = renderHook(() => useCreateHousehold(TEST_LABELS.HOUSEHOLD), { wrapper });

      // When/Then
      await expect(result.current.createHousehold(mockHouseholdCreationPayload)).rejects.toThrow(
        ERROR_MESSAGES.CREATE_FAILED
      );

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });

      // Association should not be created
      expect(mockCreateHouseholdAssociationMutateAsync).not.toHaveBeenCalled();
    });

    test('given association creation fails when household created then logs error but completes', async () => {
      // Given
      const associationError = new Error(ERROR_MESSAGES.ASSOCIATION_FAILED);
      mockCreateHouseholdAssociationMutateAsync.mockRejectedValue(associationError);
      const { result } = renderHook(() => useCreateHousehold(TEST_LABELS.HOUSEHOLD), { wrapper });

      // When
      const response = await result.current.createHousehold(mockHouseholdCreationPayload);

      // Then
      expect(response).toEqual(mockCreateHouseholdResponse);
      expect(consoleMocks.consoleSpy.error).toHaveBeenCalledWith(
        CONSOLE_MESSAGES.ASSOCIATION_ERROR,
        associationError
      );

      // Household creation should succeed (check only first argument)
      expect(mockCreateHousehold).toHaveBeenCalled();
      expect(mockCreateHousehold.mock.calls[0][0]).toEqual(mockHouseholdCreationPayload);
    });
  });

  describe('state management', () => {
    test('given hook initialized then isPending is false', () => {
      // When
      const { result } = renderHook(() => useCreateHousehold(TEST_LABELS.HOUSEHOLD), { wrapper });

      // Then
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('given mutation in progress then isPending is true', async () => {
      // Given
      let resolveMutation: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolveMutation = resolve;
      });
      mockCreateHousehold.mockReturnValue(pendingPromise);

      const { result } = renderHook(() => useCreateHousehold(TEST_LABELS.HOUSEHOLD), { wrapper });

      // When
      result.current.createHousehold(mockHouseholdCreationPayload);

      // Then
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      // Cleanup
      resolveMutation!(mockCreateHouseholdResponse);
      await pendingPromise;
    });

    test('given mutation completes then isPending returns to false', async () => {
      // Given
      const { result } = renderHook(() => useCreateHousehold(TEST_LABELS.HOUSEHOLD), { wrapper });

      // When
      await result.current.createHousehold(mockHouseholdCreationPayload);

      // Then
      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });
  });

  describe('query invalidation', () => {
    test('given successful creation then does not broadly invalidate household queries', async () => {
      // Given
      const { result } = renderHook(() => useCreateHousehold(TEST_LABELS.HOUSEHOLD), { wrapper });

      // When
      await result.current.createHousehold(mockHouseholdCreationPayload);

      // Then - invalidation is handled by the association hook, not this hook
      await waitFor(() => {
        expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
      });
    });

    test('given failed creation then does not invalidate queries', async () => {
      // Given
      mockCreateHousehold.mockRejectedValue(new Error(ERROR_MESSAGES.CREATE_FAILED));
      const { result } = renderHook(() => useCreateHousehold(TEST_LABELS.HOUSEHOLD), { wrapper });

      // When
      try {
        await result.current.createHousehold(mockHouseholdCreationPayload);
      } catch {
        // Expected error
      }

      // Then
      expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    test('given multiple concurrent calls then handles correctly', async () => {
      // Given
      const { result } = renderHook(() => useCreateHousehold(TEST_LABELS.HOUSEHOLD), { wrapper });

      // When - Create multiple households concurrently
      const promises = [
        result.current.createHousehold(mockHouseholdCreationPayload),
        result.current.createHousehold(mockHouseholdCreationPayload),
      ];

      // Then
      const results = await Promise.all(promises);

      expect(results).toHaveLength(2);
      expect(mockCreateHousehold).toHaveBeenCalledTimes(2);
      expect(mockCreateHouseholdAssociationMutateAsync).toHaveBeenCalledTimes(2);
    });

    test('given household ID missing in response then still attempts association', async () => {
      // Given
      const responseWithoutId = { result: {} };
      mockCreateHousehold.mockResolvedValue(responseWithoutId);
      const { result } = renderHook(() => useCreateHousehold(TEST_LABELS.HOUSEHOLD), { wrapper });

      // When
      await result.current.createHousehold(mockHouseholdCreationPayload);

      // Then
      expect(mockCreateHouseholdAssociationMutateAsync).toHaveBeenCalledWith({
        userId: TEST_IDS.USER_ID,
        householdId: undefined,
        countryId: mockHouseholdCreationPayload.country_id,
        label: TEST_LABELS.HOUSEHOLD,
      });
    });
  });
});
