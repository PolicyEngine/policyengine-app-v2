import type { components } from '@/api/publicApi/schema';
import { TEST_POLICYENGINE_VERSION } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import {
  CTC_FULLY_REFUNDABLE,
  STANDARD_DEDUCTION_JOINT,
  STANDARD_DEDUCTION_SINGLE,
} from '@/tests/fixtures/api/publicApi/searchFileMocks';

type Child = components['schemas']['MetadataParameterChild'];

function node(path: string, label: string, childCount: number): Child {
  return { path, label, type: 'node', child_count: childCount, parameter: null };
}

function parameter(path: string, label: string): Child {
  return {
    path,
    label,
    type: 'parameter',
    child_count: null,
    parameter: {
      id: `id-${path}`,
      name: path,
      label,
      description: null,
      data_type: 'float',
      unit: 'currency-USD',
      economy: true,
      household: true,
    },
  };
}

/** The reform-changeable children of each node, as `/v2/parameters/children` lists them. */
export const PARAMETER_CHILDREN: Record<string, Child[]> = {
  gov: [node('gov.irs', 'IRS', 3)],
  'gov.irs': [node('gov.irs.credits', 'Credits', 1), node('gov.irs.deductions', 'Deductions', 2)],
  'gov.irs.credits': [node('gov.irs.credits.ctc', 'Child Tax Credit', 1)],
  'gov.irs.credits.ctc': [node('gov.irs.credits.ctc.refundable', 'Refundable', 1)],
  'gov.irs.credits.ctc.refundable': [parameter(CTC_FULLY_REFUNDABLE, 'Fully refundable')],
  'gov.irs.deductions': [node('gov.irs.deductions.standard', 'Standard deduction', 2)],
  'gov.irs.deductions.standard': [
    node('gov.irs.deductions.standard.amount', 'Standard deduction amount', 2),
  ],
  'gov.irs.deductions.standard.amount': [
    parameter(STANDARD_DEDUCTION_JOINT, 'Joint'),
    parameter(STANDARD_DEDUCTION_SINGLE, 'Single'),
  ],
};

/** One page of a node's children. */
export function childrenPage(parentPath: string, offset = 0, limit = 500) {
  const items = PARAMETER_CHILDREN[parentPath] ?? [];
  return {
    status: 'ok',
    message: null,
    result: {
      policyengine_version: TEST_POLICYENGINE_VERSION,
      items: items.slice(offset, offset + limit),
      offset,
      limit,
      has_more: offset + limit < items.length,
    },
  };
}
