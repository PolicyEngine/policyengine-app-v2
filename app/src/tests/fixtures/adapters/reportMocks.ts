import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import {
  createMockBudgetSummary,
  createMockDecileImpacts,
  createMockEconomicImpactResponse,
  createMockInequalityPair,
  createMockIntraDecile,
  createMockPovertyPair,
} from '@/tests/fixtures/v2MockFactory';
import { Report } from '@/types/ingredients/Report';
import { ReportMetadata } from '@/types/metadata/reportMetadata';

export const mockReportOutput: EconomicImpactResponse = createMockEconomicImpactResponse({
  budget_summary: createMockBudgetSummary({
    taxRevenue: 100000,
    stateTaxRevenue: 25000,
    benefitSpending: -50000,
    countPeople: 130000000,
    netIncome: 1000000,
  }),
  decile_impacts: createMockDecileImpacts([100, 200, 300], [0.01, 0.02, 0.03]),
  intra_decile: createMockIntraDecile({
    gain5: 0.3,
    gainLess5: 0.2,
    noChange: 0.35,
    loseLess5: 0.1,
    lose5: 0.05,
  }),
  inequality: createMockInequalityPair(
    { gini: 0.45, top10: 0.35, top1: 0.15 },
    { gini: 0.44, top10: 0.34, top1: 0.14 }
  ),
  poverty: [
    ...createMockPovertyPair('poverty', null, 0.13, 0.12),
    ...createMockPovertyPair('poverty', 'is_adult', 0.12, 0.11),
    ...createMockPovertyPair('poverty', 'is_child', 0.18, 0.16),
    ...createMockPovertyPair('poverty', 'is_senior', 0.09, 0.085),
    ...createMockPovertyPair('deep_poverty', null, 0.06, 0.055),
    ...createMockPovertyPair('deep_poverty', 'is_adult', 0.05, 0.045),
    ...createMockPovertyPair('deep_poverty', 'is_child', 0.08, 0.07),
    ...createMockPovertyPair('deep_poverty', 'is_senior', 0.04, 0.038),
    ...createMockPovertyPair('poverty', 'is_female', 0.14, 0.13),
    ...createMockPovertyPair('poverty', 'is_male', 0.12, 0.11),
    ...createMockPovertyPair('deep_poverty', 'is_female', 0.065, 0.06),
    ...createMockPovertyPair('deep_poverty', 'is_male', 0.055, 0.05),
    ...createMockPovertyPair('poverty', 'is_black', 0.22, 0.2),
    ...createMockPovertyPair('poverty', 'is_hispanic', 0.18, 0.16),
    ...createMockPovertyPair('poverty', 'is_white', 0.09, 0.085),
    ...createMockPovertyPair('poverty', 'is_other', 0.15, 0.14),
  ],
  congressional_district_impact: null,
});

export const mockReport: Report = {
  id: '123',
  countryId: 'us',
  year: '2024',
  apiVersion: 'v2',
  simulationIds: ['456', '789'],
  status: 'complete',
  outputType: 'economy',
  output: mockReportOutput,
};

export const mockPendingReport: Report = {
  id: '1',
  countryId: 'us',
  year: '2025',
  apiVersion: 'v2',
  simulationIds: ['111'],
  status: 'pending',
  output: null,
};

export const mockErrorReport: Report = {
  id: '2',
  countryId: 'us',
  year: '2024',
  apiVersion: 'v2',
  simulationIds: ['222', '333'],
  status: 'error',
  output: null,
};

export const mockReportMetadata: ReportMetadata = {
  id: 123,
  country_id: 'us',
  year: '2024',
  api_version: 'v2',
  simulation_1_id: '456',
  simulation_2_id: '789',
  status: 'complete',
  output: JSON.stringify(mockReportOutput),
};

export const mockReportMetadataSingleSimulation: ReportMetadata = {
  id: 1,
  country_id: 'us',
  year: '2024',
  api_version: 'v2',
  simulation_1_id: '999',
  simulation_2_id: null,
  status: 'pending',
  output: null,
};
