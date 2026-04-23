import { countryIds } from '@/libs/countries';

export const REPORT_SPEC_SCHEMA_VERSION = 1 as const;

export interface ReportSimulationInput {
  population_type: 'household' | 'geography';
  population_id: string;
  policy_id: number;
}

export interface HouseholdReportSpec {
  country_id: (typeof countryIds)[number];
  report_kind: 'household_single' | 'household_comparison';
  time_period: string;
  simulation_1: ReportSimulationInput;
  simulation_2: ReportSimulationInput | null;
}

export interface EconomyReportSpec {
  country_id: (typeof countryIds)[number];
  report_kind: 'economy_single' | 'economy_comparison';
  time_period: string;
  region: string;
  baseline_policy_id: number;
  reform_policy_id: number;
  dataset: string;
  target: 'general' | 'cliff';
  options: Record<string, unknown>;
}

export type ExplicitReportSpec = HouseholdReportSpec | EconomyReportSpec;
