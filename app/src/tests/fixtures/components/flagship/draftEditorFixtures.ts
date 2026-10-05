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

/** Loads the fixture parameters into the app store, as a metadata fetch would. */
export function seedDeductionMetadata() {
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
            region: [],
            time_period: [
              { name: 2026, label: '2026' },
              { name: 2027, label: '2027' },
            ],
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
