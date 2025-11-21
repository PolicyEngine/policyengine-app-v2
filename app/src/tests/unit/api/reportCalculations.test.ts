import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchHouseholdCalculation } from '@/api/householdCalculation';
import { fetchCalculationWithMeta } from '@/api/reportCalculations';
import { fetchSocietyWideCalculation } from '@/api/societyWideCalculation';
import {
  mockEconomyCalcResult,
  mockEconomyMeta,
  mockHouseholdCalcResult,
  mockHouseholdMeta,
  TEST_COUNTRIES,
  TEST_POLICY_IDS,
  TEST_POPULATION_IDS,
  TEST_REGIONS,
} from '@/tests/fixtures/api/reportCalculationsMocks';

// Mock the calculation APIs
vi.mock('@/api/householdCalculation');
vi.mock('@/api/societyWideCalculation');

describe('reportCalculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchCalculationWithMeta', () => {
    describe('household calculations', () => {
      it('given household metadata then fetches household calculation', async () => {
        // Given
        const meta = mockHouseholdMeta();
        const mockResult = mockHouseholdCalcResult();

        (fetchHouseholdCalculation as any).mockResolvedValue(mockResult);

        // When
        const result = await fetchCalculationWithMeta(meta);

        // Then
        expect(fetchHouseholdCalculation).toHaveBeenCalledWith(
          TEST_COUNTRIES.US,
          TEST_POPULATION_IDS.HOUSEHOLD_123,
          TEST_POLICY_IDS.POLICY_2 // Uses reform policy when available
        );
        expect(result).toEqual(mockResult);
      });

      it('given no reform policy then uses baseline policy', async () => {
        // Given
        const meta = mockHouseholdMeta({ policyIds: { baseline: TEST_POLICY_IDS.POLICY_1 } });
        const mockResult = mockHouseholdCalcResult();

        (fetchHouseholdCalculation as any).mockResolvedValue(mockResult);

        // When
        await fetchCalculationWithMeta(meta);

        // Then
        expect(fetchHouseholdCalculation).toHaveBeenCalledWith(
          TEST_COUNTRIES.US,
          TEST_POPULATION_IDS.HOUSEHOLD_123,
          TEST_POLICY_IDS.POLICY_1 // Falls back to baseline
        );
      });

      it('given household fetch error then throws error', async () => {
        // Given
        const meta = mockHouseholdMeta({ policyIds: { baseline: TEST_POLICY_IDS.POLICY_1 } });

        (fetchHouseholdCalculation as any).mockRejectedValue(new Error('Calculation failed'));

        // When/Then
        await expect(fetchCalculationWithMeta(meta)).rejects.toThrow('Calculation failed');
      });
    });

    describe('society-wide calculations', () => {
      it('given economy metadata then fetches society-wide calculation', async () => {
        // Given
        const meta = mockEconomyMeta();
        const mockResult = mockEconomyCalcResult();

        (fetchSocietyWideCalculation as any).mockResolvedValue(mockResult);

        // When
        const result = await fetchCalculationWithMeta(meta);

        // Then
        expect(fetchSocietyWideCalculation).toHaveBeenCalledWith(
          TEST_COUNTRIES.US,
          TEST_POLICY_IDS.POLICY_2, // reform
          TEST_POLICY_IDS.POLICY_1, // baseline
          {
            region: TEST_REGIONS.ENHANCED_CPS,
            time_period: meta.year,
          }
        );
        expect(result).toEqual(mockResult);
      });

      it('given no region then uses countryId as region', async () => {
        // Given
        const meta = mockEconomyMeta({ region: undefined });

        (fetchSocietyWideCalculation as any).mockResolvedValue({ status: 'complete' });

        // When
        await fetchCalculationWithMeta(meta);

        // Then
        expect(fetchSocietyWideCalculation).toHaveBeenCalledWith(
          TEST_COUNTRIES.US,
          TEST_POLICY_IDS.POLICY_2,
          TEST_POLICY_IDS.POLICY_1,
          {
            region: TEST_COUNTRIES.US, // Falls back to countryId
            time_period: meta.year,
          }
        );
      });

      it('given no reform policy then uses baseline for both', async () => {
        // Given
        const meta = mockEconomyMeta({ policyIds: { baseline: TEST_POLICY_IDS.POLICY_1 } });

        (fetchSocietyWideCalculation as any).mockResolvedValue({ status: 'complete' });

        // When
        await fetchCalculationWithMeta(meta);

        // Then
        expect(fetchSocietyWideCalculation).toHaveBeenCalledWith(
          TEST_COUNTRIES.US,
          TEST_POLICY_IDS.POLICY_1, // baseline used for reform when no reform provided
          TEST_POLICY_IDS.POLICY_1,
          expect.any(Object)
        );
      });

      it('given society-wide fetch error then throws error', async () => {
        // Given
        const meta = mockEconomyMeta({ policyIds: { baseline: TEST_POLICY_IDS.POLICY_1 } });

        (fetchSocietyWideCalculation as any).mockRejectedValue(new Error('API error'));

        // When/Then
        await expect(fetchCalculationWithMeta(meta)).rejects.toThrow('API error');
      });
    });
  });
});
