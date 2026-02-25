import { vi } from 'vitest';
import type { V2RegionMetadata } from '@/api/v2/regions';
import { TEST_TIMESTAMPS } from '@/tests/fixtures/constants';

export const TEST_REGION_CODES = {
  US_NATIONAL: 'us',
  CALIFORNIA: 'state/ca',
  NY_DISTRICT: 'congressional_district/NY-14',
  SHEFFIELD: 'constituency/Sheffield Central',
} as const;

export const mockV2Region = (overrides?: Partial<V2RegionMetadata>): V2RegionMetadata => ({
  id: 'region-001',
  code: TEST_REGION_CODES.CALIFORNIA,
  label: 'California',
  region_type: 'state',
  requires_filter: true,
  filter_field: 'state_code',
  filter_value: 'CA',
  parent_code: 'us',
  state_code: 'CA',
  state_name: 'California',
  dataset_id: 'dataset-cps-2024',
  tax_benefit_model_id: 'tbm-us-001',
  created_at: TEST_TIMESTAMPS.CREATED_AT,
  updated_at: TEST_TIMESTAMPS.UPDATED_AT,
  ...overrides,
});

export const mockV2RegionNational = (): V2RegionMetadata =>
  mockV2Region({
    id: 'region-us',
    code: TEST_REGION_CODES.US_NATIONAL,
    label: 'United States',
    region_type: 'country',
    requires_filter: false,
    filter_field: null,
    filter_value: null,
    parent_code: null,
    state_code: null,
    state_name: null,
  });

export const mockV2RegionCongressionalDistrict = (): V2RegionMetadata =>
  mockV2Region({
    id: 'region-ny14',
    code: TEST_REGION_CODES.NY_DISTRICT,
    label: 'New York 14th',
    region_type: 'congressional_district',
    parent_code: 'state/ny',
    state_code: 'NY',
    state_name: 'New York',
  });

export const mockV2RegionUKConstituency = (): V2RegionMetadata =>
  mockV2Region({
    id: 'region-sheffield',
    code: TEST_REGION_CODES.SHEFFIELD,
    label: 'Sheffield Central',
    region_type: 'constituency',
    requires_filter: false,
    filter_field: null,
    filter_value: null,
    parent_code: 'uk',
    state_code: null,
    state_name: null,
    tax_benefit_model_id: 'tbm-uk-001',
  });

export const mockRegionList = (): V2RegionMetadata[] => [
  mockV2RegionNational(),
  mockV2Region(),
  mockV2RegionCongressionalDistrict(),
];

// HTTP helpers
export const mockSuccessResponse = (data: any) => ({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue(data),
  text: vi.fn().mockResolvedValue(JSON.stringify(data)),
});

export const mockErrorResponse = (status: number, errorText = 'Server error') => ({
  ok: false,
  status,
  json: vi.fn().mockRejectedValue(new Error('Not JSON')),
  text: vi.fn().mockResolvedValue(errorText),
});

export const REGION_ERROR_MESSAGES = {
  FETCH_FAILED: (countryId: string) => `Failed to fetch regions for ${countryId}`,
  NOT_FOUND: (code: string) => `Region not found: ${code}`,
  FETCH_BY_CODE_FAILED: (code: string, countryId: string) =>
    `Failed to fetch region ${code} for ${countryId}`,
} as const;
