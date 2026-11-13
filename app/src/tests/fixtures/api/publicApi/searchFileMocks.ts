import type { components } from '@/api/publicApi/schema';
import { TEST_POLICYENGINE_VERSION } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';

type SearchFile = components['schemas']['MetadataParameterSearchFileContent'];

export const STANDARD_DEDUCTION_SINGLE = 'gov.irs.deductions.standard.amount.SINGLE';
export const STANDARD_DEDUCTION_JOINT = 'gov.irs.deductions.standard.amount.JOINT';
export const CTC_FIRST_BRACKET_AMOUNT = 'gov.irs.credits.ctc.amount.base[0].amount';
export const CTC_FULLY_REFUNDABLE = 'gov.irs.credits.ctc.refundable.fully_refundable';
/** Not editable until 2026, when its value becomes a number. */
export const CTC_PHASE_OUT_SINGLE = 'gov.irs.credits.ctc.phase_out.threshold.SINGLE';
/** A parameter a reform cannot change: in the file for its label only. */
export const CTC_ARPA_AMOUNT = 'gov.irs.credits.ctc.amount.arpa';

/** A small US search file, as `GET /v2/parameters/search-file` returns it. */
export const US_SEARCH_FILE: SearchFile = {
  format: 1,
  country_id: 'us',
  policyengine_version: TEST_POLICYENGINE_VERSION,
  parameters: [
    {
      path: CTC_FIRST_BRACKET_AMOUNT,
      label: null,
      unit: 'currency-USD',
      description: 'Child Tax Credit base amount for the first bracket.',
      editable: true,
    },
    {
      path: CTC_PHASE_OUT_SINGLE,
      label: 'CTC phase-out threshold for single filers',
      unit: 'currency-USD',
      description: null,
      editable: false,
      editable_changes: [{ start_date: '2026-01-01', editable: true }],
    },
    {
      path: CTC_FULLY_REFUNDABLE,
      label: 'Child Tax Credit fully refundable',
      unit: 'bool',
      description: null,
      editable: true,
    },
    {
      path: STANDARD_DEDUCTION_JOINT,
      label: null,
      unit: 'currency-USD',
      description: null,
      editable: true,
    },
    {
      path: STANDARD_DEDUCTION_SINGLE,
      label: null,
      unit: 'currency-USD',
      description: 'Standard deduction for single filers.',
      editable: true,
    },
  ],
  other_parameters: [{ path: CTC_ARPA_AMOUNT, label: 'ARPA Child Tax Credit amount' }],
  nodes: [
    { path: 'gov', label: 'Government' },
    { path: 'gov.irs', label: 'IRS' },
    { path: 'gov.irs.credits.ctc', label: 'Child Tax Credit' },
    { path: 'gov.irs.credits.ctc.amount.base', label: 'Child Tax Credit base amount' },
    { path: 'gov.irs.deductions.standard', label: 'Standard deduction' },
    { path: 'gov.irs.deductions.standard.amount', label: 'Standard deduction amount' },
  ],
};

export function searchFileResponse(file: unknown = US_SEARCH_FILE, status = 200): Response {
  return new Response(JSON.stringify(file), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
