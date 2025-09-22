import { BASE_URL } from '@/constants';
import { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';

export type EconomyReportOutput = ReportOutputSocietyWideUS | ReportOutputSocietyWideUK;

// TEMPORARY MOCK - Remove this section when ready to use real API
const MOCK_ECONOMY_CALCULATION = process.env.NODE_ENV === 'development';
let mockCallCount = 0;

async function mockFetchEconomyCalculation(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  params?: EconomyCalculationParams
): Promise<EconomyCalculationResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  mockCallCount++;
  console.log(`[MOCK] Economy calculation call #${mockCallCount} for ${countryId} - reform: ${reformPolicyId}, baseline: ${baselinePolicyId}`);

  // Simulate queue progression for first 3 calls
  if (mockCallCount <= 3) {
    return {
      status: 'pending',
      queue_position: Math.max(0, 5 - mockCallCount),
      average_time: 20 - (mockCallCount * 5),
      result: null
    };
  }

  // On 4th call, return completed result
  if (mockCallCount === 4) {
    // Reset counter for next simulation
    mockCallCount = 0;

    // Return mock data based on country
    const mockResult: EconomyReportOutput = countryId === 'us'
      ? ({
          // Mock US data structure - minimal fields for testing
          budget: {
            budgetary_impact: -5000000000,
            benefit_spending_impact: 2000000000,
            tax_revenue_impact: -7000000000,
          },
          distributional: {
            deciles: {
              income: [15000, 25000, 35000, 45000, 55000, 65000, 75000, 85000, 100000, 150000],
              relative_change: [0.05, 0.04, 0.03, 0.02, 0.02, 0.01, 0.01, 0.005, 0.003, -0.001],
              absolute_change: [750, 1000, 1050, 900, 1100, 650, 750, 425, 300, -150],
            }
          },
          poverty: {
            poverty_rate_change: -0.02,
            deep_poverty_rate_change: -0.01,
            child_poverty_rate_change: -0.025,
          },
          inequality: {
            gini_index_change: -0.015,
            top_1_percent_share_change: -0.005,
            top_10_percent_share_change: -0.008,
          }
        } as unknown as ReportOutputSocietyWideUS)
      : ({
          // Mock UK data structure - minimal fields for testing
          budget: {
            budgetary_impact: -3000000000,
            benefit_spending_impact: 1500000000,
            tax_revenue_impact: -4500000000,
          },
          distributional: {
            deciles: {
              income: [12000, 20000, 28000, 36000, 44000, 52000, 60000, 70000, 85000, 120000],
              relative_change: [0.04, 0.035, 0.03, 0.025, 0.02, 0.015, 0.01, 0.008, 0.005, 0.001],
              absolute_change: [480, 700, 840, 900, 880, 780, 600, 560, 425, 120],
            }
          },
          poverty: {
            poverty_rate_change: -0.018,
            deep_poverty_rate_change: -0.009,
            child_poverty_rate_change: -0.022,
          },
          inequality: {
            gini_coefficient_change: -0.012,
          }
        } as unknown as ReportOutputSocietyWideUK);

    return {
      status: 'completed',
      result: mockResult
    };
  }

  // Shouldn't reach here, but reset just in case
  mockCallCount = 0;
  return {
    status: 'error',
    result: null,
    error: 'Unexpected mock state'
  };
}
// END TEMPORARY MOCK

// NOTE: Need to add other params at later point
export interface EconomyCalculationParams {
  region?: string;
}

export interface EconomyCalculationResponse {
  status: 'pending' | 'completed' | 'error';
  queue_position?: number;
  average_time?: number;
  result: EconomyReportOutput | null;
  error?: string;
}

export async function fetchEconomyCalculation(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  params?: EconomyCalculationParams
): Promise<EconomyCalculationResponse> {
  // TEMPORARY: Use mock in development
  if (MOCK_ECONOMY_CALCULATION) {
    return mockFetchEconomyCalculation(countryId, reformPolicyId, baselinePolicyId, params);
  }

  const queryParams = new URLSearchParams();

  if (params?.region !== undefined) {
    queryParams.append('region', params.region);
  }

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Economy calculation failed: ${response.statusText}`);
  }

  return response.json();
}
