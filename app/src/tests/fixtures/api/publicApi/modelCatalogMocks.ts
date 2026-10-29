import type { components } from '@/api/publicApi/schema';

type Schemas = components['schemas'];

export const TEST_POLICYENGINE_VERSION = '6.11.1';
export const TEST_TAX_BENEFIT_MODEL_ID = '0b1f6c7e-2f43-4c1a-9f0e-1d3e5a7b9c11';
export const TEST_MODEL_VERSION_ID = '5d2c8a90-6e1b-4f3a-8c7d-2b4e6f8a0c22';
export const TEST_DEFAULT_DATASET_ID = '9a7b5c3d-1e2f-4a6b-8c0d-3e5f7a9b1c33';
export const TEST_CURRENT_LAW_ID = 2;

function region(
  code: string,
  label: string,
  regionType: Schemas['MetadataRegion']['region_type'],
  state: { code: string; name: string } | null = null
): Schemas['MetadataRegion'] {
  return {
    id: `region-${code}`,
    code,
    label,
    region_type: regionType,
    requires_filter: regionType !== 'national',
    filter_field: null,
    filter_value: null,
    filter_strategy: null,
    parent_code: regionType === 'national' ? null : 'us',
    state_code: state?.code ?? null,
    state_name: state?.name ?? null,
    default_dataset_id: TEST_DEFAULT_DATASET_ID,
  };
}

const CALIFORNIA = { code: 'CA', name: 'California' };

/**
 * A US catalog version's SPM settings, as `GET /v2/model-catalog` gives
 * them: the settings a household's `spm` selection takes, and the
 * certified selection for every field a household leaves out.
 */
export const US_SPM_AVAILABILITY: Schemas['MetadataSPMAvailability'] = {
  available: true,
  settings_schema: {
    title: 'SPMSelection',
    type: 'object',
    properties: { geography_kind: { enum: ['county', 'national', 'metro'] } },
  },
  defaults: { geography_kind: 'national', scenario: 'ce_trend' },
};

/** A small US catalog version, as `GET /v2/model-catalog` returns it. */
export const US_MODEL_CATALOG_RESULT: Schemas['MetadataModelCatalogResult'] = {
  policyengine_version: TEST_POLICYENGINE_VERSION,
  catalog_format: 2,
  model: { id: TEST_TAX_BENEFIT_MODEL_ID, name: 'policyengine-us', description: null },
  model_version: {
    id: TEST_MODEL_VERSION_ID,
    model_id: TEST_TAX_BENEFIT_MODEL_ID,
    version: '2.2.1',
    description: null,
    current_law_id: TEST_CURRENT_LAW_ID,
    metadata_time_periods: [2025, 2026],
  },
  entities: [
    { key: 'person', plural: 'people', is_person: true },
    { key: 'household', plural: 'households', is_person: false },
  ],
  basic_inputs: ['age', 'employment_income'],
  regions: [
    region('us', 'United States', 'national'),
    region('state/ca', 'California', 'state', CALIFORNIA),
    region(
      'congressional_district/CA-01',
      "California's 1st congressional district",
      'congressional_district',
      CALIFORNIA
    ),
    region('place/CA-44000', 'Los Angeles city', 'place', CALIFORNIA),
  ],
  datasets: [
    {
      id: TEST_DEFAULT_DATASET_ID,
      name: 'populace_us_2024',
      description: null,
      year: 2024,
      storage_path: null,
      is_output_dataset: false,
    },
  ],
  economy_options: {
    region: [
      { name: 'us', label: 'United States', type: 'national' },
      { name: 'state/ca', label: 'California', type: 'state' },
      {
        name: 'congressional_district/CA-01',
        label: "California's 1st congressional district",
        type: 'congressional_district',
      },
    ],
    time_period: [
      { name: 2025, label: '2025' },
      { name: 2026, label: '2026' },
    ],
    datasets: [{ name: 'populace_us_2024', label: 'Microcosm', default: true }],
  },
  spm: US_SPM_AVAILABILITY,
};

export function modelCatalogEnvelope(
  result: Schemas['MetadataModelCatalogResult'] = US_MODEL_CATALOG_RESULT
) {
  return { status: 'ok', message: null, result };
}
