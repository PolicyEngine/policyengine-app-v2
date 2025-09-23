import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi, afterEach } from 'vitest';
import { createReport } from '@/api/report';
import { fetchEconomyCalculation } from '@/api/economy';
import { fetchHouseholdCalculation } from '@/api/household_calculation';
import { useCreateReport } from '@/hooks/useCreateReport';
import { useCreateReportAssociation } from '@/hooks/useUserReportAssociations';
import {
  CONSOLE_MESSAGES,
  createMockCreateAssociation,
  createMockQueryClient,
  ERROR_MESSAGES,
  mockReportCreationPayload,
  mockReportMetadata,
  setupConsoleMocks,
  TEST_COUNTRY_ID,
  TEST_LABEL,
  TEST_REPORT_ID_STRING,
  TEST_USER_ID,
  mockHouseholdSimulation,
  mockEconomySimulation,
  mockHousehold,
  mockNationalGeography,
  mockSubnationalGeography,
} from '@/tests/fixtures/hooks/reportHooksMocks';

// Mock the API
vi.mock('@/api/report', () => ({
  createReport: vi.fn(),
}));

// Mock calculation APIs
vi.mock('@/api/economy', () => ({
  fetchEconomyCalculation: vi.fn(),
}));

vi.mock('@/api/household_calculation', () => ({
  fetchHouseholdCalculation: vi.fn(),
}));

// Mock the association hook
vi.mock('@/hooks/useUserReportAssociations', () => ({
  useCreateReportAssociation: vi.fn(),
}));

// Mock query keys
vi.mock('@/libs/queryKeys', () => ({
  reportKeys: {
    all: ['reports'],
  },
}));

describe('useCreateReport', () => {
  let queryClient: ReturnType<typeof createMockQueryClient>;
  let mockCreateAssociation: ReturnType<typeof createMockCreateAssociation>;
  let consoleMocks: ReturnType<typeof setupConsoleMocks>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createMockQueryClient();
    consoleMocks = setupConsoleMocks();

    // Set up mock for createAssociation
    mockCreateAssociation = createMockCreateAssociation();
    (useCreateReportAssociation as any).mockReturnValue(mockCreateAssociation);

    // Set default mock for createReport
    (createReport as any).mockResolvedValue(mockReportMetadata);
  });

  afterEach(() => {
    consoleMocks.restore();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('successful report creation', () => {
    test('given valid data when creating report then creates report and association', async () => {
      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
      });

      // Then
      await waitFor(() => {
        expect(createReport).toHaveBeenCalledWith(TEST_COUNTRY_ID, mockReportCreationPayload);
        expect(mockCreateAssociation.mutateAsync).toHaveBeenCalledWith({
          userId: TEST_USER_ID,
          reportId: TEST_REPORT_ID_STRING,
          label: TEST_LABEL,
          isCreated: true,
        });
      });

      expect(consoleMocks.logSpy).toHaveBeenCalledWith(CONSOLE_MESSAGES.LABEL_LOG, TEST_LABEL);
    });

    test('given no label when creating report then creates with undefined label', async () => {
      // When
      const { result } = renderHook(() => useCreateReport(), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
      });

      // Then
      await waitFor(() => {
        expect(mockCreateAssociation.mutateAsync).toHaveBeenCalledWith({
          userId: TEST_USER_ID,
          reportId: TEST_REPORT_ID_STRING,
          label: undefined,
          isCreated: true,
        });
      });
    });

    test('given successful creation then invalidates report queries', async () => {
      // Given
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
      });

      // Then
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reports'] });
      });
    });
  });

  describe('error handling', () => {
    test('given API error when creating report then throws error', async () => {
      // Given
      const error = new Error(ERROR_MESSAGES.CREATE_REPORT_FAILED);
      (createReport as any).mockRejectedValue(error);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      // Then
      await expect(
        result.current.createReport({
          countryId: TEST_COUNTRY_ID,
          payload: mockReportCreationPayload,
        })
      ).rejects.toThrow(ERROR_MESSAGES.CREATE_REPORT_FAILED);

      expect(mockCreateAssociation.mutateAsync).not.toHaveBeenCalled();
    });

    test('given association creation fails then logs error but report creation succeeds', async () => {
      // Given
      const associationError = new Error(ERROR_MESSAGES.CREATE_ASSOCIATION_FAILED);
      mockCreateAssociation.mutateAsync.mockRejectedValue(associationError);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      const response = await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
      });

      // Then
      await waitFor(() => {
        expect(consoleMocks.errorSpy).toHaveBeenCalledWith(
          'Report created but post-creation tasks failed:',
          associationError
        );
      });

      // Report creation should still return the metadata
      expect(response).toEqual(mockReportMetadata);
    });
  });

  describe('calculation triggering', () => {

    beforeEach(() => {
      // Set up mocks for calculation APIs
      (fetchEconomyCalculation as any).mockResolvedValue({ status: 'pending' });
      (fetchHouseholdCalculation as any).mockResolvedValue({ id: 'household-123' });
    });

    test('given household simulation when creating report then triggers household calculation', async () => {
      // Given
      const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
        simulations: {
          simulation1: mockHouseholdSimulation,
          simulation2: { ...mockHouseholdSimulation, policyId: 'policy-2' },
        },
        populations: {
          household1: mockHousehold,
        },
      });

      // Then
      await waitFor(() => {
        // Should trigger household calculations for both baseline and reform
        expect(prefetchSpy).toHaveBeenCalledWith({
          queryKey: ['household_calculation', TEST_COUNTRY_ID, 'household-123', 'policy-1'],
          queryFn: expect.any(Function),
        });
        expect(prefetchSpy).toHaveBeenCalledWith({
          queryKey: ['household_calculation', TEST_COUNTRY_ID, 'household-123', 'policy-2'],
          queryFn: expect.any(Function),
        });
      });
    });

    test('given economy simulation with national scope then triggers calculation without region', async () => {
      // Given
      const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
        simulations: {
          simulation1: mockEconomySimulation,
          simulation2: { ...mockEconomySimulation, policyId: 'policy-3' },
        },
        populations: {
          geography1: mockNationalGeography,
        },
      });

      // Then
      await waitFor(() => {
        expect(prefetchSpy).toHaveBeenCalledWith({
          queryKey: ['economy', TEST_COUNTRY_ID, 'policy-3', 'policy-2', {}],
          queryFn: expect.any(Function),
        });
      });

      // Verify the queryFn calls fetchEconomyCalculation with empty params
      const call = prefetchSpy.mock.calls.find(c => c[0].queryKey[0] === 'economy');
      const queryFn = call?.[0].queryFn as any;
      await queryFn();
      expect(fetchEconomyCalculation).toHaveBeenCalledWith(
        TEST_COUNTRY_ID,
        'policy-3',
        'policy-2',
        {}
      );
    });

    test('given economy simulation with subnational scope then triggers calculation with region', async () => {
      // Given
      const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
        simulations: {
          simulation1: mockEconomySimulation,
          simulation2: { ...mockEconomySimulation, policyId: 'policy-3' },
        },
        populations: {
          geography1: mockSubnationalGeography,
        },
      });

      // Then
      await waitFor(() => {
        expect(prefetchSpy).toHaveBeenCalledWith({
          queryKey: ['economy', TEST_COUNTRY_ID, 'policy-3', 'policy-2', { region: 'california' }],
          queryFn: expect.any(Function),
        });
      });

      // Verify the queryFn calls fetchEconomyCalculation with region param
      const call = prefetchSpy.mock.calls.find(c => c[0].queryKey[0] === 'economy');
      const queryFn = call?.[0].queryFn as any;
      await queryFn();
      expect(fetchEconomyCalculation).toHaveBeenCalledWith(
        TEST_COUNTRY_ID,
        'policy-3',
        'policy-2',
        { region: 'california' }
      );
    });

    test('given no populations data then does not trigger calculations', async () => {
      // Given
      const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
        simulations: {
          simulation1: mockEconomySimulation,
        },
        // No populations provided
      });

      // Then
      await waitFor(() => {
        // Should still create report and association
        expect(createReport).toHaveBeenCalled();
        // But should not trigger any calculations
        const economyCalls = prefetchSpy.mock.calls.filter(c => c[0].queryKey[0] === 'economy');
        const householdCalls = prefetchSpy.mock.calls.filter(c => c[0].queryKey[0] === 'household_calculation');
        expect(economyCalls).toHaveLength(0);
        expect(householdCalls).toHaveLength(0);
      });
    });

    test('given calculation triggering fails then still creates report successfully', async () => {
      // Given
      const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');
      prefetchSpy.mockRejectedValueOnce(new Error('Prefetch failed'));

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      const response = await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
        simulations: {
          simulation1: mockEconomySimulation,
          simulation2: { ...mockEconomySimulation, policyId: 'policy-3' },
        },
        populations: {
          geography1: mockNationalGeography,
        },
      });

      // Then
      await waitFor(() => {
        // Should log error but still return report metadata
        expect(consoleMocks.errorSpy).toHaveBeenCalledWith(
          'Report created but post-creation tasks failed:',
          expect.any(Error)
        );
      });
      expect(response).toEqual(mockReportMetadata);
    });
  });

  describe('formatEconomyParams helper behavior', () => {
    test('given null geography then economy calculation not triggered', async () => {
      // Given
      const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
        simulations: {
          simulation1: mockEconomySimulation,
          simulation2: { ...mockEconomySimulation, policyId: 'policy-3' },
        },
        populations: {
          geography1: null,
        },
      });

      // Then - should not trigger any economy calculations
      await waitFor(() => {
        const economyCalls = prefetchSpy.mock.calls.filter(c => c[0].queryKey[0] === 'economy');
        expect(economyCalls).toHaveLength(0);
      });
    });

    test('given subnational geography with empty geographyId then uses empty params', async () => {
      // Given
      const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');
      const emptyGeographyIdGeo = {
        ...mockSubnationalGeography,
        geographyId: '',
      };

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
        simulations: {
          simulation1: mockEconomySimulation,
          simulation2: { ...mockEconomySimulation, policyId: 'policy-3' },
        },
        populations: {
          geography1: emptyGeographyIdGeo,
        },
      });

      // Then - should use empty params despite subnational scope
      await waitFor(() => {
        expect(prefetchSpy).toHaveBeenCalledWith({
          queryKey: ['economy', TEST_COUNTRY_ID, 'policy-3', 'policy-2', {}],
          queryFn: expect.any(Function),
        });
      });
    });
  });

  describe('mutation state', () => {
    test('given pending mutation then isPending is true', async () => {
      // Given
      let resolveFn: any;
      const pendingPromise = new Promise((resolve) => {
        resolveFn = resolve;
      });
      (createReport as any).mockReturnValue(pendingPromise);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      // Start the mutation but don't await it yet
      const createPromise = result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
      });

      // Then - check pending state after starting mutation
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      // Resolve to clean up
      resolveFn(mockReportMetadata);
      await createPromise;

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });

    test('given mutation error then error is accessible', async () => {
      // Given
      const error = new Error(ERROR_MESSAGES.API_ERROR);
      (createReport as any).mockRejectedValue(error);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      try {
        await result.current.createReport({
          countryId: TEST_COUNTRY_ID,
          payload: mockReportCreationPayload,
        });
      } catch {
        // Expected to throw
      }

      // Then
      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });
    });
  });
});
