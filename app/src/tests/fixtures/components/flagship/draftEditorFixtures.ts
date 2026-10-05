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
  ...deduction('SINGLE', 'SINGLE', 16100),
  ...deduction('JOINT', 'JOINT', 32200),
  ...deduction('HEAD_OF_HOUSEHOLD', 'HEAD OF HOUSEHOLD', 24150),
};

export const SINGLE_PATH = 'gov.irs.deductions.standard.amount.SINGLE';
export const JOINT_PATH = 'gov.irs.deductions.standard.amount.JOINT';
export const CTC_PATH = 'gov.irs.credits.ctc.amount.base';
export const LIST_PATH = 'gov.irs.credits.ctc.refundable.social_security.add';

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
