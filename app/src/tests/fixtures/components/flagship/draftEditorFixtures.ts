import { fetchMetadataThunk } from '@/reducers/metadataReducer';
import { store } from '@/store';

const deduction = (segment: string, label: string, base: number) => ({
  [`gov.irs.deductions.standard.amount.${segment}`]: {
    parameter: `gov.irs.deductions.standard.amount.${segment}`,
    label,
    type: 'parameter',
    description: 'Standard deduction by filing status.',
    unit: 'currency-USD',
    economy: true,
    household: true,
    values: { '2025-01-01': base - 350, '2026-01-01': base, '2027-01-01': base + 400 },
  },
});

const phaseIn = (index: number, field: 'threshold' | 'amount', unit: string, value: number) => ({
  [`gov.irs.credits.eitc.phase_in_rate[${index}].${field}`]: {
    parameter: `gov.irs.credits.eitc.phase_in_rate[${index}].${field}`,
    label: field,
    type: 'parameter',
    unit,
    economy: true,
    household: true,
    values: { '2026-01-01': value },
  },
});

/** A standard deduction broken down by filing status, plus its node. */
export const DEDUCTION_PARAMETERS = {
  'gov.irs.deductions.standard.amount': {
    parameter: 'gov.irs.deductions.standard.amount',
    label: 'Standard deduction amount',
    type: 'parameterNode',
  },
  'gov.irs.credits.ctc.amount.base': {
    parameter: 'gov.irs.credits.ctc.amount.base',
    label: 'Child tax credit base amount',
    type: 'parameter',
    description: 'Maximum credit per qualifying child.',
    unit: 'currency-USD',
    economy: true,
    household: true,
    values: { '2025-01-01': 2000, '2026-01-01': 2200 },
  },
  'gov.irs.credits.ctc.refundable.social_security.add': {
    parameter: 'gov.irs.credits.ctc.refundable.social_security.add',
    label: 'Child Tax Credit added social security taxes',
    type: 'parameter',
    unit: 'list',
    economy: true,
    household: true,
    values: { '2026-01-01': ['employee_social_security_tax', 'employee_medicare_tax'] },
  },
  // A schedule of brackets: where each starts (in children) and its rate.
  'gov.irs.credits.eitc.phase_in_rate': {
    parameter: 'gov.irs.credits.eitc.phase_in_rate',
    label: 'EITC phase-in rate by number of children',
    type: 'parameterNode',
    description: 'Earned income credit phase-in rate.',
  },
  ...phaseIn(0, 'threshold', 'child', 0),
  ...phaseIn(0, 'amount', '/1', 0.0765),
  ...phaseIn(1, 'threshold', 'child', 1),
  ...phaseIn(1, 'amount', '/1', 0.34),
  // An inflation index, and an amount current law grows with it.
  'gov.bls.cpi.cpi_u': {
    parameter: 'gov.bls.cpi.cpi_u',
    label: 'CPI-U',
    type: 'parameter',
    unit: 'currency-USD',
    economy: false,
    household: true,
    values: { '2026-01-01': 100, '2027-01-01': 103, '2028-01-01': 106 },
  },
  'gov.irs.income.exemption.amount': {
    parameter: 'gov.irs.income.exemption.amount',
    label: 'Personal exemption amount',
    type: 'parameter',
    unit: 'currency-USD',
    economy: true,
    household: true,
    values: {
      '2026-01-01': 5000,
      '2027-01-01': 5100,
      '2028-01-01': 5200,
      '2029-01-01': 5300,
    },
  },
  // A threshold current law leaves unlimited, as metadata sends it: the text "Infinity".
  'gov.irs.credits.cdcc.phase_out.second_start': {
    parameter: 'gov.irs.credits.cdcc.phase_out.second_start',
    label: 'CDCC second phase-out start',
    type: 'parameter',
    unit: 'currency-USD',
    economy: true,
    household: true,
    values: { '2022-01-01': 'Infinity' },
  },
  ...deduction('SINGLE', 'SINGLE', 16100),
  ...deduction('JOINT', 'JOINT', 32200),
  ...deduction('HEAD_OF_HOUSEHOLD', 'HEAD OF HOUSEHOLD', 24150),
};

export const SINGLE_PATH = 'gov.irs.deductions.standard.amount.SINGLE';
export const JOINT_PATH = 'gov.irs.deductions.standard.amount.JOINT';
export const CTC_PATH = 'gov.irs.credits.ctc.amount.base';
export const LIST_PATH = 'gov.irs.credits.ctc.refundable.social_security.add';
export const PHASE_IN_RATE_PATH = 'gov.irs.credits.eitc.phase_in_rate[1].amount';
export const EXEMPTION_PATH = 'gov.irs.income.exemption.amount';
export const NO_LIMIT_PATH = 'gov.irs.credits.cdcc.phase_out.second_start';

/** Loads the fixture parameters into the app store, as a metadata fetch would. */
/** A few US regions, as metadata's economy_options.region lists them. */
export const US_REGIONS = [
  { name: 'us', label: 'the US', type: 'national' },
  { name: 'state/ca', label: 'California', type: 'state' },
  { name: 'state/ny', label: 'New York', type: 'state' },
  {
    name: 'congressional_district/CA-01',
    label: "California's 1st congressional district",
    type: 'congressional_district',
  },
];

/**
 * A few UK regions, as metadata's economy_options.region lists them. A
 * constituency and a local authority can share a name (Bedford).
 */
export const UK_REGIONS = [
  { name: 'uk', label: 'the UK', type: 'national' },
  { name: 'country/england', label: 'England', type: 'country' },
  { name: 'country/scotland', label: 'Scotland', type: 'country' },
  { name: 'constituency/Bedford', label: 'Bedford', type: 'constituency' },
  { name: 'constituency/Aberdeen North', label: 'Aberdeen North', type: 'constituency' },
  { name: 'local_authority/Bedford', label: 'Bedford', type: 'local_authority' },
];

export function seedDeductionMetadata({
  regions = [],
  lastYear = 2027,
}: {
  regions?: Array<{ name: string; label: string; type: string }>;
  /** The model's last year (economy_options.time_period runs 2025 to it). */
  lastYear?: number;
} = {}) {
  const meta = { arg: 'us', requestId: 'draft-editor-test', requestStatus: 'pending' };
  store.dispatch({ type: fetchMetadataThunk.pending.type, meta });
  store.dispatch({
    type: fetchMetadataThunk.fulfilled.type,
    meta: { ...meta, requestStatus: 'fulfilled' },
    payload: {
      country: 'us',
      data: {
        result: {
          parameters: DEDUCTION_PARAMETERS,
          variables: {},
          entities: {},
          variableModules: {},
          economy_options: {
            region: regions,
            time_period: Array.from({ length: lastYear - 2024 }, (_, index) => ({
              name: 2025 + index,
              label: String(2025 + index),
            })),
            datasets: [],
          },
          current_law_id: 2,
          basicInputs: [],
          modelled_policies: { core: {}, filtered: {} },
          version: 'test',
        },
      },
    },
  });
}
