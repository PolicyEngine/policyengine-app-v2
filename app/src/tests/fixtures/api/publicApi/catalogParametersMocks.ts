import type { components } from '@/api/publicApi/schema';
import { TEST_POLICYENGINE_VERSION } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import {
  STANDARD_DEDUCTION_JOINT,
  STANDARD_DEDUCTION_SINGLE,
} from '@/tests/fixtures/api/publicApi/searchFileMocks';

type Schemas = components['schemas'];

export const STANDARD_DEDUCTION_SINGLE_ID = '1f3e5a7b-9c11-4d2e-8f4a-6b8c0d2e4f61';
export const STANDARD_DEDUCTION_JOINT_ID = '2a4c6e80-1b3d-4f5a-9c7e-8d0f2a4c6e72';
export const UNKNOWN_PARAMETER = 'gov.irs.not_in_this_version';

/** Current law for the single filer's standard deduction, as the catalog dates it. */
export const STANDARD_DEDUCTION_SINGLE_PARAMETER: Schemas['MetadataCatalogParameter'] = {
  id: STANDARD_DEDUCTION_SINGLE_ID,
  name: STANDARD_DEDUCTION_SINGLE,
  label: null,
  description: 'Standard deduction for single filers.',
  data_type: 'float',
  unit: 'currency-USD',
  economy: true,
  household: true,
  values: [
    { start_date: '0001-01-01T00:00:00', end_date: null, value: 12000 },
    { start_date: '2025-01-01T00:00:00', end_date: null, value: 15000 },
  ],
};

export const STANDARD_DEDUCTION_JOINT_PARAMETER: Schemas['MetadataCatalogParameter'] = {
  id: STANDARD_DEDUCTION_JOINT_ID,
  name: STANDARD_DEDUCTION_JOINT,
  label: 'Standard deduction (joint)',
  description: null,
  data_type: 'float',
  unit: 'currency-USD',
  economy: true,
  household: false,
  values: [{ start_date: '2025-01-01T00:00:00', end_date: null, value: 30000 }],
};

const CATALOG = [STANDARD_DEDUCTION_SINGLE_PARAMETER, STANDARD_DEDUCTION_JOINT_PARAMETER];

const NODE_LABELS: Record<string, string | null> = {
  gov: 'Government',
  'gov.irs': 'IRS',
  'gov.irs.deductions': null,
  'gov.irs.deductions.standard': 'Standard deduction',
  'gov.irs.deductions.standard.amount': 'Standard deduction amount',
};

/** What `GET /v2/model-catalog/parameters` answers for the names in `url`. */
export function catalogParametersResult(
  names: string[]
): Schemas['MetadataCatalogParametersResult'] {
  const found = CATALOG.filter((parameter) => names.includes(parameter.name));
  return {
    policyengine_version: TEST_POLICYENGINE_VERSION,
    catalog_format: 2,
    parameters: found,
    node_labels: found.length > 0 ? NODE_LABELS : {},
    missing_names: names.filter((name) => !found.some((parameter) => parameter.name === name)),
  };
}
